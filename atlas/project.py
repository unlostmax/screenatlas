"""The portable project document is the sole curated inventory authority."""
from __future__ import annotations

import copy
import json
import math
from pathlib import Path, PurePosixPath
import re
import uuid

from .core import Conflict, Invalid, atomic_write, canonical, digest, file_lock, identity, sha, text
from .png import inspect_png

KINDS = ("screen", "anchor", "frame", "sheet", "gap", "system", "hub")
EDGE_KINDS = ("navigation", "state", "reference", "motion", "system", "return", "proposal")
CONTRACT_FIELDS = ("purpose", "entry", "data", "states", "edgeCases", "accessibility", "acceptance")


def contract():
    return {**{key: "" for key in CONTRACT_FIELDS}, "actions": [], "sources": []}


def validate(data):
    if not isinstance(data, dict) or data.get("schemaVersion") != 1:
        raise Invalid("Unsupported ScreenAtlas project schema; expected version 1")
    identity(data.get("id"))
    text(data.get("name"), "Project name", 200)
    text(data.get("description", ""), "Project description", 20000, False)
    if type(data.get("revision")) is not int or data["revision"] < 1:
        raise Invalid("Project revision must be a positive integer")
    for key in ("groups", "nodes", "edges", "documents", "platforms"):
        if not isinstance(data.get(key), list):
            raise Invalid(f"Project {key} must be an array")
    if len(data["nodes"]) > 10000 or len(data["edges"]) > 50000 or len(data["groups"]) > 1000:
        raise Invalid("Project exceeds the inventory size limit")
    for platform in data["platforms"]:
        text(platform, "Platform", 100)
    def ids(rows, label):
        found = set()
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get("id"), str) or not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_.-]{0,119}", row["id"]):
                raise Invalid(f"Invalid {label} identity")
            if row["id"] in found:
                raise Invalid(f"Duplicate {label} identity: {row['id']}")
            found.add(row["id"])
        return found
    groups, nodes, docs = ids(data["groups"], "group"), ids(data["nodes"], "screen"), ids(data["documents"], "document")
    ids(data["edges"], "connection")
    for document in data["documents"]:
        text(document.get("title"), "Document title", 200)
        if ("body" in document) == ("path" in document):
            raise Invalid("A document requires either body text or a relative path")
        if "body" in document:
            text(document["body"], "Document", 500000, False)
        else:
            relative_path(document["path"])
            if PurePosixPath(document["path"]).suffix.lower() not in (".md", ".txt"):
                raise Invalid("Linked documents must be Markdown or text")
    def number(value, label, positive=False):
        if type(value) not in (int, float) or not math.isfinite(value) or value < (1 if positive else 0) or value > 100000:
            raise Invalid(f"Invalid {label} coordinate or dimension")
    for group in data["groups"]:
        text(group.get("title"), "Group title", 200)
        for key in ("x", "y", "w", "h"):
            number(group.get(key), key, key in ("w", "h"))
    for node in data["nodes"]:
        text(node.get("title"), "Screen title", 200)
        if node.get("group") not in groups or node.get("kind") not in KINDS:
            raise Invalid(f"Unknown group or screen kind: {node['id']}")
        text(node.get("platform", ""), "Platform", 100, False)
        if type(node.get("retired", False)) is not bool:
            raise Invalid("Retired must be a boolean")
        for key in ("x", "y", "w", "h"):
            number(node.get(key, 240 if key == "w" else 420 if key == "h" else None), key, key in ("w", "h"))
        c = node.get("contract")
        if not isinstance(c, dict):
            raise Invalid(f"Screen contract is required: {node['id']}")
        for key in CONTRACT_FIELDS:
            text(c.get(key, ""), f"Contract {key}", 20000, False)
        if not isinstance(c.get("actions", []), list) or not isinstance(c.get("sources", []), list):
            raise Invalid("Contract actions and sources must be arrays")
        ids(c.get("actions", []), "action")
        for action in c.get("actions", []):
            text(action.get("label"), "Action label", 200)
            for key in ("condition", "effect"):
                text(action.get(key, ""), key, 2000, False)
            if action.get("to") is not None and action["to"] not in nodes:
                raise Invalid(f"Unknown action destination: {action.get('to')}")
            if action.get("kind", "navigation") not in EDGE_KINDS:
                raise Invalid("Unknown action connection kind")
        if any(source not in docs for source in c.get("sources", [])):
            raise Invalid("Unknown contract source document")
        reference = node.get("reference")
        if reference is not None:
            if not isinstance(reference, dict):
                raise Invalid("Reference must be an object or null")
            sha(reference.get("sha256"))
            if reference.get("path") != f"assets/{reference['sha256']}.png":
                raise Invalid("Curated images must use their content-addressed asset path")
            if not isinstance(reference.get("provenance"), dict):
                raise Invalid("Reference provenance is required")
    for edge in data["edges"]:
        if edge.get("from") not in nodes or edge.get("to") not in nodes or edge.get("kind") not in EDGE_KINDS:
            raise Invalid("Unknown connection endpoint or kind")
        text(edge.get("label"), "Connection label", 200)
    return data


def relative_path(value):
    if not isinstance(value, str) or not value or "\\" in value:
        raise Invalid("Expected a portable relative path")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in ("..", ".atlas-local", ".git") for part in path.parts) or ":" in value:
        raise Invalid("Path must stay inside the ScreenAtlas project")
    return value


def connections(data):
    return data["edges"] + [
        {"id": f"action:{node['id']}:{action['id']}", "from": node["id"], "to": action["to"],
         "label": action["label"], "kind": action.get("kind", "navigation"), "actionId": action["id"]}
        for node in data["nodes"] for action in node["contract"].get("actions", []) if action.get("to")]


class Project:
    def __init__(self, root):
        self.root = Path(root).resolve()
        self.path = self.root / "atlas.json"
        self.local = self.root / ".atlas-local"
        if self.local.is_symlink():
            raise Invalid("Local review state cannot be a symbolic link")

    def locked(self):
        return file_lock(self.local / "project.lock")

    def load(self):
        try:
            raw = self.path.read_bytes()
            if len(raw) > 16 * 1024 * 1024:
                raise Invalid("Project document exceeds 16 MiB")
            return validate(json.loads(raw)), digest(raw)
        except FileNotFoundError as error:
            raise Invalid("No atlas.json found. Create a project with atlas init first.") from error
        except (json.JSONDecodeError, UnicodeError) as error:
            raise Invalid(f"Invalid project JSON: {error}") from error

    def file(self, relative):
        relative_path(relative)
        path = (self.root / relative).resolve()
        if not path.is_relative_to(self.root) or path.is_relative_to(self.local):
            raise Invalid("Project file escapes the allowed directory")
        return path

    def save_unlocked(self, data, expected):
        validate(data)
        previous, etag = self.load()
        if expected != etag:
            raise Conflict("Project changed. Refresh and reconcile your draft before saving.")
        data = copy.deepcopy(data)
        if data.get("id") != previous["id"]:
            raise Invalid("Project identity cannot change")
        old = {node["id"]: node for node in previous["nodes"]}
        new = {node["id"]: node for node in data.get("nodes", [])}
        if set(old) - set(new):
            raise Invalid("Retire screens instead of deleting their stable identities")
        if any(old[key].get("reference") != new[key].get("reference") for key in old):
            raise Invalid("Curated references change only through accepted-version promotion")
        if any(node.get("reference") is not None for key, node in new.items() if key not in old):
            raise Invalid("New screens begin without an approved reference")
        data["revision"] = previous["revision"] + 1
        return self.write(data)

    def write(self, data):
        validate(data)
        encoded = (json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False) + "\n").encode()
        if len(encoded) > 16 * 1024 * 1024:
            raise Invalid("Project document exceeds 16 MiB")
        atomic_write(self.path, encoded)
        return {"project": data, "etag": digest(encoded)}

    def document(self, item):
        if "body" in item:
            return item["body"]
        file = self.file(item["path"])
        if file.stat().st_size > 500000:
            raise Invalid("Supporting document exceeds 500 KB")
        return file.read_text(encoding="utf-8")

    def check(self):
        data, etag = self.load()
        warnings, linked, images = [], set(), {}
        groups = {group["id"]: group for group in data["groups"]}
        for edge in connections(data):
            linked.update((edge["from"], edge["to"]))
        for node in data["nodes"]:
            if node.get("retired"):
                continue
            if not node["contract"].get("purpose"):
                warnings.append(f"{node['id']}: purpose is unspecified")
            if node["id"] not in linked:
                warnings.append(f"{node['id']}: no mapped connections")
            group = groups[node["group"]]
            if node["x"] + node.get("w", 240) > group["w"] or node["y"] + node.get("h", 420) > group["h"]:
                warnings.append(f"{node['id']}: card extends outside its chapter")
            reference = node.get("reference")
            if reference:
                file = self.file(reference["path"])
                raw = file.read_bytes()
                if digest(raw) != reference["sha256"]:
                    raise Conflict(f"Curated reference missing or changed: {node['id']}")
                inspect_png(raw)
                if reference["sha256"] in images:
                    warnings.append(f"{node['id']}: shares an image with {images[reference['sha256']]} — consider sharing one screen")
                images[reference["sha256"]] = node["id"]
        live = [node for node in data["nodes"] if not node.get("retired")]
        for index, node in enumerate(live):
            group = groups[node["group"]]
            x, y = group["x"] + node["x"], group["y"] + node["y"]
            for other in live[:index]:
                g = groups[other["group"]]
                ox, oy = g["x"] + other["x"], g["y"] + other["y"]
                if x < ox + other.get("w", 240) and ox < x + node.get("w", 240) and y < oy + other.get("h", 420) and oy < y + node.get("h", 420):
                    warnings.append(f"Overlapping cards: {other['id']} and {node['id']}")
        for document in data["documents"]:
            self.document(document)
        return {"valid": True, "etag": etag, "screens": len(live), "connections": len(connections(data)), "warnings": warnings}


def initialize(root, name="Untitled application"):
    project = Project(root)
    project.root.mkdir(parents=True, exist_ok=True)
    with project.locked():
        if project.path.exists():
            raise Conflict("This folder already contains a ScreenAtlas project")
        data = {"schemaVersion": 1, "id": str(uuid.uuid4()), "name": name, "revision": 1,
                "description": "", "platforms": ["Web"], "documents": [], "groups": [
                    {"id": "start", "title": "Getting started", "note": "", "x": 80, "y": 80, "w": 1800, "h": 700}],
                "nodes": [], "edges": []}
        project.write(data)
        ignore = project.root / ".gitignore"
        existing = ignore.read_text() if ignore.exists() else ""
        if ".atlas-local/" not in existing.splitlines():
            atomic_write(ignore, (existing.rstrip() + "\n.atlas-local/\n").lstrip().encode())
    return project
