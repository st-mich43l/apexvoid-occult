import re
from typing import Optional

# Mappings from keywords to domains
DOMAIN_MAP = {
  "wealth": ["tiền", "tài chính", "nợ", "phá sản", "kinh doanh", "đầu tư", "lỗ"],
  "career": ["công việc", "sự nghiệp", "chức", "đuổi việc", "nghỉ việc", "dự án", "thăng chức", "mất việc"],
  "love": ["tình cảm", "tình duyên", "cưới", "vợ", "chồng", "chia tay", "ly hôn", "người yêu"],
  "health": ["bệnh", "sức khỏe", "ốm", "tai nạn", "mổ xẻ", "tật"]
}

DOMAIN_TO_PALACE = {
  "wealth": "Tài Bạch",
  "career": "Quan Lộc",
  "love": "Phu Thê",
  "health": "Tật Ách"
}

NEGATIVE_WORDS = ["biến cố", "mất", "phá", "nợ", "thất bại", "chia tay", "ly hôn", "đuổi", "nghỉ", "khủng hoảng", "kém", "tệ", "cãi", "lỗ"]
POSITIVE_WORDS = ["cưới", "thăng", "trúng", "được", "tăng", "tốt", "khởi sắc", "thành công"]

# Forecast / question markers — PR #250: these must NOT become observed events.
_FORECAST = re.compile(
  r"("
  r"\bcó\s+(tốt|tệ|kém|khả năng|được|bị)?\b|"
  r"\bliệu\b|"
  r"\bthế\s+nào\b|"
  r"\bra\s+sao\b|"
  r"\bkhông\s*\?|"
  r"\?\s*$|"
  r"có\s+cưới\s+không|"
  r"có\s+mất\s+việc\s+không|"
  r"có\s+tốt\s+không|"
  r"có\s+tệ\s+không|"
  r"năm\s+sau\s+có|"
  r"\d+\s*năm\s+tới|"
  r"khởi\s+sắc\s+không"
  r")",
  re.IGNORECASE,
)

# Strong retrospective assertion required to record an event.
_ASSERTED = re.compile(
  r"("
  r"\bđã\b|"
  r"\bbị\b|"
  r"\bxảy\s+ra\b|"
  r"\btừng\b|"
  r"năm\s+đó\s+tôi|"
  r"năm\s+ngoái\s+tôi|"
  r"năm\s+vừa\s+rồi\s+tôi|"
  r"tôi\s+đã\b|"
  r"tôi\s+bị\b"
  r")",
  re.IGNORECASE,
)


def parse_event(question: str, current_year: int) -> Optional[dict]:
  """
  Nhận diện biến cố TỰ THUẬT đã xảy ra.

  PR #250: forecast questions (có…không?, liệu, thế nào, N năm tới…)
  must NOT create event records. Require assertive retrospective language.
  Health domain remains excluded.
  """
  question_lower = question.lower()

  if _FORECAST.search(question_lower) and not _ASSERTED.search(question_lower):
    return None

  if not _ASSERTED.search(question_lower):
    # Without assertive past language, do not record — conservative.
    return None

  year = None
  match_year = re.search(r'\b(19\d{2}|20\d{2})\b', question)
  if match_year:
    year = int(match_year.group(1))
  elif "năm ngoái" in question_lower or "năm vừa rồi" in question_lower or "năm trước" in question_lower:
    year = current_year - 1

  if not year:
    return None

  matched_domain = None
  for dom, words in DOMAIN_MAP.items():
    if any(w in question_lower for w in words):
      matched_domain = dom
      break

  if not matched_domain:
    return None

  if matched_domain == "health":
    return None

  valence = None
  if any(w in question_lower for w in NEGATIVE_WORDS):
    valence = "negative"
  elif any(w in question_lower for w in POSITIVE_WORDS):
    valence = "positive"

  if not valence:
    return None

  palace = DOMAIN_TO_PALACE[matched_domain]

  return {
    "year": year,
    "domain": matched_domain,
    "palace": palace,
    "valence": valence,
    "note": question
  }
