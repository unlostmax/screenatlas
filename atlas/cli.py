"""Machine-readable agent CLI. Review writes require stable operation IDs."""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
import shutil
import sqlite3
import sys
import uuid
import zipfile

from . import __version__
from .core import Conflict, Invalid, canonical
from .onboarding import project_handoff
from .project import Project, connections, contract, initialize
from .server import make_server
from .store import DECISIONS, STATUSES, Store, encode_file
from .transfer import backup, restore, static_export


def parser():
    result = argparse.ArgumentParser(prog="screen-atlas", description="ScreenAtlas — local application contracts and visual review. Output is JSON except serve.")
    result.add_argument("--version", action="version", version=f"ScreenAtlas {__version__}")
    result.add_argument("--project", type=Path, default=Path.cwd(), help="Folder containing atlas.json")
    commands = result.add_subparsers(dest="command", required=True)
    start = commands.add_parser("start", help="Create or reopen a project and open its local workbench")
    start.add_argument("directory", type=Path, help="New map folder, or an existing folder containing atlas.json")
    start_options = start.add_mutually_exclusive_group()
    start_options.add_argument("--name", help="Name for a new empty project")
    start_options.add_argument("--example", action="store_true", help="Start with the Second Sole demo")
    start.add_argument("--port", type=int, default=8765)
    init = commands.add_parser("init", help="Create a portable project without modifying an existing ScreenAtlas")
    init.add_argument("directory", type=Path)
    init.add_argument("--name", default="Untitled application")
    init.add_argument("--example", action="store_true", help="Copy the Second Sole sneaker marketplace example")
    serve = commands.add_parser("serve", help="Serve on loopback only")
    serve.add_argument("--port", type=int, default=8765)
    handoff = commands.add_parser("handoff", help="Read the short agent starter prompt without opening the browser")
    handoff.add_argument("--port", type=int, default=8765, help="Port of the project's local viewer")
    commands.add_parser("inspect", help="Read project, review history and exact image identities")
    commands.add_parser("check", help="Validate portable inventory and report authoring warnings")
    commands.add_parser("doctor", help="Verify review database, schema and recorded image integrity")
    context = commands.add_parser("context", help="Export one screen's contract, references, feedback and connections")
    context.add_argument("id")
    listing = commands.add_parser("list", help="Read anchored feedback")
    listing.add_argument("--status", choices=STATUSES)
    commands.add_parser("proposals", help="Read all candidate versions, acceptances and promotions")
    commands.add_parser("captures", help="Read implementation screenshot versions and decisions")
    edit = commands.add_parser("project-set", help="Replace curated topology/contracts with an expected project digest")
    edit.add_argument("file", type=Path)
    edit.add_argument("--etag", required=True)
    add = commands.add_parser("add-screen", help="Add a stable screen/state without an approved reference")
    add.add_argument("file", type=Path, help="JSON screen object")
    add.add_argument("--etag", required=True)
    retire = commands.add_parser("retire-screen", help="Retire a screen while preserving its identity and history")
    retire.add_argument("id")
    retire.add_argument("--etag", required=True)
    comment = commands.add_parser("comment", help="Create anchored feedback from JSON")
    comment.add_argument("file", type=Path)
    comment.add_argument("--operation", required=True)
    for name in ("reply", "status"):
        item = commands.add_parser(name)
        item.add_argument("id")
        if name == "status":
            item.add_argument("status", choices=STATUSES)
        else:
            body = item.add_mutually_exclusive_group(required=True)
            body.add_argument("--body")
            body.add_argument("--body-file", type=Path)
            item.add_argument("--preview", type=Path)
            item.add_argument("--status", choices=STATUSES)
        item.add_argument("--revision", required=True, type=int)
        item.add_argument("--operation", required=True)
    for name in ("import-proposals", "import-captures"):
        item = commands.add_parser(name)
        item.add_argument("manifest", type=Path)
        item.add_argument("--operation", required=True)
    accept = commands.add_parser("accept", help="Record an explicitly reviewed candidate; does not promote")
    accept.add_argument("id")
    accept.add_argument("version")
    accept.add_argument("--revision", type=int, required=True)
    accept.add_argument("--image-sha256", required=True)
    accept.add_argument("--reviewed", action="store_true", required=True, help="An explicit reviewer decision, not agent inference")
    accept.add_argument("--operation", required=True)
    promote = commands.add_parser("promote", help="Promote the exact accepted candidate; never commit or push")
    promote.add_argument("id")
    promote.add_argument("version")
    promote.add_argument("--etag", required=True)
    promote.add_argument("--operation", required=True)
    decide = commands.add_parser("decide", help="Record an explicit appearance decision for an exact capture")
    decide.add_argument("id")
    decide.add_argument("status", choices=DECISIONS)
    decide.add_argument("--revision", type=int, required=True)
    decide.add_argument("--image-sha256", required=True)
    decide.add_argument("--reference-sha256", required=True, help="Digest or 'none' for an unreferenced capture")
    decide.add_argument("--reviewed", required=True, action="store_true")
    decide.add_argument("--operation", required=True)
    archive = commands.add_parser("backup", help="Create a private, complete project and review backup")
    archive.add_argument("file", type=Path)
    recover = commands.add_parser("restore", help="Verify and restore a backup into a new directory")
    recover.add_argument("file", type=Path)
    recover.add_argument("directory", type=Path)
    export = commands.add_parser("export", help="Create one self-contained read-only HTML file")
    export.add_argument("file", type=Path)
    export.add_argument("--include-review", action="store_true", help="Explicitly include private comments, candidates and app captures")
    skill = commands.add_parser("agent-skill", help="Print bundled Codex workflow instructions without installing them")
    skill.add_argument("--output", type=Path, help="Write SKILL.md to a chosen new folder")
    commands.add_parser("new-id", help="Generate an operation or capture UUID")
    commands.add_parser("templates", help="Print screen, proposal and capture manifest examples")
    return result


def read_json(path):
    if path.stat().st_size > 16 * 1024 * 1024:
        raise Invalid("JSON input exceeds 16 MiB")
    return json.loads(path.read_text(encoding="utf-8"))


def serve_project(store, port):
    data, _ = store.project.load()
    server = make_server(store, port)
    print(f"ScreenAtlas — {data['name']}", flush=True)
    print(f"http://127.0.0.1:{server.server_port}/", flush=True)
    print("Agent setup is ready. Continue with this handoff in your agent conversation:", flush=True)
    print(project_handoff(store.project, server.server_port)["prompt"], flush=True)
    print(f"Project: {store.project.root}", flush=True)
    print("Keep this window open. Press Ctrl+C to stop. Your work stays saved locally.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return None


def run(args):
    command = args.command
    if command == "start":
        project = Project(args.directory)
        if not project.path.exists():
            if project.root.exists() and any(project.root.iterdir()):
                raise Invalid("Choose a new map folder or an existing ScreenAtlas project. This folder contains other files.")
            run(argparse.Namespace(command="init", directory=args.directory,
                                   name=args.name or "Untitled application", example=args.example))
        return serve_project(Store(project.root), args.port)
    if command == "new-id":
        return {"id": str(uuid.uuid4())}
    if command == "templates":
        return {"screen": {"id": "library-empty", "title": "Library · empty", "group": "start", "kind": "screen",
                           "platform": "Web", "x": 80, "y": 100, "w": 240, "h": 420, "reference": None, "contract": contract()},
                "proposalManifest": {"entries": [{"id": "library-empty", "original": None, "baselineSha256": None,
                    "candidate": "candidate.png", "prompt": "The exact prompt used", "source": "Codex Image Gen",
                    "provenance": {"tool": "Record the actual tool", "inputSha256": [], "limitations": ["Static visual reference"]}}]},
                "captureManifest": {"entries": [{"id": "Use atlas new-id", "nodeId": "library-empty", "file": "capture.png",
                    "state": "Empty library", "source": "simulator", "device": "Device and OS; unknown if unavailable",
                    "buildRevision": "", "capturedAt": "", "note": "Fixture and evidence limitations"}]}}
    if command == "agent-skill":
        source = Path(__file__).parent / "agent-skill" / "SKILL.md"
        if args.output:
            args.output.mkdir(parents=True, exist_ok=True)
            target = args.output / "SKILL.md"
            if target.exists():
                raise Conflict("Skill destination already exists")
            shutil.copyfile(source, target)
            return {"file": str(target.resolve())}
        return {"skill": source.read_text()}
    if command == "init":
        if args.example:
            if args.directory.exists() and any(args.directory.iterdir()):
                raise Conflict("Example initialization requires an empty or new directory")
            shutil.copytree(Path(__file__).parent / "examples/second-sole", args.directory, dirs_exist_ok=True)
            project = Project(args.directory)
            data, _ = project.load()
            data["id"] = str(uuid.uuid4())
            project.write(data)
            (args.directory / ".gitignore").write_text(".atlas-local/\n")
        else:
            project = initialize(args.directory, args.name)
        data, etag = project.load()
        return {"directory": str(project.root), "projectId": data["id"], "name": data["name"], "screens": len(data["nodes"]), "etag": etag}
    if command == "restore":
        return restore(args.file, args.directory)
    project = Project(args.project)
    if command == "handoff":
        return project_handoff(project, args.port)
    if command == "check":
        return project.check()
    if command in ("project-set", "add-screen", "retire-screen"):
        with project.locked():
            data, _ = project.load()
            if command == "project-set":
                data = read_json(args.file)
            elif command == "add-screen":
                data["nodes"].append(read_json(args.file))
            else:
                node = Store.node(data, args.id)
                node["retired"] = True
            return project.save_unlocked(data, args.etag)
    store = Store(args.project)
    if command == "serve":
        return serve_project(store, args.port)
    if command == "doctor":
        report = store.doctor()
        if not report["healthy"]:
            raise Conflict(canonical(report))
        return report
    if command == "backup":
        return backup(store, args.file)
    if command == "export":
        return static_export(store, args.file, args.include_review)
    if command in ("inspect", "context", "list", "proposals", "captures"):
        snapshot = store.snapshot()
        if command == "inspect":
            return snapshot
        if command == "list":
            return {"threads": [thread for thread in snapshot["threads"] if not args.status or thread["status"] == args.status]}
        if command == "proposals":
            return {key: snapshot[key] for key in ("versions", "designStates", "acceptances", "promotions")}
        if command == "captures":
            return {"captures": snapshot["captures"]}
        node = store.node(snapshot["project"], args.id, active=False)
        docs = [document for document in snapshot["project"]["documents"] if document["id"] in node["contract"].get("sources", [])]
        return {"projectName": snapshot["project"]["name"], "projectEtag": snapshot["etag"], "node": node,
                "documents": [{"id": document["id"], "title": document["title"], "body": project.document(document)} for document in docs],
                "connections": [edge for edge in connections(snapshot["project"]) if args.id in (edge["from"], edge["to"])],
                "threads": [thread for thread in snapshot["threads"] if thread["node_id"] == args.id],
                "referenceSnapshots": [reference for reference in snapshot["referenceSnapshots"] if reference["node_id"] == args.id],
                "versions": [version for version in snapshot["versions"] if version["node_id"] == args.id],
                "captures": [capture for capture in snapshot["captures"] if capture["node_id"] == args.id]}
    payload = {"operationId": args.operation}
    if command in ("import-proposals", "import-captures"):
        manifest = read_json(args.manifest)
        if not isinstance(manifest, dict):
            raise Invalid("Manifest must be a JSON object")
        entries = manifest.get("entries")
        if not isinstance(entries, list) or any(not isinstance(entry, dict) for entry in entries):
            raise Invalid("Manifest requires an array of entry objects")
        entries = copy.deepcopy(entries)
        for entry in entries:
            key = "candidate" if command == "import-proposals" else "file"
            if key not in entry:
                raise Invalid(f"Manifest entry requires {key}")
            file = Path(entry.pop(key))
            if not file.is_absolute():
                file = args.manifest.resolve().parent / file
            entry["png"] = encode_file(file)
        payload["entries"] = entries
    elif command == "comment":
        payload.update(read_json(args.file))
        payload["operationId"] = args.operation
    else:
        payload["id"] = args.id
        if command in ("reply", "status", "accept", "decide"):
            payload["revision"] = args.revision
        if command in ("reply", "status", "decide") and args.status:
            payload["status"] = args.status
        if command == "reply":
            payload["body"] = args.body_file.read_text(encoding="utf-8") if args.body_file else args.body
            if args.preview:
                payload["png"] = encode_file(args.preview)
        if command in ("accept", "promote"):
            payload["versionId"] = args.version
        if command == "promote":
            payload["etag"] = args.etag
        if command in ("accept", "decide"):
            payload["imageSha256"] = args.image_sha256
        if command == "decide":
            payload["referenceSha256"] = None if args.reference_sha256 == "none" else args.reference_sha256
    return store.execute(command, payload)


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        result = run(args)
        if result is not None:
            print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))
    except (Invalid, Conflict, OSError, ValueError, TypeError, KeyError, sqlite3.Error, zipfile.BadZipFile) as error:
        code = "conflict" if isinstance(error, Conflict) else "invalid" if isinstance(error, (Invalid, ValueError, TypeError, KeyError)) else "io_error"
        print(json.dumps({"error": str(error), "code": code}), file=sys.stderr)
        raise SystemExit({"conflict": 3, "invalid": 2, "io_error": 1}[code])
