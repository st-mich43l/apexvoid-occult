import { describe, expect, it } from "vitest";
import {
  loadTrungChauResearchPackV0,
  resetTrungChauResearchPackCache,
} from "../index";

describe("trung-chau-research-v0 doctrine matrix", () => {
  it("covers required investigation topics and keeps futureRuntimeAction none", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const ids = new Set(loaded.pack.doctrineMatrix.rows.map((r) => r.policyId));
    for (const required of [
      "POL-TC-TUHOA",
      "POL-TC-TUHOA-CANH-KHOA",
      "POL-TC-KHOIVIET",
      "POL-TC-KHOIVIET-CANH",
      "POL-TC-HOA-LINH",
      "POL-TC-LINH-DIRECTION",
      "POL-TC-BACSI",
      "POL-TC-TIEU-HAN-ROLE",
      "POL-TC-ANNUAL-PALACE",
      "POL-TC-TIEU-HAN-MONTHLY",
      "POL-TC-DV-TUHOA",
      "POL-TC-DV-DECORATION",
      "POL-TC-TRUNG-BAI",
      "POL-TC-SIGNATURE-STARS",
      "POL-TC-TUONG-TINH",
      "POL-TC-HOA-CAI",
      "POL-TC-KIEP-SAT",
    ]) {
      expect(ids.has(required)).toBe(true);
    }

    for (const row of loaded.pack.doctrineMatrix.rows) {
      expect(row.school).toBe("trung-chau");
      expect(["none", "separate_pr_after_expert_review"]).toContain(
        row.futureRuntimeAction,
      );
      // V0 must not declare immediate engine edits.
      expect(row.futureRuntimeAction).toBe("none");
    }
  });

  it("keeps CURRENT RUNTIME / research verdict / expert status separable for Canh Khoa", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const row = loaded.pack.doctrineMatrix.rows.find(
      (r) => r.policyId === "POL-TC-TUHOA-CANH-KHOA",
    );
    expect(row).toBeDefined();
    expect(row!.runtimeObservationRef).toBe("OBS-TC-TUHOA-CANH-KHOA");
    expect(row!.expertReviewRefs).toContain("ERQ-005");
    expect(row!.researchVerdict).toBe("expert_pending");
    expect(row!.futureRuntimeAction).toBe("none");

    const obs = loaded.pack.runtimeObservations.observations.find(
      (o) => o.observationId === "OBS-TC-TUHOA-CANH-KHOA",
    );
    expect(obs?.observedBehavior).toBe("Thiên Phủ");
  });
});

describe("trung-chau-research-v0 contradictions + ERQ-005", () => {
  it("open/pending contradictions have null resolution and resolve refs", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const claimIds = new Set(
      loaded.pack.sourceRegistry.claims.map((c) => c.claimId),
    );
    const sourceIds = new Set(
      loaded.pack.sourceRegistry.sources.map((s) => s.sourceId),
    );

    for (const c of loaded.pack.contradictions.contradictions) {
      for (const id of c.claimRefs) expect(claimIds.has(id)).toBe(true);
      for (const id of c.sourceRefs) expect(sourceIds.has(id)).toBe(true);
      if (
        c.status === "open" ||
        c.status === "expert_pending" ||
        c.status === "insufficient_evidence"
      ) {
        expect(c.resolution).toBeNull();
      }
    }
  });

  it("ERQ-005 remains expert_pending with both runtime positions", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const erq = loaded.pack.expertReview.reviews.find(
      (r) => r.reviewId === "ERQ-005",
    );
    expect(erq).toBeDefined();
    expect(erq!.status).toBe("expert_pending");
    expect(erq!.reviewRequired).toBe(true);
    expect(erq!.currentRuntimePositions["nam-phai.Canh.Khoa"]).toBe("Thái Âm");
    expect(erq!.currentRuntimePositions["trung-chau.Canh.Khoa"]).toBe(
      "Thiên Phủ",
    );
  });
});
