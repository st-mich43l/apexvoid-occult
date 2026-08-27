"""Unit tests for temporal year resolver (PR #250)."""
from __future__ import annotations
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.temporal_request import (  # noqa: E402
  resolve_requested_years,
  missing_foreign_years,
  MAX_TEMPORAL_YEARS,
)


class TestTemporalResolver(unittest.TestCase):
  def setUp(self):
    self.anchor = 2026

  def years(self, q: str):
    r = resolve_requested_years(q, self.anchor)
    return r.code, list(r.years)

  def test_matrix(self):
    cases = [
      ("2027", "OK", [2027]),
      ("2027 và 2028", "OK", [2027, 2028]),
      ("2029, 2027, 2028", "OK", [2027, 2028, 2029]),
      ("2027-2029", "OK", [2027, 2028, 2029]),
      ("2027 đến 2029", "OK", [2027, 2028, 2029]),
      ("2027 tới 2029", "OK", [2027, 2028, 2029]),
      ("2027 28 29", "OK", [2027, 2028, 2029]),
      ("2027, 28, 29, 30", "OK", [2027, 2028, 2029, 2030]),
      ("năm nay", "OK", [2026]),
      ("năm sau", "OK", [2027]),
      ("năm tới", "OK", [2027]),
      ("năm trước", "OK", [2025]),
      ("năm ngoái", "OK", [2025]),
      ("3 năm tới", "OK", [2027, 2028, 2029]),
      ("năm nay và năm sau", "OK", [2026, 2027]),
      ("28", "NO_TEMPORAL_TARGET", []),
      ("28 tuổi", "NO_TEMPORAL_TARGET", []),
      ("5 năm kinh nghiệm", "NO_TEMPORAL_TARGET", []),
      ("tổng quan sự nghiệp", "NO_TEMPORAL_TARGET", []),
    ]
    for q, code, expected in cases:
      with self.subTest(q=q):
        got_code, got = self.years(q)
        self.assertEqual(got_code, code, msg=q)
        self.assertEqual(got, expected, msg=q)

  def test_range_too_large(self):
    r = resolve_requested_years("2027-2032", 2026)
    self.assertEqual(r.code, "TEMPORAL_RANGE_TOO_LARGE")
    self.assertEqual(r.requested_count, 6)
    self.assertEqual(MAX_TEMPORAL_YEARS, 5)

  def test_out_of_range(self):
    self.assertEqual(resolve_requested_years("năm 1899 thế nào?", 2026).code, "TEMPORAL_YEAR_OUT_OF_RANGE")
    self.assertEqual(resolve_requested_years("năm 2101 thế nào?", 2026).code, "TEMPORAL_YEAR_OUT_OF_RANGE")
    self.assertEqual(resolve_requested_years("1900", 2026).code, "OK")
    self.assertEqual(resolve_requested_years("2100", 2026).code, "OK")

  def test_missing_foreign(self):
    r = resolve_requested_years("2026 và 2027 thế nào?", 2026)
    self.assertEqual(missing_foreign_years(r, 2026), [2027])

  def test_anchor_authority_not_server_now(self):
    # Displaying 2029 while "năm sau" means 2030 relative to chart
    r = resolve_requested_years("năm sau", 2029)
    self.assertEqual(list(r.years), [2030])


if __name__ == "__main__":
  unittest.main()
