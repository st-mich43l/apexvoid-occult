"""Validate TemporalSnapshotBundle identity and requested year sets (PR #250).

Frontend-supplied snapshots are untrusted transport. Backend must validate.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from .temporal_request import MAX_TEMPORAL_YEARS

# Sources treated as temporal (may differ across years). Others compared when present.
TEMPORAL_STAR_SOURCES = frozenset({
  "annual",
  "annual-mutagen",
  "major-mutagen",
  "monthly-flow",
})

NATAL_IDENTITY_FIELDS = (
  "school",
  "gender",
  "menhElement",
  "menhBranch",
  "yearStem",
  "yearBranch",
  "birthMonthStem",
  "birthMonthBranch",
  "birthDayStem",
  "birthDayBranch",
  "birthHourStem",
  "birthHourBranch",
)

PALACE_STATIC_FIELDS = ("index", "branch", "name", "stem", "isMenh", "isThan")


@dataclass(frozen=True)
class SnapshotValidationError:
  code: str
  message: str
  detail: Optional[str] = None


def _mutagen_key(m: dict) -> tuple:
  return (m.get("mutagen"), m.get("starName"), m.get("palaceName"))


def _palace_by_index(chart: dict) -> dict[int, dict]:
  out = {}
  for p in chart.get("palaces") or []:
    out[int(p["index"])] = p
  return out


def validate_temporal_bundle(
  anchor: dict,
  bundle: dict,
  required_years: list[int],
) -> Optional[SnapshotValidationError]:
  """Return an error if the bundle is invalid; None if OK.

  required_years: missing foreign years the negotiation asked for (no anchor).
  """
  if not isinstance(bundle, dict):
    return SnapshotValidationError(
      "TEMPORAL_SNAPSHOT_SET_MISMATCH",
      "temporalSnapshots must be an object",
    )

  anchor_year = anchor.get("annualYear")
  bundle_anchor = bundle.get("anchorAnnualYear")
  if bundle_anchor != anchor_year:
    return SnapshotValidationError(
      "TEMPORAL_ANCHOR_MISMATCH",
      "temporalSnapshots.anchorAnnualYear must equal chart.annualYear",
      detail=f"anchor={anchor_year} bundle={bundle_anchor}",
    )

  snapshots = bundle.get("snapshots")
  if not isinstance(snapshots, list):
    return SnapshotValidationError(
      "TEMPORAL_SNAPSHOT_SET_MISMATCH",
      "snapshots must be a list",
    )

  if len(snapshots) > MAX_TEMPORAL_YEARS:
    return SnapshotValidationError(
      "TEMPORAL_SNAPSHOT_SET_MISMATCH",
      f"at most {MAX_TEMPORAL_YEARS} snapshots",
    )

  years: list[int] = []
  for snap in snapshots:
    if not isinstance(snap, dict):
      return SnapshotValidationError(
        "TEMPORAL_SNAPSHOT_SET_MISMATCH",
        "each snapshot must be a chart object",
      )
    y = snap.get("annualYear")
    if not isinstance(y, int):
      return SnapshotValidationError(
        "TEMPORAL_SNAPSHOT_SET_MISMATCH",
        "snapshot.annualYear must be int",
      )
    years.append(y)

  if len(years) != len(set(years)):
    return SnapshotValidationError(
      "TEMPORAL_SNAPSHOT_SET_MISMATCH",
      "duplicate snapshot years",
    )

  if anchor_year in years:
    return SnapshotValidationError(
      "TEMPORAL_SNAPSHOT_SET_MISMATCH",
      "snapshots must not include the anchor year",
    )

  expected = sorted(required_years)
  actual = sorted(years)
  if actual != expected:
    return SnapshotValidationError(
      "TEMPORAL_SNAPSHOT_SET_MISMATCH",
      "snapshot years must exactly match required foreign years",
      detail=f"expected={expected} actual={actual}",
    )

  for snap in snapshots:
    err = _validate_same_natal(anchor, snap)
    if err:
      return err

  return None


def _validate_same_natal(anchor: dict, snap: dict) -> Optional[SnapshotValidationError]:
  for field in NATAL_IDENTITY_FIELDS:
    if anchor.get(field) != snap.get(field):
      return SnapshotValidationError(
        "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
        "snapshot natal identity does not match anchor",
        detail=field,
      )

  a_pal = _palace_by_index(anchor)
  s_pal = _palace_by_index(snap)
  if set(a_pal.keys()) != set(s_pal.keys()) or len(a_pal) != 12:
    return SnapshotValidationError(
      "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
      "palace topology length/index mismatch",
    )

  for idx, ap in a_pal.items():
    sp = s_pal[idx]
    for field in PALACE_STATIC_FIELDS:
      if ap.get(field) != sp.get(field):
        return SnapshotValidationError(
          "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
          "palace static topology mismatch",
          detail=f"palace[{idx}].{field}",
        )

  a_nat = sorted(_mutagen_key(m) for m in (anchor.get("natalMutagens") or []))
  s_nat = sorted(_mutagen_key(m) for m in (snap.get("natalMutagens") or []))
  if a_nat != s_nat:
    return SnapshotValidationError(
      "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
      "natalMutagens mismatch",
    )

  # Optional static star signature (exclude temporal sources)
  for idx, ap in a_pal.items():
    sp = s_pal[idx]
    a_stars = _static_star_sig(ap.get("stars") or [])
    s_stars = _static_star_sig(sp.get("stars") or [])
    if a_stars != s_stars:
      return SnapshotValidationError(
        "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH",
        "static natal star signature mismatch",
        detail=f"palace[{idx}]",
      )

  return None


def _static_star_sig(stars: list[dict]) -> list[tuple]:
  sig = []
  for s in stars:
    src = s.get("source") or ""
    if src in TEMPORAL_STAR_SOURCES or src.endswith("-mutagen") and src != "natal-mutagen":
      # natal-mutagen is natal; annual-mutagen/major-mutagen are temporal
      if src != "natal-mutagen":
        continue
    if src in ("annual", "monthly-flow"):
      continue
    sig.append((s.get("name"), s.get("layer"), src, s.get("brightness")))
  return sorted(sig)
