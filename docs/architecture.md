# Architecture and evidence boundaries

ScreenAtlas has a Python package and a dependency-free browser client. `project.py`
owns the portable project schema, contract-derived connections, file boundaries,
and atomic document edits. `store.py` owns review commands and SQLite history.
`server.py` and `cli.py` are adapters over those same operations. `transfer.py`
owns private backup/restore and self-contained read-only exports. `png.py`
validates PNG structure and bounded raster lengths without transforming bytes.

The first standalone schema intentionally begins at migration 0001. The original
application's private database is not an install prerequisite or supported input.
Migrations are transactionally applied, checksum-verified, serialized across
processes, and checked against a freshly constructed schema fingerprint.

## Three authorities

The portable `atlas.json` owns screen IDs, contracts, layout, source documents,
and curated reference pointers. SQLite owns local feedback and review history.
Immutable PNG objects own image bytes. Browser storage holds only drafts and
view preferences; deleting it never deletes shared review history.

Review writes serialize through an operating-system file lock and a SQLite
transaction. The lock coordinates browser threads and agent CLI processes.
Expected revisions prevent stale aggregate updates. Exact operation receipts
make response-loss retries safe. Project edits use the actual file digest,
not just a revision counter, to detect external manual edits.

An image path cannot serve as version identity. PNG bytes are keyed by SHA-256;
existing objects are verified before reuse. Reference comments snapshot the
canonical image even before any proposal exists. Proposal and capture imports
preserve their images and reference baselines. Removed/retired screens retain
their identities and histories. A malformed PNG, wrong anchor digest, altered
object, or changed baseline is rejected rather than normalized into success.

Migration 0002 adds full curated-reference snapshots, including prompt and
provenance, beside the immutable image identity. A real schema-1 fixture proves
that the upgrade retains feedback. Metadata not recorded by an older schema
remains unknown. Earlier accepted versions retain their acceptance labels in
the viewer; earlier curated baselines remain inspectable after promotion.

## Separate decisions

Feedback status describes work on a conversation. A reply preview is an
attachment. A registered proposal has an independent version identity and
acceptance record. Acceptance does not rewrite curated reference files.
Promotion requires the exact currently accepted version and records its
provenance in the portable document. Captures use the curated reference at
import; locally accepted but unpromoted candidates do not silently become
capture baselines.

Image objects and provenance are prepared before an atomic project-file
replacement during promotion. If the process stops after that replacement but
before the SQLite completion record, the document's accepted version identity
is sufficient to recover the record on retry. Tests inject that interruption.
No filesystem/database transaction is claimed. Failed imports may retain
unreferenced immutable objects; nothing automatically deletes evidence.

Captures bind their own UUID, image digest, reference digest, and contract
digest. Every new capture starts pending. Its comments and appearance decisions
never move to another capture. Contract changes are flagged separately from
reference changes. Approval requires matching current curated reference bytes;
it conveys no behavior or release approval. Build metadata is recorded as
supplied and is not compared with the ScreenAtlas repository's Git revision.

## Browser and local server

`start` creates an empty project or reopens an existing one, then serves the
workbench. It rejects nonempty folders without an atlas.json and never replaces
an existing map based on setup flags. The Get started guide obtains a live,
project-specific prompt from `/api/onboarding`. Its absolute map and launcher
paths stay outside snapshots and read-only exports. `launch.py` allows that
command to run from another app's working directory without PATH activation.
The prompt uses the existing agent workflow and leaves generation to the tools
actually available in the user's Codex session.

All groups share one world coordinate system. Group frames stay on that canvas;
their names focus the camera and their disclosure arrows expand the sidebar.
Native group and screen checkboxes control visibility, including mixed group
states. These preferences are browser drafts, separate from project authoring.
Hidden cards unmount without rebuilding the remaining images or moving the
camera. Offscreen thumbnails unload.
New groups introduced by an agent become visible automatically; known groups
that the user hid stay hidden. The first populated map fits once when an empty
project receives its initial screen inventory. Subsequent imports retain the
camera position. Visibility preferences remember which groups were known.

The unselected overview derives a forward forest from real connections inside
each group: one upstream parent per child, excluding returns, references, and
cross-group shortcuts. This is a display summary and never rewrites contracts.
Selection replaces that summary with the selected screen's outgoing links;
Incoming and All controls reveal the other directions. Bundling is directional:
opposing actions get separate ports and arrows, while all individual actions
remain in the inspector. Hover or keyboard focus isolates one directed pair
and shows its exact source, destination, and action labels.

`connections.js` supplies dependency-free planning and orthogonal routing.
Ports are distributed along card edges. Routes avoid padded cards and their
headings, prefer short lanes without shared segments, and use a bounded sparse
visibility search for obstructed paths. A route that cannot be found is not
drawn through an intervening screen; its action remains in the inspector.
Geometry is cached per selection/direction and invalidated by graph or
visibility changes. Viewport culling limits SVG work during pan/zoom. Labels
remain readable when space permits, with a focused action readout when zoomed
out. The self-contained export inlines the same planner before the viewer.
The minimap and searchable list provide alternatives to canvas gestures.

The loopback server requires the exact loopback Host and denies cross-site
requests. Writes require same-origin requests and a fresh per-server token.
Request bodies and socket time are bounded. Packaged UI files, digest-addressed
images, and explicitly declared Markdown/text documents are the only served
resources. Path traversal and symlink escapes are rejected. No HTTP directory
listing, arbitrary repository-file access, remote binding, account system,
or external generation API is present.

The trust model is a local owner and agents permitted to access their files.
Attribution labels are not authenticated people, and checksums are not signed
audit records. Hosted teams would require a separate authentication, storage,
authorization, and collaboration design.

## Transfer

Private backups include a consistent SQLite backup, the curated document,
declared source documents, curated images, and immutable review objects. Every
included file is checksummed. Restore accepts only declared safe paths, rejects
duplicate entries and excessive expansion, verifies the schema and evidence,
and completes into a new directory. Existing projects are never overwritten.

Read-only HTML exports embed data, images, styles, and browser code without
external requests. Review content is opt-in. The same viewer disables edits
and decisions when reading an export. Portable project transfer and private
history transfer remain distinct.
