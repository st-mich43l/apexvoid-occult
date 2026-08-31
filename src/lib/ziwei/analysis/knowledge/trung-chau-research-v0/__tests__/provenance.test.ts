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

  it("bibliographic catalog entry cannot alone support doctrine claims", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const biblio = loaded.pack.sourceRegistry.sources.find(
      (s) => s.sourceId === "SRC-TC-BIBLIO-PRIMARY-LECTURE",
    );
    expect(biblio?.allowedUsage).not.toContain("claim_support");

    const supported = loaded.pack.sourceRegistry.claims.filter(
      (c) => c.status === "source_supported",
    );
    for (const claim of supported) {
      expect(claim.sourceRefs).not.toEqual(["SRC-TC-BIBLIO-PRIMARY-LECTURE"]);
    }
  });

  it("runtime↔source mismatches use runtime_vs_source contradiction type", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const ctr2 = loaded.pack.contradictions.contradictions.find(
      (c) => c.contradictionId === "CTR-TC-002",
    );
    expect(ctr2?.contradictionType).toBe("runtime_vs_source");
  });

  it("temporal doctrine layers are not collapsed", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const ids = new Set(loaded.pack.doctrineMatrix.rows.map((r) => r.policyId));
    expect(ids.has("POL-TC-TIEU-HAN-EXISTENCE")).toBe(true);
    expect(ids.has("POL-TC-FLOW-YEAR-MENH")).toBe(true);
    expect(ids.has("POL-TC-DOU-JUN-MONTHLY")).toBe(true);
    expect(ids.has("POL-TC-TIEU-HAN-GEOMETRY")).toBe(true);
    expect(ids.has("POL-TC-MONTHLY-CALENDAR-IDENTITY")).toBe(true);
    expect(ids.has("POL-TC-FLOWBASE-MODES")).toBe(true);
  });

  it("published-work bibliographic identity is separated from reproduction", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const biblio = loaded.pack.sourceRegistry.sources.find(
      (s) => s.sourceId === "SRC-TC-BIBLIO-ANXING-001",
    );
    const repro = loaded.pack.sourceRegistry.sources.find(
      (s) => s.sourceId === "SRC-TC-REPRO-ANXING-001",
    );
    expect(biblio?.sourceAuthorityRole).toBe("bibliographic_identity");
    expect(repro?.sourceAuthorityRole).toBe("published_work_reproduction");
    expect(repro?.bibliographicIdentityRef).toBe("SRC-TC-BIBLIO-ANXING-001");
    expect(biblio?.isbn).toBe("9787309096651");
  });

  it("CTR-TC-004 records legacy FlowMonth metadata debt", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const ctr = loaded.pack.contradictions.contradictions.find(
      (c) => c.contradictionId === "CTR-TC-004",
    );
    expect(ctr?.contradictionType).toBe("runtime_vs_contract_and_source");
    expect(ctr?.status).toBe("open");
    expect(ctr?.resolution).toBeNull();
    expect(ctr?.description).toMatch(/PR #263/);

    const rq = loaded.pack.sourceRegistry.researchQueue.find(
      (r) => r.researchId === "RQ-TC-012",
    );
    expect(rq?.status).toBe("partially_resolved");
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
