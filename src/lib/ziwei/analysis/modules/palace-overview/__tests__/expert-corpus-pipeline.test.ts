import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { assignCaseSplit } from "../calibration/split-v2";
import { loadCalibrationReviews, loadHoldoutReviews } from "../calibration/reviews-v2";
import { pairwiseLogicalKey } from "../calibration/benchmark-v2-types";
import { buildExpertReviewNatalPack } from "../calibration/review-pack";
import { BENCHMARK_TEMPORAL_SENTINEL, natalFromBirthInput, toBirthInput, type NatalBenchmarkInput } from "../research/natal-input";
import {
  fingerprintHash,
  fingerprintNatalCase,
  syntheticCaseId,
} from "../research/case-fingerprint";
import { classifyCohorts } from "../research/cohort-classifier";
import {
  DISCOVERY_VERSION,
  discoverCandidates,
  duplicateFingerprintGroups,
  greedySelect,
  type DiscoveryConfig,
} from "../research/case-discovery";
import { countCohorts, fingerprintsForCases } from "../research/corpus-coverage";
import { promoteCandidate, validateCandidate } from "../research/case-promotion";
import { assignPairwiseComparisons } from "../research/pairwise-assignment";
import { planPilotAssignments, validateAssignments } from "../research/review-assignment";
import { renderReviewFormHtml, reviewFormMustNotContainEngineOutput } from "../research/review-form";
import { ingestReviewPayload } from "../research/ingest-review";
import { researchModuleImportLeaks } from "../research/leak-guard";
import { corpusDecision } from "../research/corpus-decision";
import {
  eligibleSchoolsForReview,
  schoolEligibilityForFingerprint,
} from "../research/school-eligibility";
import type { ExpertBenchmarkCase } from "../calibration/benchmark-v2-types";

const FIXTURE: DiscoveryConfig = {
  discoveryVersion: DISCOVERY_VERSION,
  fromDate: "1980-01-03",
  toDate: "1980-01-10",
  stepDays: 7,
  hours: ["Tý", "Ngọ"],
  genders: ["female"],
  timezone: "7",
  fingerprintSchool: "nam-phai",
  maxCandidates: 8,
};

const SEED: NatalBenchmarkInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
};

describe("corpus discovery integrity", () => {
  it("is deterministic", () => {
    const a = discoverCandidates(FIXTURE);
    const b = discoverCandidates(FIXTURE);
    expect(a.map((c) => c.candidateId)).toEqual(b.map((c) => c.candidateId));
    expect(a.map((c) => c.fingerprintHash)).toEqual(b.map((c) => c.fingerprintHash));
    expect(a.map((c) => c.cohortTags)).toEqual(b.map((c) => c.cohortTags));
  });

  it("does not import Palace Overview scoring", () => {
    expect(researchModuleImportLeaks()).toEqual([]);
  });

  it("keeps fingerprints stable across annualYear", () => {
    const fpA = fingerprintNatalCase(SEED, "nam-phai");
    const birthB = { ...toBirthInput(SEED), annualYear: "2027" };
    const natalB = natalFromBirthInput(birthB);
    const fpB = fingerprintNatalCase(natalB, "nam-phai");
    expect(fingerprintHash(fpA)).toBe(fingerprintHash(fpB));
    expect(classifyCohorts(fpA)).toEqual(classifyCohorts(fpB));
  });

  it("hashes the same fingerprint twice and changes when natal structure changes", () => {
    const fp = fingerprintNatalCase(SEED, "nam-phai");
    expect(fingerprintHash(fp)).toBe(fingerprintHash(fingerprintNatalCase(SEED, "nam-phai")));
    const other = fingerprintNatalCase(
      { solarDate: "1975-03-08", birthHour: "Tý", gender: "male", timezone: "7" },
      "nam-phai",
    );
    expect(fingerprintHash(fp)).not.toBe(fingerprintHash(other));
  });

  it("reports exact duplicate fingerprints", () => {
    const c = discoverCandidates(FIXTURE)[0]!;
    expect(duplicateFingerprintGroups([c, { ...c, candidateId: "dup" }])).toEqual([
      [c.candidateId, "dup"],
    ]);
  });
});

describe("promotion and coverage", () => {
  it("promotes with deterministic split and valid natal calculation", () => {
    const candidate = discoverCandidates(FIXTURE)[0]!;
    expect(validateCandidate(candidate)).toEqual([]);
    const promoted = promoteCandidate(candidate, "2026-08-14T00:00:00Z");
    expect(promoted.splitAssignment).toBe(assignCaseSplit(promoted.caseId));
    expect(promoted.caseId.startsWith("case-")).toBe(true);
  });

  it("counts committed case cohorts", () => {
    const cases: ExpertBenchmarkCase[] = [
      {
        caseId: "a",
        input: toBirthInput(SEED),
        eligibleSchools: ["nam-phai"],
        cohortTags: ["vcd", "tuan"],
        createdAt: "2026-08-14T00:00:00Z",
        splitAssignment: "calibration",
        splitVersion: "v2",
      },
    ];
    expect(countCohorts(cases).vcd).toBe(1);
    expect(countCohorts(cases).tuan).toBe(1);
    expect(fingerprintsForCases(cases)[0]?.fingerprint.school).toBe("nam-phai");
  });
});

describe("assignments and pairwise", () => {
  it("rejects reviewer/school mismatches", () => {
    const errors = validateAssignments(
      [
        {
          assignmentId: "x",
          reviewerId: "ghost",
          caseId: "c1",
          school: "nam-phai",
          purpose: "pilot",
          status: "assigned",
          createdAt: "2026-08-14T00:00:00Z",
        },
      ],
      [],
      new Set(["c1"]),
      new Map([["c1", ["nam-phai"]]]),
    );
    expect(errors.some((e) => e.includes("unknown reviewer"))).toBe(true);
  });

  it("plans nothing when no reviewers exist", () => {
    expect(planPilotAssignments([], [], "2026-08-14T00:00:00Z")).toEqual([]);
  });

  it("assigns compact deterministic pairs without self or duplicate logical pairs", () => {
    const a = assignPairwiseComparisons({
      caseId: "c1",
      school: "nam-phai",
      reviewerId: "r1",
      rubricVersion: "2.1.0",
    });
    const b = assignPairwiseComparisons({
      caseId: "c1",
      school: "nam-phai",
      reviewerId: "r1",
      rubricVersion: "2.1.0",
    });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(5);
    expect(a.length).toBeLessThanOrEqual(12);
    const keys = a.map((p) =>
      pairwiseLogicalKey("c1", "nam-phai", p.axis, p.leftPalace, p.rightPalace),
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(a.some((p) => p.leftPalace === p.rightPalace)).toBe(false);
  });
});

describe("review form and ingest", () => {
  it("renders a blinded form", () => {
    const chart = calculateNamPhai(toBirthInput(SEED));
    const pack = buildExpertReviewNatalPack({
      caseId: "female-1991-09-21-dau",
      school: "nam-phai",
      birth: toBirthInput(SEED),
      chart,
    });
    const html = renderReviewFormHtml({
      pack,
      assignment: {
        assignmentId: "asg-1",
        reviewerId: "reviewer-test",
        caseId: pack.caseId,
        school: "nam-phai",
        purpose: "pilot",
        status: "assigned",
        createdAt: "2026-08-14T00:00:00Z",
      },
      pairwise: assignPairwiseComparisons({
        caseId: pack.caseId,
        school: "nam-phai",
        reviewerId: "reviewer-test",
        rubricVersion: "2.1.0",
      }),
    });
    expect(reviewFormMustNotContainEngineOutput(html)).toEqual([]);
    expect(html).toContain("RESEARCH ONLY");
    expect(html).toContain("Mệnh");
  });

  it("rejects ingest without a registered reviewer", () => {
    const result = ingestReviewPayload({
      reviewId: "new-1",
      assignmentId: "asg-missing",
      caseId: "female-1991-09-21-dau",
      reviewerId: "nobody",
      school: "nam-phai",
      reviewedAt: "2026-08-14T00:00:00Z",
      blindedToEngine: true,
      rubricVersion: "2.1.0",
      palaceRatings: [
        {
          palaceName: "Mệnh",
          support: "high",
          pressure: "low",
          stability: "medium",
          activation: "medium",
          netQuality: "supportive",
          confidence: "high",
        },
      ],
      pairwiseComparisons: [],
    });
    expect(result.ok).toBe(false);
  });
});

describe("corpus decision and holdout", () => {
  it("is PILOT_READY at five cases with zero reviews", () => {
    const cases = Array.from({ length: 5 }, (_, i) => ({
      caseId: `c${i}`,
      input: toBirthInput(SEED),
      eligibleSchools: ["nam-phai" as const],
      cohortTags: [],
      createdAt: "2026-08-14T00:00:00Z",
      splitAssignment: "calibration" as const,
      splitVersion: "v2",
    }));
    expect(corpusDecision({ cases, reviews: [], reviewers: [], pilotAccepted: false })).toBe(
      "PILOT_READY",
    );
    expect(corpusDecision({ cases: cases.slice(0, 1), reviews: [], reviewers: [], pilotAccepted: false })).toBe(
      "BUILDING",
    );
  });

  it("keeps calibration/holdout accessors separate", () => {
    expect(loadCalibrationReviews().every((r) => r.caseId)).toBe(true);
    expect(loadHoldoutReviews()).toEqual([]);
  });

  it("marks Nam Phái VCD as research-only", () => {
    const fp = fingerprintNatalCase(SEED, "nam-phai");
    const rows = schoolEligibilityForFingerprint(fp);
    if (fp.vcdPalaces.length) {
      expect(rows.find((r) => r.school === "nam-phai")?.reviewEligibility).toBe("research-only");
      expect(eligibleSchoolsForReview(rows)).toContain("trung-chau");
    }
  });
});

describe("greedy coverage", () => {
  it("selects without using scores", () => {
    const pool = discoverCandidates(FIXTURE);
    const picked = greedySelect(pool, 2);
    expect(picked).toHaveLength(Math.min(2, pool.length));
    expect(picked[0]?.whyCandidateSelected.length).toBeGreaterThan(0);
    expect(toBirthInput(SEED).annualYear).toBe(BENCHMARK_TEMPORAL_SENTINEL.annualYear);
    expect(syntheticCaseId(SEED)).toMatch(/^case-[a-f0-9]{12}$/);
  });
});
