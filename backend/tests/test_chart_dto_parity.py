"""TS ChartDto → Python ChartDTO parity fixture (PR #247 / #249)."""
from __future__ import annotations
import json
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.schemas import ChartDTO  # noqa: E402

# Minimal serialized shape matching src/lib/ziwei/chart.ts serializeChart
FIXTURE = {
  "school": "nam-phai",
  "gender": "female",
  "menhElement": "Thổ",
  "menhBranch": "Mùi",
  "yearStem": "Tân",
  "yearBranch": "Mùi",
  "birthMonthStem": "Canh",
  "birthMonthBranch": "Dần",
  "birthDayStem": "Giáp",
  "birthDayBranch": "Tý",
  "birthHourStem": "Bính",
  "birthHourBranch": "Dậu",
  "annualStem": "Bính",
  "annualBranch": "Ngọ",
  "annualYear": 2026,
  "nominalAge": 35,
  "majorFortunePalace": {"name": "Quan Lộc", "branch": "Hợi", "start": 26, "end": 35},
  "taiTuePalace": {"name": "Huynh Đệ", "branch": "Ngọ"},
  "smallLimitPalace": {"name": "Mệnh", "branch": "Mùi"},
  "annualHeadPalace": {"name": "Tài Bạch", "branch": "Mão"},
  "palaces": [
    {
      "index": i,
      "branch": b,
      "name": n,
      "stem": "Giáp",
      "isMenh": i == 5,
      "isThan": False,
      "changSheng": "Đế Vượng",
      "majorFortuneActive": False,
      "flowMonths": [],
      "stars": [],
    }
    for i, (b, n) in enumerate([
      ("Dần", "Phụ Mẫu"), ("Mão", "Phúc Đức"), ("Thìn", "Điền Trạch"),
      ("Tỵ", "Quan Lộc"), ("Ngọ", "Nô Bộc"), ("Mùi", "Mệnh"),
      ("Thân", "Tài Bạch"), ("Dậu", "Tật Ách"), ("Tuất", "Thiên Di"),
      ("Hợi", "Nô Bộc"), ("Tý", "Phu Thê"), ("Sửu", "Huynh Đệ"),
    ])
  ],
  "natalMutagens": [{"mutagen": "Lộc", "starName": "Thái Âm", "palaceName": "Tài Bạch"}],
  "annualMutagens": [],
  "majorMutagens": [],
}

TEMPORAL_FIELDS = (
  "school",
  "gender",
  "yearStem",
  "yearBranch",
  "birthMonthStem",
  "birthMonthBranch",
  "birthDayStem",
  "birthDayBranch",
  "birthHourStem",
  "birthHourBranch",
  "annualYear",
  "annualStem",
  "annualBranch",
  "nominalAge",
)


class TestChartDtoParity(unittest.TestCase):
  def test_pydantic_accepts_serialize_chart_shape(self):
    dto = ChartDTO.model_validate(FIXTURE)
    self.assertEqual(dto.school, "nam-phai")
    self.assertEqual(dto.gender, "female")
    self.assertEqual(dto.annualYear, 2026)
    self.assertIsNotNone(dto.annualHeadPalace)
    self.assertEqual(dto.annualHeadPalace.name, "Tài Bạch")
    self.assertEqual(len(dto.palaces), 12)
    dumped = json.loads(dto.model_dump_json())
    self.assertEqual(dumped["annualHeadPalace"]["branch"], "Mão")

  def test_temporal_and_identity_fields_round_trip(self):
    dto = ChartDTO.model_validate(FIXTURE)
    dumped = json.loads(dto.model_dump_json())
    for key in TEMPORAL_FIELDS:
      self.assertEqual(dumped[key], FIXTURE[key], key)
    self.assertEqual(dumped["majorFortunePalace"]["name"], "Quan Lộc")
    self.assertEqual(dumped["taiTuePalace"]["branch"], "Ngọ")
    self.assertEqual(dumped["smallLimitPalace"]["name"], "Mệnh")
    self.assertEqual(dumped["annualHeadPalace"]["branch"], "Mão")
    self.assertEqual(len(dumped["natalMutagens"]), 1)
    self.assertEqual(dumped["annualMutagens"], [])
    self.assertEqual(dumped["majorMutagens"], [])

  def test_school_literal_rejects_arbitrary_string(self):
    bad = {**FIXTURE, "school": "fake-school"}
    with self.assertRaises(Exception):
      ChartDTO.model_validate(bad)

  def test_gender_literal_rejects_empty(self):
    bad = {**FIXTURE, "gender": ""}
    with self.assertRaises(Exception):
      ChartDTO.model_validate(bad)


if __name__ == "__main__":
  unittest.main()
