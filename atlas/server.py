"""Loopback-only HTTP adapter. Never serves an arbitrary repository tree."""
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import secrets
import sqlite3
from urllib.parse import unquote, urlsplit

from .core import Conflict, Invalid
from .onboarding import project_handoff

MAX_JSON = 42 * 1024 * 1024
WEB = Path(__file__).parent / "web"


def make_server(store, port=8765):
    token = secrets.token_urlsafe(32)

    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(15)

        def log_message(self, format, *args):
            if len(args) > 1 and str(args[1]) not in ("200", "204"):
                super().log_message(format, *args)

        def send(self, status, body, content_type="application/json"):
            if content_type == "application/json":
                body = json.dumps(body, ensure_ascii=False, allow_nan=False).encode()
            elif isinstance(body, str):
                body = body.encode()
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
            self.end_headers()
            self.wfile.write(body)

        def allowed(self, write=False):
            host = f"127.0.0.1:{self.server.server_port}"
            if self.headers.get("Host") != host or self.headers.get("Sec-Fetch-Site") == "cross-site":
                self.send(403, {"error": "Loopback, same-site access required", "code": "forbidden"})
                return False
            if write and (self.headers.get("Origin") != f"http://{host}" or self.headers.get("X-Atlas-Token") != token):
                self.send(403, {"error": "Same-origin write token required", "code": "forbidden"})
                return False
            return True

        def error(self, error):
            status = 409 if isinstance(error, Conflict) else 400 if isinstance(error, (Invalid, ValueError, TypeError, KeyError)) else 500
            self.send(status, {"error": str(error), "code": "conflict" if status == 409 else "invalid" if status == 400 else "io_error"})

        def do_GET(self):
            if not self.allowed():
                return
            path = unquote(urlsplit(self.path).path)
            try:
                if path == "/api/state":
                    self.send(200, {**store.snapshot(), "token": token, "readonly": False})
                elif path == "/api/onboarding":
                    self.send(200, project_handoff(store.project, self.server.server_port))
                elif path.startswith("/api/images/"):
                    value = path.removeprefix("/api/images/").removesuffix(".png")
                    self.send(200, store.image(value), "image/png")
                elif path.startswith("/api/documents/"):
                    data, _ = store.project.load()
                    item = next((item for item in data["documents"] if item["id"] == path.removeprefix("/api/documents/")), None)
                    if not item:
                        self.send(404, {"error": "Document not found"})
                    else:
                        self.send(200, {"title": item["title"], "body": store.project.document(item)})
                elif path in ("/", "/index.html", "/app.js", "/connections.js", "/app.css"):
                    name = "index.html" if path in ("/", "/index.html") else path[1:]
                    content_type = {"html": "text/html; charset=utf-8", "js": "text/javascript; charset=utf-8", "css": "text/css; charset=utf-8"}[name.rsplit(".", 1)[1]]
                    self.send(200, (WEB / name).read_bytes(), content_type)
                elif path == "/favicon.ico":
                    self.send(204, b"", "image/x-icon")
                else:
                    self.send(404, {"error": "Not found"})
            except (Invalid, Conflict, OSError, ValueError, TypeError, sqlite3.Error) as error:
                self.error(error)

        def do_POST(self):
            if not self.allowed(write=True):
                return
            try:
                path = urlsplit(self.path).path
                if self.headers.get("Transfer-Encoding"):
                    raise Invalid("Transfer encoding is unsupported; supply Content-Length")
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= MAX_JSON or self.headers.get("Content-Type", "").split(";", 1)[0] != "application/json":
                    raise Invalid("A JSON body of at most 42 MiB is required")
                raw = self.rfile.read(size)
                if len(raw) != size:
                    raise Invalid("Incomplete request body")
                payload = json.loads(raw, parse_constant=lambda value: (_ for _ in ()).throw(Invalid("Non-finite JSON number")))
                if not isinstance(payload, dict):
                    raise Invalid("Expected a JSON object")
                if path == "/api/project":
                    with store.project.locked():
                        result = store.project.save_unlocked(payload["project"], payload.get("etag"))
                elif path.startswith("/api/commands/"):
                    result = store.execute(path.removeprefix("/api/commands/"), payload, "reviewer")
                else:
                    self.send(404, {"error": "Unknown operation"})
                    return
                self.send(200, result)
            except (Invalid, Conflict, OSError, ValueError, TypeError, KeyError, sqlite3.Error) as error:
                self.error(error)

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    server.daemon_threads = True
    return server
