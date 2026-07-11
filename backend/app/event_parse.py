import re
from typing import Optional

# Mappings from keywords to domains
DOMAIN_MAP = {
  "wealth": ["tiền", "tài chính", "nợ", "phá sản", "kinh doanh", "đầu tư", "lỗ"],
  "career": ["công việc", "sự nghiệp", "chức", "đuổi việc", "nghỉ việc", "dự án", "thăng chức"],
  "love": ["tình cảm", "tình duyên", "cưới", "vợ", "chồng", "chia tay", "ly hôn", "người yêu"],
  "health": ["bệnh", "sức khỏe", "ốm", "tai nạn", "mổ xẻ", "tật"]
}

DOMAIN_TO_PALACE = {
  "wealth": "Tài Bạch",
  "career": "Quan Lộc",
  "love": "Phu Thê",
  "health": "Tật Ách"
}

# Valence mapping
NEGATIVE_WORDS = ["biến cố", "mất", "phá", "nợ", "thất bại", "chia tay", "ly hôn", "đuổi", "nghỉ", "khủng hoảng", "kém", "tệ", "cãi", "lỗ"]
POSITIVE_WORDS = ["cưới", "thăng", "trúng", "được", "tăng", "tốt", "khởi sắc", "thành công"]

def parse_event(question: str, current_year: int) -> Optional[dict]:
  """
  Nhận diện biến cố từ câu hỏi.
  Yêu cầu: Phải có đủ (Năm + Domain + Valence). Nếu là health -> ignore.
  """
  question_lower = question.lower()
  
  # 1. Xác định năm
  year = None
  match_year = re.search(r'\b(19\d{2}|20\d{2})\b', question)
  if match_year:
    year = int(match_year.group(1))
  elif "năm ngoái" in question_lower or "năm vừa rồi" in question_lower or "năm trước" in question_lower:
    year = current_year - 1
  
  if not year:
    return None
    
  # 2. Xác định domain
  matched_domain = None
  for dom, words in DOMAIN_MAP.items():
    if any(w in question_lower for w in words):
      matched_domain = dom
      break
      
  if not matched_domain:
    return None
    
  # Cấm domain sức khỏe
  if matched_domain == "health":
    return None
    
  # 3. Xác định valence
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
