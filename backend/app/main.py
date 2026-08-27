"""FastAPI app — backend luận giải Tử Vi (local dev).

Chạy:  uvicorn app.main:app --reload --port 8000  (từ thư mục backend/)
"""
import os
import time
import json
import logging
import asyncio
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from . import config
from . import store
from .event_parse import parse_event
from .schemas import InterpretRequest
from .api_errors import (
  TemporalRangeTooLargeResponse,
  TemporalSnapshotValidationErrorResponse,
  TemporalSnapshotsRequiredResponse,
  TemporalYearOutOfRangeResponse,
  UnsupportedNarrativeSchoolResponse,
)
from .liencung import build_focus, classify_intent, select_palaces, detect_cach_cuc
from .prompt import build_system, build_user_turn
from .kb.retriever import get_retriever
from .llm import get_client, LLMError
from .narrative_school import (
  resolve_narrative_school,
  unsupported_school_payload,
  NAM_PHAI_PROFILE,
)
from .temporal_request import (
  MAX_TEMPORAL_YEARS,
  missing_foreign_years,
  resolve_requested_years,
)
from .temporal_validate import validate_temporal_bundle
from .temporal_focus import build_temporal_focus

@asynccontextmanager
async def lifespan(app: FastAPI):
  await store.init_db()
  yield

app = FastAPI(title="Void Occult — Tử Vi luận giải", version="0.1.0", lifespan=lifespan)
app.add_middleware(
  CORSMiddleware,
  allow_origins=config.ALLOW_ORIGINS,
  allow_credentials=False,
  allow_methods=["*"],
  allow_headers=["*"],
)

logging.basicConfig(level=logging.WARNING, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# --- Rate limiting (In-process sliding window) ---
# Applied only to expensive interpretation (LLM path), NOT to snapshot handshake.
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "10"))
RATE_LIMIT_BURST = int(os.getenv("RATE_LIMIT_BURST", "3"))

_ip_history = defaultdict(list)

def check_interpretation_rate_limit(request: Request):
  ip = request.headers.get("X-Forwarded-For")
  if ip:
    ip = ip.split(",")[-1].strip()
  else:
    ip = request.client.host if request.client else "unknown"

  now = time.time()
  _ip_history[ip] = [t for t in _ip_history[ip] if now - t < 60]

  if len(_ip_history[ip]) >= RATE_LIMIT_PER_MIN + RATE_LIMIT_BURST:
    return False
  _ip_history[ip].append(now)
  return True

_retriever_nam_phai = get_retriever(NAM_PHAI_PROFILE.kb_subdir or "nam_phai")


@app.get("/health")
async def health():
  return {"ok": True, "model": config.GEMINI_MODEL}


def _temporal_debug_payload(req: InterpretRequest) -> dict:
  chart = req.chart.model_dump() if req.chart else None
  anchor_year = chart.get("annualYear") if chart else None
  resolved = resolve_requested_years(req.question, anchor_year)
  required = missing_foreign_years(resolved, anchor_year)
  validated_years = []
  temporal_mode = "single"
  temporal_focus = None
  if chart is not None and required:
    temporal_mode = "multi"
    if req.temporalSnapshots is not None:
      bundle = req.temporalSnapshots.model_dump()
      err = validate_temporal_bundle(chart, bundle, required)
      if err is None:
        validated_years = [s["annualYear"] for s in bundle["snapshots"]]
        temporal_focus = build_temporal_focus(chart, bundle["snapshots"], req.question)
  return {
    "anchorYear": anchor_year,
    "resolvedYears": list(resolved.years),
    "resolveCode": resolved.code,
    "requiredSnapshotYears": required,
    "validatedSnapshotYears": validated_years,
    "temporalMode": temporal_mode,
    "temporalFocus": temporal_focus,
  }


if config.DEBUG:
  @app.post("/api/debug/focus")
  def debug_focus(req: InterpretRequest):
    """Soi khối 'trọng tâm' + tài liệu KB được chọn (không gọi LLM) — tiện kiểm thử."""
    chart = req.chart.model_dump() if req.chart else None
    if chart is not None:
      profile = resolve_narrative_school(chart.get("school"))
      if not profile.supported:
        return JSONResponse(status_code=422, content=unsupported_school_payload(profile.school))
      retriever = get_retriever(profile.kb_subdir or "nam_phai")
    else:
      retriever = _retriever_nam_phai
    ci = classify_intent(req.question)
    temporal = _temporal_debug_payload(req)
    focus = (
      temporal["temporalFocus"]
      if temporal.get("temporalFocus")
      else build_focus(chart, req.question, ci)
    )
    return {
      "intent": ci["intent"]["key"],
      "timing": ci["timing"],
      "kb_docs": retriever.docs_for(chart, ci),
      "focus": focus,
      **temporal,
    }


@app.post(
  "/api/interpret",
  responses={
    409: {
      "model": TemporalSnapshotsRequiredResponse,
      "description": "Foreign-year snapshots required (zero side effects)",
    },
    422: {
      "model": UnsupportedNarrativeSchoolResponse,
      "description": (
        "Unsupported narrative school, temporal range/year errors, "
        "or snapshot validation failures (see api_errors models in OpenAPI)"
      ),
    },
  },
)
async def interpret(req: InterpretRequest, request: Request):
  chart = req.chart.model_dump() if req.chart else None

  # 1) School-aware narrative gate — before snapshot negotiation / KB / LLM.
  if chart is not None:
    narrative = resolve_narrative_school(chart.get("school"))
    if not narrative.supported:
      return JSONResponse(
        status_code=422,
        content=UnsupportedNarrativeSchoolResponse(
          school=narrative.school,
          message=(
            "Luận giải AI cho trường phái này chưa được kích hoạt vì hệ thống "
            "hiện chưa có knowledge pack đã được kiểm chứng."
          ),
        ).model_dump(),
      )
    retriever = get_retriever(narrative.kb_subdir or "nam_phai")
    system_prompt = narrative.system_prompt
  else:
    narrative = NAM_PHAI_PROFILE
    retriever = _retriever_nam_phai
    system_prompt = narrative.system_prompt

  # 2) Temporal year resolution (anchor = chart.annualYear, never server now)
  anchor_year = chart.get("annualYear") if chart else None
  resolved = resolve_requested_years(req.question, anchor_year)

  if resolved.code == "TEMPORAL_RANGE_TOO_LARGE":
    return JSONResponse(
      status_code=422,
      content=TemporalRangeTooLargeResponse(
        maxYears=MAX_TEMPORAL_YEARS,
        requestedCount=resolved.requested_count,
        message="Khoảng thời gian quá dài. Hãy chọn tối đa 5 năm để luận cùng lúc.",
      ).model_dump(),
    )

  if resolved.code == "TEMPORAL_YEAR_OUT_OF_RANGE":
    return JSONResponse(
      status_code=422,
      content=TemporalYearOutOfRangeResponse(
        message="Năm yêu cầu nằm ngoài phạm vi lá số hiện được hỗ trợ.",
      ).model_dump(),
    )

  required = missing_foreign_years(resolved, anchor_year)

  # 3) Snapshot negotiation — zero side effects when missing
  snapshots_payload = None
  if required:
    if req.temporalSnapshots is None:
      if anchor_year is None:
        return JSONResponse(
          status_code=422,
          content=TemporalYearOutOfRangeResponse(
            message="Năm yêu cầu nằm ngoài phạm vi lá số hiện được hỗ trợ.",
          ).model_dump(),
        )
      return JSONResponse(
        status_code=409,
        content=TemporalSnapshotsRequiredResponse(
          anchorYear=int(anchor_year),
          years=required,
          maxSnapshots=MAX_TEMPORAL_YEARS,
        ).model_dump(),
      )
    bundle = req.temporalSnapshots.model_dump()
    err = validate_temporal_bundle(chart or {}, bundle, required)
    if err is not None:
      code = err.code  # type: ignore[assignment]
      return JSONResponse(
        status_code=422,
        content=TemporalSnapshotValidationErrorResponse(
          code=code,
          error=code,
          message=(
            "Không thể tạo ngữ cảnh nhiều năm nhất quán với lá số đang hiển thị."
            if err.code == "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH"
            else "Không thể chuẩn bị dữ liệu lưu niên đầy đủ cho khoảng thời gian này."
          ),
          detail=err.detail,
        ).model_dump(),
      )
    snapshots_payload = bundle["snapshots"]

  # 4) Expensive interpretation budget (after handshake)
  if not check_interpretation_rate_limit(request):
    return JSONResponse(
      status_code=429,
      content={"error": "Rate limit exceeded"},
      headers={"Retry-After": "60"},
    )

  ci = classify_intent(req.question)
  if snapshots_payload is not None:
    focus = build_temporal_focus(chart, snapshots_payload, req.question, ci)
  else:
    focus = build_focus(chart, req.question, ci)

  # Events / observations — only on real interpretation (never on handshake).
  # Forecast questions must not become observed events (see event_parse).
  # Multi-year snapshots are QUERY CONTEXT, not observations — only record for anchor.
  event_info = None
  if chart:
    current_year = chart.get("annualYear") or datetime.now(timezone.utc).year
    event_info = parse_event(req.question, current_year)
    if event_info:
      asyncio.create_task(store.record_event(
        req.chart, event_info["year"], event_info["palace"],
        event_info["valence"], event_info["domain"], event_info["note"]
      ))
      for p in chart.get("palaces", []):
        if p["name"] == event_info["palace"]:
          cc_dicts = detect_cach_cuc([{"role": "chính", "p": p}])
          cc_ids = [c["id"] for c in cc_dicts]
          asyncio.create_task(store.record_observation(req.chart, event_info["year"], p["name"], cc_ids))
          break

    if chart.get("annualYear"):
      sset = select_palaces(chart, ci["intent"])
      for x in sset:
        if x["role"] == "chính":
          cc_dicts = detect_cach_cuc([x])
          cc_ids = [c["id"] for c in cc_dicts]
          asyncio.create_task(store.record_observation(req.chart, chart["annualYear"], x["p"]["name"], cc_ids))

  kb_ctx = retriever.retrieve(chart, ci)
  system = build_system(system_prompt)
  user_turn = build_user_turn(
    req.question,
    focus,
    kb_ctx,
    req.chartText,
    req.profile.model_dump(),
    temporal_mode=bool(snapshots_payload),
  )

  contents = [{"role": m.role, "parts": [{"text": m.text}]} for m in req.history]
  contents.append({"role": "user", "parts": [{"text": user_turn}]})

  try:
    client = get_client()
  except LLMError as e:
    return JSONResponse(status_code=400, content={"error": str(e)})

  async def gen():
    if event_info:
      confirm_msg = f"[Đã ghi nhận: biến cố {event_info['domain']} năm {event_info['year']}]\n\n"
      yield f"event: delta\ndata: {json.dumps(confirm_msg)}\n\n"

    try:
      async def _run():
        async for chunk in client.stream_async(system, contents):
          yield f"event: delta\ndata: {json.dumps(chunk)}\n\n"

      generator = _run()
      LLM_TIMEOUT_S = float(os.getenv("LLM_TIMEOUT_S", "120"))
      while True:
        try:
          chunk = await asyncio.wait_for(generator.__anext__(), timeout=LLM_TIMEOUT_S)
          yield chunk
        except StopAsyncIteration:
          yield "event: done\ndata: {}\n\n"
          break

    except Exception:
      logger.exception("Error during LLM stream")
      yield f"event: error\ndata: {json.dumps({'message': 'Hệ thống đang quá tải hoặc gặp sự cố nội bộ. Vui lòng thử lại sau.'})}\n\n"

  return StreamingResponse(gen(), media_type="text/event-stream")
