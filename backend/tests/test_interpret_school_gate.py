"""PR #249 — /api/interpret school gate before LLM."""
from __future__ import annotations
import unittest
from pathlib import Path
import sys
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.narrative_school import UNSUPPORTED_NARRATIVE_SCHOOL  # noqa: E402


def _minimal_chart(school: str) -> dict:
  return {
    "school": school,
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
    "palaces": [],
    "natalMutagens": [],
    "annualMutagens": [],
    "majorMutagens": [],
  }


class TestInterpretSchoolGate(unittest.TestCase):
  def setUp(self):
    self.client = TestClient(app)

  def test_trung_chau_returns_422_before_llm(self):
    with patch("app.main.get_client") as mock_client:
      res = self.client.post(
        "/api/interpret",
        json={
          "question": "Xem tổng quan",
          "chartText": "lá số",
          "chart": _minimal_chart("trung-chau"),
        },
      )
      self.assertEqual(res.status_code, 422)
      body = res.json()
      self.assertEqual(body["code"], UNSUPPORTED_NARRATIVE_SCHOOL)
      self.assertEqual(body["school"], "trung-chau")
      mock_client.assert_not_called()


if __name__ == "__main__":
  unittest.main()
