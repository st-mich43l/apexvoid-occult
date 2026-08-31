import { describe, expect, it } from "vitest";
import {
  assertDoctrineClaimNotEngineeringOnly,
  loadTrungChauResearchPackV0,
  resetTrungChauResearchPackCache,
  validateTrungChauResearchPackV0,
  type ResearchClaim,
  type ResearchSource,
} from "../index";

describe("trung-chau-research-v0 validation", () => {
  it("loads and validates the committed pack", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.pack.meta.runtimeAuthority).toBe(false);
    expect(loaded.pack.meta.runtimeImpact).toBe("none");
    expect(loaded.pack.meta.narrativeAuthority).toBe(false);
    expect(loaded.pack.meta.researchStage).toBe("V0.4");
    expect(loaded.pack.tuHoaAudit?.cells.length).toBe(40);
    expect(loaded.pack.placementAudit?.sections.length).toBeGreaterThan(0);
    expect(loaded.pack.temporalAudit?.entries.length).toBeGreaterThan(0);
    expect(loaded.pack.erq005DecisionPacket?.status).toBe("expert_pending");
    expect(loaded.pack.erq005ReleaseDecision?.decision).toBe("APPROVE_MAU_AND_NHAM");
    expect(loaded.pack.erq005ReleaseDecision?.status).toBe("resolved");
    expect(loaded.pack.erq005ReleaseDecision?.runtimeAuthority).toBe(false);
    expect(loaded.pack.tuHoaImpactAudit?.summary.goldenCasesWithPhiFlowDelta).toBe(45);
    expect(["incomplete", "research_only"]).toContain(loaded.pack.meta.status);
    expect(loaded.pack.meta.school).toBe("trung-chau");
  });

  it("rejects duplicate observation ids", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const broken = structuredClone(loaded.pack);
    broken.runtimeObservations.observations.push({
      ...broken.runtimeObservations.observations[0]!,
    });
    const result = validateTrungChauResearchPackV0(broken);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes("duplicate"))).toBe(true);
  });

  it("rejects unresolved claimRefs on matrix rows", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const broken = structuredClone(loaded.pack);
    broken.doctrineMatrix.rows[0]!.claimRefs = ["CLM-TC-DOES-NOT-EXIST"];
    const result = validateTrungChauResearchPackV0(broken);
    expect(result.ok).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("CLM-TC-DOES-NOT-EXIST")),
    ).toBe(true);
  });

  it("requires ERQ-005", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const broken = structuredClone(loaded.pack);
    broken.expertReview.reviews = [];
    broken.doctrineMatrix.rows = broken.doctrineMatrix.rows.map((row) => ({
      ...row,
      expertReviewRefs: row.expertReviewRefs.filter((id) => id !== "ERQ-005"),
    }));
    const result = validateTrungChauResearchPackV0(broken);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes("ERQ-005"))).toBe(true);
  });
});

describe("trung-chau-research-v0 provenance", () => {
  it("rejects source_supported backed only by internal_engineering", () => {
    const sources: ResearchSource[] = [
      {
        sourceId: "SRC-TC-ENGINE-001",
        title: "engine",
        sourceType: "internal_engineering",
        allowedUsage: ["runtime_comparison"],
        prohibitedUsage: ["claim_as_classical_doctrine"],
      },
    ];
    const claim: ResearchClaim = {
      claimId: "CLM-TC-BAD-001",
      school: "trung-chau",
      summary: "Pretend classical claim",
      sourceRefs: ["SRC-TC-ENGINE-001"],
      status: "source_supported",
    };
    const issues = assertDoctrineClaimNotEngineeringOnly(claim, sources);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]!.message).toMatch(/non-internal_engineering/);
  });
});
