"""History, identity, approval, transfer, CLI, and loopback boundary proofs."""
import base64
from concurrent.futures import ThreadPoolExecutor
import copy
from contextlib import redirect_stdout
import http.client
import io
import json
import os
from pathlib import Path
import sqlite3
import shlex
import struct
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
import uuid
import zipfile
import zlib

from atlas.core import Conflict, Invalid, canonical, digest
from atlas import cli
from atlas.onboarding import project_handoff
from atlas.png import inspect_png
from atlas.project import Project, connections, contract, initialize, validate
from atlas.server import make_server
from atlas.store import MIGRATIONS, Store
from atlas.transfer import backup, restore, static_export


def png(color=90, width=3, height=4):
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)
    raster = b"".join(b"\0" + bytes([color, 140, 180]) * width for _ in range(height))
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raster)) + chunk(b"IEND", b"")


def encoded(raw):
    return base64.b64encode(raw).decode()


class AtlasTest(unittest.TestCase):
    def test_start_creates_empty_app_and_prints_concrete_next_step(self):
        destination = self.directory / "my-map"
        with patch("atlas.cli.make_server") as factory, redirect_stdout(io.StringIO()) as output:
            factory.return_value.server_port = 53100
            cli.run(cli.parser().parse_args(["start", str(destination), "--name", "Taskboard", "--port", "0"]))
            factory.return_value.serve_forever.assert_called_once()
            factory.return_value.server_close.assert_called_once()
        data, _ = Project(destination).load()
        self.assertEqual(data["name"], "Taskboard")
        self.assertEqual(data["nodes"], [])
        self.assertEqual(len(data["groups"]), 1)
        self.assertIn("http://127.0.0.1:53100/", output.getvalue())
        self.assertIn("Copy Codex prompt", output.getvalue())
        self.assertEqual(Store(destination).snapshot()["versions"], [])

    def test_start_reopens_existing_project_without_replacing_it(self):
        self.comment(body="Keep this review")
        before, etag = self.project.load()
        with patch("atlas.cli.make_server") as factory, redirect_stdout(io.StringIO()):
            factory.return_value.server_port = 53100
            cli.run(cli.parser().parse_args(["start", str(self.project.root), "--example"]))
        self.assertEqual(self.project.load(), (before, etag))
        self.assertEqual(len(self.store.snapshot()["threads"]), 1)

    def test_start_rejects_nonempty_nonproject_folder(self):
        destination = self.directory / "application-code"
        destination.mkdir()
        marker = destination / "app.txt"
        marker.write_text("Existing application")
        with self.assertRaises(Invalid), patch("atlas.cli.make_server") as factory:
            cli.run(cli.parser().parse_args(["start", str(destination)]))
        factory.assert_not_called()
        self.assertEqual(marker.read_text(), "Existing application")
        self.assertFalse((destination / "atlas.json").exists())

    def test_project_prompt_runs_from_another_folder_and_preserves_review_boundary(self):
        project = initialize(self.directory / "My app's map", "Desktop task planner")
        handoff = project_handoff(project, 53101)
        self.assertEqual(handoff["projectDirectory"], str(project.root))
        self.assertIn("http://127.0.0.1:53101/", handoff["prompt"])
        self.assertIn("do not copy the demo", handoff["prompt"])
        self.assertIn("stop for my design review", handoff["prompt"])
        self.assertIn("landscape", handoff["prompt"])
        if os.name != "nt":
            result = subprocess.run([*shlex.split(handoff["command"]), "inspect"], cwd=self.directory,
                                    capture_output=True, text=True)
        else:
            result = subprocess.run(handoff["command"] + " inspect", cwd=self.directory,
                                    capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["project"]["name"], "Desktop task planner")

    def test_showcase_init_preserves_references_and_has_no_fabricated_reviews(self):
        destination = self.directory / "showcase"
        initialized = subprocess.run(
            [sys.executable, "-m", "screen_atlas", "init", str(destination), "--example"],
            capture_output=True, text=True,
        )
        self.assertEqual(initialized.returncode, 0, initialized.stderr)
        project = Project(destination)
        data, _ = project.load()
        self.assertEqual(data["name"], "Second Sole")
        self.assertEqual(project.check()["warnings"], [])
        nodes = {node["id"]: node for node in data["nodes"]}
        roots = [nodes[id] for id in ("home", "search", "sell", "inbox", "profile")]
        groups = {group["id"]: group for group in data["groups"]}
        self.assertEqual(len({node["group"] for node in roots}), 5)
        self.assertNotIn("navigation", groups)
        root_positions = [(groups[node["group"]]["x"] + node["x"],
                           groups[node["group"]]["y"] + node["y"]) for node in roots]
        self.assertEqual(len({y for _, y in root_positions}), 1)
        self.assertEqual([x for x, _ in root_positions], sorted(x for x, _ in root_positions))
        for root in roots:
            descendants = [node for node in nodes.values()
                           if node["group"] == root["group"] and node["id"] != root["id"]]
            self.assertTrue(descendants)
            self.assertTrue(all(node["y"] > root["y"] + root["h"] for node in descendants))
        self.assertEqual(nodes["filters"]["group"], nodes["search"]["group"])
        self.assertEqual(nodes["checkout"]["group"], nodes["home"]["group"])
        self.assertEqual(nodes["saved"]["group"], nodes["profile"]["group"])
        self.assertEqual(len(nodes), len(data["nodes"]))
        for screen, source in (("my-listings", "my-listings.png"), ("listing-actions", "listing-actions.png"), ("moodboard", "moodboard.png")):
            self.assertEqual(project.file(nodes[screen]["reference"]["path"]).read_bytes(),
                             (destination / "sources" / source).read_bytes())
        reachable, pending = set(), ["home"]
        while pending:
            node_id = pending.pop()
            if node_id in reachable:
                continue
            reachable.add(node_id)
            pending.extend(edge["to"] for edge in connections(data) if edge["from"] == node_id)
        self.assertTrue({node["id"] for node in data["nodes"] if node["kind"] == "screen"}.issubset(reachable))
        snapshot = Store(destination).snapshot()
        for collection in ("captures", "versions", "acceptances", "promotions", "threads"):
            self.assertEqual(snapshot[collection], [])
        version = subprocess.run([sys.executable, "-m", "screen_atlas", "--version"], capture_output=True, text=True)
        self.assertEqual(version.returncode, 0)
        self.assertIn("ScreenAtlas", version.stdout)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="atlas-test-")
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.project = initialize(self.directory / "project", "Neutral application")
        data, _ = self.project.load()
        self.baseline = png()
        self.baseline_hash = digest(self.baseline)
        (self.project.root / "assets").mkdir()
        (self.project.root / f"assets/{self.baseline_hash}.png").write_bytes(self.baseline)
        data["nodes"] = [{"id": "one", "title": "One", "group": "start", "kind": "screen", "platform": "Web",
                          "x": 80, "y": 100, "w": 240, "h": 420, "reference": {
                              "sha256": self.baseline_hash, "path": f"assets/{self.baseline_hash}.png",
                              "provenance": {"scope": "Test visual fixture"}}, "contract": {**contract(), "purpose": "Read one item"}}]
        self.project.write(data)
        self.store = Store(self.project.root)

    def execute(self, command, payload=None, operation=None):
        return self.store.execute(command, {**(payload or {}), "operationId": operation or str(uuid.uuid4())})

    def proposal(self, color=100, node="one", baseline="default", operation=None):
        entry = {"id": node, "png": encoded(png(color)), "prompt": "Change the bounded button detail; preserve layout and intentional colors.",
                 "baselineSha256": self.baseline_hash if baseline == "default" else baseline,
                 "source": "Deterministic test fixture", "provenance": {"inputSha256": [self.baseline_hash]}}
        return self.execute("import-proposals", {"entries": [entry]}, operation)["versions"][0]

    def accept(self, version_id):
        snapshot = self.store.snapshot()
        version = next(v for v in snapshot["versions"] if v["id"] == version_id)
        state = next(s for s in snapshot["designStates"] if s["node_id"] == version["node_id"])
        return self.execute("accept", {"id": version["node_id"], "versionId": version_id, "imageSha256": version["sha256"], "revision": state["revision"]})

    def promote(self, version_id, operation=None):
        version = next(v for v in self.store.snapshot()["versions"] if v["id"] == version_id)
        return self.execute("promote", {"id": version["node_id"], "versionId": version_id, "etag": self.project.load()[1]}, operation)

    def capture(self, color=150, **changes):
        entry = {"id": str(uuid.uuid4()), "nodeId": "one", "png": encoded(png(color)), "state": "Populated",
                 "source": "simulator", "device": "Example browser; OS unknown", **changes}
        self.execute("import-captures", {"entries": [entry]})
        return entry

    def comment(self, anchor=None, **changes):
        payload = {"id": str(uuid.uuid4()), "body": "Move this control", "anchor": anchor or {
            "kind": "image", "nodeId": "one", "imageSha256": self.baseline_hash, "x": .25, "y": .5}, **changes}
        self.execute("comment", payload)
        return payload

    def decision(self, capture_id, status="approved", revision=0):
        capture = next(c for c in self.store.snapshot()["captures"] if c["id"] == capture_id)
        return {"id": capture_id, "status": status, "revision": revision, "imageSha256": capture["sha256"], "referenceSha256": capture["reference_sha256"]}

    def test_comments_persist_and_snapshot_canonical_image(self):
        payload = self.comment()
        self.execute("reply", {"id": payload["id"], "revision": 1, "body": "Candidate attached", "png": encoded(png(120)), "status": "ready"})
        version_id = self.proposal()
        self.accept(version_id)
        self.promote(version_id)
        rows = Store(self.project.root).snapshot()["threads"]
        self.assertTrue(rows[0]["reference_changed"])
        self.assertEqual(rows[0]["image_sha256"], self.baseline_hash)
        self.assertEqual(self.store.image(self.baseline_hash), self.baseline)
        self.assertEqual(len(rows[0]["messages"]), 2)
        self.assertEqual(rows[0]["status"], "ready")
        self.assertEqual(rows[0]["revision"], 2)

    def test_reply_retry_after_lost_response_is_exactly_once(self):
        thread = self.comment()["id"]
        payload = {"id": thread, "revision": 1, "body": "Ready", "status": "ready"}
        op = str(uuid.uuid4())
        self.assertEqual(self.execute("reply", payload, op), self.execute("reply", payload, op))
        self.assertEqual(len(self.store.snapshot()["threads"][0]["messages"]), 2)
        with self.assertRaises(Conflict):
            self.execute("reply", {**payload, "body": "Different"}, op)
        with self.assertRaises(Conflict):
            self.execute("reply", {**payload, "body": "Stale"})

    def test_comment_save_identity_and_anchor_are_strict(self):
        payload = self.comment()
        self.execute("comment", payload)
        self.assertEqual(len(self.store.snapshot()["threads"]), 1)
        with self.assertRaises(Conflict):
            self.execute("comment", {**payload, "body": "Other content"})
        with self.assertRaises(Invalid):
            self.comment({"kind": "image", "nodeId": "one", "x": .3, "y": .4})
        with self.assertRaises(Conflict):
            self.comment({"kind": "image", "nodeId": "one", "imageSha256": digest(png(2)), "x": .3, "y": .4})

    def test_invalid_feedback_and_nonfinite_anchors(self):
        for kind, x, y in [("node", 2, .4), ("canvas", -1, 0), ("bogus", .2, .3)]:
            with self.assertRaises(Invalid):
                self.comment({"kind": kind, "nodeId": None if kind == "canvas" else "one", "x": x, "y": y})
        with self.assertRaises(Invalid):
            self.comment(body=" ")
        with self.assertRaises((Invalid, ValueError)):
            self.comment({"kind": "canvas", "nodeId": None, "x": float("nan"), "y": 0})

    def test_malformed_command_shapes_are_rejected_without_database_errors(self):
        for command in ("import-proposals", "import-captures"):
            for entries in ([None], ["not an entry"], [5]):
                with self.assertRaises(Invalid):
                    self.execute(command, {"entries": entries})
        for command in ("reply", "decide"):
            with self.assertRaises(Invalid):
                self.execute(command, {"id": {"wrong": "type"}})
        with self.assertRaises(Invalid):
            self.project.save_unlocked([], self.project.load()[1])

    def test_concurrent_replies_do_not_overwrite_each_other(self):
        thread = self.comment()["id"]
        def reply(body):
            try:
                self.execute("reply", {"id": thread, "revision": 1, "body": body})
                return True
            except Conflict:
                return False
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(reply, ["First", "Second"]))
        self.assertEqual(sorted(outcomes), [False, True])
        self.assertEqual(len(self.store.snapshot()["threads"][0]["messages"]), 2)

    def test_resolution_preview_and_acceptance_are_separate(self):
        thread = self.comment()["id"]
        self.execute("reply", {"id": thread, "revision": 1, "body": "Preview", "png": encoded(png(77)), "status": "resolved"})
        snapshot = self.store.snapshot()
        self.assertEqual(snapshot["versions"], [])
        self.assertEqual(snapshot["acceptances"], [])
        self.assertEqual(self.project.load()[0]["nodes"][0]["reference"]["sha256"], self.baseline_hash)

    def test_acceptance_promotes_nothing_implicitly_and_retains_versions(self):
        first = self.proposal()
        self.accept(first)
        snapshot = Store(self.project.root).snapshot()
        self.assertEqual(snapshot["designStates"][0]["accepted_id"], first)
        self.assertEqual(snapshot["acceptances"][0]["version_id"], first)
        self.assertEqual(self.project.load()[0]["nodes"][0]["reference"]["sha256"], self.baseline_hash)
        self.assertEqual(snapshot["promotions"], [])
        second = self.proposal(130)
        self.assertNotEqual(first, second)
        self.assertEqual(len(self.store.snapshot()["versions"]), 2)

    def test_historical_reference_preserves_provenance_and_accepts_feedback(self):
        data, _ = self.project.load()
        data["nodes"][0]["reference"]["provenance"]["prompt"] = "Original generation prompt"
        self.project.write(data)
        candidate = self.proposal()
        self.accept(candidate)
        self.promote(candidate)
        references = self.store.snapshot()["referenceSnapshots"]
        original = next(r for r in references if r["sha256"] == self.baseline_hash)
        self.assertEqual(original["reference"]["provenance"]["prompt"], "Original generation prompt")
        self.comment()
        self.assertTrue(self.store.snapshot()["threads"][0]["reference_changed"])
        file = self.directory / "historical.html"
        static_export(self.store, file, True)
        self.assertIn("Original generation prompt", file.read_text())

    def test_review_export_includes_baseline_without_comments_or_captures(self):
        candidate = self.proposal()
        self.accept(candidate)
        self.promote(candidate)
        file = self.directory / "baseline.html"
        static_export(self.store, file, True)
        self.assertIn(encoded(self.baseline), file.read_text())

    def test_stale_acceptance_cannot_accept_a_new_candidate(self):
        first = self.proposal()
        old = self.store.snapshot()["designStates"][0]
        self.proposal(180)
        with self.assertRaises(Conflict):
            self.execute("accept", {"id": "one", "versionId": first, "imageSha256": digest(png(100)), "revision": old["revision"]})
        self.assertEqual(self.store.snapshot()["acceptances"], [])

    def test_acceptance_retry_preserves_exact_version(self):
        candidate = self.proposal()
        payload = {"id": "one", "versionId": candidate, "imageSha256": digest(png(100)), "revision": 1}
        operation = str(uuid.uuid4())
        self.execute("accept", payload, operation)
        self.proposal(180)
        self.execute("accept", payload, operation)
        snapshot = self.store.snapshot()
        self.assertEqual(len(snapshot["acceptances"]), 1)
        self.assertIsNotNone(snapshot["designStates"][0]["proposed_id"])

    def test_expected_baseline_and_tampered_candidate_are_rejected(self):
        with self.assertRaises(Conflict):
            self.proposal(baseline=digest(png(199)))
        candidate = self.proposal()
        (self.store.objects / f"{digest(png(100))}.png").write_bytes(png(101))
        with self.assertRaises(Conflict):
            self.accept(candidate)
        self.assertEqual(self.store.snapshot()["acceptances"], [])

    def test_batch_failure_publishes_no_partial_proposal_state(self):
        good = {"id": "one", "baselineSha256": self.baseline_hash, "prompt": "A bounded edit", "png": encoded(png(10))}
        with self.assertRaises(Invalid):
            self.execute("import-proposals", {"entries": [good, {**good, "id": "missing"}]})
        self.assertEqual(self.store.snapshot()["versions"], [])

    def test_new_screen_starts_without_baseline_or_implicit_approval(self):
        data, etag = self.project.load()
        data["nodes"].append({**copy.deepcopy(data["nodes"][0]), "id": "new", "reference": None, "x": 500})
        with self.project.locked():
            self.project.save_unlocked(data, etag)
        candidate = self.proposal(node="new", baseline=None)
        self.assertIsNone(next(s for s in self.store.snapshot()["designStates"] if s["node_id"] == "new")["accepted_id"])
        self.accept(candidate)
        self.promote(candidate)
        node = self.project.load()[0]["nodes"][1]
        self.assertEqual(node["reference"]["provenance"]["acceptedVersion"], candidate)
        self.assertIsNone(node["reference"]["provenance"]["previousSha256"])

    def test_unknown_screen_import_does_not_create_topology(self):
        with self.assertRaises(Invalid):
            self.proposal(node="missing", baseline=None)
        self.assertEqual(len(self.project.load()[0]["nodes"]), 1)

    def test_promotion_requires_accepted_version_and_expected_project(self):
        candidate = self.proposal()
        with self.assertRaises(Conflict):
            self.promote(candidate)
        self.accept(candidate)
        with self.assertRaises(Conflict):
            self.execute("promote", {"id": "one", "versionId": candidate, "etag": "stale"})
        self.promote(candidate)
        current = self.project.load()[0]["nodes"][0]["reference"]
        self.assertEqual(current["sha256"], digest(png(100)))
        self.assertTrue(self.project.file(current["path"]).is_file())
        self.assertEqual(len(self.store.snapshot()["promotions"]), 1)

    def test_interrupted_promotion_recovers_after_atomic_document_write(self):
        candidate = self.proposal()
        self.accept(candidate)
        payload = {"id": "one", "versionId": candidate, "etag": self.project.load()[1]}
        operation = str(uuid.uuid4())
        write = self.store.project.write
        def crash_after_write(data):
            write(data)
            raise RuntimeError("Simulated process failure after atomic file promotion")
        with patch.object(self.store.project, "write", crash_after_write):
            with self.assertRaises(RuntimeError):
                self.execute("promote", payload, operation)
        self.assertEqual(self.store.snapshot()["promotions"], [])
        self.execute("promote", payload, operation)
        self.assertEqual(len(self.store.snapshot()["promotions"]), 1)
        self.assertEqual(self.project.load()[0]["nodes"][0]["reference"]["provenance"]["acceptedVersion"], candidate)

    def test_capture_retry_and_metadata_identity(self):
        entry = self.capture()
        self.execute("import-captures", {"entries": [entry]})
        self.assertEqual(len(self.store.snapshot()["captures"]), 1)
        for changed in ({"png": encoded(png(20))}, {"state": "Different"}, {"device": "Different"}):
            with self.assertRaises(Conflict):
                self.execute("import-captures", {"entries": [{**entry, **changed}]})
        self.assertIsNone(self.store.snapshot()["captures"][0]["build_revision"])

    def test_capture_feedback_never_moves_to_a_new_capture(self):
        first = self.capture()
        value = digest(png(150))
        self.comment({"kind": "capture", "nodeId": "one", "captureId": first["id"], "imageSha256": value, "x": .2, "y": .7})
        self.capture(151)
        candidate = self.proposal()
        self.accept(candidate)
        self.promote(candidate)
        snapshot = self.store.snapshot()
        self.assertEqual(snapshot["threads"][0]["capture_id"], first["id"])
        self.assertEqual(snapshot["threads"][0]["image_sha256"], value)
        self.assertTrue(snapshot["threads"][0]["reference_changed"])
        self.assertEqual(self.store.image(self.baseline_hash), self.baseline)

    def test_capture_decisions_are_versioned_and_do_not_transfer(self):
        first = self.capture()
        payload = self.decision(first["id"])
        op = str(uuid.uuid4())
        self.execute("decide", payload, op)
        self.execute("decide", payload, op)
        second = self.capture(152)
        snapshot = self.store.snapshot()
        self.assertEqual(next(c for c in snapshot["captures"] if c["id"] == second["id"])["review"]["status"], "pending")
        self.execute("decide", self.decision(first["id"], "changes_requested", 1))
        older = next(c for c in self.store.snapshot()["captures"] if c["id"] == first["id"])
        self.assertEqual([d["status"] for d in older["decisions"]], ["approved", "changes_requested"])
        with self.assertRaises(Conflict):
            self.execute("decide", payload)

    def test_capture_approval_rejects_changed_reference_or_bytes(self):
        first = self.capture()
        payload = self.decision(first["id"])
        candidate = self.proposal()
        self.accept(candidate)
        self.promote(candidate)
        with self.assertRaises(Conflict):
            self.execute("decide", payload)
        second = self.capture(160)
        (self.store.objects / f"{digest(png(160))}.png").write_bytes(png(161))
        with self.assertRaises(Conflict):
            self.execute("decide", self.decision(second["id"]))
        self.assertFalse(self.store.doctor()["healthy"])

    def test_retired_screen_keeps_review_history(self):
        thread = self.comment()["id"]
        candidate = self.proposal()
        data, etag = self.project.load()
        data["nodes"][0]["retired"] = True
        with self.project.locked():
            self.project.save_unlocked(data, etag)
        snapshot = self.store.snapshot()
        self.assertEqual(snapshot["threads"][0]["id"], thread)
        self.assertEqual(snapshot["versions"][0]["id"], candidate)
        with self.assertRaises(Invalid):
            self.accept(candidate)
        data["nodes"] = []
        with self.assertRaises(Invalid):
            self.project.save_unlocked(data, self.project.load()[1])

    def test_contract_navigation_has_one_authoritative_destination(self):
        data, etag = self.project.load()
        data["nodes"].append({**copy.deepcopy(data["nodes"][0]), "id": "two", "reference": None, "x": 450})
        data["nodes"][0]["contract"]["actions"] = [{"id": "next", "label": "Continue", "to": "two", "effect": "Save current choices"}]
        with self.project.locked():
            self.project.save_unlocked(data, etag)
        self.assertEqual(connections(self.project.load()[0])[0]["to"], "two")
        with self.assertRaises(Conflict):
            self.project.save_unlocked(data, etag)
        data["nodes"][0]["reference"] = None
        with self.assertRaises(Invalid):
            self.project.save_unlocked(data, self.project.load()[1])

    def test_linked_document_allowlist_blocks_escape_and_html(self):
        data, _ = self.project.load()
        for path in ("../private.md", ".atlas-local/private.md", "private.html", "C:/private.md"):
            bad = copy.deepcopy(data)
            bad["documents"] = [{"id": "doc", "title": "Source", "path": path}]
            with self.assertRaises(Invalid):
                validate(bad)
        outside = self.directory / "outside.md"
        outside.write_text("private")
        if os.name != "nt":
            (self.project.root / "source.md").symlink_to(outside)
            with self.assertRaises(Invalid):
                self.project.document({"path": "source.md"})

    def test_contract_change_is_flagged_separately_from_appearance(self):
        entry = self.capture()
        self.execute("decide", self.decision(entry["id"]))
        data, etag = self.project.load()
        data["nodes"][0]["contract"]["edgeCases"] = "Recover from an interrupted operation"
        with self.project.locked():
            self.project.save_unlocked(data, etag)
        capture = self.store.snapshot()["captures"][0]
        self.assertTrue(capture["contract_changed"])
        self.assertFalse(capture["reference_changed"])
        self.assertEqual(capture["review"]["status"], "approved")

    def test_unreferenced_capture_cannot_be_approved(self):
        data, etag = self.project.load()
        data["nodes"].append({**copy.deepcopy(data["nodes"][0]), "id": "new", "reference": None, "x": 500})
        with self.project.locked():
            self.project.save_unlocked(data, etag)
        entry = self.capture(nodeId="new")
        with self.assertRaises(Conflict):
            self.execute("decide", self.decision(entry["id"]))
        self.assertEqual(self.store.snapshot()["captures"][0]["review"]["status"], "pending")

    def test_private_backup_restore_retains_full_history_and_bytes(self):
        self.comment()
        candidate = self.proposal()
        self.accept(candidate)
        self.promote(candidate)
        self.capture()
        before = self.store.snapshot()
        file = self.directory / "backup.zip"
        backup(self.store, file)
        destination = self.directory / "restored"
        restore(file, destination)
        restored = Store(destination)
        self.assertEqual(before, restored.snapshot())
        self.assertTrue(restored.doctor()["healthy"])
        self.assertEqual(restored.image(self.baseline_hash), self.baseline)
        with self.assertRaises(Conflict):
            restore(file, destination)

    def test_restore_rejects_tampering_and_path_injection(self):
        self.comment()
        valid = self.directory / "backup.zip"
        backup(self.store, valid)
        for mode in ("tamper", "traversal"):
            bad = self.directory / f"{mode}.zip"
            with zipfile.ZipFile(valid) as source, zipfile.ZipFile(bad, "w") as target:
                for name in source.namelist():
                    raw = source.read(name)
                    target.writestr(name, raw + b"wrong" if mode == "tamper" and name == "atlas.json" else raw)
                if mode == "traversal":
                    target.writestr("../outside.txt", b"escape")
            with self.assertRaises((Invalid, Conflict, ValueError)):
                restore(bad, self.directory / f"restore-{mode}")
        self.assertFalse((self.directory / "outside.txt").exists())

    def test_static_export_omits_private_review_unless_requested(self):
        self.comment(body="PRIVATE_FEEDBACK_MARKER")
        self.capture()
        clean, private = self.directory / "clean.html", self.directory / "private.html"
        static_export(self.store, clean)
        static_export(self.store, private, True)
        self.assertNotIn("PRIVATE_FEEDBACK_MARKER", clean.read_text())
        self.assertIn("PRIVATE_FEEDBACK_MARKER", private.read_text())
        self.assertIn("data:image/png;base64,", clean.read_text())
        self.assertNotIn('src="/app.js"', clean.read_text())
        self.assertNotIn('src="/connections.js"', clean.read_text())
        self.assertIn('ScreenAtlasConnections', clean.read_text())
        self.assertNotIn('href="/app.css"', clean.read_text())
        self.assertIn('"readonly": true', clean.read_text())
        self.assertNotIn(str(self.project.root), clean.read_text())

    def test_fresh_schema_migration_checksums_and_project_binding(self):
        reopened = Store(self.project.root)
        self.assertTrue(reopened.doctor()["healthy"])
        with reopened.connect() as db:
            db.execute("UPDATE migrations SET sha256='tampered'")
        with self.assertRaises(Conflict):
            Store(self.project.root)

    def test_v1_upgrade_uses_real_old_schema_and_preserves_feedback(self):
        old = initialize(self.directory / "old-project", "Old project fixture")
        data, _ = old.load()
        data["nodes"] = copy.deepcopy(self.project.load()[0]["nodes"])
        old.file(f"assets/{self.baseline_hash}.png").parent.mkdir()
        old.file(f"assets/{self.baseline_hash}.png").write_bytes(self.baseline)
        old.write(data)
        thread_id = str(uuid.uuid4())
        database = old.local / "review.sqlite3"
        with sqlite3.connect(database) as db:
            sql = MIGRATIONS[0].read_text()
            db.executescript(sql)
            db.execute("INSERT INTO migrations VALUES(1,?)", (digest(sql.encode()),))
            db.execute("PRAGMA user_version=1")
            db.execute("INSERT INTO project_identity VALUES(?)", (data["id"],))
            db.execute("INSERT INTO threads(id,node_id,image_sha256,anchor_kind,x,y,status,revision) VALUES(?,'one',?,'image',0.2,0.3,'open',1)", (thread_id,self.baseline_hash))
            db.execute("INSERT INTO messages(thread_id,author,body) VALUES(?,'reviewer','Original feedback')", (thread_id,))
            db.execute("INSERT INTO transitions(thread_id,status,author,revision) VALUES(?,'open','reviewer',1)", (thread_id,))
        migrated = Store(old.root)
        snapshot = migrated.snapshot()
        self.assertEqual(snapshot["threads"][0]["id"], thread_id)
        self.assertEqual(snapshot["threads"][0]["messages"][0]["body"], "Original feedback")
        self.assertEqual(snapshot["referenceSnapshots"], [])
        self.assertTrue(migrated.doctor()["healthy"])
        with migrated.connect() as db:
            self.assertEqual(db.execute("PRAGMA user_version").fetchone()[0], len(MIGRATIONS))
            self.assertEqual(db.execute("PRAGMA foreign_key_check").fetchall(), [])

    def test_database_from_another_project_is_rejected(self):
        data, _ = self.project.load()
        data["id"] = str(uuid.uuid4())
        self.project.write(data)
        with self.assertRaises(Conflict):
            Store(self.project.root)

    def test_schema_drift_and_future_schema_are_rejected(self):
        with self.store.connect() as db:
            db.execute("CREATE TABLE unexpected(secret TEXT)")
        with self.assertRaises(Conflict):
            Store(self.project.root)
        with self.store.connect() as db:
            db.execute("PRAGMA user_version=99")
        with self.assertRaises(Invalid):
            Store(self.project.root)

    def test_cli_manifest_paths_context_and_structured_conflicts(self):
        candidate = self.directory / "candidate.png"
        candidate.write_bytes(png(55))
        manifest = self.directory / "proposals.json"
        manifest.write_text(json.dumps({"entries": [{"id": "one", "baselineSha256": self.baseline_hash, "candidate": "candidate.png", "prompt": "Actual prompt"}]}))
        command = [sys.executable, "-B", "-m", "atlas", "--project", str(self.project.root)]
        op = str(uuid.uuid4())
        imported = subprocess.run([*command, "import-proposals", str(manifest), "--operation", op], capture_output=True, text=True)
        self.assertEqual(imported.returncode, 0, imported.stderr)
        version_id = json.loads(imported.stdout)["versions"][0]
        context = subprocess.run([*command, "context", "one"], capture_output=True, text=True)
        self.assertEqual(json.loads(context.stdout)["versions"][0]["id"], version_id)
        stale = subprocess.run([*command, "accept", "one", version_id, "--revision", "99", "--image-sha256", digest(png(55)), "--reviewed", "--operation", str(uuid.uuid4())], capture_output=True, text=True)
        self.assertEqual(stale.returncode, 3)
        self.assertEqual(json.loads(stale.stderr)["code"], "conflict")

    def test_http_origin_token_paths_limits_and_shared_store(self):
        server = make_server(self.store, 0)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        port = server.server_port
        def call(method, path, payload=None, headers=None, raw=None):
            connection = http.client.HTTPConnection("127.0.0.1", port)
            connection.request(method, path, body=raw if raw is not None else json.dumps(payload) if payload is not None else None, headers=headers or {})
            response = connection.getresponse()
            result = response.status, response.read(), dict(response.getheaders())
            connection.close()
            return result
        status, raw, headers = call("GET", "/api/state")
        self.assertEqual(status, 200)
        token = json.loads(raw)["token"]
        status, onboarding, _ = call("GET", "/api/onboarding")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(onboarding)["projectDirectory"], str(self.project.root))
        self.assertIn("import-proposals", json.loads(onboarding)["prompt"])
        self.assertEqual(call("GET", "/api/onboarding", headers={"Sec-Fetch-Site": "cross-site"})[0], 403)
        self.assertIn("frame-ancestors 'none'", headers["Content-Security-Policy"])
        good = {"Origin": f"http://127.0.0.1:{port}", "X-Atlas-Token": token, "Content-Type": "application/json"}
        payload = {"id": str(uuid.uuid4()), "operationId": str(uuid.uuid4()), "body": "Browser feedback", "anchor": {"kind": "canvas", "nodeId": None, "x": 15, "y": 30}}
        self.assertEqual(call("POST", "/api/commands/comment", payload)[0], 403)
        self.assertEqual(call("POST", "/api/commands/comment", payload, {**good, "Origin": "https://evil.example"})[0], 403)
        self.assertEqual(call("GET", "/api/state", headers={"Host": "evil.example"})[0], 403)
        self.assertEqual(call("GET", "/api/state", headers={"Sec-Fetch-Site": "cross-site"})[0], 403)
        for path in ("/.atlas-local/review.sqlite3", "/atlas.json", "/../atlas.json", "/api/documents/../atlas.json", "/assets/../.atlas-local/review.sqlite3"):
            self.assertEqual(call("GET", path)[0], 404)
        self.assertEqual(call("POST", "/api/commands/comment", payload, good)[0], 200)
        self.assertEqual(self.store.snapshot()["threads"][0]["messages"][0]["body"], "Browser feedback")
        self.assertEqual(call("POST", "/api/commands/comment", raw='{"x":NaN}', headers=good)[0], 400)
        self.assertEqual(call("POST", "/api/commands/comment", payload, {**good, "Content-Type": "text/plain"})[0], 400)
        self.assertEqual(call("POST", "/api/commands/comment", headers={**good, "Content-Length": str(50*1024*1024)})[0], 400)
        self.assertEqual(call("GET", f"/api/images/{self.baseline_hash}.png")[1], self.baseline)
        self.assertEqual(call("GET", "/")[0], 200)


class PNGTest(unittest.TestCase):
    def test_animated_png_is_not_admitted_as_static_evidence(self):
        kind, payload = b"acTL", struct.pack(">II", 2, 0)
        chunk = struct.pack(">I",len(payload))+kind+payload+struct.pack(">I",zlib.crc32(kind+payload)&0xffffffff)
        raw = png()
        with self.assertRaises(Invalid):
            inspect_png(raw[:33] + chunk + raw[33:])

    def test_actual_raster_validates_and_truncation_crc_and_bombs_fail(self):
        self.assertEqual(inspect_png(png())["width"], 3)
        for raw in (b"\x89PNG\r\n\x1a\nfixture", png()[:-2], png()+b"trailing", png()[:44]+b"bad"+png()[47:]):
            with self.assertRaises(Invalid):
                inspect_png(raw)
        # A valid-CRC PNG with impossible dimensions is rejected before decode.
        raw = png()
        header = struct.pack(">IIBBBBB", 99999, 99999, 8, 2, 0, 0, 0)
        bomb = raw[:8]+struct.pack(">I",13)+b"IHDR"+header+struct.pack(">I",zlib.crc32(b"IHDR"+header)&0xffffffff)+raw[33:]
        with self.assertRaises(Invalid):
            inspect_png(bomb)


if __name__ == "__main__":
    unittest.main()
