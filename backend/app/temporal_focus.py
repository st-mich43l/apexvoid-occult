"""Year-isolated multi-year temporal focus builder (PR #250).

PHYSICAL FACTS come only from validated ChartDTO snapshots.
Backend performs ZERO astrology placement calculation.
"""
from __future__ import annotations

from typing import Any, Optional

from .liencung import build_focus, classify_intent


def _ref_line(label: str, ref: Optional[dict]) -> str:
  if not ref:
    return f"- {label}: (không có)"
  extra = ""
  if ref.get("start") is not None and ref.get("end") is not None:
    extra = f" · tuổi {ref['start']}–{ref['end']}"
  return f"- {label}: {ref.get('name')} ({ref.get('branch')}){extra}"


def _mutagens_line(title: str, mutagens: list[dict]) -> str:
  if not mutagens:
    return f"- {title}: —"
  parts = [
    f"{m.get('mutagen')}→{m.get('starName')}"
    + (f"@{m.get('palaceName')}" if m.get("palaceName") else "")
    for m in mutagens
  ]
  return f"- {title}: " + ", ".join(parts)


def _annual_stars_summary(chart: dict) -> str:
  names = []
  for p in chart.get("palaces") or []:
    for s in p.get("stars") or []:
      src = s.get("source") or ""
      if src == "annual" or src == "annual-mutagen":
        names.append(f"{s.get('name')}@{p.get('name')}")
  if not names:
    return "- Sao lưu niên / hóa lưu: —"
  # Cap length for prompt budget
  shown = names[:24]
  more = f" (+{len(names) - 24})" if len(names) > 24 else ""
  return "- Sao lưu niên / hóa lưu: " + ", ".join(shown) + more


def _year_block(chart: dict, question: str, ci: dict) -> str:
  """Compact per-year facts — only this chart's temporal fields."""
  y = chart.get("annualYear")
  lines = [
    f"=== NĂM {y} ===",
    f"- Can Chi năm: {chart.get('annualStem')} {chart.get('annualBranch')}",
    f"- Tuổi danh nghĩa: {chart.get('nominalAge')}",
    _ref_line("Đại vận", chart.get("majorFortunePalace")),
    _ref_line("Thái Tuế", chart.get("taiTuePalace")),
    _ref_line("Tiểu Hạn", chart.get("smallLimitPalace")),
    _ref_line("Lưu Niên Đầu / annual head", chart.get("annualHeadPalace")),
    _mutagens_line("Tứ Hóa lưu niên", chart.get("annualMutagens") or []),
    _mutagens_line("Tứ Hóa đại vận", chart.get("majorMutagens") or []),
    _annual_stars_summary(chart),
  ]

  # Compact focus for this year's chart (reuse linked-palace logic)
  year_focus = build_focus(chart, question, ci)
  # Drop the foreign-year refusal appendix if present (snapshots path)
  cleaned = []
  skip = False
  for line in year_focus.splitlines():
    if "[NĂM NGOÀI PHẠM VI LÁ SỐ ĐÃ TÍNH]" in line:
      skip = True
      continue
    if skip:
      # skip until blank or new section that's not part of the refusal
      if line.startswith("[") and "NĂM NGOÀI" not in line and "KHÔNG được bịa" not in line:
        skip = False
        cleaned.append(line)
      elif line.startswith("KHÔNG được") or line.startswith("Câu hỏi nhắc"):
        continue
      elif not line.strip():
        skip = False
      continue
    cleaned.append(line)
  lines.append("[TRỌNG TÂM NĂM NÀY]")
  lines.extend(cleaned)
  return "\n".join(lines)


def build_temporal_focus(
  anchor_chart: dict,
  snapshots: list[dict],
  question: str,
  ci: Optional[dict] = None,
) -> str:
  """Build isolated multi-year focus. Snapshots must already be validated."""
  ci = ci or classify_intent(question)
  anchor_year = anchor_chart.get("annualYear")
  years = [s.get("annualYear") for s in snapshots]
  year_list = ", ".join(str(y) for y in years)

  header = [
    "[BỘ DỮ LIỆU LƯU NIÊN NHIỀU NĂM]",
    f"Năm lá số đang hiển thị (anchor): {anchor_year}",
    f"Các năm câu hỏi cần luận (snapshots): {year_list}",
    "",
    "[QUY TẮC DỮ LIỆU]",
    "- Mỗi block năm là một snapshot Calculation Core độc lập.",
    "- Sao lưu / Tứ Hóa / Tiểu Hạn / Thái Tuế / annual head của năm nào chỉ dùng cho năm đó.",
    "- Không chuyển dữ liệu lưu niên giữa các năm.",
    "- Đại vận phải đọc từ snapshot tương ứng của năm đó.",
    "- Chỉ được so sánh SAU KHI đọc facts riêng từng năm.",
    "- Nếu một fact không có trong block năm, KHÔNG được bịa.",
    "- [LÁ SỐ ĐANG XEM]/chartText) mô tả anchor; không chứa facts lưu niên của mọi năm yêu cầu.",
    "",
    "[YÊU CẦU SO SÁNH]",
    "Trình bày theo từng năm trước, rồi mới đối chiếu. Tuyệt đối không trộn Tứ Hóa/Tiểu Hạn giữa các năm.",
    "",
  ]

  blocks = [_year_block(s, question, ci) for s in sorted(snapshots, key=lambda c: c.get("annualYear") or 0)]
  return "\n".join(header + blocks)
