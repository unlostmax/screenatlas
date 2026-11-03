"""Explicit private backups and self-contained read-only sharing."""
from __future__ import annotations

import base64
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import tempfile
import zipfile

from .core import Conflict, Invalid, atomic_write, canonical, digest
from .project import validate
from .store import Store

MAX_ARCHIVE_BYTES = 2 * 1024 * 1024 * 1024


def backup(store, destination):
    destination = Path(destination).resolve()
    if destination.exists():
        raise Conflict("Backup destination already exists; choose a new filename")
    if destination.is_relative_to(store.local):
        raise Invalid("Keep backups outside the local review-state directory")
    with store.project.locked(), tempfile.TemporaryDirectory(prefix="atlas-backup-") as temporary:
        data, etag = store.project.load()
        database = Path(temporary) / "review.sqlite3"
        with store.connect() as source, sqlite3.connect(database) as target:
            source.backup(target)
        files = {"atlas.json": store.project.path.read_bytes(), ".atlas-local/review.sqlite3": database.read_bytes()}
        for node in data["nodes"]:
            if node.get("reference"):
                reference = node["reference"]
                raw = store.project.file(reference["path"]).read_bytes()
                if digest(raw) != reference["sha256"]:
                    raise Conflict("Cannot back up a changed curated image")
                files[reference["path"]] = raw
        for document in data["documents"]:
            if "path" in document:
                files[document["path"]] = store.project.document(document).encode()
        if store.objects.exists():
            for file in store.objects.iterdir():
                if re.fullmatch(r"[a-f0-9]{64}\.png", file.name):
                    files[f".atlas-local/objects/{file.name}"] = store.image(file.stem)
        if digest(files["atlas.json"]) != etag or store.project.load()[1] != etag:
            raise Conflict("Project changed while preparing its backup")
        manifest = {"format": "atlas-backup", "version": 1, "projectId": data["id"],
                    "files": {name: digest(raw) for name, raw in files.items()}}
        temporary_zip = Path(temporary) / "backup.zip"
        with zipfile.ZipFile(temporary_zip, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, raw in files.items():
                archive.writestr(name, raw)
            archive.writestr("backup.json", canonical(manifest))
        atomic_write(destination, temporary_zip.read_bytes())
    return {"file": str(destination), "files": len(files), "projectId": data["id"]}


def restore(source, destination):
    destination = Path(destination).resolve()
    if destination.exists():
        raise Conflict("Restore requires a new directory; existing projects are never overwritten")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(source) as archive:
        items = archive.infolist()
        if len(items) > 100000 or sum(item.file_size for item in items) > MAX_ARCHIVE_BYTES:
            raise Invalid("Backup exceeds the restore size limit")
        names = [item.filename for item in items]
        if len(names) != len(set(names)) or "backup.json" not in names:
            raise Invalid("Invalid backup directory")
        manifest = json.loads(archive.read("backup.json"))
        if manifest.get("format") != "atlas-backup" or manifest.get("version") != 1:
            raise Invalid("Unsupported backup format")
        hashes = manifest.get("files")
        if not isinstance(hashes, dict) or set(names) != set(hashes) | {"backup.json"}:
            raise Invalid("Backup manifest does not match its files")
        if "atlas.json" not in hashes or ".atlas-local/review.sqlite3" not in hashes:
            raise Invalid("Backup is missing project or review state")
        data = validate(json.loads(archive.read("atlas.json")))
        if data["id"] != manifest.get("projectId"):
            raise Invalid("Backup project identity differs")
        allowed = {"atlas.json", ".atlas-local/review.sqlite3"}
        allowed.update(node["reference"]["path"] for node in data["nodes"] if node.get("reference"))
        allowed.update(document["path"] for document in data["documents"] if "path" in document)
        stage = Path(tempfile.mkdtemp(prefix=".atlas-restore-", dir=destination.parent))
        try:
            for name, expected in hashes.items():
                if name not in allowed and not re.fullmatch(r"\.atlas-local/objects/[a-f0-9]{64}\.png", name):
                    raise Invalid("Backup contains an undeclared or unsafe file path")
                raw = archive.read(name)
                if digest(raw) != expected:
                    raise Conflict("Backup file checksum mismatch")
                file = stage / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(raw)
            (stage / ".gitignore").write_text(".atlas-local/\n")
            restored = Store(stage)
            report = restored.doctor()
            if not report["healthy"]:
                raise Conflict("Backup contains missing or changed review images")
            os.rename(stage, destination)
        finally:
            if stage.exists():
                shutil.rmtree(stage)
    return {"directory": str(destination), "healthy": True, "projectId": data["id"]}


def static_export(store, destination, include_review=False):
    destination = Path(destination).resolve()
    if destination.exists():
        raise Conflict("Export destination already exists; choose a new filename")
    snapshot = store.snapshot()
    with store.project.locked():
        if store.project.load()[1] != snapshot["etag"]:
            raise Conflict("Project changed during export; retry")
        data = snapshot["project"]
        for document in data["documents"]:
            document["body"] = store.project.document(document)
            document.pop("path", None)
        hashes = {node["reference"]["sha256"] for node in data["nodes"] if node.get("reference")}
        if include_review:
            hashes.update(version["sha256"] for version in snapshot["versions"])
            hashes.update(version["baseline_sha256"] for version in snapshot["versions"] if version["baseline_sha256"])
            hashes.update(reference["sha256"] for reference in snapshot["referenceSnapshots"])
            for capture in snapshot["captures"]:
                hashes.add(capture["sha256"])
                if capture["reference_sha256"]:
                    hashes.add(capture["reference_sha256"])
            for thread in snapshot["threads"]:
                if thread["image_sha256"]:
                    hashes.add(thread["image_sha256"])
                hashes.update(message["preview_sha256"] for message in thread["messages"] if message["preview_sha256"])
        else:
            for key in ("threads", "captures", "versions", "referenceSnapshots", "designStates", "acceptances", "promotions"):
                snapshot[key] = []
        snapshot["images"] = {value: "data:image/png;base64," + base64.b64encode(store.image(value)).decode() for value in hashes}
        snapshot["readonly"] = True
        web = Path(__file__).parent / "web"
        page = (web / "index.html").read_text()
        page, style_count = re.subn(r'<link\b[^>]*href="/app\.css"[^>]*>',
                                    lambda _: "<style>" + (web / "app.css").read_text() + "</style>", page)
        serialized = json.dumps(snapshot, ensure_ascii=False).replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
        scripts = "<script>window.ATLAS_EXPORT=" + serialized + ";</script><script>" + (web / "app.js").read_text().replace("</script", "<\\/script") + "</script>"
        page, script_count = re.subn(r'<script\b[^>]*src="/app\.js"[^>]*>\s*</script>', lambda _: scripts, page)
        connection_script = "<script>" + (web / "connections.js").read_text().replace("</script", "<\\/script") + "</script>"
        page, connection_count = re.subn(r'<script\b[^>]*src="/connections\.js"[^>]*>\s*</script>', lambda _: connection_script, page)
        if style_count != 1 or script_count != 1 or connection_count != 1:
            raise Invalid("Packaged viewer is missing its export asset entrypoints")
        atomic_write(destination, page.encode())
    return {"file": str(destination), "includesReview": include_review, "images": len(hashes)}
