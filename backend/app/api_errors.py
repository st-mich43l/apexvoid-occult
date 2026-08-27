"""Central structured API error / handshake response models (PR #251).

Backend owns transport codes. Frontend may map codes to localized UX copy.
Frontend-local codes (e.g. TEMPORAL_NEGOTIATION_FAILED) must NOT live here.
"""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field

from .temporal_request import MAX_TEMPORAL_YEARS


class UnsupportedNarrativeSchoolResponse(BaseModel):
  code: Literal["UNSUPPORTED_NARRATIVE_SCHOOL"] = "UNSUPPORTED_NARRATIVE_SCHOOL"
  error: Literal["UNSUPPORTED_NARRATIVE_SCHOOL"] = "UNSUPPORTED_NARRATIVE_SCHOOL"
  school: str
  message: str


class TemporalSnapshotsRequiredResponse(BaseModel):
  code: Literal["TEMPORAL_SNAPSHOTS_REQUIRED"] = "TEMPORAL_SNAPSHOTS_REQUIRED"
  error: Literal["TEMPORAL_SNAPSHOTS_REQUIRED"] = "TEMPORAL_SNAPSHOTS_REQUIRED"
  anchorYear: int
  years: list[int] = Field(min_length=1, max_length=MAX_TEMPORAL_YEARS)
  maxSnapshots: int = MAX_TEMPORAL_YEARS


class TemporalRangeTooLargeResponse(BaseModel):
  code: Literal["TEMPORAL_RANGE_TOO_LARGE"] = "TEMPORAL_RANGE_TOO_LARGE"
  error: Literal["TEMPORAL_RANGE_TOO_LARGE"] = "TEMPORAL_RANGE_TOO_LARGE"
  maxYears: int = MAX_TEMPORAL_YEARS
  requestedCount: int
  message: str


class TemporalYearOutOfRangeResponse(BaseModel):
  code: Literal["TEMPORAL_YEAR_OUT_OF_RANGE"] = "TEMPORAL_YEAR_OUT_OF_RANGE"
  error: Literal["TEMPORAL_YEAR_OUT_OF_RANGE"] = "TEMPORAL_YEAR_OUT_OF_RANGE"
  message: str


class TemporalSnapshotValidationErrorResponse(BaseModel):
  """Identity / set / anchor mismatch after a snapshot retry."""
  code: Literal[
    "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
    "TEMPORAL_ANCHOR_MISMATCH",
    "TEMPORAL_SNAPSHOT_SET_MISMATCH",
  ]
  error: Literal[
    "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
    "TEMPORAL_ANCHOR_MISMATCH",
    "TEMPORAL_SNAPSHOT_SET_MISMATCH",
  ]
  message: str
  detail: Optional[str] = None


BackendApiErrorCode = Literal[
  "UNSUPPORTED_NARRATIVE_SCHOOL",
  "TEMPORAL_SNAPSHOTS_REQUIRED",
  "TEMPORAL_RANGE_TOO_LARGE",
  "TEMPORAL_YEAR_OUT_OF_RANGE",
  "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
  "TEMPORAL_ANCHOR_MISMATCH",
  "TEMPORAL_SNAPSHOT_SET_MISMATCH",
]
