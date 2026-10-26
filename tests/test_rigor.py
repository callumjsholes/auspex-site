"""Intervals and tests on the graded record.

Run: python3 -m unittest discover -s tests   (needs node)
"""
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Rigor(unittest.TestCase):
    def test_helpers_match_known_values(self):
        proc = subprocess.run(
            ["node", "--experimental-detect-module", str(ROOT / "tests" / "rigor_check.mjs")],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        self.assertIn("rigor checks ok", proc.stdout)

    def test_notes_name_the_section_and_the_seed(self):
        notes = (ROOT / "NOTES.md").read_text()
        claude = (ROOT / "CLAUDE.md").read_text()
        self.assertIn("For the stats nerds", notes)
        self.assertIn("20261025", notes)
        self.assertIn("For the stats nerds", claude)
        self.assertIn("posted price", claude)
        page = (ROOT / "web" / "components" / "RigorSection.jsx").read_text()
        self.assertIn("For the stats nerds", page)
        self.assertNotIn("significant", page.lower())
