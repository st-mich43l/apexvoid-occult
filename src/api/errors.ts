/**
 * Frontend-local integration errors + narrow parsers for untrusted JSON (PR #251).
 * Generated TS types do not runtime-validate responses.
 */
import type { ApiTemporalSnapshotsRequired } from "@/api/contracts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function readErrorCode(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.code === "string") return payload.code;
  if (typeof payload.error === "string") return payload.error;
  return null;
}

/** Fail-closed parse of TEMPORAL_SNAPSHOTS_REQUIRED (409). */
export function parseTemporalSnapshotsRequired(
  payload: unknown,
): ApiTemporalSnapshotsRequired | null {
  if (!isRecord(payload)) return null;
  if (payload.code !== "TEMPORAL_SNAPSHOTS_REQUIRED") return null;
  if (!isInt(payload.anchorYear)) return null;
  if (!Array.isArray(payload.years) || payload.years.length === 0) return null;
  if (payload.years.length > 5) return null;
  if (!payload.years.every(isInt)) return null;
  const maxSnapshots = isInt(payload.maxSnapshots) ? payload.maxSnapshots : 5;
  return {
    code: "TEMPORAL_SNAPSHOTS_REQUIRED",
    error: "TEMPORAL_SNAPSHOTS_REQUIRED",
    anchorYear: payload.anchorYear,
    years: payload.years,
    maxSnapshots,
  };
}

export function mapBackendErrorToUserMessage(payload: unknown): string {
  if (!isRecord(payload)) return "Không thể luận giải.";
  const code = readErrorCode(payload);
  if (code === "UNSUPPORTED_NARRATIVE_SCHOOL") {
    const school = typeof payload.school === "string" ? payload.school : "";
    return school === "trung-chau"
      ? "Luận giải AI cho Trung Châu chưa được kích hoạt vì hệ thống hiện chưa có knowledge pack Trung Châu đã được kiểm chứng."
      : typeof payload.message === "string"
        ? payload.message
        : "Luận giải AI cho trường phái này chưa được kích hoạt vì hệ thống hiện chưa có knowledge pack đã được kiểm chứng.";
  }
  if (code === "TEMPORAL_RANGE_TOO_LARGE") {
    return "Khoảng thời gian quá dài. Hãy chọn tối đa 5 năm để luận cùng lúc.";
  }
  if (code === "TEMPORAL_YEAR_OUT_OF_RANGE") {
    return "Năm yêu cầu nằm ngoài phạm vi lá số hiện được hỗ trợ.";
  }
  if (
    code === "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH" ||
    code === "TEMPORAL_ANCHOR_MISMATCH"
  ) {
    return "Không thể tạo ngữ cảnh nhiều năm nhất quán với lá số đang hiển thị.";
  }
  if (code === "TEMPORAL_SNAPSHOT_SET_MISMATCH") {
    return "Không thể chuẩn bị dữ liệu lưu niên đầy đủ cho khoảng thời gian này.";
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return "Không thể luận giải.";
}
