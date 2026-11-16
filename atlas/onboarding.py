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
    workflow = Path(__file__).parent / "agent-skill" / "getting-started.md"
    prompt = f'''Help me start my app with ScreenAtlas. Read the workflow below and guide me
through its questions here. Ask for my inspiration images, generate 2-3 mood
images without UI or typography unless I request them, and save them in the
Inspiration space. Get my approval, then use them to design connected app screens.
Continue existing work and preserve review history.

Project: {json.dumps(str(project.root), ensure_ascii=False)}
Workflow: {json.dumps(str(workflow.resolve()), ensure_ascii=False)}
Viewer: http://127.0.0.1:{port}/
Command: {command}
'''
    return {"projectName": data["name"], "projectDirectory": str(project.root), "command": command, "prompt": prompt}
