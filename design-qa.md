# ScreenAtlas — first-use and connection verification

Result: passed.

## Behavior

The five navigation trees retain their existing screen positions and contracts.
The unselected canvas shows 14 main-flow arrows, replacing the 37-pair mesh.
These are real forward links within each group, with one parent per child.
Returns, cross-tree shortcuts, and visual-reference links appear on selection.

Selecting a screen defaults to Outgoing. Incoming and All controls expose the
other directions without adding unrelated edges. Each direction uses a solid
stroke at full opacity, with a single arrowhead at its destination. Opposing
flows use separate ports and routes. Actions sharing the same direction and
endpoints share an arrow; every individual action remains in the inspector.

Hovering an arrow, label, or inspector action isolates that directed pair and
outlines its endpoints. Keyboard focus does the same. A readout states the
source, destination, and all action labels, including at fit-to-map scale.
Labels appear on paths where room permits. Fit connections fits the selected
direction's related screens. Clearing selection restores the simple overview.

Routes use distributed ports and rounded orthogonal lanes. They avoid card
bounds and titles, prefer separate lanes, and use a bounded visibility search
when simpler paths are blocked. Impossible routes are not drawn through cards;
the underlying action stays available in the inspector. This update changes
presentation only; project files, image bytes, and review history are preserved.

## Automated verification

- All 43 Python regression tests pass, including HTTP boundaries and the
  standalone export. The export test checks the connection planner is inlined
  and no external planner script remains.
- Six Node tests pass. They verify the 14-link forest, one real parent per
  child, preservation of every selected-screen action, unrelated-edge removal,
  separate routes for opposing directions, hidden-screen behavior, cycles,
  self-links, cross-group shortcuts, and reference links.
- For every shipped node, all three direction filters route successfully. Every
  segment is orthogonal and avoids all padded cards and titles. No original
  screen reference or contract is regenerated or rewritten.
- JavaScript syntax and whitespace validation pass.
- The isolated installed wheel includes the exact planner and viewer bytes.
  Its fresh example exports all twenty images with both scripts inlined.
  Direct browser preview of the local export file was blocked by the browser's
  URL policy, so export verification here uses the automated inlining tests;
  the live local application was exercised in the browser.

## Browser verification

- Listing detail opens with four outgoing arrows and zero unrelated arrows.
  Incoming switches to eight incoming arrows; All shows twelve directed pairs.
- All rendered path opacities are exactly 1. No paired arrow uses marker-start.
- Keyboard focus on Buy now leaves exactly one visible route: Listing detail →
  Checkout. The readout names Buy now. This persists through a keyboard pan.
- Closing details restores fourteen main-flow paths and hides the readout.
- Hiding Checkout leaves nineteen cards and twelve main paths. No invented
  Listing detail → Order confirmed bypass appears. Restoring it recovers the
  original graph, with the same screen positions and camera.
- No browser console warnings or errors were observed.

## Evidence

Map/connection captures use a 1920 × 1080 recording viewport; first-use
captures use the default 1280 × 720 view. Temporary overrides are reset before
handoff.

- [Main-flow overview](docs/screenshots/map-overview.jpg)
- [Selected screen connections](docs/screenshots/connections-detail.jpg)
- [Isolated action](docs/screenshots/connection-focus.jpg)
- [Home flow](docs/screenshots/home-tree.jpg)
- [Profile flow](docs/screenshots/profile-flow.jpg)
- [Search flow](docs/screenshots/shop-flow.jpg)

The app remains local-only. No repository or package has been published.


## First-use readiness

The core map remains app-agnostic. The new start command creates or reopens a
project and prints the exact local URL and next step. Get started is visible in
the sidebar and empty canvas. Copy Codex prompt is above the fold at 1280 × 720,
with an optional preview. The README now leads with an empty-app setup and links
to a full guide covering Windows, returning to a project, and common failures.

New tests cover empty startup, safe reopening with review history retained,
refusal to overwrite an unrelated folder, a map path containing spaces and an
apostrophe, and the handoff launcher running successfully from another working
directory. The local onboarding endpoint follows the same cross-site boundaries
as other API reads; its absolute paths are excluded from read-only exports.

Browser smoke test: a fresh Task planner map at port 8772 started empty. The
Copy action reported success, and the prompt contained the actual project path,
platform-neutral instructions, image-tool fallback, and explicit review boundary.
The same launcher then created a custom desktop map with two groups and three
landscape cards, and imported two PNG proposals from another working directory.
Both new groups appeared without Show all; the first map fit automatically.
The browser showed three cards, two 1600 × 1000 proposal images, and one main
flow. No reviews, acceptances, promotions, or application captures were created.
These smoke-test PNGs were synthetic test fixtures, not generated UI artwork;
the test did not claim to exercise an actual Codex image-generation account.

All 43 Python checks and six connection checks pass. The Windows startup syntax
is documented and the implementation has a Windows locking/quoting path; this
session's runtime and browser checks ran on macOS, not Windows. This is a local
beta, with user-provided Codex tool access and Python requirements, rather than
a claim of universal platform certification or an autonomous image service.

- [First-use guide](docs/screenshots/getting-started.jpg)
- [New empty project](docs/screenshots/empty-project.jpg)
- [Written setup guide](docs/getting-started.md)


The final wheel was installed in an isolated environment. Its start command
created a fresh New app map from outside the checkout. The installed browser
UI successfully copied a prompt referencing that fresh project and the installed
launcher. That launcher then inspected the project from the new app directory,
without PATH activation or the source checkout. Browser warnings/errors were
empty. All packaged startup, server, launcher, and UI files matched the checkout.

## Canvas text selection

Canvas-only text selection is disabled, including the WebKit-prefixed rule.
A browser drag beginning over the Home group title changed the camera transform
and left window.getSelection().toString() empty. The starter prompt, outside the
canvas, retained user-select: text and a keyboard Select all selected its entire
3331-character value. No input or document selection behavior was disabled.

- [Canvas after the pan verification](docs/screenshots/canvas-pan.jpg)
