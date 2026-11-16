# ScreenAtlas setup

When the user asks you to install, run, or get started using ScreenAtlas, finish
setup and continue directly into the guided workflow in this conversation.

1. Create a local virtual environment and install this checkout with pip. Use a
   separate new map folder for the user's app, or reopen their chosen map.
2. Run `python -m screen_atlas start MAP_FOLDER` with that environment's Python
   in a persistent background terminal/session. Keep its printed local URL and
   short agent handoff. Do not block the conversation waiting for the server.
3. Read the workflow named in the handoff. Use the user's existing app repository
   and brief first; otherwise begin with "What are we building?" The user does
   not need to open a browser, click Get started,
   copy a prompt, or install another skill first.
4. Ask for inspiration, generate mood images, and store both in the map's
   Inspiration group as the workflow describes. Open the local viewer when
   there are images to review. Use the approved direction for later screens.

If a map is already running, get its handoff with
`python -m screen_atlas --project MAP_FOLDER handoff --port VIEWER_PORT`.
Use the installed environment's Python or the absolute launcher it returns.
If image generation or browser tools are unavailable, explain the limitation
and continue with user-supplied PNGs or the local viewer link.

These setup instructions apply when the user wants to use the tool. For work
on ScreenAtlas's source, carry out the requested implementation without
starting an app-design interview. Do not publish, deploy, or modify global
agent configuration as part of installation.
