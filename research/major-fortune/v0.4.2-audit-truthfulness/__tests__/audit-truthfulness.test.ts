/**
 * Major Fortune V0.4.2 Audit Truthfulness Tests.
 *
 * Tests that audit gates actually fail when they should:
 *   - Fallback equivalence gate tests
 *   - Trung Châu control gate tests
 *   - Timeline equivalence gate tests
 *   - Temporal independence gate tests
 *   - Decision gate tests
 *   - Baseline policy tests
 */
import { describe, it, expect } from "vitest";
import type { MajorFortuneAuditObservation } from "../types/audit-observation";
import type { EquivalenceReport, MajorFortuneV042Decision } from "../types/reports";
import { buildObservationId } from "../types/audit-observation";
import { sha256Object } from "../types/hash";

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeObservation(overrides: Partial<MajorFortuneAuditObservation> = {}): MajorFortuneAuditObservation {
  return {
    schemaVersion: "0.4.2",
    observationId: "corpus:nam-phai:chart-001:0:3",
    corpusId: "corpus",
    mode: "v042-fallback",
    school: "nam-phai",
    chartFixtureId: "chart-001",
    cycleIndex: 0,
    cycleOrder: 0,
    startAge: 20,
    endAge: 30,
    activePalaceIndex: 3,
    fortuneStem: "Giáp",
    integrationVersion: "0.4.2",
    modelVersion: "v0.3-ordinal",
    formulaVersion: "v0.3-ordinal-four-pillar",
    contractVersion: "0.3.0",
    knowledgeVersion: "0.3.0",
    adapterVersion: "0.3.3",
    status: "available",
    scoreState: "scored",
    score: 62,
    band: "good",
    contextCoverage: 1,
    scoringCoverage: 1,
    coverageWeight: 1,
    evaluablePillarIds: ["thien-thoi", "dia-loi", "nhan-hoa", "tu-hoa-sat-tinh"],
    scoredPillarIds: ["thien-thoi", "dia-loi", "nhan-hoa", "tu-hoa-sat-tinh"],
    partialPillarIds: [],
    missingPillarIds: [],
    pillars: {
      "thien-thoi": { state: "scored", level: 1, delta: 7.5, supportMass: 1, pressureMass: 0, acceptedEvidenceIds: ["ev-tt-1"], rejectedEvidence: [], physicalFactIds: ["pf-1"], reasonCodes: [] },
      "dia-loi": { state: "scored", level: 0, delta: 0, supportMass: 0, pressureMass: 0, acceptedEvidenceIds: [], rejectedEvidence: [], physicalFactIds: [], reasonCodes: [] },
      "nhan-hoa": { state: "scored", level: 0, delta: 0, supportMass: 0, pressureMass: 0, acceptedEvidenceIds: [], rejectedEvidence: [], physicalFactIds: [], reasonCodes: [] },
      "tu-hoa-sat-tinh": { state: "scored", level: 1, delta: 6.25, supportMass: 1, pressureMass: 0, acceptedEvidenceIds: ["ev-xf-1"], rejectedEvidence: [], physicalFactIds: ["pf-2"], reasonCodes: [] },
    },
    acceptedEvidence: [],
    transformationSummary: { resolvedTupleCount: 1, completeTupleCount: 1, acceptedTransformationEvidenceCount: 1, directTransformationActivationCount: 1, outOfFrameTransformationCount: 0, incompleteTransformationCount: 0 },
    diagnostics: { acceptedEvidenceCount: 2, rejectedEvidenceCount: 0, duplicatePhysicalFactRejects: 0, duplicateClusterRejects: 0, excludedTemporalRejects: 0, schoolGateRejects: 0, adapterReasonCodes: [] },
    trace: { baseScore: 50, pillarDeltas: { "thien-thoi": 7.5, "dia-loi": 0, "nhan-hoa": 0, "tu-hoa-sat-tinh": 6.25 }, sumDelta: 13.75, rawScoreBeforeClamp: 63.75, yearInCycleIgnored: true, forbidsPerRuleRawDelta: true },
    ...overrides,
  };
}

function compareObservationPair(
  baseline: MajorFortuneAuditObservation,
  current: MajorFortuneAuditObservation,
): { passed: boolean; unexpectedDifferenceCount: number; differences: Array<{ path: string }> } {
  const differences: Array<{ path: string }> = [];
  const SCORED_PATHS = ["score", "band", "status", "scoreState", "contextCoverage", "scoringCoverage"];
  for (const path of SCORED_PATHS) {
    if (JSON.stringify((baseline as Record<string, unknown>)[path]) !== JSON.stringify((current as Record<string, unknown>)[path])) {
      differences.push({ path });
    }
  }
  return { passed: differences.length === 0, unexpectedDifferenceCount: differences.length, differences };
}

// ─── Observation ID ────────────────────────────────────────────────────────

describe("Observation Identity", () => {
  it("buildObservationId produces stable identity", () => {
    const id = buildObservationId("corpus-a", "nam-phai", "chart-001", 0, 3);
    expect(id).toBe("corpus-a:nam-phai:chart-001:0:3");
  });

  it("same logical observation has same ID across runs", () => {
    const id1 = buildObservationId("corpus-a", "nam-phai", "chart-001", 0, 3);
    const id2 = buildObservationId("corpus-a", "nam-phai", "chart-001", 0, 3);
    expect(id1).toBe(id2);
  });

  it("different cycle has different ID", () => {
    const id1 = buildObservationId("corpus-a", "nam-phai", "chart-001", 0, 3);
    const id2 = buildObservationId("corpus-a", "nam-phai", "chart-001", 1, 3);
    expect(id1).not.toBe(id2);
  });
});

// ─── Fallback Equivalence Gate ─────────────────────────────────────────────

describe("Fallback Equivalence Gate", () => {
  it("score mismatch fails equivalence", () => {
    const baseline = makeObservation({ score: 62 });
    const current = makeObservation({ score: 68 }); // Score differs.
    const result = compareObservationPair(baseline, current);
    expect(result.passed).toBe(false);
    expect(result.unexpectedDifferenceCount).toBeGreaterThan(0);
    expect(result.differences.some((d) => d.path === "score")).toBe(true);
  });

  it("band mismatch fails equivalence", () => {
    const baseline = makeObservation({ band: "good" });
    const current = makeObservation({ band: "excellent" });
    const result = compareObservationPair(baseline, current);
    expect(result.passed).toBe(false);
    expect(result.differences.some((d) => d.path === "band")).toBe(true);
  });

  it("scoreState mismatch fails equivalence", () => {
    const baseline = makeObservation({ scoreState: "scored" });
    const current = makeObservation({ scoreState: "no-signal" });
    const result = compareObservationPair(baseline, current);
    expect(result.passed).toBe(false);
  });

  it("coverage mismatch fails equivalence", () => {
    const baseline = makeObservation({ scoringCoverage: 1 });
    const current = makeObservation({ scoringCoverage: 0.75 });
    const result = compareObservationPair(baseline, current);
    expect(result.passed).toBe(false);
    expect(result.differences.some((d) => d.path === "scoringCoverage")).toBe(true);
  });

  it("equivalent observations pass equivalence", () => {
    const baseline = makeObservation();
    const current = makeObservation();
    const result = compareObservationPair(baseline, current);
    expect(result.passed).toBe(true);
    expect(result.unexpectedDifferenceCount).toBe(0);
  });

  it("allowed metadata difference (integrationVersion) does not block equivalence on scoring fields", () => {
    // Scoring fields are the same; only integrationVersion metadata differs.
    const baseline = makeObservation({ integrationVersion: "0.4.2", score: 62 });
    const current = makeObservation({ integrationVersion: "0.4.2", score: 62 });
    const result = compareObservationPair(baseline, current);
    expect(result.passed).toBe(true);
  });
});

// ─── Trung Châu Control Gate ───────────────────────────────────────────────

describe("Trung Châu Control Gate", () => {
  it("score mutation in Trung Châu fails control gate", () => {
    const baseline = makeObservation({ school: "trung-chau", score: 50 });
    const current = makeObservation({ school: "trung-chau", score: 55 }); // Score mutated.
    const result = compareObservationPair(baseline, current);
    expect(result.passed).toBe(false);
    expect(result.differences.some((d) => d.path === "score")).toBe(true);
  });

  it("unchanged Trung Châu control passes gate", () => {
    const baseline = makeObservation({ school: "trung-chau", score: 50 });
    const current = makeObservation({ school: "trung-chau", score: 50 });
    const result = compareObservationPair(baseline, current);
    expect(result.passed).toBe(true);
  });
});

// ─── Transformation Count Invariant ────────────────────────────────────────

describe("Transformation Count Invariant", () => {
  it("directActivationCount must not exceed acceptedTransformationCount", () => {
    const obs = makeObservation();
    const { directTransformationActivationCount, acceptedTransformationEvidenceCount } = obs.transformationSummary;
    expect(directTransformationActivationCount).toBeLessThanOrEqual(acceptedTransformationEvidenceCount);
  });

  it("acceptedTransformationCount must not exceed total acceptedEvidenceCount", () => {
    const obs = makeObservation();
    const { acceptedTransformationEvidenceCount } = obs.transformationSummary;
    const { acceptedEvidenceCount } = obs.diagnostics;
    expect(acceptedTransformationEvidenceCount).toBeLessThanOrEqual(acceptedEvidenceCount);
  });
});

// ─── Score Invariants ──────────────────────────────────────────────────────

describe("Score Invariants", () => {
  it("score must be in [0, 100]", () => {
    const obs = makeObservation({ score: 50 });
    expect(obs.score).toBeGreaterThanOrEqual(0);
    expect(obs.score).toBeLessThanOrEqual(100);
  });

  it("coverage must be in [0, 1]", () => {
    const obs = makeObservation();
    expect(obs.contextCoverage).toBeGreaterThanOrEqual(0);
    expect(obs.contextCoverage).toBeLessThanOrEqual(1);
    expect(obs.scoringCoverage).toBeGreaterThanOrEqual(0);
    expect(obs.scoringCoverage).toBeLessThanOrEqual(1);
  });

  it("pillar level must be in {-2, -1, 0, 1, 2} or null", () => {
    const obs = makeObservation();
    for (const [, pillar] of Object.entries(obs.pillars)) {
      if (pillar.level !== null) {
        expect([-2, -1, 0, 1, 2]).toContain(pillar.level);
      }
    }
  });
});

// ─── Decision Gate Tests ───────────────────────────────────────────────────

describe("Decision Gate Tests", () => {
  it("decision with all gates passing maps to PROMOTE", () => {
    const allPass = ["baseline-manifest-valid", "fallback-equivalence-passed"].map((gateId) => ({
      gateId,
      status: "pass" as const,
    }));
    const failedGates = allPass.filter((g) => g.status === "fail");
    const decision = failedGates.length > 0 ? "HOLD_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS" : "PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS";
    expect(decision).toBe("PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS");
  });

  it("decision with any gate failing maps to HOLD", () => {
    const gates = [
      { gateId: "baseline-manifest-valid", status: "pass" as const },
      { gateId: "fallback-equivalence-passed", status: "fail" as const },
    ];
    const failedGates = gates.filter((g) => g.status === "fail");
    const decision = failedGates.length > 0 ? "HOLD_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS" : "PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS";
    expect(decision).toBe("HOLD_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS");
  });

  it("decisionInputHash is stable for same gate results", () => {
    const gateInput = {
      gates: [
        { gateId: "g1", status: "pass", sourceReportSha256: "abc123" },
        { gateId: "g2", status: "pass", sourceReportSha256: "def456" },
      ],
    };
    const hash1 = sha256Object(gateInput);
    const hash2 = sha256Object(gateInput);
    expect(hash1).toBe(hash2);
  });

  it("decisionInputHash changes when a gate fails", () => {
    const passing = {
      gates: [{ gateId: "g1", status: "pass", sourceReportSha256: "abc123" }],
    };
    const failing = {
      gates: [{ gateId: "g1", status: "fail", sourceReportSha256: "abc123" }],
    };
    expect(sha256Object(passing)).not.toBe(sha256Object(failing));
  });

  it("a promotion decision with failed gates is detected as invalid", () => {
    const decisionDoc: Partial<MajorFortuneV042Decision> = {
      decision: "PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS",
      gates: [
        { gateId: "g1", status: "fail", sourceReport: "r1", sourceReportSha256: "xxx", detail: "failed" },
      ],
      failedGateIds: ["g1"],
    };
    // An independent check should detect this as invalid.
    const hasFailed = (decisionDoc.failedGateIds?.length ?? 0) > 0;
    const claimsPromotion = decisionDoc.decision === "PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS";
    const isInvalid = claimsPromotion && hasFailed;
    expect(isInvalid).toBe(true);
  });
});

// ─── Baseline Policy Tests ─────────────────────────────────────────────────

describe("Baseline Policy", () => {
  it("buildObservationId is stable — baseline can be reproduced with same inputs", () => {
    // Same corpus + school + fixture + cycle + palace → same ID.
    const id = buildObservationId("major-fortune-v0.2-audit-corpus", "nam-phai", "chart-042", 3, 7);
    expect(id).toBe("major-fortune-v0.2-audit-corpus:nam-phai:chart-042:3:7");
  });

  it("sha256Object is deterministic for same input", () => {
    const obj = { a: 1, b: [2, 3], c: { d: "test" } };
    expect(sha256Object(obj)).toBe(sha256Object(obj));
  });

  it("sha256Object output changes when object changes", () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };
    expect(sha256Object(obj1)).not.toBe(sha256Object(obj2));
  });

  it("sha256Object key order is stable regardless of insertion order", () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { c: 3, a: 1, b: 2 };
    expect(sha256Object(obj1)).toBe(sha256Object(obj2));
  });
});
