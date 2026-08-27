"""Interpret temporal handshake side effects + school gate order (PR #250)."""
from __future__ import annotations
import unittest
from pathlib import Path
import sys
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.narrative_school import UNSUPPORTED_NARRATIVE_SCHOOL  # noqa: E402


def _minimal_chart(school="nam-phai", year=2026):
  branches = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]
  names = ["Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Mệnh",
           "Tài Bạch", "Tật Ách", "Thiên Di", "Phu Thê", "Huynh Đệ", "Tử Tức"]
  return {
    "school": school, "gender": "female",
    "menhElement": "Thổ", "menhBranch": "Mùi",
    "yearStem": "Tân", "yearBranch": "Mùi",
    "birthMonthStem": "Canh", "birthMonthBranch": "Dần",
    "birthDayStem": "Giáp", "birthDayBranch": "Tý",
    "birthHourStem": "Bính", "birthHourBranch": "Dậu",
    "annualStem": "Bính", "annualBranch": "Ngọ",
    "annualYear": year, "nominalAge": 35,
    "majorFortunePalace": None, "taiTuePalace": None,
    "smallLimitPalace": None, "annualHeadPalace": None,
    "palaces": [
      {"index": i, "branch": branches[i], "name": names[i], "stem": "Giáp",
       "isMenh": i == 5, "isThan": False, "changSheng": "", "majorFortuneActive": False,
       "flowMonths": [], "stars": []}
      for i in range(12)
    ],
    "natalMutagens": [], "annualMutagens": [], "majorMutagens": [],
  }


class TestInterpretTemporal(unittest.TestCase):
  def setUp(self):
    self.client = TestClient(app)

  def test_trung_chau_before_snapshot_negotiation(self):
    r = self.client.post("/api/interpret", json={
      "question": "2027-2029 thế nào?",
      "chartText": "x",
      "chart": _minimal_chart("trung-chau"),
      "profile": {},
      "history": [],
    })
    self.assertEqual(r.status_code, 422)
    self.assertEqual(r.json()["code"], UNSUPPORTED_NARRATIVE_SCHOOL)

  def test_handshake_409_and_zero_side_effects(self):
    with patch("app.main.store.record_event", new_callable=AsyncMock) as ev, \
         patch("app.main.store.record_observation", new_callable=AsyncMock) as obs, \
         patch("app.main.get_client") as gc:
      r = self.client.post("/api/interpret", json={
        "question": "2027 và 2028 thế nào?",
        "chartText": "anchor",
        "chart": _minimal_chart("nam-phai", 2026),
        "profile": {},
        "history": [],
      })
      self.assertEqual(r.status_code, 409)
      body = r.json()
      self.assertEqual(body["code"], "TEMPORAL_SNAPSHOTS_REQUIRED")
      self.assertEqual(body["years"], [2027, 2028])
      self.assertEqual(body["anchorYear"], 2026)
      ev.assert_not_called()
      obs.assert_not_called()
      gc.assert_not_called()

  def test_ordinary_question_no_temporal(self):
    # Will fail later without API key — but should NOT 409
    with patch("app.main.get_client") as gc:
      gc.side_effect = Exception("no llm in test")
      # Actually LLMError path — patch to raise LLMError
      from app.llm import LLMError
      gc.side_effect = LLMError("no key")
      r = self.client.post("/api/interpret", json={
        "question": "tổng quan sự nghiệp",
        "chartText": "anchor",
        "chart": _minimal_chart("nam-phai", 2026),
        "profile": {},
        "history": [],
      })
      self.assertNotEqual(r.status_code, 409)
      self.assertEqual(r.status_code, 400)


if __name__ == "__main__":
  unittest.main()
