"""Closing-line value on the public site.

Fixtures cover a publish that includes the cents fields and one that does not.
The site must not invent a cents number from the price or from clv_pts.
Run: python3 -m unittest discover -s tests   (needs node)
"""
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Clv(unittest.TestCase):
    def test_fixtures_with_and_without_the_fields(self):
        proc = subprocess.run(
            ["node", "--experimental-detect-module", str(ROOT / "tests" / "clv_check.mjs")],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        self.assertIn("clv checks ok", proc.stdout)

    def test_pages_render_the_summary_and_the_card_line(self):
        record = (ROOT / "web" / "app" / "record" / "page.jsx").read_text()
        board = (ROOT / "web" / "components" / "RecordBoard.jsx").read_text()
        today = (ROOT / "web" / "components" / "Today.jsx").read_text()
        self.assertIn("clv={D.clv}", record)
        self.assertIn("summaryCopy", board)
        self.assertIn("copy.sentence", board)
        self.assertIn("<CloseLine ", today)
        self.assertTrue((ROOT / "tests" / "fixtures" / "clv" / "with.json").is_file())
        self.assertTrue((ROOT / "tests" / "fixtures" / "clv" / "without.json").is_file())


if __name__ == "__main__":
    unittest.main()
