import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { normalizeNatalFacts, TEMPORAL_FACT_SOURCES } from "@/lib/ziwei/analysis/facts";
import type { BirthInput, ChartStar } from "@/types/chart";
import type {
  ExpertBenchmarkCase,
  ExpertReview,
  ExpertReviewer,
  PalaceExpertRating,
} from "../calibration/benchmark-v2-types";
import {
  parseReliabilityUnitId,
  reliabilityUnitId,
} from "../calibration/benchmark-v2-types";
import {
  assertReviewPackContainsStaticNatalFactsOnly,
  buildExpertReviewNatalPack,
  natalFactIdsFromPack,
} from "../calibration/review-pack";
import {
  loadCalibrationReviews,
  loadHoldoutReviews,
  multiReviewerCaseSchoolCount,
  overlappingUnitCount,
  overlappingReliabilityUnits,
  reliabilityBySchool,
} from "../calibration/reviews-v2";
import {
  comparisonGraphConnectivity,
  orientedPairwiseResult,
  uniquePairwiseCount,
  usablePairwiseCount,
} from "../calibration/pairwise";
import { classifyReliability } from "../calibration/readiness";
import { krippendorffAlphaOrdinal } from "../calibration/krippendorff";
import {
  validateAdjudications,
  validateExpertReviews,
} from "../calibration/validate-reviews";
import { assignCaseSplit } from "../calibration/split-v2";
import { assertSplitIsByCompleteChart } from "../calibration/readiness";
import { loadBenchmarkCasesV2 } from "../calibration/reviews-v2";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function unableRating(palaceName: string): PalaceExpertRating {
  return {
    palaceName,
    support: "unable-to-judge",
    pressure: "unable-to-judge",
    stability: "unable-to-judge",
    activation: "unable-to-judge",
    netQuality: "unable-to-judge",
    confidence: "medium",
  };
}

function rating(
  palaceName: string,
  support: PalaceExpertRating["support"] = "high",
): PalaceExpertRating {
  return {
    palaceName,
    support,
    pressure: "low",
    stability: "medium",
    activation: "medium",
    netQuality: "supportive",
    confidence: "high",
  };
}

function review(partial: Partial<ExpertReview> & Pick<ExpertReview, "reviewId" | "reviewerId">): ExpertReview {
  return {
    caseId: "female-1991-09-21-dau",
    school: "nam-phai",
    reviewedAt: "2026-08-14T00:00:00Z",
    blindedToEngine: true,
    rubricVersion: "2.1.0",
    assignmentId: `asg-${partial.reviewId}`,
    palaceRatings: [rating("Mệnh")],
    pairwiseComparisons: [],
    reviewerConfidence: "high",
    ...partial,
  };
}

const REVIEWERS: ExpertReviewer[] = [
  {
    id: "alice",
    schools: ["nam-phai", "trung-chau"],
    status: "active",
    addedAt: "2026-08-01T00:00:00Z",
  },
  {
    id: "bob",
    schools: ["nam-phai"],
    status: "active",
    addedAt: "2026-08-01T00:00:00Z",
  },
];

describe("review pack natal isolation", () => {
  it("projects only canonical natal facts, not raw palace star arrays", () => {
    const chart = calculateNamPhai(REGRESSION);
    const palace = chart.palaces[0]!;
    const injected: ChartStar[] = [
      { name: "Lưu Văn Xương", source: "annual" },
      { name: "Hóa Lộc", source: "annual-mutagen" },
      { name: "Hóa Quyền", source: "major-mutagen" },
      { name: "Văn Khúc", source: "monthly-flow" },
    ];
    palace.stars = [...(palace.stars ?? []), ...injected];

    const pack = buildExpertReviewNatalPack({
      caseId: "seed",
      school: "nam-phai",
      birth: REGRESSION,
      chart,
    });
    expect(TEMPORAL_FACT_SOURCES).toContain("monthly-flow");
    const leaks = assertReviewPackContainsStaticNatalFactsOnly(pack);
    expect(leaks).toEqual([]);
    const sources = pack.palaces.flatMap((p) => p.stars.map((s) => s.source));
    expect(sources).not.toContain("annual");
    expect(sources).not.toContain("annual-mutagen");
    expect(sources).not.toContain("major-mutagen");
    expect(sources).not.toContain("monthly-flow");

    const { facts } = normalizeNatalFacts(chart, { school: "nam-phai" });
    expect(natalFactIdsFromPack(pack)).toEqual(
      facts
        .filter((f) => f.kind !== "chang-sheng")
        .map((f) => f.id)
        .sort(),
    );
  });

  it("does not change when annualYear changes", () => {
    const a = calculateNamPhai({ ...REGRESSION, annualYear: "2026" });
    const b = calculateNamPhai({ ...REGRESSION, annualYear: "2027" });
    const pa = buildExpertReviewNatalPack({
      caseId: "seed",
      school: "nam-phai",
      birth: REGRESSION,
      chart: a,
    });
    const pb = buildExpertReviewNatalPack({
      caseId: "seed",
      school: "nam-phai",
      birth: { ...REGRESSION, annualYear: "2027" },
      chart: b,
    });
    expect(JSON.stringify(pa)).toEqual(JSON.stringify(pb));
  });

  it("contains no engine scores, bands, axes, drivers, reviews, or adjudications", () => {
    const chart = calculateNamPhai(REGRESSION);
    const pack = buildExpertReviewNatalPack({
      caseId: "seed",
      school: "nam-phai",
      birth: REGRESSION,
      chart,
    });
    const blob = JSON.stringify(pack);
    for (const forbidden of [
      "score",
      "band",
      "rawAxes",
      "normalizedAxes",
      "topSupportDrivers",
      "topPressureDrivers",
      "adjudication",
      "palaceRatings",
    ]) {
      expect(blob.includes(`"${forbidden}"`)).toBe(false);
    }
    expect(pack.blindedToEngine).toBe(true);
  });

  it("represents natal transformations once and Tuần/Triệt as void markers", () => {
    const chart = calculateNamPhai(REGRESSION);
    const pack = buildExpertReviewNatalPack({
      caseId: "seed",
      school: "nam-phai",
      birth: REGRESSION,
      chart,
    });
    const ids = pack.natalTransformations.map((t) => t.factId);
    expect(ids).toHaveLength(new Set(ids).size);
    expect(pack.natalTransformations).toHaveLength(4);
    expect(pack.voidMarkers.some((v) => v.voidType === "Tuần" || v.voidType === "Triệt")).toBe(
      true,
    );
  });

  it("is deterministic and valid for both schools", () => {
    for (const [school, calculate] of [
      ["nam-phai", calculateNamPhai],
      ["trung-chau", calculateTrungChau],
    ] as const) {
      const chart = calculate(REGRESSION);
      const pack = buildExpertReviewNatalPack({
        caseId: "seed",
        school,
        birth: REGRESSION,
        chart,
      });
      expect(assertReviewPackContainsStaticNatalFactsOnly(pack)).toEqual([]);
      const again = buildExpertReviewNatalPack({
        caseId: "seed",
        school,
        birth: REGRESSION,
        chart,
      });
      expect(JSON.stringify(pack)).toEqual(JSON.stringify(again));
    }
  });
});

describe("multi-reviewer overlap", () => {
  it("does not count disjoint palace ratings as overlap", () => {
    const reviews = [
      review({ reviewId: "r1", reviewerId: "alice", palaceRatings: [rating("Mệnh")] }),
      review({ reviewId: "r2", reviewerId: "bob", palaceRatings: [rating("Quan Lộc")] }),
    ];
    expect(overlappingUnitCount(reviews, "female-1991-09-21-dau", "nam-phai")).toBe(0);
    expect(multiReviewerCaseSchoolCount(reviews, 3)).toBe(0);
    expect(overlappingReliabilityUnits(reviews)).toHaveLength(0);
  });

  it("counts the same palace+axis from two reviewers as one overlapping unit", () => {
    const reviews = [
      review({ reviewId: "r1", reviewerId: "alice", palaceRatings: [rating("Mệnh")] }),
      review({ reviewId: "r2", reviewerId: "bob", palaceRatings: [rating("Mệnh")] }),
    ];
    expect(overlappingReliabilityUnits(reviews).some((u) => u.palaceName === "Mệnh" && u.axis === "support")).toBe(
      true,
    );
    expect(overlappingUnitCount(reviews, "female-1991-09-21-dau", "nam-phai")).toBeGreaterThanOrEqual(
      1,
    );
    expect(multiReviewerCaseSchoolCount(reviews, 3)).toBe(1);
  });
});

describe("reliability by school", () => {
  it("does not mix Nam Phái and Trung Châu ratings", () => {
    const reviews = [
      review({
        reviewId: "n1",
        reviewerId: "alice",
        school: "nam-phai",
        palaceRatings: [rating("Mệnh", "high")],
      }),
      review({
        reviewId: "n2",
        reviewerId: "bob",
        school: "nam-phai",
        palaceRatings: [rating("Mệnh", "high")],
      }),
      review({
        reviewId: "t1",
        reviewerId: "alice",
        school: "trung-chau",
        palaceRatings: [rating("Mệnh", "high")],
      }),
      review({
        reviewId: "t2",
        reviewerId: "carol",
        school: "trung-chau",
        palaceRatings: [rating("Mệnh", "low")],
      }),
    ];
    const bySchool = reliabilityBySchool(reviews);
    expect(bySchool["nam-phai"]!.support.alpha).toBe(1);
    expect(bySchool["trung-chau"]!.support.alpha).not.toBe(1);
    expect(bySchool["trung-chau"]!.support.alpha).not.toBeNull();
  });
});

describe("krippendorff fixtures", () => {
  it("returns 1 for perfect agreement, null with no overlap, and treats unable as missing", () => {
    expect(
      krippendorffAlphaOrdinal(
        [
          ["low", "low"],
          ["medium", "medium"],
        ],
        ["low", "medium", "high"],
      ).alpha,
    ).toBe(1);
    expect(krippendorffAlphaOrdinal([["low", null]], ["low", "medium", "high"]).status).toBe(
      "NOT_COMPUTABLE",
    );
    const partial = krippendorffAlphaOrdinal(
      [
        ["low", "low", "low"],
        ["medium", null, "medium"],
        [null, "high", "high"],
      ],
      ["low", "medium", "high"],
    );
    expect(partial.alpha).not.toBeNull();
    expect(partial.reviewerCount).toBe(3);
  });

  it("encodes reliability units as JSON arrays so delimiters cannot collide", () => {
    const a = reliabilityUnitId("case:with:colons", "nam-phai", "Mệnh", "support");
    const b = reliabilityUnitId("case", "with:colons", "nam-phai", "Mệnh");
    expect(a).not.toBe(b);
    expect(parseReliabilityUnitId(a)).toEqual({
      caseId: "case:with:colons",
      school: "nam-phai",
      palaceName: "Mệnh",
      axis: "support",
    });
  });
});

describe("pairwise integrity", () => {
  it("counts only LEFT/RIGHT/TIE as usable", () => {
    const rows = [
      {
        reviewerId: "alice",
        school: "nam-phai" as const,
        caseId: "c1",
        axis: "support" as const,
        leftPalace: "Mệnh",
        rightPalace: "Quan Lộc",
        result: "LEFT" as const,
      },
      {
        reviewerId: "alice",
        school: "nam-phai" as const,
        caseId: "c1",
        axis: "support" as const,
        leftPalace: "Tài Bạch",
        rightPalace: "Tật Ách",
        result: "TIE" as const,
      },
      {
        reviewerId: "alice",
        school: "nam-phai" as const,
        caseId: "c1",
        axis: "support" as const,
        leftPalace: "Phúc Đức",
        rightPalace: "Phụ Mẫu",
        result: "UNABLE_TO_JUDGE" as const,
      },
    ];
    expect(usablePairwiseCount(rows)).toBe(2);
    expect(uniquePairwiseCount(rows)).toBe(2);
  });

  it("treats reversed palace order as the same unique pair", () => {
    const rows = [
      {
        reviewerId: "alice",
        school: "nam-phai" as const,
        caseId: "c1",
        axis: "support" as const,
        leftPalace: "Mệnh",
        rightPalace: "Quan Lộc",
        result: "LEFT" as const,
      },
      {
        reviewerId: "bob",
        school: "nam-phai" as const,
        caseId: "c1",
        axis: "support" as const,
        leftPalace: "Quan Lộc",
        rightPalace: "Mệnh",
        result: "RIGHT" as const,
      },
    ];
    expect(uniquePairwiseCount(rows)).toBe(1);
    expect(orientedPairwiseResult(rows[0]!)).toBe("LEFT");
    expect(orientedPairwiseResult(rows[1]!)).toBe("LEFT");
    expect(classifyReliability(null)).toBe("NOT_COMPUTABLE");
    expect(classifyReliability(0.7)).toBe("COMPUTABLE_STRONG");
    const g = comparisonGraphConnectivity(rows);
    expect(g.nodes).toBe(2);
    expect(g.edges).toBe(1);
  });
});

describe("raw review validation", () => {
  it("rejects unknown reviewer, wrong school, empty review, duplicates, and self pairs", () => {
    expect(
      validateExpertReviews(
        [review({ reviewId: "x", reviewerId: "ghost" })],
        REVIEWERS,
      ).some((e) => e.includes("unknown reviewerId")),
    ).toBe(true);

    expect(
      validateExpertReviews(
        [review({ reviewId: "x", reviewerId: "bob", school: "trung-chau" })],
        REVIEWERS,
      ).some((e) => e.includes("not approved")),
    ).toBe(true);

    expect(
      validateExpertReviews(
        [
          review({
            reviewId: "empty",
            reviewerId: "alice",
            palaceRatings: [unableRating("Mệnh")],
            pairwiseComparisons: [
              {
                reviewerId: "alice",
                school: "nam-phai",
                caseId: "female-1991-09-21-dau",
                axis: "support",
                leftPalace: "Mệnh",
                rightPalace: "Quan Lộc",
                result: "UNABLE_TO_JUDGE",
              },
            ],
          }),
        ],
        REVIEWERS,
      ).some((e) => e.includes("no usable")),
    ).toBe(true);

    expect(
      validateExpertReviews(
        [
          review({
            reviewId: "dup-palace",
            reviewerId: "alice",
            palaceRatings: [rating("Quan Lộc"), rating("Quan Lộc")],
          }),
        ],
        REVIEWERS,
      ).some((e) => e.includes("duplicate palace")),
    ).toBe(true);

    expect(
      validateExpertReviews(
        [
          review({
            reviewId: "self",
            reviewerId: "alice",
            pairwiseComparisons: [
              {
                reviewerId: "alice",
                school: "nam-phai",
                caseId: "female-1991-09-21-dau",
                axis: "support",
                leftPalace: "Mệnh",
                rightPalace: "Mệnh",
                result: "LEFT",
              },
            ],
          }),
        ],
        REVIEWERS,
      ).some((e) => e.includes("self pairwise")),
    ).toBe(true);

    expect(
      validateExpertReviews(
        [
          review({
            reviewId: "dup-pair",
            reviewerId: "alice",
            pairwiseComparisons: [
              {
                reviewerId: "alice",
                school: "nam-phai",
                caseId: "female-1991-09-21-dau",
                axis: "support",
                leftPalace: "Mệnh",
                rightPalace: "Quan Lộc",
                result: "LEFT",
              },
              {
                reviewerId: "alice",
                school: "nam-phai",
                caseId: "female-1991-09-21-dau",
                axis: "support",
                leftPalace: "Quan Lộc",
                rightPalace: "Mệnh",
                result: "RIGHT",
              },
            ],
          }),
        ],
        REVIEWERS,
      ).some((e) => e.includes("duplicate logical pairwise")),
    ).toBe(true);
  });

  it("rejects adjudications that do not cite reviewers who reviewed that case-school", () => {
    const errors = validateAdjudications(
      [
        {
          caseId: "female-1991-09-21-dau",
          school: "nam-phai",
          palaceName: "Mệnh",
          axis: "support",
          reviewerIds: ["alice"],
          decision: "high",
          adjudicator: "bob",
          rationale: " ",
          sourceReferences: [],
        },
      ],
      [],
      REVIEWERS,
    );
    expect(errors.some((e) => e.includes("empty rationale"))).toBe(true);
    expect(errors.some((e) => e.includes("did not review"))).toBe(true);
  });
});

describe("split and holdout access", () => {
  it("keeps SHA-256 whole-case assignment with no calibration/holdout overlap", () => {
    expect(assertSplitIsByCompleteChart()).toBe(true);
    const cases = loadBenchmarkCasesV2();
    for (const c of cases) {
      expect(assignCaseSplit(c.caseId)).toBe(c.splitAssignment);
    }
  });

  it("does not return holdout reviews from the calibration accessor", () => {
    const cases: ExpertBenchmarkCase[] = [
      {
        caseId: "cal-case",
        input: REGRESSION,
        eligibleSchools: ["nam-phai"],
        cohortTags: [],
        createdAt: "2026-01-01T00:00:00Z",
        splitAssignment: "calibration",
        splitVersion: "v2",
      },
      {
        caseId: "hold-case",
        input: REGRESSION,
        eligibleSchools: ["nam-phai"],
        cohortTags: [],
        createdAt: "2026-01-01T00:00:00Z",
        splitAssignment: "holdout",
        splitVersion: "v2",
      },
    ];
    const reviews = [
      review({ reviewId: "c", reviewerId: "alice", caseId: "cal-case" }),
      review({ reviewId: "h", reviewerId: "alice", caseId: "hold-case" }),
    ];
    expect(loadCalibrationReviews(reviews, cases).map((r) => r.reviewId)).toEqual(["c"]);
    expect(loadHoldoutReviews(reviews, cases).map((r) => r.reviewId)).toEqual(["h"]);
  });
});
