import { describe, expect, it } from "vitest";
import {
  assertDoctrineClaimNotEngineeringOnly,
  loadTrungChauResearchPackV0,
  resetTrungChauResearchPackCache,
  validateTrungChauResearchPackV0,
  type ResearchClaim,
} from "../index";

describe("trung-chau-research-v0 provenance rules", () => {
  it("pack claims never mark doctrine support from engineering alone", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const sources = loaded.pack.sourceRegistry.sources;
    for (const claim of loaded.pack.sourceRegistry.claims) {
      if (
        claim.status === "source_supported" ||
        claim.status === "source_conflicted" ||
        claim.status === "expert_pending"
      ) {
        const issues = assertDoctrineClaimNotEngineeringOnly(claim, sources);
        expect(issues).toEqual([]);
      }
    }
  });

  it("validator fails closed when a matrix claims fake source support", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const broken = structuredClone(loaded.pack);
    const badClaim: ResearchClaim = {
      claimId: "CLM-TC-FAKE-001",
      school: "trung-chau",
      summary: "Fake supported claim",
      sourceRefs: ["SRC-TC-ENGINE-001"],
      status: "source_supported",
    };
    broken.sourceRegistry.claims.push(badClaim);
    const result = validateTrungChauResearchPackV0(broken);
    expect(result.ok).toBe(false);
  });
});
