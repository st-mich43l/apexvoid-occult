"""School-aware narrative profiles (PR #249).

Physical chart schools ≠ narrative KB capability.
Nam Phái has a verified KB pack. Trung Châu does not — fail closed.
Never map trung-chau → nam_phai corpus.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional

from .constants import SYSTEM_PROMPT

UNSUPPORTED_NARRATIVE_SCHOOL = "UNSUPPORTED_NARRATIVE_SCHOOL"


@dataclass(frozen=True)
class NarrativeSchoolProfile:
  school: str
  supported: bool
  kb_subdir: Optional[str]
  system_prompt: Optional[str]


NAM_PHAI_PROFILE = NarrativeSchoolProfile(
  school="nam-phai",
  supported=True,
  kb_subdir="nam_phai",
  system_prompt=SYSTEM_PROMPT,
)

TRUNG_CHAU_PROFILE = NarrativeSchoolProfile(
  school="trung-chau",
  supported=False,
  kb_subdir=None,
  system_prompt=None,
)

_PROFILES: dict[str, NarrativeSchoolProfile] = {
  "nam-phai": NAM_PHAI_PROFILE,
  "trung-chau": TRUNG_CHAU_PROFILE,
}


def resolve_narrative_school(school: Optional[str]) -> NarrativeSchoolProfile:
  """Resolve chart.school to a narrative profile.

  Known supported → profile.
  Known unsupported / unknown → fail-closed unsupported profile.
  Missing school with no chart is handled by the caller (legacy path).
  """
  key = (school or "").strip()
  if key in _PROFILES:
    return _PROFILES[key]
  return NarrativeSchoolProfile(
    school=key or "unknown",
    supported=False,
    kb_subdir=None,
    system_prompt=None,
  )


def unsupported_school_payload(school: str) -> dict:
  from .api_errors import UnsupportedNarrativeSchoolResponse

  return UnsupportedNarrativeSchoolResponse(
    school=school,
    message=(
      "Luận giải AI cho trường phái này chưa được kích hoạt vì hệ thống "
      "hiện chưa có knowledge pack đã được kiểm chứng."
    ),
  ).model_dump()
