CREATE TABLE migrations(version INTEGER PRIMARY KEY, sha256 TEXT NOT NULL) STRICT;
CREATE TABLE project_identity(id TEXT PRIMARY KEY) STRICT;
CREATE TABLE operations(id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, result TEXT NOT NULL) STRICT;
CREATE TABLE versions(
 sequence INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, node_id TEXT NOT NULL,
 sha256 TEXT NOT NULL, baseline_sha256 TEXT, prompt TEXT NOT NULL,
 source TEXT NOT NULL, note TEXT NOT NULL, provenance TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE TABLE acceptances(
 sequence INTEGER PRIMARY KEY, node_id TEXT NOT NULL, version_id TEXT NOT NULL REFERENCES versions(id),
 previous_id TEXT REFERENCES versions(id), revision INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(node_id,revision), UNIQUE(version_id)
) STRICT;
CREATE TABLE design_states(
 node_id TEXT PRIMARY KEY, proposed_id TEXT REFERENCES versions(id),
 accepted_id TEXT REFERENCES versions(id), revision INTEGER NOT NULL CHECK(revision>0)
) STRICT;
CREATE TABLE promotions(
 sequence INTEGER PRIMARY KEY, node_id TEXT NOT NULL, version_id TEXT NOT NULL REFERENCES versions(id),
 project_etag TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(node_id,version_id)
) STRICT;
CREATE TABLE captures(
 sequence INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, node_id TEXT NOT NULL,
 sha256 TEXT NOT NULL, reference_sha256 TEXT, contract_sha256 TEXT NOT NULL,
 state TEXT NOT NULL, source TEXT NOT NULL CHECK(source IN ('device','simulator','archive')),
 device TEXT NOT NULL, build_revision TEXT, captured_at TEXT, note TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE TABLE capture_decisions(
 sequence INTEGER PRIMARY KEY, capture_id TEXT NOT NULL REFERENCES captures(id),
 status TEXT NOT NULL CHECK(status IN ('pending','approved','changes_requested')),
 revision INTEGER NOT NULL CHECK(revision>0),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(capture_id,revision)
) STRICT;
CREATE TABLE threads(
 sequence INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, node_id TEXT,
 image_sha256 TEXT, capture_id TEXT REFERENCES captures(id),
 anchor_kind TEXT NOT NULL CHECK(anchor_kind IN ('image','node','canvas','capture')),
 x REAL NOT NULL, y REAL NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('open','in_progress','ready','resolved')),
 revision INTEGER NOT NULL CHECK(revision>0),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE TABLE messages(
 sequence INTEGER PRIMARY KEY, thread_id TEXT NOT NULL REFERENCES threads(id),
 author TEXT NOT NULL CHECK(author IN ('reviewer','assistant')),
 body TEXT NOT NULL, preview_sha256 TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE TABLE transitions(
 sequence INTEGER PRIMARY KEY, thread_id TEXT NOT NULL REFERENCES threads(id),
 status TEXT NOT NULL CHECK(status IN ('open','in_progress','ready','resolved')),
 author TEXT NOT NULL CHECK(author IN ('reviewer','assistant')), revision INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE INDEX messages_thread ON messages(thread_id,sequence);
CREATE INDEX versions_node ON versions(node_id,sequence);
CREATE INDEX captures_node ON captures(node_id,sequence);
