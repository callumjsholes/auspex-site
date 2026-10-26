"""Game-page write-ups stay inside the public fields.

Run: python3 -m unittest discover -s tests   (needs node)
"""
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Previews(unittest.TestCase):
    def test_writeups_use_only_public_fields(self):
        proc = subprocess.run(
            ["node", "--experimental-detect-module", str(ROOT / "tests" / "preview_check.mjs")],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        self.assertIn("preview checks ok", proc.stdout)

    def test_notes_name_the_writeup(self):
        notes = (ROOT / "NOTES.md").read_text()
        self.assertIn("web/lib/previews.js", notes)
        self.assertIn("SportsEvent", notes)
        page = (ROOT / "web" / "components" / "GameScreen.jsx").read_text()
        self.assertIn("gamePreview", page)
        self.assertIn("eventBlurb", page)
        self.assertIn("previewDescription", page)
