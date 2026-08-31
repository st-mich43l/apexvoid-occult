/**
 * PRE vs POST Trung Châu Tứ Hóa policy contract for research only.
 * Reuses frozen PRE table from historical impact-compare (pre-#262).
 */
import {
  PRE_CORRECTION_TRUNG_CHAU_TU_HOA,
  candidateCellDifferences,
  khoaTarget,
} from "../../knowledge/trung-chau-research-v0/impact-compare";
import { TRUNG_CHAU_TU_HOA } from "@/lib/ziwei/schools/trung-chau-policy";
import type { TuHoaTable } from "@/lib/ziwei/schools/policy-types";
import type { PolicyCellDiff } from "./types";

export { PRE_CORRECTION_TRUNG_CHAU_TU_HOA, khoaTarget };

export const POST_CORRECTION_TRUNG_CHAU_TU_HOA: TuHoaTable = TRUNG_CHAU_TU_HOA;

/** Exact PRE↔POST cell diffs. Must be length 2 for the approved Khoa corrections. */
export function prePostPolicyCellDifferences(): PolicyCellDiff[] {
  return candidateCellDifferences(
    PRE_CORRECTION_TRUNG_CHAU_TU_HOA,
    POST_CORRECTION_TRUNG_CHAU_TU_HOA,
  );
}

export function assertApprovedCorrectionContract(): {
  ok: true;
  diffs: PolicyCellDiff[];
} {
  const diffs = prePostPolicyCellDifferences();
  if (diffs.length !== 2) {
    throw new Error(`TOTAL_POLICY_CELL_DIFF=${diffs.length}; expected 2`);
  }
  const mau = diffs.find((d) => d.stem === "Mậu" && d.mutagen === "Khoa");
  const nham = diffs.find((d) => d.stem === "Nhâm" && d.mutagen === "Khoa");
  if (!mau || mau.from !== "Hữu Bật" || mau.to !== "Thái Dương") {
    throw new Error(`Mậu Khoa contract broken: ${JSON.stringify(mau)}`);
  }
  if (!nham || nham.from !== "Tả Phụ" || nham.to !== "Thiên Phủ") {
    throw new Error(`Nhâm Khoa contract broken: ${JSON.stringify(nham)}`);
  }
  if (khoaTarget(POST_CORRECTION_TRUNG_CHAU_TU_HOA, "Canh") !== "Thiên Phủ") {
    throw new Error("Canh Khoa must remain Thiên Phủ");
  }
  if (khoaTarget(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, "Canh") !== "Thiên Phủ") {
    throw new Error("PRE Canh Khoa must remain Thiên Phủ");
  }
  return { ok: true, diffs };
}
