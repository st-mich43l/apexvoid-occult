"""Temporal snapshot validation + focus isolation (PR #250)."""
from __future__ import annotations
import copy
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.temporal_validate import validate_temporal_bundle  # noqa: E402
from app.temporal_focus import build_temporal_focus  # noqa: E402


def _palace(i, br, name, **kw):
  return {
    "index": i, "branch": br, "name": name, "stem": "Giáp",
    "isMenh": kw.get("isMenh", False), "isThan": False,
    "changSheng": "Đế Vượng", "majorFortuneActive": kw.get("active", False),
    "flowMonths": kw.get("flowMonths", []),
    "stars": kw.get("stars", []),
  }


BRANCHES = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]
NAMES = ["Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Mệnh",
         "Tài Bạch", "Tật Ách", "Thiên Di", "Phu Thê", "Huynh Đệ", "Tử Tức"]


def _base_chart(year: int, annual_stem="Bính", annual_branch="Ngọ"):
  palaces = [_palace(i, BRANCHES[i], NAMES[i], isMenh=(i == 5)) for i in range(12)]
  # natal star
  palaces[5]["stars"] = [{"name": "Thiên Lương", "layer": "major", "brightness": "Đắc", "source": "natal", "element": "Thổ"}]
  # annual star unique per year
  palaces[0]["stars"] = [{"name": f"Lưu-{year}", "layer": "minor", "brightness": "", "source": "annual", "element": ""}]
  return {
    "school": "nam-phai", "gender": "female",
    "menhElement": "Thổ", "menhBranch": "Mùi",
    "yearStem": "Tân", "yearBranch": "Mùi",
    "birthMonthStem": "Canh", "birthMonthBranch": "Dần",
    "birthDayStem": "Giáp", "birthDayBranch": "Tý",
    "birthHourStem": "Bính", "birthHourBranch": "Dậu",
    "annualStem": annual_stem, "annualBranch": annual_branch,
    "annualYear": year, "nominalAge": year - 1991,
    "majorFortunePalace": {"name": "Quan Lộc", "branch": "Hợi", "start": 26, "end": 35},
    "taiTuePalace": {"name": "Huynh Đệ", "branch": annual_branch},
    "smallLimitPalace": {"name": "Mệnh", "branch": "Mùi"},
    "annualHeadPalace": {"name": "Tài Bạch", "branch": "Mão"},
    "palaces": palaces,
    "natalMutagens": [{"mutagen": "Lộc", "starName": "Thái Âm", "palaceName": "Tài Bạch"}],
    "annualMutagens": [{"mutagen": "Kỵ", "starName": f"Star{year}", "palaceName": "Phu Thê"}],
    "majorMutagens": [],
  }


class TestTemporalValidate(unittest.TestCase):
  def test_accept_exact_set(self):
    anchor = _base_chart(2026)
    s27 = _base_chart(2027, "Đinh", "Mùi")
    s28 = _base_chart(2028, "Mậu", "Thân")
    err = validate_temporal_bundle(
      anchor,
      {"anchorAnnualYear": 2026, "snapshots": [s27, s28]},
      [2027, 2028],
    )
    self.assertIsNone(err)

  def test_reject_missing_extra_dup_anchor(self):
    anchor = _base_chart(2026)
    s27 = _base_chart(2027)
    s28 = _base_chart(2028)
    s29 = _base_chart(2029)
    self.assertEqual(
      validate_temporal_bundle(anchor, {"anchorAnnualYear": 2026, "snapshots": [s27]}, [2027, 2028]).code,
      "TEMPORAL_SNAPSHOT_SET_MISMATCH",
    )
    self.assertEqual(
      validate_temporal_bundle(anchor, {"anchorAnnualYear": 2026, "snapshots": [s27, s28, s29]}, [2027, 2028]).code,
      "TEMPORAL_SNAPSHOT_SET_MISMATCH",
    )
    bad = copy.deepcopy(s27)
    err = validate_temporal_bundle(
      anchor,
      {"anchorAnnualYear": 2026, "snapshots": [s27, bad, s28]},
      [2027, 2028],
    )
    self.assertEqual(err.code, "TEMPORAL_SNAPSHOT_SET_MISMATCH")
    with_anchor = copy.deepcopy(anchor)
    self.assertEqual(
      validate_temporal_bundle(
        anchor,
        {"anchorAnnualYear": 2026, "snapshots": [with_anchor, s27, s28]},
        [2027, 2028],
      ).code,
      "TEMPORAL_SNAPSHOT_SET_MISMATCH",
    )

  def test_anchor_mismatch(self):
    anchor = _base_chart(2026)
    s27 = _base_chart(2027)
    err = validate_temporal_bundle(
      anchor, {"anchorAnnualYear": 2025, "snapshots": [s27]}, [2027]
    )
    self.assertEqual(err.code, "TEMPORAL_ANCHOR_MISMATCH")

  def test_identity_school_gender_topology(self):
    anchor = _base_chart(2026)
    s27 = _base_chart(2027)
    bad = copy.deepcopy(s27)
    bad["school"] = "trung-chau"
    self.assertEqual(
      validate_temporal_bundle(anchor, {"anchorAnnualYear": 2026, "snapshots": [bad]}, [2027]).code,
      "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
    )
    bad2 = copy.deepcopy(s27)
    bad2["gender"] = "male"
    self.assertEqual(
      validate_temporal_bundle(anchor, {"anchorAnnualYear": 2026, "snapshots": [bad2]}, [2027]).code,
      "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
    )
    bad3 = copy.deepcopy(s27)
    bad3["palaces"][0]["name"] = "WRONG"
    self.assertEqual(
      validate_temporal_bundle(anchor, {"anchorAnnualYear": 2026, "snapshots": [bad3]}, [2027]).code,
      "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
    )
    bad4 = copy.deepcopy(s27)
    bad4["natalMutagens"] = []
    self.assertEqual(
      validate_temporal_bundle(anchor, {"anchorAnnualYear": 2026, "snapshots": [bad4]}, [2027]).code,
      "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
    )

  def test_temporal_fields_may_differ(self):
    anchor = _base_chart(2026)
    s27 = _base_chart(2027, "Đinh", "Mùi")
    s27["nominalAge"] = 99
    s27["majorFortuneActive"] = True
    s27["smallLimitPalace"] = {"name": "Tài Bạch", "branch": "Mão"}
    s27["annualMutagens"] = [{"mutagen": "Lộc", "starName": "X", "palaceName": "Mệnh"}]
    err = validate_temporal_bundle(
      anchor, {"anchorAnnualYear": 2026, "snapshots": [s27]}, [2027]
    )
    self.assertIsNone(err)


class TestTemporalFocusIsolation(unittest.TestCase):
  def test_year_isolation(self):
    anchor = _base_chart(2026)
    s27 = _base_chart(2027, "Đinh", "Mùi")
    s28 = _base_chart(2028, "Mậu", "Thân")
    focus = build_temporal_focus(anchor, [s27, s28], "2027 và 2028 tình duyên?")
    # Split by year blocks
    i27 = focus.index("=== NĂM 2027 ===")
    i28 = focus.index("=== NĂM 2028 ===")
    block27 = focus[i27:i28]
    block28 = focus[i28:]
    self.assertIn("Star2027", block27)
    self.assertIn("Lưu-2027", block27)
    self.assertNotIn("Star2028", block27)
    self.assertNotIn("Lưu-2028", block27)
    self.assertIn("Star2028", block28)
    self.assertIn("Lưu-2028", block28)
    self.assertNotIn("Star2027", block28)
    self.assertNotIn("Lưu-2027", block28)


if __name__ == "__main__":
  unittest.main()
