import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  calculateChart,
  expandAllMajorFortuneCycleObservations,
  MF_V02_FULL_CORPUS,
} from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus.js";
import { isMajorFortuneV04NamPhaiTransformationsEnabled } from "../../../../src/lib/ziwei/analysis/feature-flags.js";
import { analyzeMajorFortuneOrdinalV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter/index.js";
import type {
  CorpusGapReport,
  ReconciliationResult,
} from "../schema/foundation.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);

function increment(target: Record<string, number>, key: string, value = 1): void {
  target[key] = (target[key] ?? 0) + value;
}

function levelKey(level: number | null | undefined): string {
  return level === null || level === undefined ? "null" : String(level);
}

function partialPairKey(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "unknown";
  const colon = normalized.indexOf(":");
  return colon > 0 ? normalized.slice(0, colon) : normalized;
}

function reconcileWithV04(
  report: CorpusGapReport,
): ReconciliationResult {
  const result: ReconciliationResult = {
    status: "matched",
    comparedMetrics: [],
    mismatches: [],
    reason: null,
  };

  try {
    const coverage = JSON.parse(
      fs.readFileSync(
        path.join(
          ROOT,
          "research/major-fortune/v0.4.4-verification-closure/reports/enabled-coverage-report.json",
        ),
        "utf8",
      ),
    );

    const comparisons = [
      {
        metric: "outOfFrameTuples",
        expected: coverage.outOfFrameTupleCount,
        actual: report.tuHoa.outOfFrameTuples,
      },
    ].filter((entry) => typeof entry.expected === "number");

    if (comparisons.length === 0) {
      return {
        status: "not-comparable",
        comparedMetrics: [],
        mismatches: [],
        reason:
          "The V0.4 coverage artifact does not expose comparable metrics.",
      };
    }

    for (const comparison of comparisons) {
      result.comparedMetrics.push(comparison.metric);
      if (comparison.expected !== comparison.actual) {
        result.mismatches.push(comparison);
      }
    }

    if (result.mismatches.length > 0) {
      result.status = "mismatched";
      result.reason =
        "Current production extraction does not reproduce the frozen V0.4 baseline.";
    } else {
      result.reason =
        "Current production extraction reproduces all comparable V0.4 metrics.";
    }
    return result;
  } catch (error) {
    return {
      status: "not-comparable",
      comparedMetrics: [],
      mismatches: [],
      reason:
        error instanceof Error
          ? `Could not load the V0.4 baseline: ${error.message}`
          : "Could not load the V0.4 baseline.",
    };
  }
}

export function runCorpusReport(opts?: { outputBase?: string }): void {
  const outputBase = opts?.outputBase ?? CANONICAL_BASE;
  const observations = expandAllMajorFortuneCycleObservations(
    MF_V02_FULL_CORPUS,
  );
  const adapterPolicy = JSON.parse(
    fs.readFileSync(
      path.join(
        ROOT,
        "src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter/policy/adapter-policy.v0.3.json",
      ),
      "utf8",
    ),
  );
  const principalStars = new Set<string>(adapterPolicy.principalStarNames);
  const transformationFeatureEnabled =
    isMajorFortuneV04NamPhaiTransformationsEnabled();

  const report: CorpusGapReport = {
    schemaVersion: "0.5.0",
    thienThoi: {
      totalObservationsBySchool: {},
      evidenceEmissionCount: 0,
      elementRelationDistribution: {},
      supportPressureNeutralDistribution: {},
      missingMenhElement: 0,
      missingPalaceBranchMapping: 0,
      scorePillarLevelDistribution: {},
      scorePillarStateDistribution: {},
      sameElementPolicyCount: 0,
      strongNormalStrengthDistribution: {},
      noElementEvidenceObservations: 0,
      acceptedEvidenceCount: 0,
      rejectedEvidenceCount: 0,
      supportMass: 0,
      pressureMass: 0,
    },
    diaLoi: {
      voChinhDieuObservations: 0,
      onePrincipalCases: 0,
      twoPrincipalCases: 0,
      moreThanTwoDefensiveAnomalyCount: 0,
      brightnessByStarAndDignity: {},
      dignityCounts: {},
      missingBrightness: 0,
      unsupportedBrightness: 0,
      mixedDignity: 0,
      evidenceEmissionCount: 0,
      noSignalCases: 0,
      measurableOppositePalacePrincipalCases: 0,
      scorePillarLevelDistribution: {},
      scorePillarStateDistribution: {},
      schoolDistribution: {},
      acceptedEvidenceCount: 0,
      rejectedEvidenceCount: 0,
      supportMass: 0,
      pressureMass: 0,
    },
    nhanHoa: {
      activationCountForEachConfiguredSet: {},
      partialPairCountForEachSet: {},
      supportOnly: 0,
      pressureOnly: 0,
      mixed: 0,
      noEvidenceObservations: 0,
      scorePillarLevelDistribution: {},
      scorePillarStateDistribution: {},
      duplicatePhysicalFactRejections: 0,
      duplicateEvidenceClusterRejections: 0,
      schoolDistribution: {},
      acceptedEvidenceCount: 0,
      rejectedEvidenceCount: 0,
      supportMass: 0,
      pressureMass: 0,
    },
    tuHoa: {
      resolvedTuples: 0,
      completeTuples: 0,
      incompleteTuples: 0,
      directActivePalaceTuples: 0,
      outOfFrameTuples: 0,
      acceptedTransformationEvidence: 0,
      transformationTypeDistribution: {},
      targetPalaceDistribution: {},
      multiTransformationObservations: 0,
      zeroDirectEvidenceObservations: 0,
      blockedNamPhaiObservations: 0,
      featureEnabledProductionState: transformationFeatureEnabled,
      scorePillarLevelDistribution: {},
      scorePillarStateDistribution: {},
      duplicateEvidenceRejection: 0,
      duplicateOwnershipRejection: 0,
      measurableNatalTransitCollisions: {
        status: "not-measurable",
        reason:
          "The frozen corpus contains one natal chart plus a Major Fortune cycle, not an independently resolved transit layer.",
        requiredCapability: "annual-chart-transit-resolution",
      },
      acceptedEvidenceCount: 0,
      rejectedEvidenceCount: 0,
      supportMass: 0,
      pressureMass: 0,
    },
    reconciliation: {
      status: "not-comparable",
      comparedMetrics: [],
      mismatches: [],
      reason: null,
    },
  };

  for (const observation of observations) {
    const chart = calculateChart(observation.school, observation.input);
    if (!chart) continue;

    const activePalace = chart.palaces.find(
      (palace) => palace.index === observation.activePalaceIndex,
    );
    if (!activePalace) {
      throw new Error(
        `Active palace ${observation.activePalaceIndex} was not found.`,
      );
    }

    const analysis = analyzeMajorFortuneOrdinalV03(chart, {
      school: observation.school,
      cycleOverride: {
        cycleIndex: observation.cycleIndex,
        activePalaceIndex: observation.activePalaceIndex,
        startAge: observation.startAge,
        endAge: observation.endAge,
      },
    });
    const { emittedEvidence, adapterDiagnostics } = analysis.build;
    const pillars = analysis.evaluation?.pillars;

    increment(
      report.thienThoi.totalObservationsBySchool,
      observation.school,
    );
    increment(report.diaLoi.schoolDistribution, observation.school);
    increment(report.nhanHoa.schoolDistribution, observation.school);

    const thienThoiEvidence = emittedEvidence.filter(
      (evidence) => evidence.pillarId === "thien-thoi",
    );
    report.thienThoi.evidenceEmissionCount += thienThoiEvidence.length;
    if (thienThoiEvidence.length === 0) {
      report.thienThoi.noElementEvidenceObservations += 1;
    }
    report.thienThoi.missingMenhElement +=
      adapterDiagnostics.missingMenhElement.length;
    report.thienThoi.missingPalaceBranchMapping +=
      adapterDiagnostics.notes.filter((note) =>
        note.startsWith("unknown-palace-branch-element"),
      ).length;

    for (const evidence of thienThoiEvidence) {
      const relation = evidence.reasonCode.startsWith("element-relation:")
        ? evidence.reasonCode.slice("element-relation:".length)
        : "unknown";
      increment(report.thienThoi.elementRelationDistribution, relation);
      increment(
        report.thienThoi.supportPressureNeutralDistribution,
        evidence.direction,
      );
      increment(
        report.thienThoi.strongNormalStrengthDistribution,
        evidence.strength,
      );
      if (relation === "same_element") {
        report.thienThoi.sameElementPolicyCount += 1;
      }
    }

    const principalInActivePalace = (activePalace.stars ?? []).filter(
      (star) =>
        principalStars.has(star.name) &&
        ((star as any).source ?? "natal") === "natal",
    );
    if (principalInActivePalace.length === 0) {
      report.diaLoi.voChinhDieuObservations += 1;
      const oppositePalace = chart.palaces.find(
        (palace) =>
          palace.index === (observation.activePalaceIndex + 6) % 12,
      );
      const oppositePrincipal = (oppositePalace?.stars ?? []).filter(
        (star) =>
          principalStars.has(star.name) &&
          ((star as any).source ?? "natal") === "natal",
      );
      if (oppositePrincipal.length > 0) {
        report.diaLoi.measurableOppositePalacePrincipalCases += 1;
      }
    } else if (principalInActivePalace.length === 1) {
      report.diaLoi.onePrincipalCases += 1;
    } else if (principalInActivePalace.length === 2) {
      report.diaLoi.twoPrincipalCases += 1;
    } else {
      report.diaLoi.moreThanTwoDefensiveAnomalyCount += 1;
    }

    for (const star of principalInActivePalace) {
      if (!star.brightness) {
        report.diaLoi.missingBrightness += 1;
        continue;
      }
      report.diaLoi.brightnessByStarAndDignity[star.name] ??= {};
      increment(
        report.diaLoi.brightnessByStarAndDignity[star.name],
        star.brightness,
      );
      increment(report.diaLoi.dignityCounts, star.brightness);
    }
    report.diaLoi.unsupportedBrightness +=
      adapterDiagnostics.unsupportedBrightness.length;

    const diaLoiEvidence = emittedEvidence.filter(
      (evidence) => evidence.pillarId === "dia-loi",
    );
    report.diaLoi.evidenceEmissionCount += diaLoiEvidence.length;
    if (diaLoiEvidence.length === 0) {
      report.diaLoi.noSignalCases += 1;
    }
    const diaLoiDirections = new Set(
      diaLoiEvidence.map((evidence) => evidence.direction),
    );
    if (
      diaLoiDirections.has("support") &&
      diaLoiDirections.has("pressure")
    ) {
      report.diaLoi.mixedDignity += 1;
    }

    const nhanHoaEvidence = emittedEvidence.filter(
      (evidence) => evidence.pillarId === "nhan-hoa",
    );
    if (nhanHoaEvidence.length === 0) {
      report.nhanHoa.noEvidenceObservations += 1;
    }
    const nhanHoaDirections = new Set(
      nhanHoaEvidence.map((evidence) => evidence.direction),
    );
    if (
      nhanHoaDirections.has("support") &&
      nhanHoaDirections.has("pressure")
    ) {
      report.nhanHoa.mixed += 1;
    } else if (nhanHoaDirections.has("support")) {
      report.nhanHoa.supportOnly += 1;
    } else if (nhanHoaDirections.has("pressure")) {
      report.nhanHoa.pressureOnly += 1;
    }
    for (const evidence of nhanHoaEvidence) {
      const setId = evidence.reasonCode.startsWith("auxiliary-set:")
        ? evidence.reasonCode.slice("auxiliary-set:".length)
        : null;
      if (setId) {
        increment(
          report.nhanHoa.activationCountForEachConfiguredSet,
          setId,
        );
      }
    }
    for (const partialPair of adapterDiagnostics.partialPairSets) {
      increment(
        report.nhanHoa.partialPairCountForEachSet,
        partialPairKey(partialPair),
      );
    }

    const directTransformationEvidence = emittedEvidence.filter(
      (evidence) =>
        evidence.pillarId === "tu-hoa-sat-tinh" &&
        evidence.physicalFactKind === "major-fortune-transformation",
    );
    const directCount = directTransformationEvidence.length;
    const outOfFrameCount =
      adapterDiagnostics.outOfFrameTransformationCount;
    const incompleteCount =
      adapterDiagnostics.incompleteTransformationTuples.length;
    const completeCount = directCount + outOfFrameCount;
    const resolvedCount = completeCount + incompleteCount;

    report.tuHoa.directActivePalaceTuples += directCount;
    report.tuHoa.outOfFrameTuples += outOfFrameCount;
    report.tuHoa.incompleteTuples += incompleteCount;
    report.tuHoa.completeTuples += completeCount;
    report.tuHoa.resolvedTuples += resolvedCount;
    report.tuHoa.acceptedTransformationEvidence += directCount;
    if (directCount === 0) {
      report.tuHoa.zeroDirectEvidenceObservations += 1;
    }
    if (directCount > 1) {
      report.tuHoa.multiTransformationObservations += 1;
    }
    if (adapterDiagnostics.namPhaiTransformationBlocked.length > 0) {
      report.tuHoa.blockedNamPhaiObservations += 1;
    }

    for (const evidence of directTransformationEvidence) {
      const tuple = evidence.transformationTuple;
      increment(
        report.tuHoa.transformationTypeDistribution,
        tuple?.transformationType ?? "unknown",
      );
      increment(
        report.tuHoa.targetPalaceDistribution,
        tuple?.targetPalace ?? "unknown",
      );
    }

    const pillarPairs = [
      ["thienThoi", "thien-thoi"],
      ["diaLoi", "dia-loi"],
      ["nhanHoa", "nhan-hoa"],
      ["tuHoa", "tu-hoa-sat-tinh"],
    ] as const;

    for (const [reportKey, pillarId] of pillarPairs) {
      const pillar = pillars?.[pillarId];
      if (!pillar) continue;
      const target = report[reportKey] as {
        scorePillarLevelDistribution: Record<string, number>;
        scorePillarStateDistribution: Record<string, number>;
        acceptedEvidenceCount: number;
        rejectedEvidenceCount: number;
        supportMass: number;
        pressureMass: number;
      };
      increment(target.scorePillarLevelDistribution, levelKey(pillar.level));
      increment(target.scorePillarStateDistribution, pillar.state);
      target.acceptedEvidenceCount += pillar.acceptedEvidenceIds.length;
      target.rejectedEvidenceCount += pillar.rejectedEvidence.length;
      target.supportMass += pillar.supportMass;
      target.pressureMass += pillar.pressureMass;

      if (reportKey === "nhanHoa") {
        report.nhanHoa.duplicatePhysicalFactRejections +=
          pillar.rejectedEvidence.filter(
            (rejection) =>
              rejection.reason === "duplicate-physical-fact" ||
              rejection.reason === "conflicting-physical-fact",
          ).length;
        report.nhanHoa.duplicateEvidenceClusterRejections +=
          pillar.rejectedEvidence.filter(
            (rejection) =>
              rejection.reason === "duplicate-evidence-cluster" ||
              rejection.reason === "conflicting-evidence-cluster",
          ).length;
      }
      if (reportKey === "tuHoa") {
        report.tuHoa.duplicateEvidenceRejection +=
          pillar.rejectedEvidence.filter(
            (rejection) =>
              rejection.reason === "duplicate-physical-fact" ||
              rejection.reason === "duplicate-evidence-cluster" ||
              rejection.reason === "conflicting-physical-fact" ||
              rejection.reason === "conflicting-evidence-cluster",
          ).length;
        report.tuHoa.duplicateOwnershipRejection +=
          pillar.rejectedEvidence.filter(
            (rejection) =>
              rejection.reason ===
                "cross-pillar-ownership-violation" ||
              rejection.reason === "pillar-family-mismatch",
          ).length;
      }
    }
  }

  if (
    report.tuHoa.completeTuples + report.tuHoa.incompleteTuples !==
    report.tuHoa.resolvedTuples
  ) {
    throw new Error("Transformation tuple reconciliation failed.");
  }
  if (
    report.tuHoa.directActivePalaceTuples !==
    report.tuHoa.acceptedTransformationEvidence
  ) {
    throw new Error(
      "Direct transformation tuples do not reconcile to emitted evidence.",
    );
  }

  report.reconciliation = reconcileWithV04(report);

  fs.mkdirSync(path.join(outputBase, "reports"), { recursive: true });
  const output = `${JSON.stringify(report, null, 2)}\n`;
  fs.writeFileSync(
    path.join(outputBase, "reports/corpus-gap-report.json"),
    output,
  );
  fs.writeFileSync(
    path.join(outputBase, "reports/corpus-gap-report.hash"),
    `${crypto.createHash("sha256").update(output).digest("hex")}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCorpusReport();
}
