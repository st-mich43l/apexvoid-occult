/**
 * PR #265 research entry — post-Trung-Châu Mậu/Nhâm Khoa correction sensitivity.
 * Research-only: must not be imported by production routers.
 */
import { assertApprovedCorrectionContract, prePostPolicyCellDifferences } from "./policy";
import { corpusInventory, loadFullTrungChauCorpus } from "./corpus";
import { buildPreCorrectionShadowChart } from "./counterfactual";
import {
  runPalaceOverviewSensitivity,
  summarizePalaceOverview,
} from "./modules/palace-overview";
import {
  runAnnualAxesSensitivity,
  summarizeAnnualAxes,
} from "./modules/annual-axes";
import {
  runMajorFortuneModelDelta,
  runMajorFortuneV05Correction,
  runMajorFortuneV1Correction,
  summarizeMajorFortune,
} from "./modules/major-fortune";
import {
  assertTcMonthlyProductionUnavailable,
  runMonthlyFlowV1ShadowSensitivity,
  summarizeMonthlyFlowV1,
  MONTHLY_FLOW_V1_SHADOW_LABEL,
} from "./modules/monthly-flow-v1";
import type { ModuleSummaryRow, SensitivityClassification } from "./types";
import { stableSortByKey } from "./metrics";

export const RESEARCH_SCHEMA_VERSION = "pr265-tc-post-correction-sensitivity.v1";
export const RESEARCH_GENERATION_ID = "trung-chau/v0.4-post-correction-sensitivity";

export function buildSensitivityReport(baseSha: string) {
  assertApprovedCorrectionContract();
  assertTcMonthlyProductionUnavailable();

  const corpus = loadFullTrungChauCorpus();
  const inventory = corpusInventory(corpus);

  const poObs = [];
  const aaObs = [];
  const mfA = [];
  const mfB = [];
  const mfC = [];
  const monthlyObs = [];

  for (const c of corpus) {
    const pair = buildPreCorrectionShadowChart(c.postChart);
    poObs.push(...runPalaceOverviewSensitivity(c.caseId, pair));
    aaObs.push(...runAnnualAxesSensitivity(c.caseId, pair));
    mfA.push(runMajorFortuneV05Correction(c.caseId, pair));
    mfB.push(runMajorFortuneV1Correction(c.caseId, pair));
    mfC.push(runMajorFortuneModelDelta(c.caseId, pair));
    monthlyObs.push(...runMonthlyFlowV1ShadowSensitivity(c.caseId, c.postChart));
  }

  const poSummary = summarizePalaceOverview(poObs);
  const aaSummary = summarizeAnnualAxes(aaObs);
  const mfASummary = summarizeMajorFortune(mfA, "MF-A");
  const mfBSummary = summarizeMajorFortune(mfB, "MF-B");
  const monthlySummary = summarizeMonthlyFlowV1(monthlyObs);

  const classifications = tallyClassifications([
    ...poObs.map((o) => o.classification),
    ...aaObs.map((o) => o.classification),
    ...mfA.map((o) => o.classification),
    ...mfB.map((o) => o.classification),
    ...monthlyObs.map((o) => o.classification),
  ]);

  const globalSummary: ModuleSummaryRow[] = [
    {
      module: "Palace Overview",
      observations: poSummary.observations,
      exposed: poSummary.exposed,
      changed: poSummary.changed,
      controlMaxAbsDelta: poSummary.controlMaxAbsDelta,
      medianAbsDelta: poSummary.exposedStats.medianAbsoluteDelta,
      p95AbsDelta: poSummary.exposedStats.p95AbsoluteDelta,
      maxAbsDelta: poSummary.exposedStats.maxAbsoluteDelta,
      bandFlips: poSummary.bandFlips,
      verdict: poSummary.unexpectedControlDeltas === 0 ? "coherent" : "UNEXPECTED_DELTA",
    },
    {
      module: "Annual Axes",
      observations: aaSummary.observations,
      exposed: aaSummary.exposed,
      changed: aaSummary.changed,
      controlMaxAbsDelta: aaSummary.controlMaxAbsDelta,
      medianAbsDelta: aaSummary.exposedStats.medianAbsoluteDelta,
      p95AbsDelta: aaSummary.exposedStats.p95AbsoluteDelta,
      maxAbsDelta: aaSummary.exposedStats.maxAbsoluteDelta,
      bandFlips: aaSummary.bandFlips,
      verdict: aaSummary.unexpectedControlDeltas === 0 ? "coherent" : "UNEXPECTED_DELTA",
    },
    {
      module: "Major Fortune V0.5",
      observations: mfASummary.observations,
      exposed: mfASummary.exposed,
      changed: mfASummary.changed,
      controlMaxAbsDelta: mfASummary.controlMaxAbsDelta,
      medianAbsDelta: mfASummary.exposedStats.medianAbsoluteDelta,
      p95AbsDelta: mfASummary.exposedStats.p95AbsoluteDelta,
      maxAbsDelta: mfASummary.exposedStats.maxAbsoluteDelta,
      bandFlips: mfASummary.bandFlips,
      verdict: mfASummary.unexpectedControlDeltas === 0 ? "coherent" : "UNEXPECTED_DELTA",
    },
    {
      module: "Major Fortune V1",
      observations: mfBSummary.observations,
      exposed: mfBSummary.exposed,
      changed: mfBSummary.changed,
      controlMaxAbsDelta: mfBSummary.controlMaxAbsDelta,
      medianAbsDelta: mfBSummary.exposedStats.medianAbsoluteDelta,
      p95AbsDelta: mfBSummary.exposedStats.p95AbsoluteDelta,
      maxAbsDelta: mfBSummary.exposedStats.maxAbsoluteDelta,
      bandFlips: mfBSummary.bandFlips,
      verdict:
        mfBSummary.coverageGapCount === mfBSummary.observations &&
        mfBSummary.changed === 0
          ? "COVERAGE_GAP (V1 unscored XF)"
          : mfBSummary.unexpectedControlDeltas === 0
            ? "coherent"
            : "UNEXPECTED_DELTA",
    },
    {
      module: "Monthly V1 shadow",
      observations: monthlySummary.observations,
      exposed: monthlySummary.exposed,
      changed: monthlySummary.changed,
      controlMaxAbsDelta: monthlySummary.controlMaxAbsDelta,
      medianAbsDelta: monthlySummary.exposedStats.medianAbsoluteDelta,
      p95AbsDelta: monthlySummary.exposedStats.p95AbsoluteDelta,
      maxAbsDelta: monthlySummary.exposedStats.maxAbsoluteDelta,
      bandFlips: monthlySummary.bandFlips,
      verdict:
        monthlySummary.calendarInvariantFailures === 0 &&
        monthlySummary.unexpectedControlDeltas === 0
          ? "coherent"
          : "UNEXPECTED_DELTA",
    },
  ];

  const controlOk =
    poSummary.unexpectedControlDeltas === 0 &&
    aaSummary.unexpectedControlDeltas === 0 &&
    mfASummary.unexpectedControlDeltas === 0 &&
    monthlySummary.unexpectedControlDeltas === 0 &&
    monthlySummary.calendarInvariantFailures === 0;

  const outliers = {
    palaceOverview: stableSortByKey(
      poObs.filter((o) => o.exposed && o.absoluteDelta > 0),
      (o) => `${String(o.absoluteDelta).padStart(8, "0")}:${o.caseId}:${o.palaceIndex}`,
    )
      .slice(-10)
      .reverse()
      .map((o) => ({
        caseId: o.caseId,
        palaceIndex: o.palaceIndex,
        absoluteDelta: o.absoluteDelta,
        bandChanged: o.bandChanged,
      })),
    annualAxes: stableSortByKey(
      aaObs.filter((o) => o.exposed && o.absoluteDelta > 0),
      (o) => `${String(o.absoluteDelta).padStart(8, "0")}:${o.caseId}:${o.domain}`,
    )
      .slice(-10)
      .reverse()
      .map((o) => ({
        caseId: o.caseId,
        domain: o.domain,
        absoluteDelta: o.absoluteDelta,
        cohort: o.cohort,
      })),
    monthly: stableSortByKey(
      monthlyObs.filter((o) => o.exposed && o.absoluteDelta > 0),
      (o) => `${String(o.absoluteDelta).padStart(8, "0")}:${o.caseId}:${o.monthKey}`,
    )
      .slice(-10)
      .reverse()
      .map((o) => ({
        caseId: o.caseId,
        monthKey: o.monthKey,
        absoluteDelta: o.absoluteDelta,
        calendarStem: o.preCalendarStem,
      })),
  };

  return {
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    generatedFrom: RESEARCH_GENERATION_ID,
    baseSha,
    corpus: inventory,
    correction: {
      diffs: prePostPolicyCellDifferences(),
      totalPolicyCellDiff: prePostPolicyCellDifferences().length,
    },
    globalSummary,
    modules: {
      palaceOverview: {
        summary: poSummary,
        // Compact: omit full observation dump from committed artifact size;
        // counts and stats are authoritative. Full obs available via regenerate.
        observationCount: poObs.length,
        sampleExposedChanged: outliers.palaceOverview,
      },
      annualAxes: {
        summary: aaSummary,
        observationCount: aaObs.length,
        sampleExposedChanged: outliers.annualAxes,
      },
      majorFortuneV05: {
        summary: mfASummary,
        observationCount: mfA.length,
      },
      majorFortuneV1: {
        summary: mfBSummary,
        observationCount: mfB.length,
        modelDeltaSampleCount: mfC.length,
        note: "MF-C model deltas excluded from correction sensitivity aggregates.",
      },
      monthlyFlowV1Shadow: {
        label: MONTHLY_FLOW_V1_SHADOW_LABEL,
        summary: monthlySummary,
        observationCount: monthlyObs.length,
        sampleExposedChanged: outliers.monthly,
      },
    },
    controls: {
      allExactZero: controlOk,
      palaceOverviewUnexpected: poSummary.unexpectedControlDeltas,
      annualAxesUnexpected: aaSummary.unexpectedControlDeltas,
      majorFortuneV05Unexpected: mfASummary.unexpectedControlDeltas,
      monthlyUnexpected: monthlySummary.unexpectedControlDeltas,
      monthlyCalendarInvariantFailures: monthlySummary.calendarInvariantFailures,
    },
    classifications,
    limitations: [
      "Major Fortune V0.5 TC adapter scores natal year-stem XF only (scoreLuckStemMutagens=false).",
      "Major Fortune V1 does not score luck-stem or natal year-stem Tứ Hóa → XF score sensitivity is COVERAGE_GAP.",
      "Monthly experiment varies provider.tuHoaTargets only on POST chart geometry.",
      "TC Monthly production remains unavailable (unsupported-school).",
      "No arbitrary abs(delta) instability threshold invented.",
      ...(aaSummary.coverageGaps.length
        ? [`Annual Axes cohort coverage gaps: ${aaSummary.coverageGaps.join(", ")}`]
        : []),
    ],
    outcome: controlOk
      ? {
          kind: "A_COHERENT_SENSITIVITY" as const,
          recommendation:
            "#266 refactor(research): consolidate deterministic analysis shadow-comparison tooling",
        }
      : {
          kind: "C_ARCHITECTURE_OR_HARNESS_ANOMALY" as const,
          recommendation:
            "STOP scoring work; investigate harness/control deltas before any tuning PR",
        },
  };
}

function tallyClassifications(values: string[]): Record<SensitivityClassification, number> {
  const out: Record<SensitivityClassification, number> = {
    PHYSICAL_CORRECTION_PROPAGATION: 0,
    EXPECTED_ANALYSIS_RESPONSE: 0,
    MODEL_INSTABILITY: 0,
    COVERAGE_GAP: 0,
    UNEXPECTED_DELTA: 0,
  };
  for (const v of values) {
    if (v in out) out[v as SensitivityClassification] += 1;
  }
  return out;
}

export type SensitivityReport = ReturnType<typeof buildSensitivityReport>;
