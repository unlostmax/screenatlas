"""Small shared boundary helpers; no application-specific dependencies."""
from __future__ import annotations

from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import threading
import uuid


class Invalid(ValueError):
    """An invalid command or project (CLI exit 2, HTTP 400)."""


class Conflict(Exception):
    """A stale revision or identity mismatch (CLI exit 3, HTTP 409)."""


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def identity(value):
    try:
        return str(uuid.UUID(value))
    except (ValueError, TypeError, AttributeError) as error:
        raise Invalid("A UUID is required for a stable save identity") from error


def text(value, label, limit=20000, required=True):
    if not isinstance(value, str) or len(value) > limit or (required and not value.strip()):
        raise Invalid(f"{label} must be {'nonempty ' if required else ''}text, at most {limit} characters")
    return value.strip()


def sha(value, nullable=False):
    if nullable and value is None:
        return None
    if not isinstance(value, str) or not re.fullmatch(r"[a-f0-9]{64}", value):
        raise Invalid("Expected a SHA-256 image identity")
    return value


def atomic_write(path: Path, data: bytes):
    """Write and sync bytes before replacing a single portable document."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".atlas-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as output:
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
        if os.name != "nt":
            directory = os.open(path.parent, os.O_RDONLY)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


_locks: dict[str, threading.RLock] = {}
_locks_guard = threading.Lock()


@contextmanager
def file_lock(path: Path):
    """Serialize CLI processes and server threads; OS releases locks on death."""
    with _locks_guard:
        lock = _locks.setdefault(str(path), threading.RLock())
    with lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a+b") as handle:
            if os.name == "nt":
                import msvcrt
                if handle.tell() == 0:
                    handle.write(b"\0")
                    handle.flush()
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_LOCK, 1)
            else:
                import fcntl
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                if os.name == "nt":
                    handle.seek(0)
                    msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
                else:
                    fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
