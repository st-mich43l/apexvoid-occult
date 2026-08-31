import { describe, expect, it } from "vitest";
import { TRUNG_CHAU_TU_HOA } from "@/lib/ziwei/schools/trung-chau-policy";
import { getTuHoaTargets } from "@/lib/ziwei/calculation/shared-mutagens";
import type { TuHoaTable } from "@/lib/ziwei/schools/policy-types";
import {
  loadTrungChauResearchPackV0,
  resetTrungChauResearchPackCache,
} from "../index";
import {
  CANDIDATE_TU_HOA,
  candidateCellDifferences,
  computeImpactSummary,
} from "../impact-compare";

function khoaStar(table: TuHoaTable, stem: string): string {
  return getTuHoaTargets(table, stem).find((t) => t.mutagen === "Khoa")?.starName ?? "";
}

describe("trung-chau-research-v0 ERQ-005 candidate impact (V0.3)", () => {
  it("candidate table differs only on Mậu and Nhâm Khoa", () => {
    expect(candidateCellDifferences()).toHaveLength(2);
    expect(khoaStar(CANDIDATE_TU_HOA, "Mậu")).toBe("Thái Dương");
    expect(khoaStar(TRUNG_CHAU_TU_HOA, "Mậu")).toBe("Hữu Bật");
    expect(khoaStar(CANDIDATE_TU_HOA, "Nhâm")).toBe("Thiên Phủ");
    expect(khoaStar(TRUNG_CHAU_TU_HOA, "Nhâm")).toBe("Tả Phụ");
    expect(khoaStar(CANDIDATE_TU_HOA, "Canh")).toBe(khoaStar(TRUNG_CHAU_TU_HOA, "Canh"));
  });

  it("decision packet and impact artifact stay expert_pending / research_candidate", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    expect(loaded.pack.meta.researchStage).toBe("V0.3");
    expect(loaded.pack.erq005DecisionPacket?.status).toBe("expert_pending");
    expect(loaded.pack.erq005CandidateImpact?.runtimeAuthority).toBe(false);
    expect(loaded.pack.erq005CandidateImpact?.candidateDifferences?.length).toBe(2);
    expect(loaded.pack.tuHoaImpactAudit?.runtimeAuthority).toBe(false);
  });

  it("committed V0.3 impact summary matches recomputed golden comparison", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const { summary } = computeImpactSummary();
    const committed = loaded.pack.erq005CandidateImpact?.impactSummary as Record<
      string,
      number
    >;
    expect(committed.goldenCasesTotal).toBe(summary.goldenCasesTotal);
    expect(committed.goldenCasesWithNatalDelta).toBe(summary.goldenCasesWithNatalDelta);
    expect(committed.goldenCasesWithAnnualDelta).toBe(summary.goldenCasesWithAnnualDelta);
    expect(committed.goldenCasesWithMajorDelta).toBe(summary.goldenCasesWithMajorDelta);
    expect(committed.goldenCasesWithPhiFlowDelta).toBe(summary.goldenCasesWithPhiFlowDelta);
    expect(committed.goldenCasesWithAnyMutagenDelta).toBe(
      summary.goldenCasesWithAnyMutagenDelta,
    );
    expect(committed.monthlyRowsWithKhoaDelta).toBe(summary.monthlyRowsWithKhoaDelta);
  });

  it("documents that V0.2 count of 9 is not full blast radius", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.pack.erq005CandidateImpact?.v02ProvenanceNote).toMatch(/not full/);
    const { summary } = computeImpactSummary();
    expect(summary.directNatalTriggerCases).toBe(9);
    expect(summary.goldenCasesWithPhiFlowDelta).toBe(45);
    expect(summary.goldenCasesWithPhiFlowDelta).toBeGreaterThan(
      summary.directNatalTriggerCases,
    );
  });
});
