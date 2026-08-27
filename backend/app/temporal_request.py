"""Deterministic temporal year resolver for multi-year snapshot negotiation (PR #250).

Authority: question text + anchor chart.annualYear only.
Never uses datetime.now() for relative language when a chart exists.
Never invents year-specific Tử Vi facts.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal, Optional

ANNUAL_YEAR_MIN = 1900
ANNUAL_YEAR_MAX = 2100
MAX_TEMPORAL_YEARS = 5

TemporalCode = Literal[
  "OK",
  "NO_TEMPORAL_TARGET",
  "TEMPORAL_RANGE_TOO_LARGE",
  "TEMPORAL_YEAR_OUT_OF_RANGE",
]


@dataclass(frozen=True)
class TemporalResolveResult:
  code: TemporalCode
  years: tuple[int, ...]
  requested_count: int = 0
  message: str = ""


def _unique_sorted(years: list[int]) -> list[int]:
  return sorted(set(years))


def _in_domain(y: int) -> bool:
  return ANNUAL_YEAR_MIN <= y <= ANNUAL_YEAR_MAX


def _expand_range(start: int, end: int) -> list[int]:
  if end < start:
    start, end = end, start
  return list(range(start, end + 1))


# Relative phrases keyed by Vietnamese wording → offset from anchor
# (single year or multi-year "N năm tới")
_REL_SINGLE = [
  (re.compile(r"năm\s+nay\b"), 0),
  (re.compile(r"năm\s+đang\s+xem\b"), 0),
  (re.compile(r"năm\s+sau\b"), 1),
  (re.compile(r"năm\s+tới\b"), 1),
  (re.compile(r"năm\s+kế\s+tiếp\b"), 1),
  (re.compile(r"năm\s+trước\b"), -1),
  (re.compile(r"năm\s+ngoái\b"), -1),
]

_REL_MULTI = re.compile(
  r"(?<!\d)([1-5])\s*năm\s+(?:tới|sau|kế\s+tiếp)\b",
  re.IGNORECASE,
)

# Avoid treating career-experience phrases as forecasts.
_EXPERIENCE = re.compile(r"\d+\s*năm\s+kinh\s+nghiệm", re.IGNORECASE)

# Standalone years — collect broadly then fail-closed on domain
_YEAR4 = re.compile(r"\b((?:1\d{3}|2\d{3}))\b")

# Compact: 4-digit anchor then 2-digit continuations
_COMPACT = re.compile(
  r"\b((?:1\d{3}|2\d{3}))\b((?:\s*[,，]?\s*\b\d{2}\b){1,4})"
)

# Explicit ranges
_RANGE_DASH = re.compile(r"\b((?:1\d{3}|2\d{3}))\s*[-–—]\s*((?:1\d{3}|2\d{3}))\b")
_RANGE_WORDS = re.compile(
  r"\b((?:1\d{3}|2\d{3}))\s*(?:đến|tới|tới hết)\s*((?:1\d{3}|2\d{3}))\b",
  re.IGNORECASE,
)

# Bare 2-digit "28" or "28 tuổi" must NOT become years.
_AGE = re.compile(r"\b\d{1,2}\s*tuổi\b", re.IGNORECASE)


def resolve_requested_years(
  question: str,
  anchor_year: Optional[int],
) -> TemporalResolveResult:
  """Resolve distinct requested annual years from the CURRENT question + anchor.

  Returns NO_TEMPORAL_TARGET when nothing temporal is requested (ordinary questions).
  """
  if not question or not str(question).strip():
    return TemporalResolveResult("NO_TEMPORAL_TARGET", ())

  q = str(question)
  q_lower = q.lower()

  # Strip experience phrases so "5 năm kinh nghiệm" does not become multi-year.
  q_work = _EXPERIENCE.sub(" ", q_lower)
  q_work = _AGE.sub(" ", q_work)

  collected: list[int] = []

  # 1) Explicit ranges (dash / đến / tới)
  for m in _RANGE_DASH.finditer(q_work):
    collected.extend(_expand_range(int(m.group(1)), int(m.group(2))))
  for m in _RANGE_WORDS.finditer(q_work):
    collected.extend(_expand_range(int(m.group(1)), int(m.group(2))))

  # Remove matched range spans so we don't double-count endpoints alone incorrectly
  # when also collecting singles — duplicates are fine (unique_sorted).

  # 2) Compact continuations "2027 28 29"
  for m in _COMPACT.finditer(q_work):
    base = int(m.group(1))
    century = (base // 100) * 100
    collected.append(base)
    for t in re.findall(r"\b(\d{2})\b", m.group(2)):
      collected.append(century + int(t))

  # 3) Remaining explicit 4-digit years
  for m in _YEAR4.finditer(q_work):
    collected.append(int(m.group(1)))

  # 4) Relative language — only when anchor is known
  if anchor_year is not None:
    # Multi-year "N năm tới" (1..5) — skip if experience already stripped
    for m in _REL_MULTI.finditer(q_work):
      n = int(m.group(1))
      collected.extend([anchor_year + i for i in range(1, n + 1)])

    for pat, offset in _REL_SINGLE:
      if pat.search(q_work):
        # Special case: "năm tới" also matches inside "3 năm tới" — multi already
        # added those years. Adding offset=1 once more is fine (dedupe).
        # But "năm tới" alone after "3 năm tới" would add anchor+1 which is already in set.
        collected.append(anchor_year + offset)

  years = _unique_sorted(collected)

  if not years:
    return TemporalResolveResult("NO_TEMPORAL_TARGET", ())

  # Domain check first (any out-of-range year fails closed)
  out = [y for y in years if not _in_domain(y)]
  if out:
    return TemporalResolveResult(
      "TEMPORAL_YEAR_OUT_OF_RANGE",
      (),
      requested_count=len(years),
      message=f"Year(s) outside {ANNUAL_YEAR_MIN}..{ANNUAL_YEAR_MAX}: {out}",
    )

  if len(years) > MAX_TEMPORAL_YEARS:
    return TemporalResolveResult(
      "TEMPORAL_RANGE_TOO_LARGE",
      (),
      requested_count=len(years),
      message=f"Requested {len(years)} years; max is {MAX_TEMPORAL_YEARS}",
    )

  return TemporalResolveResult("OK", tuple(years), requested_count=len(years))


def missing_foreign_years(
  resolved: TemporalResolveResult,
  anchor_year: Optional[int],
) -> list[int]:
  """Years that need frontend snapshots (exclude anchor)."""
  if resolved.code != "OK":
    return []
  if anchor_year is None:
    return list(resolved.years)
  return [y for y in resolved.years if y != anchor_year]
