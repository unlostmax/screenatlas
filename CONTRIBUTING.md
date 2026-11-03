# Contributing to ScreenAtlas

ScreenAtlas is local-only Python/SQLite and plain browser JavaScript, licensed under
MIT. Keep the installed runtime free of network services and package dependencies
unless an explicit product decision changes that boundary. Changes to hosted
operation, authentication, generation billing, or evidence-retention policy
need a design discussion before implementation.

## Development

Use Python 3.11+ with SQLite 3.37+. Run directly with `python -m screen_atlas`, or
install the checkout into a Python environment you manage. Node is optional
development tooling for JavaScript syntax checks. Preserve source images and
record exact image-generation prompts; do not regenerate assets during tests.

```sh
python3 -B -m unittest discover -s tests -v
node --check atlas/web/app.js
node --test tests/test_connections.cjs
python3 -m screen_atlas --project atlas/examples/second-sole check
```

Use a disposable project for browser testing. Exercise an empty project as well
as the example: create a screen, edit its contract, connect actions, arrange its
card, pin feedback, reply through the CLI, import a proposal, explicitly accept
and promote that test candidate, import a real screenshot, and inspect both
the comparison and the frozen reference. Verify a narrow viewport and keyboard
access as well as the desktop map. Keep test data out of the bundled example's
curated inventory and out of Git.

Test behavior rather than matching implementation text. Changes to history,
identity, retries, or approvals need targeted regression evidence. Use valid
PNG fixtures; signature-only fake PNGs do not prove image validation. Tests of
HTTP boundaries require permission to bind loopback in restricted environments.
Do not skip those checks and call the full suite passing.

## Persistent formats

An initial migration may evolve before its first release. After release,
existing migrations are immutable. Add ordered migrations and real old-schema
fixtures, verify their checksums, and prove that supported upgrades and fresh
installs converge on the same schema. Unsupported future schema versions and
unexpected schema drift must fail visibly.

Preserve stable node, operation, candidate, capture, and thread IDs. New screen
types must not confer approval by their names. Never collapse feedback status,
design acceptance, promotion, screenshot appearance decisions, and release
acceptance into one flag. Keep model/tool provenance truthful and unknown build
identity unknown.

## Preparing a release

- Run the regression suite, syntax check, inventory check, and browser workflow.
- Build a wheel from the checkout and run it in an isolated environment,
  including example initialization, server assets, imports, backup, and export.
- Include the MIT license, NOTICE attribution, maintained format documentation,
  and the agent skill. Review runtime dependencies and packaged assets.
- Exclude private review databases, captures, original-app content, credentials,
  local paths, and generated build directories.
- Document supported Python/SQLite/browser versions and any migration changes.
- Obtain the owner's explicit direction before registry publication, public
  repository creation, remote pushes, or a hosted deployment.

Contributions are supplied under the project's MIT license. Retain attribution
for borrowed code and record the provenance and permitted use of new assets.
