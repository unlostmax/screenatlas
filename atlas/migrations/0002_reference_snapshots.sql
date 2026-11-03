CREATE TABLE reference_snapshots(
 sequence INTEGER PRIMARY KEY, node_id TEXT NOT NULL, sha256 TEXT NOT NULL,
 reference_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(node_id,sha256,reference_json)
) STRICT;
