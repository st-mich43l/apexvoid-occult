"""Cross-language contract fixtures from serializeChart (PR #251)."""
from __future__ import annotations
import json
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.schemas import ChartDTO, TemporalSnapshotBundle  # noqa: E402

CONTRACTS = ROOT / "tests" / "contracts"


class TestContractFixtures(unittest.TestCase):
  def test_nam_phai_fixture(self):
    raw = json.loads((CONTRACTS / "chart-dto-nam-phai.json").read_text(encoding="utf-8"))
    dto = ChartDTO.model_validate(raw)
    self.assertEqual(dto.school, "nam-phai")
    self.assertEqual(dto.gender, "female")
    self.assertEqual(len(dto.palaces), 12)
    self.assertIsInstance(dto.annualYear, int)

  def test_trung_chau_fixture(self):
    raw = json.loads((CONTRACTS / "chart-dto-trung-chau.json").read_text(encoding="utf-8"))
    dto = ChartDTO.model_validate(raw)
    self.assertEqual(dto.school, "trung-chau")
    self.assertEqual(dto.gender, "female")

  def test_temporal_bundle_fixture(self):
    raw = json.loads((CONTRACTS / "temporal-snapshot-bundle.json").read_text(encoding="utf-8"))
    bundle = TemporalSnapshotBundle.model_validate(raw)
    self.assertEqual(bundle.anchorAnnualYear, 2026)
    self.assertEqual([s.annualYear for s in bundle.snapshots], [2027, 2028])
    self.assertLessEqual(len(bundle.snapshots), 5)

  def test_missing_school_fails(self):
    raw = json.loads((CONTRACTS / "chart-dto-nam-phai.json").read_text(encoding="utf-8"))
    del raw["school"]
    with self.assertRaises(Exception):
      ChartDTO.model_validate(raw)

  def test_invalid_enums_fail(self):
    raw = json.loads((CONTRACTS / "chart-dto-nam-phai.json").read_text(encoding="utf-8"))
    with self.assertRaises(Exception):
      ChartDTO.model_validate({**raw, "school": "fake"})
    with self.assertRaises(Exception):
      ChartDTO.model_validate({**raw, "gender": "other"})

  def test_openapi_contains_required_models(self):
    openapi = json.loads((Path(__file__).resolve().parent.parent / "openapi.json").read_text())
    schemas = openapi["components"]["schemas"]
    for name in (
      "ChartDTO",
      "TemporalSnapshotBundle",
      "InterpretRequest",
      "TemporalSnapshotsRequiredResponse",
      "UnsupportedNarrativeSchoolResponse",
    ):
      self.assertIn(name, schemas)


if __name__ == "__main__":
  unittest.main()
