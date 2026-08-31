import { describe, expect, it } from "vitest";
import {
  assertApprovedCorrectionContract,
  khoaTarget,
  POST_CORRECTION_TRUNG_CHAU_TU_HOA,
  PRE_CORRECTION_TRUNG_CHAU_TU_HOA,
  prePostPolicyCellDifferences,
} from "../policy";
import { TRUNG_CHAU_TU_HOA } from "@/lib/ziwei/schools/trung-chau-policy";

describe("PR265 PRE↔POST policy integrity", () => {
  it("differs in exactly two approved Khoa cells", () => {
    const diffs = prePostPolicyCellDifferences();
    expect(diffs).toHaveLength(2);
    expect(assertApprovedCorrectionContract().ok).toBe(true);
    expect(diffs).toEqual(
      expect.arrayContaining([
        { stem: "Mậu", mutagen: "Khoa", from: "Hữu Bật", to: "Thái Dương" },
        { stem: "Nhâm", mutagen: "Khoa", from: "Tả Phụ", to: "Thiên Phủ" },
      ]),
    );
  });

  it("keeps Canh Khoa = Thiên Phủ on both sides", () => {
    expect(khoaTarget(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, "Canh")).toBe("Thiên Phủ");
    expect(khoaTarget(POST_CORRECTION_TRUNG_CHAU_TU_HOA, "Canh")).toBe("Thiên Phủ");
  });

  it("POST table is the live released TC policy", () => {
    expect(POST_CORRECTION_TRUNG_CHAU_TU_HOA).toBe(TRUNG_CHAU_TU_HOA);
  });
});
