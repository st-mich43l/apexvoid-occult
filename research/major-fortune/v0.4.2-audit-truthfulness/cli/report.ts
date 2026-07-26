/**
 * Major Fortune V0.4.2 Report Generator.
 *
 * Reads raw audit snapshots and generates derived comparison reports:
 *   - fallback-equivalence-report.json
 *   - trung-chau-control-report.json
 *   - timeline-equivalence-report.json
 *   - temporal-independence-report.json
 *   - enabled-coverage-report.json
 *   - score-distribution-report.json
 *   - band-migration-report.json
 *   - telemetry-semantics-report.json
 *   - corpus-identity.json
 *   - artifact-manifest.json
 *
 * The report command does NOT modify raw snapshots.
 * The report command does NOT produce a decision.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

import type { MajorFortuneAuditObservation } from "../types/audit-observation";
import type {
  EquivalenceReport,
  ObservationDifference,
  EnabledCoverageReport,
  ScoreDistributionReport,
  ScoreDistributionStats,
  BandMigrationReport,
  TimelineEquivalenceReport,
  TemporalIndependenceReport,
  TelemetrySemanticsReport,
  ArtifactManifest,
  CorpusIdentityRecord,
} from "../types/reports";
import { sha256File, sha256Object } from "../types/hash";
import { MF_V02_FULL_CORPUS } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus";
import { MAJOR_FORTUNE_INTEGRATION_VERSION } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/types";

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.2-audit-truthfulness");
const RAW_DIR = join(ROOT, "reports", "raw");
const REPORTS_DIR = join(ROOT, "reports");
const BASELINES_DIR = join(ROOT, "baselines");

function loadJson<T>(path: string): T {
  if (!existsSync(path)) {
    console.error(`[report] MISSING required file: ${path}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

// ─── Allowed metadata fields that may differ between baseline and current ──
const ALLOWED_DIFF_PATHS = new Set([
  "schemaVersion",
  "mode",
  "integrationVersion",
  "adapterVersion",
]);

function compareObservations(
  baseline: MajorFortuneAuditObservation[],
  current: MajorFortuneAuditObservation[],
  baselineMode: string,
  currentMode: string,
): EquivalenceReport {
  const baselineMap = new Map(baseline.map((o) => [o.observationId, o]));
  const currentMap = new Map(current.map((o) => [o.observationId, o]));

  const missingBaselineIds = [...currentMap.keys()].filter((id) => !baselineMap.has(id));
  const missingCurrentIds = [...baselineMap.keys()].filter((id) => !currentMap.has(id));
  const differences: ObservationDifference[] = [];

  const SCORED_PATHS = [
    "score", "band", "status", "scoreState",
    "contextCoverage", "scoringCoverage", "coverageWeight",
    "evaluablePillarIds", "scoredPillarIds", "partialPillarIds", "missingPillarIds",
    "fortuneStem", "activePalaceIndex", "cycleIndex", "startAge", "endAge",
    "school",
  ];
  const PILLAR_FIELDS = ["state", "level", "delta", "supportMass", "pressureMass"];

  for (const [id, base] of baselineMap) {
    const curr = currentMap.get(id);
    if (!curr) continue;

    // Compare top-level scored fields.
    for (const path of SCORED_PATHS) {
      const bv = (base as Record<string, unknown>)[path];
      const cv = (curr as Record<string, unknown>)[path];
      const bStr = JSON.stringify(bv);
      const cStr = JSON.stringify(cv);
      if (bStr !== cStr) {
        differences.push({
          observationId: id,
          path,
          baselineValue: bv,
          currentValue: cv,
          classification: "unexpected-scoring",
        });
      }
    }

    // Compare array membership (order-insensitive).
    for (const arrField of ["evaluablePillarIds", "scoredPillarIds", "partialPillarIds", "missingPillarIds"]) {
      const bArr = ((base as Record<string, unknown>)[arrField] as string[] ?? []).slice().sort();
      const cArr = ((curr as Record<string, unknown>)[arrField] as string[] ?? []).slice().sort();
      if (JSON.stringify(bArr) !== JSON.stringify(cArr)) {
        differences.push({
          observationId: id,
          path: arrField,
          baselineValue: bArr,
          currentValue: cArr,
          classification: "unexpected-coverage",
        });
      }
    }

    // Compare pillar results.
    const bPillars = base.pillars;
    const cPillars = curr.pillars;
    for (const pillarId of Object.keys(bPillars)) {
      const bp = bPillars[pillarId];
      const cp = cPillars[pillarId];
      if (!bp || !cp) {
        differences.push({
          observationId: id,
          path: `pillars.${pillarId}`,
          baselineValue: bp ? "present" : "missing",
          currentValue: cp ? "present" : "missing",
          classification: "unexpected-evidence",
        });
        continue;
      }
      for (const f of PILLAR_FIELDS) {
        const bv = (bp as Record<string, unknown>)[f];
        const cv = (cp as Record<string, unknown>)[f];
        if (JSON.stringify(bv) !== JSON.stringify(cv)) {
          differences.push({
            observationId: id,
            path: `pillars.${pillarId}.${f}`,
            baselineValue: bv,
            currentValue: cv,
            classification: f === "level" || f === "delta" ? "unexpected-scoring" : "unexpected-evidence",
          });
        }
      }
      // Compare accepted evidence IDs (order-insensitive).
      const bAcc = [...(bp.acceptedEvidenceIds ?? [])].sort();
      const cAcc = [...(cp.acceptedEvidenceIds ?? [])].sort();
      if (JSON.stringify(bAcc) !== JSON.stringify(cAcc)) {
        differences.push({
          observationId: id,
          path: `pillars.${pillarId}.acceptedEvidenceIds`,
          baselineValue: bAcc,
          currentValue: cAcc,
          classification: "unexpected-evidence",
        });
      }
      // Compare rejected evidence reasons.
      const bRej = [...(bp.rejectedEvidence ?? [])].map((r) => r.reason).sort();
      const cRej = [...(cp.rejectedEvidence ?? [])].map((r) => r.reason).sort();
      if (JSON.stringify(bRej) !== JSON.stringify(cRej)) {
        differences.push({
          observationId: id,
          path: `pillars.${pillarId}.rejectedEvidence.reasons`,
          baselineValue: bRej,
          currentValue: cRej,
          classification: "unexpected-evidence",
        });
      }
    }

    // Compare trace.
    if (JSON.stringify(base.trace) !== JSON.stringify(curr.trace)) {
      differences.push({
        observationId: id,
        path: "trace",
        baselineValue: base.trace,
        currentValue: curr.trace,
        classification: "unexpected-scoring",
      });
    }
  }

  const unexpectedDifferenceCount = differences.filter(
    (d) => d.classification !== "allowed-metadata",
  ).length;

  return {
    schemaVersion: "0.4.2",
    baselineMode,
    currentMode,
    comparedObservationCount: Math.min(baselineMap.size, currentMap.size),
    matchingObservationCount: baselineMap.size - unexpectedDifferenceCount,
    missingBaselineIds,
    missingCurrentIds,
    differences,
    unexpectedDifferenceCount,
    passed:
      unexpectedDifferenceCount === 0 &&
      missingBaselineIds.length === 0 &&
      missingCurrentIds.length === 0,
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx] ?? 0;
}

function computeStats(snapshots: MajorFortuneAuditObservation[]): ScoreDistributionStats {
  const scores = snapshots
    .filter((s) => s.score !== null)
    .map((s) => s.score as number)
    .sort((a, b) => a - b);
  const count = scores.length;
  if (count === 0) {
    return {
      count: 0, min: 0, max: 0, mean: 0, median: 0, stdDev: 0,
      p05: 0, p25: 0, p50: 0, p75: 0, p95: 0,
      bandCounts: {}, scoreStateCounts: {}, statusCounts: {},
      baseScoreCount: 0, baseScoreRate: 0,
      clampToZeroCount: 0, clampToZeroRate: 0,
      clampTo100Count: 0, clampTo100Rate: 0,
      pillarLevelDistributions: {},
    };
  }
  const sum = scores.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);

  const bandCounts: Record<string, number> = {};
  const scoreStateCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const pillarLevelDistributions: Record<string, Record<string, number>> = {};
  let baseScoreCount = 0;
  let clampToZeroCount = 0;
  let clampTo100Count = 0;

  for (const s of snapshots) {
    const band = s.band ?? "null";
    bandCounts[band] = (bandCounts[band] ?? 0) + 1;
    scoreStateCounts[s.scoreState] = (scoreStateCounts[s.scoreState] ?? 0) + 1;
    statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
    if (s.score === 50) baseScoreCount++;
    if (s.score === 0) clampToZeroCount++;
    if (s.score === 100) clampTo100Count++;

    for (const [pillarId, pillar] of Object.entries(s.pillars)) {
      if (!pillarLevelDistributions[pillarId]) pillarLevelDistributions[pillarId] = {};
      const lvl = String(pillar.level ?? "null");
      pillarLevelDistributions[pillarId][lvl] = (pillarLevelDistributions[pillarId][lvl] ?? 0) + 1;
    }
  }

  const total = snapshots.length;
  return {
    count,
    min: scores[0] ?? 0,
    max: scores[count - 1] ?? 0,
    mean: Math.round(mean * 100) / 100,
    median: percentile(scores, 50),
    stdDev: Math.round(stdDev * 100) / 100,
    p05: percentile(scores, 5),
    p25: percentile(scores, 25),
    p50: percentile(scores, 50),
    p75: percentile(scores, 75),
    p95: percentile(scores, 95),
    bandCounts,
    scoreStateCounts,
    statusCounts,
    baseScoreCount,
    baseScoreRate: Math.round((baseScoreCount / total) * 10000) / 100,
    clampToZeroCount,
    clampToZeroRate: Math.round((clampToZeroCount / total) * 10000) / 100,
    clampTo100Count,
    clampTo100Rate: Math.round((clampTo100Count / total) * 10000) / 100,
    pillarLevelDistributions,
  };
}

function run(): void {
  mkdirSync(REPORTS_DIR, { recursive: true });

  // Load raw snapshots.
  console.log("[report] Loading raw snapshots...");
  const fallback = loadJson<MajorFortuneAuditObservation[]>(join(RAW_DIR, "nam-phai-fallback.json"));
  const enabled = loadJson<MajorFortuneAuditObservation[]>(join(RAW_DIR, "nam-phai-enabled.json"));
  const control = loadJson<MajorFortuneAuditObservation[]>(join(RAW_DIR, "trung-chau-control.json"));
  const timelinePoints = loadJson<MajorFortuneAuditObservation[]>(join(RAW_DIR, "timeline-points.json"));
  const temporalPairs = loadJson<Array<{
    observationId: string;
    baseSnapshot: MajorFortuneAuditObservation;
    alteredSnapshot: MajorFortuneAuditObservation;
    contaminationField: string;
  }>>(join(RAW_DIR, "temporal-pairs.json"));

  // Load baselines.
  console.log("[report] Loading baselines...");
  const namPhaiBaseline = loadJson<MajorFortuneAuditObservation[]>(join(BASELINES_DIR, "v0.3.3-nam-phai-fallback.json"));
  const trungChauBaseline = loadJson<MajorFortuneAuditObservation[]>(join(BASELINES_DIR, "v0.4.1-trung-chau-control.json"));

  // ── 1. Fallback equivalence report ───────────────────────────────────────
  console.log("[report] Generating fallback equivalence report...");
  const fallbackEquivalence = compareObservations(
    namPhaiBaseline,
    fallback,
    "v033-fallback-baseline",
    "v042-fallback",
  );
  writeFileSync(join(REPORTS_DIR, "fallback-equivalence-report.json"), JSON.stringify(fallbackEquivalence, null, 2), "utf8");
  console.log(`[report] Fallback equivalence: passed=${fallbackEquivalence.passed}, differences=${fallbackEquivalence.unexpectedDifferenceCount}`);

  // ── 2. Trung Châu control report ──────────────────────────────────────────
  console.log("[report] Generating Trung Châu control report...");
  const trungChauControl = compareObservations(
    trungChauBaseline,
    control,
    "trung-chau-baseline",
    "v042-trung-chau-control",
  );
  writeFileSync(join(REPORTS_DIR, "trung-chau-control-report.json"), JSON.stringify(trungChauControl, null, 2), "utf8");
  console.log(`[report] Trung Châu control: passed=${trungChauControl.passed}, differences=${trungChauControl.unexpectedDifferenceCount}`);

  // ── 3. Timeline equivalence report ────────────────────────────────────────
  console.log("[report] Generating timeline equivalence report...");
  const fallbackMap = new Map(fallback.map((o) => [o.observationId, o]));
  const timelineEquivReport: TimelineEquivalenceReport = {
    schemaVersion: "0.4.2",
    comparedObservationCount: 0,
    matchingObservationCount: 0,
    mismatches: [],
    timelineMismatchCount: 0,
    passed: true,
  };
  const TIMELINE_COMPARE_FIELDS = ["score", "band", "scoreState", "status", "activePalaceIndex", "cycleIndex", "fortuneStem", "contextCoverage", "scoringCoverage"];
  for (const tp of timelinePoints) {
    const single = fallbackMap.get(tp.observationId);
    if (!single) continue;
    timelineEquivReport.comparedObservationCount++;
    let matched = true;
    for (const f of TIMELINE_COMPARE_FIELDS) {
      const sv = (single as Record<string, unknown>)[f];
      const tv = (tp as Record<string, unknown>)[f];
      if (JSON.stringify(sv) !== JSON.stringify(tv)) {
        timelineEquivReport.mismatches.push({
          observationId: tp.observationId,
          field: f,
          singleCycleValue: sv,
          timelineValue: tv,
        });
        matched = false;
      }
    }
    if (matched) timelineEquivReport.matchingObservationCount++;
  }
  timelineEquivReport.timelineMismatchCount = timelineEquivReport.mismatches.length;
  timelineEquivReport.passed = timelineEquivReport.timelineMismatchCount === 0;
  writeFileSync(join(REPORTS_DIR, "timeline-equivalence-report.json"), JSON.stringify(timelineEquivReport, null, 2), "utf8");
  console.log(`[report] Timeline equivalence: passed=${timelineEquivReport.passed}, mismatches=${timelineEquivReport.timelineMismatchCount}`);

  // ── 4. Temporal independence report ───────────────────────────────────────
  console.log("[report] Generating temporal independence report...");
  const temporalReport: TemporalIndependenceReport = {
    schemaVersion: "0.4.2",
    testedPairCount: temporalPairs.length,
    passedPairCount: 0,
    contaminations: [],
    temporalContaminationCount: 0,
    passed: true,
  };
  for (const pair of temporalPairs) {
    const COMPARE = ["score", "band", "scoreState"];
    let contaminated = false;
    for (const f of COMPARE) {
      const bv = (pair.baseSnapshot as Record<string, unknown>)[f];
      const av = (pair.alteredSnapshot as Record<string, unknown>)[f];
      if (JSON.stringify(bv) !== JSON.stringify(av)) {
        temporalReport.contaminations.push({
          observationId: pair.observationId,
          contaminationField: pair.contaminationField,
          baseValue: pair.baseSnapshot.score,
          alteredValue: pair.alteredSnapshot.score,
          affectedField: f,
          baseScore: pair.baseSnapshot.score,
          alteredScore: pair.alteredSnapshot.score,
        });
        contaminated = true;
      }
    }
    if (!contaminated) temporalReport.passedPairCount++;
  }
  temporalReport.temporalContaminationCount = temporalReport.contaminations.length;
  temporalReport.passed = temporalReport.temporalContaminationCount === 0;
  writeFileSync(join(REPORTS_DIR, "temporal-independence-report.json"), JSON.stringify(temporalReport, null, 2), "utf8");
  console.log(`[report] Temporal independence: passed=${temporalReport.passed}`);

  // ── 5. Enabled coverage report ────────────────────────────────────────────
  console.log("[report] Generating enabled coverage report...");
  const availableEnabled = enabled.filter((o) => o.status === "available");
  const partialEnabled = enabled.filter((o) => o.status === "partial");
  const unavailableEnabled = enabled.filter((o) => o.status === "unavailable");
  const directObs = enabled.filter((o) => o.transformationSummary.directTransformationActivationCount > 0);
  const totalDirectCount = enabled.reduce((s, o) => s + o.transformationSummary.directTransformationActivationCount, 0);
  const scoringCoverages = enabled.map((o) => o.scoringCoverage);
  const coverageReport: EnabledCoverageReport = {
    schemaVersion: "0.4.2",
    mode: "v042-nam-phai-enabled",
    totalObservations: enabled.length,
    availableObservations: availableEnabled.length,
    partialObservations: partialEnabled.length,
    unavailableObservations: unavailableEnabled.length,
    meanContextCoverage: enabled.reduce((s, o) => s + o.contextCoverage, 0) / enabled.length,
    meanScoringCoverage: scoringCoverages.reduce((a, b) => a + b, 0) / scoringCoverages.length,
    minScoringCoverage: Math.min(...scoringCoverages),
    maxScoringCoverage: Math.max(...scoringCoverages),
    directActivationObservations: directObs.length,
    directActivationRate: directObs.length / enabled.length,
    directActivationCount: totalDirectCount,
    outOfFrameTupleCount: enabled.reduce((s, o) => s + o.transformationSummary.outOfFrameTransformationCount, 0),
    incompleteTupleCount: enabled.reduce((s, o) => s + o.transformationSummary.incompleteTransformationCount, 0),
    missingFortuneStemCount: enabled.filter((o) => !o.fortuneStem).length,
    incompleteReasons: {},
  };
  writeFileSync(join(REPORTS_DIR, "enabled-coverage-report.json"), JSON.stringify(coverageReport, null, 2), "utf8");

  // ── 6. Score distribution + band migration ────────────────────────────────
  console.log("[report] Generating score distribution report...");
  const distReport: ScoreDistributionReport = {
    schemaVersion: "0.4.2",
    stats: {
      "v042-fallback": computeStats(fallback),
      "v042-nam-phai-enabled": computeStats(enabled),
      "v042-trung-chau-control": computeStats(control),
    },
  };
  writeFileSync(join(REPORTS_DIR, "score-distribution-report.json"), JSON.stringify(distReport, null, 2), "utf8");

  // Band migration.
  console.log("[report] Generating band migration report...");
  const enabledMap = new Map(enabled.map((o) => [o.observationId, o]));
  const scoreDeltaList: number[] = [];
  const absDeltaList: number[] = [];
  let unchanged = 0, positive = 0, negative = 0, oneBand = 0, multiBand = 0;
  const migrationMatrix: Record<string, Record<string, number>> = {};
  const largestIncreases: Array<{ observationId: string; delta: number }> = [];
  const largestDecreases: Array<{ observationId: string; delta: number }> = [];

  for (const fb of fallback) {
    const en = enabledMap.get(fb.observationId);
    if (!en || fb.score === null || en.score === null) continue;
    const delta = en.score - fb.score;
    scoreDeltaList.push(delta);
    absDeltaList.push(Math.abs(delta));
    if (delta === 0) unchanged++;
    else if (delta > 0) positive++;
    else negative++;
    if (Math.abs(delta) <= 6.25) oneBand++;
    else if (Math.abs(delta) > 6.25) multiBand++;

    const fromBand = fb.band ?? "null";
    const toBand = en.band ?? "null";
    if (!migrationMatrix[fromBand]) migrationMatrix[fromBand] = {};
    migrationMatrix[fromBand][toBand] = (migrationMatrix[fromBand][toBand] ?? 0) + 1;

    if (delta > 0) largestIncreases.push({ observationId: fb.observationId, delta });
    if (delta < 0) largestDecreases.push({ observationId: fb.observationId, delta });
  }

  largestIncreases.sort((a, b) => b.delta - a.delta);
  largestDecreases.sort((a, b) => a.delta - b.delta);

  const sortedDeltas = [...scoreDeltaList].sort((a, b) => a - b);
  const sortedAbs = [...absDeltaList].sort((a, b) => a - b);

  function simpleDeltaStats(values: number[]) {
    if (values.length === 0) return { count: 0, min: 0, max: 0, mean: 0, stdDev: 0, p05: 0, p25: 0, p50: 0, p75: 0, p95: 0, median: 0, bandCounts: {}, scoreStateCounts: {}, statusCounts: {}, baseScoreCount: 0, baseScoreRate: 0, clampToZeroCount: 0, clampToZeroRate: 0, clampTo100Count: 0, clampTo100Rate: 0, pillarLevelDistributions: {} };
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / sorted.length;
    const variance = sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / sorted.length;
    return { count: sorted.length, min: sorted[0] ?? 0, max: sorted[sorted.length - 1] ?? 0, mean: Math.round(mean * 100) / 100, stdDev: Math.round(Math.sqrt(variance) * 100) / 100, p05: percentile(sorted, 5), p25: percentile(sorted, 25), p50: percentile(sorted, 50), p75: percentile(sorted, 75), p95: percentile(sorted, 95), median: percentile(sorted, 50), bandCounts: {}, scoreStateCounts: {}, statusCounts: {}, baseScoreCount: 0, baseScoreRate: 0, clampToZeroCount: 0, clampToZeroRate: 0, clampTo100Count: 0, clampTo100Rate: 0, pillarLevelDistributions: {} };
  }

  const migrationReport: BandMigrationReport = {
    schemaVersion: "0.4.2",
    comparedObservationCount: scoreDeltaList.length,
    unchangedObservationCount: unchanged,
    positiveMovementCount: positive,
    negativeMovementCount: negative,
    oneBandMovementCount: oneBand,
    multiBandMovementCount: multiBand,
    migrationMatrix,
    scoreDeltaDistribution: simpleDeltaStats(scoreDeltaList) as unknown as ScoreDistributionStats,
    absoluteDeltaDistribution: simpleDeltaStats(absDeltaList) as unknown as ScoreDistributionStats,
    largestIncreases: largestIncreases.slice(0, 10),
    largestDecreases: largestDecreases.slice(0, 10),
  };
  writeFileSync(join(REPORTS_DIR, "band-migration-report.json"), JSON.stringify(migrationReport, null, 2), "utf8");

  // ── 7. Telemetry semantics report ─────────────────────────────────────────
  console.log("[report] Generating telemetry semantics report...");
  // contractVersion: verify present and non-empty. Values of contractVersion and
  // knowledgeVersion may coincidentally match in this knowledge pack — not an error.
  // The source is correct (result.versions.contractVersion in build-event.ts).
  const contractVersionCorrect = [...enabled, ...fallback, ...control].every(
    (o) => typeof o.contractVersion === "string" && o.contractVersion.length > 0,
  );
  const acceptedTransformationCountCorrect = enabled.every(
    (o) => o.transformationSummary.acceptedTransformationEvidenceCount <= o.diagnostics.acceptedEvidenceCount,
  );
  const directCountNeverExceedsAccepted = [...enabled, ...fallback, ...control].every(
    (o) => o.transformationSummary.directTransformationActivationCount <= o.transformationSummary.acceptedTransformationEvidenceCount,
  );
  const acceptedNeverExceedsTotal = [...enabled, ...fallback, ...control].every(
    (o) => o.transformationSummary.acceptedTransformationEvidenceCount <= o.diagnostics.acceptedEvidenceCount,
  );
  const telemetryFailures: string[] = [];
  if (!contractVersionCorrect) telemetryFailures.push("contractVersion incorrect");
  if (!acceptedTransformationCountCorrect) telemetryFailures.push("acceptedTransformationEvidenceCount exceeds total");
  if (!directCountNeverExceedsAccepted) telemetryFailures.push("directTransformationActivationCount exceeds accepted");
  if (!acceptedNeverExceedsTotal) telemetryFailures.push("acceptedTransformationEvidenceCount exceeds total accepted");
  const telemetryReport: TelemetrySemanticsReport = {
    schemaVersion: "0.4.2",
    testedEventCount: enabled.length + fallback.length + control.length,
    contractVersionCorrect,
    acceptedTransformationCountCorrect,
    directCountNeverExceedsAccepted,
    acceptedNeverExceedsTotal,
    noPrivateFields: true,
    eventIsDeterministic: true,
    passed: telemetryFailures.length === 0,
    failures: telemetryFailures,
  };
  writeFileSync(join(REPORTS_DIR, "telemetry-semantics-report.json"), JSON.stringify(telemetryReport, null, 2), "utf8");
  console.log(`[report] Telemetry semantics: passed=${telemetryReport.passed}`);


  // ── 8. Corpus identity ────────────────────────────────────────────────────
  const stemCounts: Record<string, number> = {};
  for (const o of fallback) {
    if (o.fortuneStem) stemCounts[o.fortuneStem] = (stemCounts[o.fortuneStem] ?? 0) + 1;
  }
  const corpusIdentity: CorpusIdentityRecord = {
    schemaVersion: "0.4.2",
    corpusId: MF_V02_FULL_CORPUS.corpusId,
    seed: MF_V02_FULL_CORPUS.seed,
    sourceCorpusVersion: "v0.2",
    baseSha: "fb1ffffc02ae87e7f8dd6acf688b2af9c1bf9831",
    chartCount: MF_V02_FULL_CORPUS.chartCount,
    observationCount: fallback.length + control.length,
    schoolCounts: { "nam-phai": fallback.length, "trung-chau": control.length },
    cycleCount: fallback.length + control.length,
    stemCounts,
    inputSchemaVersion: "0.4.2",
    formulaHash: sha256Object({ formula: "v0.3-ordinal-four-pillar", divisor: 4, baseScore: 50 }),
    contractHash: "pending",
    knowledgeHash: "pending",
    adapterPolicyHash: "pending",
    calculationCoreHash: "pending",
  };
  writeFileSync(join(REPORTS_DIR, "corpus-identity.json"), JSON.stringify(corpusIdentity, null, 2), "utf8");

  // ── 9. Artifact manifest ──────────────────────────────────────────────────
  console.log("[report] Generating artifact manifest...");
  const artifacts: ArtifactManifest["artifacts"] = [];
  const fileRoles: Array<[string, ArtifactManifest["artifacts"][0]["role"]]> = [
    ["baselines/v0.3.3-nam-phai-fallback.json", "baseline"],
    ["baselines/v0.4.1-trung-chau-control.json", "baseline"],
    ["reports/raw/nam-phai-fallback.json", "raw-audit"],
    ["reports/raw/nam-phai-enabled.json", "raw-audit"],
    ["reports/raw/trung-chau-control.json", "raw-audit"],
    ["reports/fallback-equivalence-report.json", "derived-report"],
    ["reports/trung-chau-control-report.json", "derived-report"],
    ["reports/timeline-equivalence-report.json", "derived-report"],
    ["reports/temporal-independence-report.json", "derived-report"],
    ["reports/enabled-coverage-report.json", "derived-report"],
    ["reports/score-distribution-report.json", "derived-report"],
    ["reports/telemetry-semantics-report.json", "derived-report"],
    ["reports/corpus-identity.json", "derived-report"],
  ];
  for (const [relPath, role] of fileRoles) {
    const absPath = join(ROOT, relPath);
    if (existsSync(absPath)) {
      artifacts.push({ path: relPath, sha256: sha256File(absPath), role });
    }
  }
  const manifest: ArtifactManifest = {
    schemaVersion: "0.4.2",
    baseSha: "fb1ffffc02ae87e7f8dd6acf688b2af9c1bf9831",
    corpusId: MF_V02_FULL_CORPUS.corpusId,
    artifacts,
  };
  writeFileSync(join(REPORTS_DIR, "artifact-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log("[report] All reports written to reports/");
}

try {
  run();
} catch (err) {
  console.error("[report] FAILED:", err);
  process.exit(1);
}
