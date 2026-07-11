import os
import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo

from .schemas import ChartDTO

logger = logging.getLogger(__name__)

# Lazy initialization of db
_client = None
_db = None

def get_db():
  global _client, _db
  if _db is None:
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGO_DB", "void_occult")
    try:
      _client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2000)
      _db = _client[db_name]
    except Exception as e:
      logger.error(f"Failed to connect to MongoDB: {e}")
  return _db

async def init_db():
  """Tạo unique indexes. Chạy một lần khi khởi động app."""
  db = get_db()
  if db is None:
    return
  try:
    await db.observations.create_index(
      [("chartHash", pymongo.ASCENDING), ("year", pymongo.ASCENDING), ("palace", pymongo.ASCENDING)],
      unique=True
    )
    await db.reported_events.create_index(
      [("chartHash", pymongo.ASCENDING), ("year", pymongo.ASCENDING), ("palace", pymongo.ASCENDING), ("domain", pymongo.ASCENDING)],
      unique=True
    )
    logger.info("MongoDB indexes initialized.")
  except Exception as e:
    logger.error(f"Failed to create indexes: {e}")

def _hash_chart(chart: ChartDTO) -> str:
  """Tạo chartHash ẩn danh từ các can chi sinh.
  KHÔNG phục hồi được danh tính. Dùng để đối chiếu observation và event của cùng 1 lá số.
  """
  # Vì ChartDTO hiện tại chưa có giới tính (gender), ta ghép các can chi sinh.
  # Các trường này cố định với lá số.
  raw = f"{chart.birthDayStem}{chart.birthDayBranch}{chart.birthMonthStem}{chart.birthMonthBranch}{chart.birthHourStem}{chart.birthHourBranch}{chart.yearStem}{chart.yearBranch}"
  return hashlib.sha256(raw.encode("utf-8")).hexdigest()

async def record_observation(chart: ChartDTO, year: int, palace: str, cach_cuc: list[str]):
  """MẪU SỐ: Ghi nhận cách cục đang hoạt động tại 1 năm, 1 cung.
  Chạy âm thầm (fire-and-forget), lỗi DB không được làm vỡ luồng.
  TUYỆT ĐỐI KHÔNG ghi domain sức khỏe.
  """
  if palace == "Tật Ách":
    return
    
  db = get_db()
  if db is None:
    return
    
  try:
    chart_hash = _hash_chart(chart)
    now = datetime.now(timezone.utc)
    # Upsert to ensure idempotency (chỉ đếm 1 lần cho mỗi chartHash-year-palace)
    await db.observations.update_one(
      {"chartHash": chart_hash, "year": year, "palace": palace},
      {
        "$setOnInsert": {
          "chartHash": chart_hash,
          "year": year,
          "palace": palace,
          "cachCuc": cach_cuc,
          "createdAt": now
        }
      },
      upsert=True
    )
  except Exception as e:
    logger.error(f"Failed to record observation: {e}")

async def record_event(chart: ChartDTO, year: int, palace: str, valence: str, domain: str, note: str):
  """TỬ SỐ: Ghi nhận biến cố do user tự thuật.
  TUYỆT ĐỐI KHÔNG ghi domain sức khỏe.
  """
  if domain == "health" or palace == "Tật Ách":
    return
    
  db = get_db()
  if db is None:
    return
    
  try:
    chart_hash = _hash_chart(chart)
    now = datetime.now(timezone.utc)
    # Upsert to ensure idempotency (chống khai trùng)
    await db.reported_events.update_one(
      {"chartHash": chart_hash, "year": year, "palace": palace, "domain": domain},
      {
        "$setOnInsert": {
          "chartHash": chart_hash,
          "year": year,
          "palace": palace,
          "valence": valence,
          "domain": domain,
          "note": note,
          "createdAt": now
        }
      },
      upsert=True
    )
  except Exception as e:
    logger.error(f"Failed to record event: {e}")
