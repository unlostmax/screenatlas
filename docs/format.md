# Project and command formats

ScreenAtlas 0.1 uses portable project schema 1 and review schema 2. Future review
migrations are ordered SQL files with immutable checksums. A review store is
bound to one project UUID; changing the portable project's UUID does not retarget
existing private history.

## Project

`atlas.json` is UTF-8 JSON with `schemaVersion`, UUID `id`, `name`, positive
`revision`, optional `description`, `platforms`, `documents`, `groups`, `nodes`,
and `edges`. `atlas inspect` returns the exact file digest as `etag`. All
browser and CLI project edits compare that digest, so a manual edit is detected
even when it did not increment `revision`.

Groups have stable `id`, `title`, optional `note`, and world-coordinate `x`,
`y`, `w`, `h`. Nodes have stable `id`, `title`, `group`, `kind`, optional
`platform`, group-relative `x`, `y`, optional `w`/`h` (240/420 defaults),
optional boolean `retired`, `reference` (object or null), and `contract`.

Node types are `screen`, `anchor`, `frame`, `sheet` (contact sheet), `gap`,
`system`, and `hub`. Types describe surfaces; they do not confer approval.
Every state that needs a distinct reference or capture should have a stable
node ID. Reused screens have multiple incoming routes, not duplicated nodes.

Contracts use text fields `purpose`, `entry`, `data`, `states`, `edgeCases`,
`accessibility`, and `acceptance`; `sources` lists supporting document IDs.
`actions` is an array of stable action IDs, human-readable `label`, optional
`condition`, `effect`, `to` (node ID or null), and `kind` (default navigation).
Actions with destinations generate map connections. Edit that action to change
its route; do not maintain a second copy in `edges`.

Additional edges have stable `id`, `from`, `to`, `label`, and `kind`. Kinds are
`navigation`, `state`, `reference`, `motion`, `system`, `return`, and `proposal`.
Use additional edges for relationships that do not belong to a screen action.
The CLI can edit all edge kinds; the browser action editor also creates typed
connections through the contract. Node/edge identities and endpoints are
validated. Bounds, disconnected screens, duplicate images, missing purposes,
and overlapping cards produce authoring warnings.

Supporting documents have `id`, `title`, and either inline `body` or a portable
`path` to a Markdown/text file inside the project. Paths cannot escape through
`..` or symlinks, or access Git/private review state. Documents are displayed as
text rather than executed as HTML. Source links are explicit; no brand Markdown
or platform-specific inventory parsing exists.

Curated references have `sha256`, `path` equal to `assets/<sha256>.png`, and
`provenance`. Promotion writes the exact accepted bytes and records generation
context and acceptance identity. Initial example references are explicitly
labelled fixtures. Their inclusion does not manufacture acceptance records.

`atlas templates` prints screen, proposal-manifest, and capture-manifest
examples. Project and import JSON inputs are limited to 16 MiB; HTTP command
bodies are limited to 42 MiB. For large screenshot batches, use multiple
manifest commands. Each PNG is limited to 30 MiB and a bounded decoded raster.

## Review mutations

All review commands require an `operationId` UUID. The server persists its
command/payload fingerprint and result in the same transaction as the review
change. Exact retries return that result; changed content under the same ID
fails. The CLI requires `--operation UUID`; browser drafts keep that identity.
Replies, status changes, acceptances, and appearance decisions also require
the current aggregate `revision`. Boolean revisions are not integers.

`referenceSnapshots` retains the full reference object, including generation
provenance, whenever a curated reference is used by a review command. Promotion
does not erase that original context. Earlier reference bytes and metadata are
available in screen context, the image viewer, backups, and review-inclusive
exports. Schema 1 upgrades retain their recorded evidence; missing historical
metadata is left unknown rather than reconstructed.

Anchored feedback requires its own UUID `id`, `body`, and `anchor`. Anchors:

- `canvas`: `nodeId: null`, world-coordinate `x` and `y`.
- `node`: `nodeId`, normalized `x`/`y`, and `imageSha256` when an image is shown.
- `image`: `nodeId`, normalized `x`/`y`, and exact `imageSha256`.
- `capture`: `nodeId`, `captureId`, normalized `x`/`y`, and capture `imageSha256`.

Coordinates on images refer to displayed image content, excluding letterbox
space. The image digest must belong to that node's design history or exact
capture. Canonical reference images used by feedback are snapshotted as well.
Feedback status is `open`, `in_progress`, `ready`, or `resolved`.

Proposal entries require existing node `id`, `candidate` PNG path (CLI only),
`baselineSha256` (current curated digest or null), and nonempty `prompt`.
Optional fields are `original`, UUID `versionId`, `source`, `reviewNote`, and
structured `provenance`. Retrying the same version retains its identity and
never resurrects it as a new pending proposal. A manifest batch is atomic for
database state; rejected batches may leave harmless unreferenced immutable
images. Evidence is never automatically garbage-collected.

Captures require UUID `id`, `nodeId`, `file` PNG path (CLI only), `state`,
`source`, and `device`. Optional fields are `buildRevision`, `capturedAt`,
`note`, and expected `referenceSha256`. The server snapshots the corresponding
curated reference and contract digest when the capture is first registered.
Metadata and image bytes cannot change under an existing capture ID. Appearance
status is `pending`, `approved`, or `changes_requested`; all decisions remain
available in that capture's `decisions` array.

HTTP commands substitute base64 `png` for CLI image paths. Requests use
`/api/commands/<command>`; project edits use `/api/project` with `project` and
`etag`. `/api/state` supplies the local browser session's token, full current
review state, and immutable history. A token is not a hosted authentication
credential. Third-party origins cannot use it through the browser.

## Agent command reference

Run `atlas --project PATH COMMAND --help` for exact arguments.

| Purpose | Commands |
| --- | --- |
| Project setup | `init`, `handoff --port`, `inspect`, `context`, `templates`, `new-id` |
| Curated authoring | `project-set --etag`, `add-screen --etag`, `retire-screen --etag` |
| Feedback | `list --status`, `comment`, `status`, `reply --body-file --preview` |
| Design candidates | `import-proposals`, `proposals`, `accept --reviewed`, `promote --etag` |
| Implementation evidence | `import-captures`, `captures`, `decide --reviewed` |
| Integrity and transfer | `check`, `doctor`, `backup`, `restore`, `export` |
| Local integration | `start DIRECTORY [--name NAME | --example] [--port PORT]`, `serve`, `agent-skill` |

`accept` requires node ID, exact version ID, displayed digest, and design-state
revision. `promote` requires that node's currently accepted version and expected
project digest. `decide` requires capture ID, current decision revision,
displayed capture digest, and frozen reference digest (`none` if absent; such
a capture cannot be approved). CLI review flags express an explicit reviewer
decision; a coding agent must not use them to infer its own approval.
