import { describe, expect, it } from "vitest";
import { KRIPPENDORFF_DISTANCE, krippendorffAlphaOrdinal } from "../calibration/krippendorff";
import { SPLIT_SEED, assignCaseSplit } from "../calibration/split-v2";
import {
  honestDoctrineCoverage,
  loadDoctrinePack,
  verifiedPrimaryRequiresExactLocator,
} from "../doctrine/loader";
import { validateExpertReviews } from "../calibration/validate-reviews";
import {
  assessBenchmarkReadiness,
  assertSplitIsByCompleteChart,
  stage3Decision,
} from "../calibration/readiness";
import {
  comparisonGraphConnectivity,
  pairwiseAgreement,
  pairwiseConsensus,
  withinChartRankAgreement,
} from "../calibration/pairwise";
import type { ExpertPairwiseReview } from "../calibration/benchmark-v2-types";
import {
  loadAdjudicationsV2,
  loadBenchmarkCasesV2,
  reliabilityBySchool,
  reviewedCaseSchoolKeys,
} from "../calibration/reviews-v2";

describe("palace overview stage 3", () => {
  it("refuses VERIFIED_PRIMARY without an exact locator", () => {
    expect(verifiedPrimaryRequiresExactLocator()).toEqual([]);
    const pack = loadDoctrinePack();
    const sources = (
      pack.sourceRegistry as { sources: Array<{ adjudication: string; locatorType: string }> }
    ).sources;
    for (const s of sources) {
      if (s.adjudication === "VERIFIED_PRIMARY") {
        expect(["EXACT_SECTION", "EXACT_LINE_OR_PARAGRAPH", "PAGE"]).toContain(s.locatorType);
      }
    }
  });

  it("ingests juan-er headings for all twelve palaces and reports honest coverage", () => {
    const map = loadDoctrinePack().juanErMap as { palaces: Array<{ canonical: string }> };
    expect(map.palaces).toHaveLength(12);
    const cov = honestDoctrineCoverage();
    expect(Object.keys(cov.byPalace)).toHaveLength(12);
    expect(cov.cartesianCells).toBe(168);
    expect(cov.uniqueClaimedPairs).toBeLessThan(168);
    expect(cov.unknownPairs).toBe(cov.cartesianCells - cov.uniqueClaimedPairs);
    expect(cov.directPrimaryClaims).toBeGreaterThan(12);
    expect(cov.conditionalPrimaryClaims).toBeGreaterThan(0);
    expect(cov.schoolSpecificClaims).toBe(0);
  });

  it("marks Zhongzhou sixty-system catalog as RESEARCH_BLOCKED_SOURCE", () => {
    const sys = loadDoctrinePack().starSystems as { sixtySystemCatalog: string };
    expect(sys.sixtySystemCatalog).toBe("RESEARCH_BLOCKED_SOURCE");
    const vcd = loadDoctrinePack().vcdPolicy as {
      schools: { "nam-phai": { status?: string } };
    };
    expect(vcd.schools["nam-phai"].status).toBe("UNRESOLVED_NAM_PHAI_VCD");
  });

  it("validates an empty review file and does not invent experts", () => {
    expect(validateExpertReviews()).toEqual([]);
    expect(loadAdjudicationsV2()).toEqual([]);
    const r = assessBenchmarkReadiness();
    expect(r.ready).toBe(false);
    expect(r.multiReviewerCaseSchoolCount).toBe(0);
    expect(r.reviewedCaseSchoolCount["nam-phai"]).toBe(0);
    expect(r.reviewedCaseSchoolCount["trung-chau"]).toBe(0);
    expect(r.krippendorffAlpha).toBeNull();
    expect(reviewedCaseSchoolKeys()).toEqual([]);
    expect(reliabilityBySchool()["nam-phai"]?.support.alpha).toBeNull();
    expect(reliabilityBySchool()["trung-chau"]?.support.alpha).toBeNull();
    expect(r.missing).toContain("multiReviewerCaseSchoolCount>=5");
  });

  it("committed pilot corpus has five cases with matching SHA-256 splits", () => {
    const cases = loadBenchmarkCasesV2();
    expect(cases).toHaveLength(5);
    for (const c of cases) {
      expect(assignCaseSplit(c.caseId)).toBe(c.splitAssignment);
    }
    expect(assignCaseSplit("female-1991-09-21-dau")).toBe("calibration");
    expect(SPLIT_SEED).toBe("palace-overview-benchmark-split-v2");
    expect(assertSplitIsByCompleteChart()).toBe(true);
  });

  it("computes equal-spaced ordinal alpha fixtures", () => {
    const empty = krippendorffAlphaOrdinal([], ["low", "medium", "high"]);
    expect(empty.alpha).toBeNull();
    expect(empty.status).toBe("NOT_COMPUTABLE");
    expect(KRIPPENDORFF_DISTANCE).toContain("equal-spaced");
    expect(empty.overlapCount).toBe(0);

    const perfect = [
      ["low", "low"],
      ["medium", "medium"],
      ["high", "high"],
    ];
    expect(krippendorffAlphaOrdinal(perfect, ["low", "medium", "high"]).alpha).toBe(1);

    const opposite = [
      ["low", "high"],
      ["low", "high"],
      ["low", "high"],
    ];
    const opp = krippendorffAlphaOrdinal(opposite, ["low", "medium", "high"]);
    expect(opp.alpha).toBe(0);
    expect(opp.overlapCount).toBe(3);
    expect(opp.reviewerCount).toBe(2);

    const mixed = [
      ["low", "medium"],
      ["medium", "high"],
    ];
    const m = krippendorffAlphaOrdinal(mixed, ["low", "medium", "high"]);
    expect(m.alpha).toBeCloseTo(0.375, 8);
  });

  it("pairwise helpers do not infer comparisons from ordinals", () => {
    const a: ExpertPairwiseReview[] = [
      {
        reviewerId: "r1",
        school: "nam-phai",
        caseId: "c1",
        axis: "support",
        leftPalace: "Mệnh",
        rightPalace: "Quan Lộc",
        result: "LEFT",
      },
    ];
    const b: ExpertPairwiseReview[] = [
      {
        reviewerId: "r2",
        school: "nam-phai",
        caseId: "c1",
        axis: "support",
        leftPalace: "Mệnh",
        rightPalace: "Quan Lộc",
        result: "LEFT",
      },
    ];
    expect(pairwiseAgreement(a, b).rate).toBe(1);
    expect(pairwiseConsensus([...a, ...b]).unanimous).toBe(1);
    expect(comparisonGraphConnectivity(a).components).toBe(1);
    expect(
      withinChartRankAgreement(
        [
          { palaceName: "Mệnh", value: "high" },
          { palaceName: "Quan Lộc", value: "low" },
        ],
        [
          { palaceName: "Mệnh", value: "medium" },
          { palaceName: "Quan Lộc", value: "low" },
        ],
      ).rate,
    ).toBe(1);
  });

  it("stage-3 research decision is collection-ready, not a release", () => {
    const d = stage3Decision(true);
    expect(d.research).toBe("READY_FOR_EXPERT_DATA_COLLECTION");
    expect(d.collection).toBe("READY");
    expect(d.calibration).toBe("NO_GO");
    expect(d.shadow).toBe("NO_GO");
    expect(d.production).toBe("NO_GO");
  });
});
