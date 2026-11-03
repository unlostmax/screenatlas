# Start your own app in ScreenAtlas

ScreenAtlas is a local planning and review tool for any app: web, mobile, or
desktop. Codex creates the screen designs; ScreenAtlas connects them to screen
behavior, feedback, and the app you build afterward. The sneaker marketplace is
an optional demo. Your project starts empty and uses your app's own navigation.

## 1. Install and open a new project

Download or clone this repository from GitHub. Open a terminal in that folder.
You need Python 3.11+ with SQLite 3.37+. ScreenAtlas has no runtime package
dependencies, accounts, or API keys. Installation may download Python build tools.

You can also open the checkout in Codex and ask it to install ScreenAtlas in a
virtual environment, start a separate empty map for your app, and show you that
map's Codex starter prompt. Ask it to keep the ScreenAtlas source unchanged.

On macOS or Linux:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install .
.venv/bin/python -m screen_atlas start ../my-app-map --name "My app"
```

On Windows, use PowerShell:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install .
.\.venv\Scripts\python.exe -m screen_atlas start ..\my-app-map --name "My app"
```

Click the local URL printed in the terminal. Keep that terminal running while
using the app. `start` creates a new map folder or reopens an existing map without
replacing it. Your application code can live in a separate folder.

For a tour instead of an empty map, change the last command to:

```sh
.venv/bin/python -m screen_atlas start ../screenatlas-demo --example
```

Windows users can use the same arguments after `python.exe -m screen_atlas`.

## 2. Give Codex your app idea

1. Click **Get started** in ScreenAtlas.
2. Click **Copy Codex prompt**.
3. Open your app's folder in Codex and paste the prompt into a chat.
4. Fill in the app idea, platform, visual style, and code folder. Attach any
   reference images you want Codex to use, then send it.

The copied prompt already includes the correct map folder, working commands,
and bundled workflow. You do not need to install a skill, set an API key, or
write import JSON yourself. Codex needs local file/command access to this map.
Its normal permissions still apply when the map is outside its workspace.

For example, describe a budgeting app for freelancers, a desktop music library,
or a web dashboard. Tell Codex which tasks matter and any visual constraints.
It should create groups for those navigation sections, put each main screen at
the top, and branch downward to the related states. There is no required number
of tabs or platform-specific UI framework.

Ask for one main screen and one supporting state first. Codex reads the map,
creates stable screen records and actions, generates individual PNG designs,
and imports them as proposals. The map updates as files change; new groups
appear automatically. More screens can be added after you review the direction.

**Image generation must be available in that Codex session.** OpenAI's
[image-generation guide](https://learn.chatgpt.com/docs/image-generation) describes
using an image request or the imagegen skill. ScreenAtlas does not supply model
access or run generation itself. If the tool is unavailable, supply PNGs and ask
Codex to import them. Generated images use the terms and limits of your chosen
image tool; ScreenAtlas does not silently fall back to a paid API.

## 3. Review the designs

Select a screen and click **Inspect images**. Review the actual proposed image.
Press **C** to pin feedback to a detail; ask Codex to read the feedback, revise
the image, and import the next candidate.

When you want to keep a design, click **Accept this proposal**, then **Promote to
reference**. These are separate explicit decisions. Codex should leave those
decisions to you. Neither action publishes code or commits to Git.

The overview shows the main flow. Select a screen to see its outgoing actions,
or switch to **Incoming** or **All**. Hover or keyboard-focus an action to trace
one arrow. Group and screen checkboxes hide content without deleting anything.

## 4. Build the app and compare the result

Ask Codex to implement your application using the approved screen contracts and
references. Later, capture screenshots from the actual running app and add them
through **More details → App screenshots → Add an app screenshot**, or ask Codex
to import them. Compare those captures with the reference in Inspect images.

A generated design is a **reference image**. A screenshot taken from the running
implementation is an **app capture**. Keep them distinct so the map shows both
what you wanted and what you actually built. Static image review covers
appearance; behavior still needs to be tested in your application.

## Return to your work

Stop the server with Ctrl+C. Your files and review history remain on disk. Run
the same `start` command to reopen the map. If you installed with the virtual
environment above, run it from the ScreenAtlas checkout using that environment's
Python. With an activated environment, `screen-atlas start ...` also works.

For each new app, choose a different map folder. To open an existing app map,
point `start` at its folder containing `atlas.json`. It will not replace the map
or rename it based on new setup flags.

## Common setup issues

- **Python is missing or too old:** install Python 3.11 or newer, then retry the
  three setup commands. Some Linux distributions package `venv` separately.
- **The port is already in use:** add `--port 8766` to the start command and open
  the newly printed URL.
- **The folder contains other files:** choose a new map folder rather than your
  existing source-code folder. You can keep the map beside your application.
- **Codex cannot run a command:** use the exact launcher in the copied prompt.
  It works outside the ScreenAtlas checkout and does not require PATH activation.
- **Codex cannot generate an image:** verify its available tools, or provide a
  PNG. ScreenAtlas can still map, review, and connect supplied images.
- **Nothing is visible:** click **Show all**, then **Fit map**. Checkboxes control
  visibility; they do not remove screen records or review history.

The [README](../README.md) covers advanced imports, optional agent-skill setup,
private backups, read-only exports, and the complete file/command reference.
