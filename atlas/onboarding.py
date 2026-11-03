"""Local, project-specific handoff instructions. Never included in public exports."""
from __future__ import annotations

import json
import os
from pathlib import Path
import shlex
import subprocess
import sys


def command_line(parts):
    return subprocess.list2cmdline(parts) if os.name == "nt" else shlex.join(parts)


def project_handoff(project, port):
    data, _ = project.load()
    command = command_line([sys.executable, "-B", str(Path(__file__).with_name("launch.py").resolve()),
                            "--project", str(project.root)])
    workflow = Path(__file__).parent / "agent-skill" / "SKILL.md"
    prompt = f'''Help me plan and design my app with ScreenAtlas.

My app idea: [describe the people, problem, and main tasks]
Platform: [web, iOS, Android, desktop, or another platform]
Visual direction: [describe the style or attach reference images]
Application code folder: [add the folder, or say this is a new app]

Start with a small screen map and the first two designs, then let me review.
The project connection details below are already filled in for this map.

ScreenAtlas project: {json.dumps(str(project.root), ensure_ascii=False)}
Current project name: {json.dumps(data["name"], ensure_ascii=False)}
Viewer already running: http://127.0.0.1:{port}/
Read the bundled workflow: {json.dumps(str(workflow.resolve()), ensure_ascii=False)}

Use this installed command, even if ScreenAtlas is not on PATH:
{command} inspect
Read available shapes with: {command} templates

1. Read the existing project and the workflow before making changes. If my brief
   is incomplete, clarify the essentials. Preserve existing screens, references,
   and review history; continue the current project rather than replacing it.
2. Create a screen inventory and behavior contracts for MY app. Use its actual
   navigation sections as groups; do not copy the demo's tab names or force five
   groups. Put each main screen at the top of its group and supporting states
   below it. Size cards to the image ratio and platform, including landscape
   desktop screens. Reuse shared destinations and connect actions to stable screen IDs.
   Use project-set or add-screen with the current expected project digest.
3. Start with one main screen and one useful supporting state. Use the image
   generation tool available in this Codex session to create separate PNG design
   references, retaining the exact prompt and actual provenance. If image
   generation is unavailable, tell me and let me supply PNGs. Do not silently
   switch to a paid API or claim that a generated design is a real app screenshot.
4. Import these images as proposals using import-proposals and stable operation
   UUIDs. Create the screen records first. Keep any existing reference as the
   baseline. Use context SCREEN_ID to read the correct reference identity.
5. Show me the results in ScreenAtlas and stop for my design review. I accept
   exact candidates and promote them to references explicitly. Do not accept,
   promote, or approve screenshots on my behalf without that authorization.
6. After review, expand the map and use the approved references to implement
   the app. Capture real screenshots from the running implementation separately
   and import them with import-captures for comparison.

Keep the existing viewer running; refresh it after imports. Do not publish,
deploy, or change my global Codex configuration as part of this setup.
'''
    return {"projectName": data["name"], "projectDirectory": str(project.root), "command": command, "prompt": prompt}
