"""Stats page totals, calibration buckets, and the narrowed probability rule.

Run: python3 -m unittest discover -s tests   (needs node)
"""
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Stats(unittest.TestCase):
    def test_totals_match_and_calibration_is_not_invented(self):
        proc = subprocess.run(
            ["node", "--experimental-detect-module", str(ROOT / "tests" / "stats_check.mjs")],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        self.assertIn("stats checks ok", proc.stdout)

    def test_page_is_linked_and_the_rule_names_the_one_chart(self):
        claude = (ROOT / "CLAUDE.md").read_text()
        self.assertIn("calibration chart", claude)
        self.assertIn("Pick cards", claude)
        self.assertIn("nba_calibration", claude)
        notes = (ROOT / "NOTES.md").read_text()
        self.assertIn("Callum signed off on the aggregated calibration chart on 2026-10-25", notes)
        self.assertIn("reviews it before it goes live", notes)
        self.assertIn("Callum signed off on aggregated model-data charts on `/stats` on 2026-10-25", notes)
        self.assertIn("feature weight", claude)
        self.assertIn("Pick cards", claude)
        header = (ROOT / "web" / "components" / "Header.jsx").read_text()
        footer = (ROOT / "web" / "components" / "Footer.jsx").read_text()
        board = (ROOT / "web" / "components" / "RecordBoard.jsx").read_text()
        sitemap = (ROOT / "web" / "app" / "sitemap.js").read_text()
        self.assertIn('href: "/stats"', header)
        self.assertIn('href="/stats"', footer)
        self.assertIn('href="/stats"', board)
        self.assertIn('"/stats"', sitemap)
