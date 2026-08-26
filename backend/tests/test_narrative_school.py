"""PR #249 — school-aware narrative routing fail-closed for Trung Châu."""
from __future__ import annotations
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.narrative_school import (  # noqa: E402
  resolve_narrative_school,
  unsupported_school_payload,
  UNSUPPORTED_NARRATIVE_SCHOOL,
)
from app.kb.retriever import get_retriever  # noqa: E402
from app.liencung import classify_intent  # noqa: E402


class TestNarrativeSchoolRouting(unittest.TestCase):
  def test_nam_phai_supported(self):
    p = resolve_narrative_school("nam-phai")
    self.assertTrue(p.supported)
    self.assertEqual(p.kb_subdir, "nam_phai")
    self.assertIsNotNone(p.system_prompt)

  def test_trung_chau_unsupported(self):
    p = resolve_narrative_school("trung-chau")
    self.assertFalse(p.supported)
    self.assertIsNone(p.kb_subdir)
    payload = unsupported_school_payload("trung-chau")
    self.assertEqual(payload["code"], UNSUPPORTED_NARRATIVE_SCHOOL)
    self.assertEqual(payload["school"], "trung-chau")

  def test_trung_chau_never_loads_nam_phai_docs(self):
    """No cross-school fallback: unsupported school must not retrieve nam_phai."""
    profile = resolve_narrative_school("trung-chau")
    self.assertFalse(profile.supported)
    # If a caller wrongly asked for nam_phai while school=trung-chau, that is a
    # gate bug — the profile itself must not point at nam_phai.
    self.assertNotEqual(profile.kb_subdir, "nam_phai")

  def test_nam_phai_retriever_still_returns_core_docs(self):
    r = get_retriever("nam_phai")
    chart = {"school": "nam-phai", "palaces": []}
    ci = classify_intent("xem tổng quan mệnh cách")
    docs = r.docs_for(chart, ci)
    self.assertIn("phong_cach_luan_giai.md", docs)
    self.assertTrue(all("/" not in d for d in docs))


if __name__ == "__main__":
  unittest.main()
