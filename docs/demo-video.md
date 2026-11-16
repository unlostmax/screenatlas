# Record a ScreenAtlas tutorial

Open the [public repository](https://github.com/unlostmax/screenatlas) in Codex
and ask it to install and start ScreenAtlas, then guide you through planning
your app. The agent reads its setup instructions and continues in the same chat.
It uses an existing app brief when available, or asks "What are we building?"
There is no browser prompt-copying step on this path.

Attach two or three inspiration images when asked. Show Codex generating two
or three mood images without UI or typography by default. The agent stores your
supplied references and the generated moods in Inspiration and opens the local
viewer for review. Choose a direction, then generate the first two app screens
from those approved mood images. Demonstrate Inspect images, Accept this
proposal, and Promote to reference.

Prepare this stage ahead of filming or edit out generation time. A terminal-only
install prints the short handoff for the user to send to Codex; installing a
Python package alone does not start an agent conversation.

Use the bundled Second Sole demo for a populated map walkthrough. Keep the
first server running and use a second terminal in the checkout:

```sh
.venv/bin/python -m screen_atlas start ../screenatlas-demo --example --port 8770
```

Open the printed demo URL for this 75–90 second walkthrough.

1. **0–10s — The idea.** Click Show all to fit the entire app on one canvas.
   “ScreenAtlas turns generated app screens into a connected plan you can build.”
2. **10–25s — Start with the tabs.** Point to Home, Search, Sell, Inbox, and
   Profile across the top of their own trees. Focus Home to follow listing
   detail through Checkout and Order confirmed, then Fit map to pull back.
   The overview shows only the main forward flow in each tree.
3. **25–40s — Control the detail.** Untick Inbox to remove its tree without
   moving the camera. Expand Home and untick Checkout. Check it again,
   then use Show all to restore everything. These choices only change your view.
4. **40–55s — Follow a branch.** Focus Profile, then select My listings.
   Only that screen's outgoing arrows appear. Hover an action to isolate its
   arrow and read exactly what it connects. Switch to Incoming or All to see
   returns and shared destinations. Click the Listing actions destination
   and open Inspect images. Show the
   exact supplied action sheet, then expand its provenance. The original
   source image and its provenance are available in the viewer.
5. **55–70s — Explain behavior.** Open Edit contract. Show responsibility,
   destinations, edge cases, and acceptance examples, then close it.
6. **70–90s — The build loop.** Select a screen and press C over a detail.
   Save a short comment and open Review. Explain that an agent can read that
   feedback, generate a candidate, and import it for explicit review. Real app
   screenshots can later be compared with their frozen reference.

For a quiet take, keep advanced details collapsed until needed. Use F to focus
a selected screen and 0 to fit the visible canvas. For another take, start the demo in a fresh folder.
