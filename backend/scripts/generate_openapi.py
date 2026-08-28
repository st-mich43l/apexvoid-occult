#!/usr/bin/env python3
"""Deterministic OpenAPI export for contract SSOT (PR #251).

Usage (from repo root or backend/):
  python backend/scripts/generate_openapi.py
  python scripts/generate_openapi.py   # cwd=backend

Must not connect to Mongo, Gemini, or the network.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# Contract artifacts must never include DEBUG-only routes (/api/debug/*).
# Force before app.config loads .env via setdefault (local VOIDOCC_DEBUG=1).
os.environ["VOIDOCC_DEBUG"] = "0"

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
  sys.path.insert(0, str(BACKEND_ROOT))

OUT = BACKEND_ROOT / "openapi.json"

# Explicit transport models that must appear in OpenAPI components even when
# only referenced from JSONResponse bodies (not response_model).
_REQUIRED_MODELS = (
  "app.schemas.ChartDTO",
  "app.schemas.TemporalSnapshotBundle",
  "app.schemas.InterpretRequest",
  "app.api_errors.UnsupportedNarrativeSchoolResponse",
  "app.api_errors.TemporalSnapshotsRequiredResponse",
  "app.api_errors.TemporalRangeTooLargeResponse",
  "app.api_errors.TemporalYearOutOfRangeResponse",
  "app.api_errors.TemporalSnapshotValidationErrorResponse",
)


def _import_symbol(path: str):
  module_name, _, attr = path.rpartition(".")
  mod = __import__(module_name, fromlist=[attr])
  return getattr(mod, attr)


def _ensure_models(schema: dict) -> None:
  from pydantic.json_schema import models_json_schema

  models = [_import_symbol(p) for p in _REQUIRED_MODELS]
  _, defs = models_json_schema(
    [(m, "serialization") for m in models],
    ref_template="#/components/schemas/{model}",
  )
  components = schema.setdefault("components", {})
  schemas = components.setdefault("schemas", {})
  # defs keys are typically "$defs" nested; models_json_schema returns mapping
  for key, value in defs.get("$defs", defs).items():
    schemas[key] = value


def main() -> int:
  from app.main import app  # noqa: WPS433 — intentional import after path setup

  schema = app.openapi()
  _ensure_models(schema)
  text = json.dumps(schema, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
  OUT.write_text(text, encoding="utf-8")
  print(f"Wrote {OUT} ({len(text)} bytes)")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
