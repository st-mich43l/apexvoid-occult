import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import {
  AXIS_ORDINAL_VALUES,
  NET_QUALITY_VALUES,
  PAIRWISE_RESULT_VALUES,
} from "../calibration/benchmark-v2-types";
import type { ExpertReview, ExpertReviewer } from "../calibration/benchmark-v2-types";
import { buildExpertReviewNatalPack } from "../calibration/review-pack";
import { loadBenchmarkCasesV2 } from "../calibration/reviews-v2";
import { ingestReviewPayload } from "../research/ingest-review";
import {
  assembleExportedReview,
  derivedReviewId,
  renderReviewFormHtml,
  reviewFormMustNotContainEngineOutput,
  reviewFormMustNotFabricateConfidence,
} from "../research/review-form";
import { assignPairwiseComparisons } from "../research/pairwise-assignment";
import {
  canTransitionAssignment,
  planPilotAssignments,
  resolveActiveReviewer,
  selectAssignedForReviewer,
  type ExpertReviewAssignment,
} from "../research/review-assignment";
import { toBirthInput } from "../research/natal-input";
import { corpusDecision } from "../research/corpus-decision";

const REVIEWERS: ExpertReviewer[] = [
  {
    id: "alice",
    schools: ["nam-phai", "trung-chau"],
    status: "active",
    addedAt: "2026-08-14T00:00:00Z",
  },
  {
    id: "bob",
    schools: ["nam-phai", "trung-chau"],
    status: "active",
    addedAt: "2026-08-14T00:00:00Z",
  },
  {
    id: "inactive",
    schools: ["nam-phai"],
    status: "inactive",
    addedAt: "2026-08-14T00:00:00Z",
  },
];

const SEED = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
};

function assignment(partial: Partial<ExpertReviewAssignment> & Pick<ExpertReviewAssignment, "assignmentId">): ExpertReviewAssignment {
  return {
    reviewerId: "alice",
    caseId: "female-1991-09-21-dau",
    school: "trung-chau",
    purpose: "pilot",
    status: "assigned",
    authority: "calibration",
    createdAt: "2026-08-14T00:00:00Z",
    ...partial,
  };
}

function usableReview(asg: ExpertReviewAssignment): ExpertReview {
  return {
    reviewId: derivedReviewId(asg.assignmentId),
    assignmentId: asg.assignmentId,
    caseId: asg.caseId,
    reviewerId: asg.reviewerId,
    school: asg.school,
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
  };
}

describe("rubric contract", () => {
  it("matches REVIEW-RUBRIC.md and does not use unknown", () => {
    const md = readFileSync(
      "src/lib/ziwei/analysis/knowledge/palace-overview/v1/benchmark/REVIEW-RUBRIC.md",
      "utf8",
    );
    expect(md).toContain(AXIS_ORDINAL_VALUES.join(" | "));
    expect(md).toContain(NET_QUALITY_VALUES.join(" | "));
    expect(md).toContain(PAIRWISE_RESULT_VALUES.join(" | "));
    expect(md).toContain("Do not use `unknown`.");
    expect(md).not.toMatch(/mark .*disputed/);
  });
});

describe("reviewer and assignment authority", () => {
  it("rejects unknown and inactive reviewers", () => {
    expect(resolveActiveReviewer("ghost", REVIEWERS).ok).toBe(false);
    expect(resolveActiveReviewer("inactive", REVIEWERS).ok).toBe(false);
    expect(resolveActiveReviewer("alice", REVIEWERS).ok).toBe(true);
  });

  it("does not give an unassigned reviewer every case", () => {
    expect(selectAssignedForReviewer("alice", [])).toEqual([]);
  });

  it("returns only the reviewer's assigned case-schools", () => {
    const asgs = [
      assignment({ assignmentId: "a1", caseId: "case-b89009044b5d", school: "trung-chau" }),
      assignment({ assignmentId: "a2", caseId: "case-2fc75a13ce4c", school: "nam-phai", reviewerId: "alice" }),
      assignment({ assignmentId: "a3", reviewerId: "bob", caseId: "female-1991-09-21-dau" }),
    ];
    const mine = selectAssignedForReviewer("alice", asgs);
    expect(mine.map((a) => a.assignmentId)).toEqual(["a1", "a2"]);
  });

  it("plans bounded overlap and marks Nam Phái VCD research-only", () => {
    const planned = planPilotAssignments(REVIEWERS, loadBenchmarkCasesV2(), "2026-08-14T00:00:00Z");
    expect(planned.length).toBeGreaterThan(0);
    expect(planned.filter((a) => a.purpose === "overlap").length).toBeGreaterThanOrEqual(2);
    for (const a of planned) {
      if (a.school === "nam-phai") {
        const rec = loadBenchmarkCasesV2().find((c) => c.caseId === a.caseId);
        if (rec?.cohortTags.includes("vcd")) {
          expect(a.authority).toBe("research-only");
        }
      }
    }
  });
});

describe("form export and confidence", () => {
  it("uses canonical assignmentId and does not fabricate confidence", () => {
    const chart = calculateNamPhai(toBirthInput(SEED));
    const pack = buildExpertReviewNatalPack({
      caseId: "female-1991-09-21-dau",
      school: "trung-chau",
      birth: toBirthInput(SEED),
      chart,
    });
    const asg = assignment({ assignmentId: "asg-real" });
    const html = renderReviewFormHtml({
      pack,
      assignment: asg,
      pairwise: assignPairwiseComparisons({
        caseId: asg.caseId,
        school: asg.school,
        reviewerId: asg.reviewerId,
        rubricVersion: "2.1.0",
      }),
    });
    expect(html).toContain("asg-real");
    expect(html).not.toContain("draft-");
    expect(reviewFormMustNotContainEngineOutput(html)).toEqual([]);
    expect(reviewFormMustNotFabricateConfidence(html)).toEqual([]);
    const blocked = assembleExportedReview({
      pack,
      assignment: asg,
      pairwise: [],
      palaceSelections: {
        Mệnh: { support: "high" },
      },
      pairwiseResults: [],
      reviewedAt: "2026-08-14T00:00:00Z",
    });
    expect(blocked.errors.some((e) => e.includes("confidence"))).toBe(true);
    expect(blocked.review.assignmentId).toBe("asg-real");
    expect(blocked.review.reviewId).toBe("asg-real-review-v1");
    expect(blocked.review.palaceRatings.find((p) => p.palaceName === "Mệnh")?.confidence).toBeUndefined();
  });
});

describe("assignment-aware ingest", () => {
  const asg = assignment({ assignmentId: "asg-1" });

  it("rejects missing rubricVersion and unassigned reviews", () => {
    const noRubric = ingestReviewPayload(
      { ...usableReview(asg), rubricVersion: "" },
      [],
      [asg],
      REVIEWERS,
    );
    expect(noRubric.ok).toBe(false);
    expect(
      ingestReviewPayload(usableReview(asg), [], [], REVIEWERS).ok,
    ).toBe(false);
  });

  it("rejects school mismatch, withdrawn, and completed duplicates", () => {
    const wrongSchool = ingestReviewPayload(
      { ...usableReview(asg), school: "nam-phai" },
      [],
      [asg],
      REVIEWERS,
    );
    expect(wrongSchool.ok).toBe(false);
    expect(
      ingestReviewPayload(usableReview(asg), [], [{ ...asg, status: "withdrawn" }], REVIEWERS).ok,
    ).toBe(false);
    expect(
      ingestReviewPayload(usableReview(asg), [], [{ ...asg, status: "completed" }], REVIEWERS).ok,
    ).toBe(false);
    const first = ingestReviewPayload(usableReview(asg), [], [asg], REVIEWERS);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.updatedAssignments.find((a) => a.assignmentId === "asg-1")?.status).toBe(
        "completed",
      );
      expect(first.merged).toHaveLength(1);
      expect(
        ingestReviewPayload(
          { ...usableReview(asg), reviewId: "other" },
          first.merged,
          first.updatedAssignments,
          REVIEWERS,
        ).ok,
      ).toBe(false);
    }
  });

  it("does not rewrite existing reviews", () => {
    const existing = [usableReview(assignment({ assignmentId: "keep", reviewerId: "bob" }))];
    const copy = JSON.stringify(existing);
    const next = assignment({ assignmentId: "asg-2" });
    const result = ingestReviewPayload(usableReview(next), existing, [next], REVIEWERS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.stringify(result.merged[0])).toBe(JSON.parse(copy).length ? JSON.stringify(existing[0]) : "");
      expect(JSON.stringify(result.merged[0])).toBe(JSON.stringify(existing[0]));
    }
  });
});

describe("assignment transitions and pilot state", () => {
  it("allows assigned to completed/withdrawn only", () => {
    expect(canTransitionAssignment("assigned", "completed")).toBe(true);
    expect(canTransitionAssignment("completed", "assigned")).toBe(false);
    expect(canTransitionAssignment("withdrawn", "completed")).toBe(false);
  });

  it("does not auto-accept the pilot", () => {
    const cases = loadBenchmarkCasesV2();
    expect(
      corpusDecision({
        cases,
        reviews: [],
        reviewers: [],
        assignments: [],
        pilotAccepted: false,
      }),
    ).toBe("PILOT_READY");
  });
});
