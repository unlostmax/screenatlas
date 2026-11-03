"""Versioned review commands shared by browser and CLI.

SQLite owns review history; atlas.json owns curated inputs. Image bytes never
change. Every command has a stable operation identity and expected revision.
"""
from __future__ import annotations

import base64
import binascii
from contextlib import contextmanager
import json
import math
from pathlib import Path
import sqlite3
import uuid

from .core import Conflict, Invalid, atomic_write, canonical, digest, identity, sha, text
from .png import inspect_png
from .project import Project

STATUSES = ("open", "in_progress", "ready", "resolved")
DECISIONS = ("pending", "approved", "changes_requested")
MIGRATIONS = sorted((Path(__file__).parent / "migrations").glob("*.sql"))


def schema_signature(db):
    return sorted(tuple(row) for row in db.execute(
        "SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'"))


class Store:
    def __init__(self, root):
        if sqlite3.sqlite_version_info < (3, 37, 0):
            raise Invalid("ScreenAtlas requires SQLite 3.37 or newer for strict review tables")
        self.project = Project(root)
        self.local = self.project.local
        self.objects = self.local / "objects"
        self.database = self.local / "review.sqlite3"
        with self.project.locked():
            data, _ = self.project.load()
            if self.database.is_symlink() or self.objects.is_symlink():
                raise Invalid("Review database and objects cannot be symbolic links")
            with self.connect() as db:
                version = db.execute("PRAGMA user_version").fetchone()[0]
                if version < 0 or version > len(MIGRATIONS):
                    raise Invalid(f"Unsupported review schema: {version}")
                for index, file in enumerate(MIGRATIONS, 1):
                    sql = file.read_text()
                    checksum = digest(sql.encode())
                    if index <= version:
                        row = db.execute("SELECT sha256 FROM migrations WHERE version=?", (index,)).fetchone()
                        if not row or row[0] != checksum:
                            raise Conflict("Review migration checksum differs from the installed schema")
                    else:
                        db.executescript(f"BEGIN IMMEDIATE;\n{sql}\nINSERT INTO migrations VALUES({index},'{checksum}');\nPRAGMA user_version={index};\nCOMMIT;")
                expected = sqlite3.connect(":memory:")
                try:
                    for file in MIGRATIONS:
                        expected.executescript(file.read_text())
                    if schema_signature(db) != schema_signature(expected):
                        raise Conflict("Review database schema differs from its migrations")
                finally:
                    expected.close()
                row = db.execute("SELECT id FROM project_identity").fetchone()
                if row and row[0] != data["id"]:
                    raise Conflict("This review store belongs to another ScreenAtlas project")
                db.execute("INSERT OR IGNORE INTO project_identity VALUES(?)", (data["id"],))

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.database, timeout=15)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    def put(self, raw):
        info = inspect_png(raw)
        value = digest(raw)
        self.objects.mkdir(exist_ok=True)
        target = self.objects / f"{value}.png"
        if target.exists():
            if target.is_symlink() or target.read_bytes() != raw:
                raise Conflict("Stored image bytes do not match their immutable identity")
        else:
            atomic_write(target, raw)
        return {"sha256": value, **info}

    def image(self, value):
        sha(value)
        private = self.objects / f"{value}.png"
        # A changed private snapshot must never be concealed by a curated copy.
        file = private if private.exists() else self.project.file(f"assets/{value}.png")
        if file.is_symlink() or not file.is_file():
            raise Conflict("Recorded image is missing; restore it from a backup")
        raw = file.read_bytes()
        if digest(raw) != value:
            raise Conflict("Recorded image bytes changed; restore the exact image")
        return raw

    def baseline(self, db, node):
        reference = node.get("reference")
        if not reference:
            return None
        raw = self.project.file(reference["path"]).read_bytes()
        if digest(raw) != reference["sha256"]:
            raise Conflict("Curated reference bytes changed")
        self.put(raw)
        db.execute("INSERT OR IGNORE INTO reference_snapshots(node_id,sha256,reference_json) VALUES(?,?,?)",
                   (node["id"], reference["sha256"], canonical(reference)))
        return reference["sha256"]

    @staticmethod
    def node(data, node_id, active=True):
        node = next((node for node in data["nodes"] if node["id"] == node_id), None)
        if not node or (active and node.get("retired")):
            raise Invalid("Unknown or retired ScreenAtlas screen")
        return node

    @staticmethod
    def raw_png(encoded):
        if not isinstance(encoded, str) or len(encoded) > 42 * 1024 * 1024:
            raise Invalid("Expected base64 PNG bytes")
        try:
            return base64.b64decode(encoded, validate=True)
        except (binascii.Error, ValueError) as error:
            raise Invalid("Expected base64 PNG bytes") from error

    @staticmethod
    def revision(payload, actual):
        if type(payload.get("revision")) is not int or payload["revision"] != actual:
            raise Conflict("Revision changed. Read the latest state and reconcile your draft.")

    def execute(self, command, payload, author="assistant"):
        allowed = {"comment": self._comment, "reply": self._reply, "status": self._reply,
                   "import-proposals": self._proposals, "accept": self._accept,
                   "promote": self._promote, "import-captures": self._captures,
                   "decide": self._decide}
        if command not in allowed or not isinstance(payload, dict) or author not in ("assistant", "reviewer"):
            raise Invalid("Unknown review command, body, or author")
        operation = identity(payload.get("operationId"))
        content = {key: value for key, value in payload.items() if key != "operationId"}
        fingerprint = digest(canonical([command, author, content]).encode())
        with self.project.locked(), self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            previous = db.execute("SELECT * FROM operations WHERE id=?", (operation,)).fetchone()
            if previous:
                if previous["fingerprint"] != fingerprint:
                    raise Conflict("This operation identity already belongs to different content")
                return json.loads(previous["result"])
            data, etag = self.project.load()
            result = allowed[command](db, data, etag, content, author)
            db.execute("INSERT INTO operations VALUES(?,?,?)", (operation, fingerprint, canonical(result)))
            return result

    def _comment(self, db, data, etag, payload, author):
        body = text(payload.get("body"), "Feedback")
        thread_id = identity(payload.get("id"))
        anchor = payload.get("anchor")
        if not isinstance(anchor, dict):
            raise Invalid("A feedback anchor is required")
        kind, node_id = anchor.get("kind"), anchor.get("nodeId")
        x, y = anchor.get("x"), anchor.get("y")
        if any(type(v) not in (int, float) or not math.isfinite(v) for v in (x, y)):
            raise Invalid("Anchor coordinates must be finite numbers")
        image_hash = capture_id = None
        if kind == "canvas":
            if node_id is not None or not (0 <= x <= 100000 and 0 <= y <= 100000):
                raise Invalid("Invalid canvas anchor")
        elif kind in ("node", "image", "capture"):
            node = self.node(data, node_id, active=False)
            if not (0 <= x <= 1 and 0 <= y <= 1):
                raise Invalid("Image and screen anchors use normalized coordinates")
            if kind == "capture":
                capture_id = identity(anchor.get("captureId"))
                capture = db.execute("SELECT * FROM captures WHERE id=?", (capture_id,)).fetchone()
                if not capture or capture["node_id"] != node_id:
                    raise Invalid("Capture does not belong to this screen")
                image_hash = capture["sha256"]
                if anchor.get("imageSha256") != image_hash:
                    raise Conflict("Displayed capture identity differs")
            else:
                image_hash = anchor.get("imageSha256")
                current = node.get("reference", {}).get("sha256") if node.get("reference") else None
                if image_hash:
                    sha(image_hash)
                    version = db.execute("SELECT 1 FROM versions WHERE node_id=? AND (sha256=? OR baseline_sha256=?)", (node_id, image_hash, image_hash)).fetchone()
                    snapshot = db.execute("SELECT 1 FROM reference_snapshots WHERE node_id=? AND sha256=?", (node_id, image_hash)).fetchone()
                    if image_hash != current and not version and not snapshot:
                        raise Conflict("Image does not belong to this screen's design history")
                    if image_hash == current:
                        self.baseline(db, node)
                elif kind == "image" or current is not None:
                    raise Invalid("The displayed image identity is required")
            if image_hash:
                self.image(image_hash)
        else:
            raise Invalid("Unknown feedback anchor kind")
        existing = db.execute("SELECT * FROM threads WHERE id=?", (thread_id,)).fetchone()
        values = (node_id, image_hash, capture_id, kind, x, y)
        if existing:
            original = db.execute("SELECT body FROM messages WHERE thread_id=? ORDER BY sequence LIMIT 1", (thread_id,)).fetchone()
            if tuple(existing[key] for key in ("node_id", "image_sha256", "capture_id", "anchor_kind", "x", "y")) != values or original[0] != body:
                raise Conflict("Feedback save identity belongs to different content")
            return {"id": thread_id, "revision": existing["revision"]}
        db.execute("INSERT INTO threads(id,node_id,image_sha256,capture_id,anchor_kind,x,y,status,revision) VALUES(?,?,?,?,?,?,?,'open',1)", (thread_id, *values))
        db.execute("INSERT INTO messages(thread_id,author,body) VALUES(?,?,?)", (thread_id, author, body))
        db.execute("INSERT INTO transitions(thread_id,status,author,revision) VALUES(?,'open',?,1)", (thread_id, author))
        return {"id": thread_id, "revision": 1}

    def _reply(self, db, data, etag, payload, author):
        thread_id = identity(payload.get("id"))
        thread = db.execute("SELECT * FROM threads WHERE id=?", (thread_id,)).fetchone()
        if not thread:
            raise Invalid("Unknown feedback thread")
        self.revision(payload, thread["revision"])
        body = text(payload["body"], "Reply") if "body" in payload else None
        status = payload.get("status")
        if (status is not None and status not in STATUSES) or not (body or status):
            raise Invalid("Supply a reply or valid feedback status")
        preview = None
        if "png" in payload:
            if not body:
                raise Invalid("A preview must accompany a reply")
            preview = self.put(self.raw_png(payload["png"]))["sha256"]
        if body:
            db.execute("INSERT INTO messages(thread_id,author,body,preview_sha256) VALUES(?,?,?,?)", (thread["id"], author, body, preview))
        revision = thread["revision"] + 1
        db.execute("UPDATE threads SET status=?,revision=? WHERE id=?", (status or thread["status"], revision, thread["id"]))
        if status:
            db.execute("INSERT INTO transitions(thread_id,status,author,revision) VALUES(?,?,?,?)", (thread["id"], status, author, revision))
        return {"id": thread["id"], "revision": revision}

    def _proposals(self, db, data, etag, payload, author):
        entries = payload.get("entries")
        if not isinstance(entries, list) or not entries or len(entries) > 100:
            raise Invalid("Supply between 1 and 100 proposal entries")
        if any(not isinstance(entry, dict) for entry in entries):
            raise Invalid("Each proposal entry must be a JSON object")
        imported, seen = [], set()
        for entry in entries:
            node = self.node(data, entry.get("id"))
            if node["id"] in seen:
                raise Invalid("A proposal batch must contain unique screen identities")
            seen.add(node["id"])
            if "baselineSha256" not in entry:
                raise Invalid("Proposal baselineSha256 is required; use null for a new screen")
            baseline = self.baseline(db, node)
            if sha(entry["baselineSha256"], nullable=True) != baseline:
                raise Conflict("Proposal was generated against a different curated reference")
            original = node["reference"]["path"] if node.get("reference") else None
            if "original" in entry and entry["original"] != original:
                raise Conflict("Proposal targets a different canonical image path")
            prompt = text(entry.get("prompt"), "Generation prompt")
            image = self.put(self.raw_png(entry.get("png")))
            provenance = entry.get("provenance", {})
            if not isinstance(provenance, dict) or len(canonical(provenance)) > 40000:
                raise Invalid("Generation provenance must be an object of at most 40 KB")
            source = text(entry.get("source", "External generation"), "Generation source", 1000)
            note = text(entry.get("reviewNote", ""), "Review note", 4000, False)
            version_id = identity(entry.get("versionId") or str(uuid.uuid5(uuid.UUID(data["id"]), canonical([node["id"], image["sha256"], baseline, prompt, source, note, provenance]))))
            values = (node["id"], image["sha256"], baseline, prompt, source, note, canonical({**provenance, **image}))
            existing = db.execute("SELECT * FROM versions WHERE id=?", (version_id,)).fetchone()
            if existing:
                if tuple(existing[key] for key in ("node_id", "sha256", "baseline_sha256", "prompt", "source", "note", "provenance")) != values:
                    raise Conflict("Proposal version identity belongs to different content")
            else:
                db.execute("INSERT INTO versions(id,node_id,sha256,baseline_sha256,prompt,source,note,provenance) VALUES(?,?,?,?,?,?,?,?)", (version_id, *values))
                db.execute("INSERT INTO design_states(node_id,proposed_id,revision) VALUES(?,?,1) ON CONFLICT(node_id) DO UPDATE SET proposed_id=excluded.proposed_id,revision=revision+1", (node["id"], version_id))
            imported.append(version_id)
        return {"versions": imported}

    def _accept(self, db, data, etag, payload, author):
        node = self.node(data, payload.get("id"))
        state = db.execute("SELECT * FROM design_states WHERE node_id=?", (node["id"],)).fetchone()
        if not state or not state["proposed_id"]:
            raise Conflict("There is no pending candidate to accept")
        self.revision(payload, state["revision"])
        if payload.get("versionId") != state["proposed_id"]:
            raise Conflict("Displayed proposal version changed")
        version = db.execute("SELECT * FROM versions WHERE id=?", (state["proposed_id"],)).fetchone()
        if self.baseline(db, node) != version["baseline_sha256"]:
            raise Conflict("Curated reference changed since proposal import")
        if payload.get("imageSha256") != version["sha256"]:
            raise Conflict("The displayed candidate image differs")
        self.image(version["sha256"])
        revision = state["revision"] + 1
        db.execute("INSERT INTO acceptances(node_id,version_id,previous_id,revision) VALUES(?,?,?,?)", (node["id"], version["id"], state["accepted_id"], revision))
        db.execute("UPDATE design_states SET accepted_id=proposed_id,proposed_id=NULL,revision=? WHERE node_id=?", (revision, node["id"]))
        return {"id": node["id"], "versionId": version["id"], "revision": revision}

    def _promote(self, db, data, etag, payload, author):
        node = self.node(data, payload.get("id"))
        version_id = identity(payload.get("versionId"))
        version = db.execute("SELECT * FROM versions WHERE id=? AND node_id=?", (version_id, node["id"])).fetchone()
        state = db.execute("SELECT * FROM design_states WHERE node_id=?", (node["id"],)).fetchone()
        if not version or not state or state["accepted_id"] != version["id"]:
            raise Conflict("Promotion requires the exact currently accepted version")
        raw = self.image(version["sha256"])
        current = node.get("reference")
        # Recovery after the atomic document write but before SQLite commit:
        # the accepted version identity in the document is a durable receipt.
        already = current and current.get("provenance", {}).get("acceptedVersion") == version["id"] and current["sha256"] == version["sha256"]
        if not already:
            if payload.get("etag") != etag or self.baseline(db, node) != version["baseline_sha256"]:
                raise Conflict("Project or canonical baseline changed before promotion")
            target = self.project.file(f"assets/{version['sha256']}.png")
            if target.exists() and target.read_bytes() != raw:
                raise Conflict("Curated asset path contains different bytes")
            if not target.exists():
                atomic_write(target, raw)
            acceptance = dict(db.execute("SELECT * FROM acceptances WHERE version_id=?", (version["id"],)).fetchone())
            node["reference"] = {"sha256": version["sha256"], "path": f"assets/{version['sha256']}.png", "provenance": {
                **json.loads(version["provenance"]), "prompt": version["prompt"], "source": version["source"],
                "reviewNote": version["note"], "acceptedVersion": version["id"], "acceptedAt": acceptance["created_at"],
                "previousSha256": version["baseline_sha256"], "scope": "Visual reference only; not implementation or release approval"}}
            data["revision"] += 1
            etag = self.project.write(data)["etag"]
        else:
            self.baseline(db, node)
        db.execute("INSERT OR IGNORE INTO promotions(node_id,version_id,project_etag) VALUES(?,?,?)", (node["id"], version["id"], etag))
        return {"id": node["id"], "versionId": version["id"], "etag": etag}

    def _captures(self, db, data, etag, payload, author):
        entries = payload.get("entries")
        if not isinstance(entries, list) or not entries or len(entries) > 100:
            raise Invalid("Supply between 1 and 100 capture entries")
        if any(not isinstance(entry, dict) for entry in entries):
            raise Invalid("Each capture entry must be a JSON object")
        results = []
        for entry in entries:
            node = self.node(data, entry.get("nodeId"))
            capture_id = identity(entry.get("id"))
            image = self.put(self.raw_png(entry.get("png")))
            state = text(entry.get("state"), "Screen state", 200)
            source = entry.get("source")
            if source not in ("device", "simulator", "archive"):
                raise Invalid("Capture source must be device, simulator, or archive")
            device = text(entry.get("device"), "Device and OS", 200)
            build = text(entry.get("buildRevision", ""), "Build revision", 200, False) or None
            captured = text(entry.get("capturedAt", ""), "Capture time", 200, False) or None
            note = text(entry.get("note", ""), "Capture note", 4000, False)
            values = (node["id"], image["sha256"], state, source, device, build, captured, note)
            existing = db.execute("SELECT * FROM captures WHERE id=?", (capture_id,)).fetchone()
            if existing:
                if tuple(existing[key] for key in ("node_id", "sha256", "state", "source", "device", "build_revision", "captured_at", "note")) != values:
                    raise Conflict("Capture identity belongs to different image bytes or metadata")
                if "referenceSha256" in entry and entry["referenceSha256"] != existing["reference_sha256"]:
                    raise Conflict("Capture reference identity differs")
            else:
                baseline = self.baseline(db, node)
                if "referenceSha256" in entry and entry["referenceSha256"] != baseline:
                    raise Conflict("Capture targets a different curated reference")
                contract_hash = digest(canonical(node["contract"]).encode())
                db.execute("INSERT INTO captures(id,node_id,sha256,state,source,device,build_revision,captured_at,note,reference_sha256,contract_sha256) VALUES(?,?,?,?,?,?,?,?,?,?,?)", (capture_id, *values, baseline, contract_hash))
            results.append(capture_id)
        return {"captures": results}

    @staticmethod
    def capture_review(db, capture_id):
        row = db.execute("SELECT status,revision,created_at FROM capture_decisions WHERE capture_id=? ORDER BY revision DESC LIMIT 1", (capture_id,)).fetchone()
        return dict(row) if row else {"status": "pending", "revision": 0, "created_at": None}

    def _decide(self, db, data, etag, payload, author):
        capture_id = identity(payload.get("id"))
        capture = db.execute("SELECT * FROM captures WHERE id=?", (capture_id,)).fetchone()
        if not capture:
            raise Invalid("Unknown capture")
        if payload.get("status") not in DECISIONS:
            raise Invalid("Unknown appearance decision")
        if payload.get("imageSha256") != capture["sha256"] or payload.get("referenceSha256") != capture["reference_sha256"]:
            raise Conflict("Displayed capture or reference identity differs")
        current = self.capture_review(db, capture["id"])
        self.revision(payload, current["revision"])
        if payload["status"] == "approved":
            node = self.node(data, capture["node_id"])
            if not capture["reference_sha256"] or self.baseline(db, node) != capture["reference_sha256"]:
                raise Conflict("Appearance approval requires the matching current curated reference")
            self.image(capture["sha256"])
            self.image(capture["reference_sha256"])
        revision = current["revision"] + 1
        db.execute("INSERT INTO capture_decisions(capture_id,status,revision) VALUES(?,?,?)", (capture["id"], payload["status"], revision))
        return {"id": capture["id"], "status": payload["status"], "revision": revision}

    def snapshot(self):
        with self.project.locked(), self.connect() as db:
            db.execute("BEGIN")
            data, etag = self.project.load()
            nodes = {node["id"]: node for node in data["nodes"]}
            versions = [dict(row) for row in db.execute("SELECT * FROM versions ORDER BY sequence")]
            references = [dict(row) for row in db.execute("SELECT * FROM reference_snapshots ORDER BY sequence")]
            for reference in references:
                reference["reference"] = json.loads(reference.pop("reference_json"))
            for version in versions:
                version["provenance"] = json.loads(version["provenance"])
                node = nodes.get(version["node_id"])
                current = node["reference"]["sha256"] if node and node.get("reference") else None
                version["baseline_changed"] = current not in (version["baseline_sha256"], version["sha256"])
            states = [dict(row) for row in db.execute("SELECT * FROM design_states")]
            captures = [dict(row) for row in db.execute("SELECT * FROM captures ORDER BY sequence DESC")]
            for capture in captures:
                node = nodes.get(capture["node_id"])
                capture["reference_changed"] = not node or capture["reference_sha256"] != (node["reference"]["sha256"] if node.get("reference") else None)
                capture["contract_changed"] = not node or capture["contract_sha256"] != digest(canonical(node["contract"]).encode())
                capture["review"] = self.capture_review(db, capture["id"])
                capture["decisions"] = [dict(row) for row in db.execute("SELECT * FROM capture_decisions WHERE capture_id=? ORDER BY revision", (capture["id"],))]
            threads = [dict(row) for row in db.execute("SELECT * FROM threads ORDER BY sequence")]
            messages, transitions = {}, {}
            for row in db.execute("SELECT * FROM messages ORDER BY sequence"):
                messages.setdefault(row["thread_id"], []).append(dict(row))
            for row in db.execute("SELECT * FROM transitions ORDER BY sequence"):
                transitions.setdefault(row["thread_id"], []).append(dict(row))
            captures_by_id = {capture["id"]: capture for capture in captures}
            for thread in threads:
                node = nodes.get(thread["node_id"])
                thread["title"] = node["title"] if node else "Canvas"
                thread["messages"] = messages.get(thread["id"], [])
                thread["transitions"] = transitions.get(thread["id"], [])
                thread["reference_changed"] = bool(thread["node_id"] and (not node or thread["image_sha256"] != (node["reference"]["sha256"] if node.get("reference") else None)))
                if thread["capture_id"]:
                    thread["reference_changed"] = captures_by_id[thread["capture_id"]]["reference_changed"]
            return {"project": data, "etag": etag, "versions": versions, "referenceSnapshots": references, "designStates": states,
                    "acceptances": [dict(row) for row in db.execute("SELECT * FROM acceptances ORDER BY sequence")],
                    "promotions": [dict(row) for row in db.execute("SELECT * FROM promotions ORDER BY sequence")],
                    "captures": captures, "threads": threads}

    def doctor(self):
        with self.project.locked(), self.connect() as db:
            errors = [row[0] for row in db.execute("PRAGMA integrity_check") if row[0] != "ok"]
            errors.extend(str(tuple(row)) for row in db.execute("PRAGMA foreign_key_check"))
            hashes = set()
            for table, columns in (("versions", ("sha256", "baseline_sha256")), ("reference_snapshots", ("sha256",)), ("threads", ("image_sha256",)),
                                   ("messages", ("preview_sha256",)), ("captures", ("sha256", "reference_sha256"))):
                for column in columns:
                    hashes.update(row[0] for row in db.execute(f"SELECT {column} FROM {table} WHERE {column} IS NOT NULL"))
            for value in hashes:
                try:
                    inspect_png(self.image(value))
                except (Invalid, Conflict, OSError) as error:
                    errors.append(f"Image {value}: {error}")
            check = self.project.check()
            return {"healthy": not errors, "schemaVersion": len(MIGRATIONS), "imagesChecked": len(hashes), "errors": errors, "project": check}


def encode_file(path):
    path = Path(path)
    if path.stat().st_size > 30 * 1024 * 1024:
        raise Invalid("PNG exceeds 30 MiB")
    return base64.b64encode(path.read_bytes()).decode("ascii")
