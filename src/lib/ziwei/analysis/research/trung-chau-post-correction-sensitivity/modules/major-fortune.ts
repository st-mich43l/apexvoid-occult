import type { ChartData } from "@/types/chart";
import { analyzeMajorFortuneCandidateV05 } from "../../../modules/major-fortune/v0.5-candidate/candidate";
import { analyzeMajorFortuneV1 } from "../../../modules/major-fortune/engine-v1/analyze";
import { anyChartLayerExposed } from "../exposure";
import { numericDeltaStats, round6 } from "../metrics";
import type { CounterfactualPair } from "../counterfactual";
import type { CorrectionExposure } from "../types";

export interface MajorFortuneObservation {
  caseId: string;
  experiment: "MF-A" | "MF-B" | "MF-C";
  deltaKind: "CORRECTION_DELTA" | "MODEL_DELTA";
  exposed: boolean;
  exposure: CorrectionExposure;
  /** Natal layer drives TC V0.5 XF (luck-stem XF disabled by adapter policy). */
  natalExposed: boolean;
  preScore: number | null;
  postScore: number | null;
  signedDelta: number;
  absoluteDelta: number;
  preBand: string | null;
  postBand: string | null;
  bandChanged: boolean;
  classification: string;
  note: string | null;
}

function cycleFromChart(chart: ChartData): {
  cycleIndex: number;
  startAge: number;
  endAge: number;
  activePalaceIndex: number;
} | null {
  const palace = chart.majorFortunePalace;
  const mf = palace?.majorFortune;
  if (!palace || mf?.order == null || mf.start == null || mf.end == null) return null;
  return {
    cycleIndex: mf.order,
    startAge: mf.start,
    endAge: mf.end,
    activePalaceIndex: palace.index,
  };
}

/**
 * MF-A: V0.5 PRE vs POST physical facts.
 * Uses chart mutagen arrays WITHOUT cycleOverride so PRE majorMutagens are not
 * overwritten by live school policy re-resolution. TC adapter scores natal XF only.
 */
export function runMajorFortuneV05Correction(
  caseId: string,
  pair: CounterfactualPair,
): MajorFortuneObservation {
  const exposed = anyChartLayerExposed(pair.exposure);
  const natalExposed = pair.exposure.natalKhoaChanged;
  const pre = analyzeMajorFortuneCandidateV05(pair.preChart, { school: "trung-chau" });
  const post = analyzeMajorFortuneCandidateV05(pair.postChart, { school: "trung-chau" });
  const preScore = pre.result?.score ?? null;
  const postScore = post.result?.score ?? null;
  const signedDelta =
    preScore == null || postScore == null ? 0 : round6(postScore - preScore);
  const absoluteDelta = Math.abs(signedDelta);
  const preBand = pre.result?.band ?? null;
  const postBand = post.result?.band ?? null;

  let classification = "EXPECTED_ANALYSIS_RESPONSE";
  if (!natalExposed && absoluteDelta !== 0) classification = "UNEXPECTED_DELTA";
  else if (!natalExposed && absoluteDelta === 0) classification = "EXPECTED_ANALYSIS_RESPONSE";
  else if (natalExposed && absoluteDelta !== 0) classification = "EXPECTED_ANALYSIS_RESPONSE";
  else if (natalExposed && absoluteDelta === 0) {
    classification = "PHYSICAL_CORRECTION_PROPAGATION";
  }

  return {
    caseId,
    experiment: "MF-A",
    deltaKind: "CORRECTION_DELTA",
    exposed,
    exposure: pair.exposure,
    natalExposed,
    preScore,
    postScore,
    signedDelta,
    absoluteDelta,
    preBand,
    postBand,
    bandChanged: preBand !== postBand,
    classification,
    note:
      "TC V0.5 adapter policy: scoreLuckStemMutagens=false; natal year-stem XF only.",
  };
}

/**
 * MF-B: V1 PRE vs POST. V1 does not score luck-stem or natal year-stem Tứ Hóa.
 * Score deltas are expected to be exact zero → COVERAGE_GAP for XF sensitivity.
 */
export function runMajorFortuneV1Correction(
  caseId: string,
  pair: CounterfactualPair,
): MajorFortuneObservation {
  const cycle = cycleFromChart(pair.postChart);
  const exposed = anyChartLayerExposed(pair.exposure);
  if (!cycle) {
    return {
      caseId,
      experiment: "MF-B",
      deltaKind: "CORRECTION_DELTA",
      exposed,
      exposure: pair.exposure,
      natalExposed: pair.exposure.natalKhoaChanged,
      preScore: null,
      postScore: null,
      signedDelta: 0,
      absoluteDelta: 0,
      preBand: null,
      postBand: null,
      bandChanged: false,
      classification: "COVERAGE_GAP",
      note: "No major fortune cycle metadata on chart; V1 requires cycleOverride.",
    };
  }

  const pre = analyzeMajorFortuneV1(pair.preChart, {
    school: "trung-chau",
    cycleOverride: cycle,
  });
  const post = analyzeMajorFortuneV1(pair.postChart, {
    school: "trung-chau",
    cycleOverride: cycle,
  });
  const preScore = pre?.score?.normalizedScore ?? null;
  const postScore = post?.score?.normalizedScore ?? null;
  const signedDelta =
    preScore == null || postScore == null ? 0 : round6(postScore - preScore);
  const absoluteDelta = Math.abs(signedDelta);
  const preBand = pre?.score?.band ?? null;
  const postBand = post?.score?.band ?? null;

  let classification: string = "COVERAGE_GAP";
  if (absoluteDelta !== 0) {
    // V1 claims not to score Tứ Hóa — nonzero is unexpected harness/architecture signal.
    classification = "UNEXPECTED_DELTA";
  }

  return {
    caseId,
    experiment: "MF-B",
    deltaKind: "CORRECTION_DELTA",
    exposed,
    exposure: pair.exposure,
    natalExposed: pair.exposure.natalKhoaChanged,
    preScore,
    postScore,
    signedDelta,
    absoluteDelta,
    preBand,
    postBand,
    bandChanged: preBand !== postBand,
    classification,
    note:
      "V1 evaluate.ts: luck-stem Tứ Hóa not scored; natal year-stem hóa not this shadow path.",
  };
}

/** MF-C: model delta only (V0.5 POST vs V1 POST). Not correction sensitivity. */
export function runMajorFortuneModelDelta(
  caseId: string,
  pair: CounterfactualPair,
): MajorFortuneObservation {
  const cycle = cycleFromChart(pair.postChart);
  const v05 = analyzeMajorFortuneCandidateV05(pair.postChart, { school: "trung-chau" });
  const v1 = cycle
    ? analyzeMajorFortuneV1(pair.postChart, {
        school: "trung-chau",
        cycleOverride: cycle,
      })
    : null;
  const preScore = v05.result?.score ?? null;
  const postScore = v1?.score?.normalizedScore ?? null;
  const signedDelta =
    preScore == null || postScore == null ? 0 : round6(postScore - preScore);
  return {
    caseId,
    experiment: "MF-C",
    deltaKind: "MODEL_DELTA",
    exposed: anyChartLayerExposed(pair.exposure),
    exposure: pair.exposure,
    natalExposed: pair.exposure.natalKhoaChanged,
    preScore,
    postScore,
    signedDelta,
    absoluteDelta: Math.abs(signedDelta),
    preBand: v05.result?.band ?? null,
    postBand: v1?.score?.band ?? null,
    bandChanged: (v05.result?.band ?? null) !== (v1?.score?.band ?? null),
    classification: "COVERAGE_GAP",
    note: "MODEL_DELTA only — not merged into correction-sensitivity stats.",
  };
}

export function summarizeMajorFortune(
  observations: MajorFortuneObservation[],
  experiment: "MF-A" | "MF-B",
) {
  const rows = observations.filter((o) => o.experiment === experiment);
  const control = rows.filter((o) =>
    experiment === "MF-A" ? !o.natalExposed : !o.exposed,
  );
  const exposed = rows.filter((o) =>
    experiment === "MF-A" ? o.natalExposed : o.exposed,
  );
  return {
    observations: rows.length,
    exposed: exposed.length,
    changed: rows.filter((o) => o.absoluteDelta !== 0).length,
    controlMaxAbsDelta: Math.max(0, ...control.map((o) => o.absoluteDelta)),
    controlStats: numericDeltaStats(control.map((o) => o.signedDelta)),
    exposedStats: numericDeltaStats(exposed.map((o) => o.signedDelta)),
    allStats: numericDeltaStats(rows.map((o) => o.signedDelta)),
    bandFlips: rows.filter((o) => o.bandChanged).length,
    unexpectedControlDeltas: control.filter((o) => o.absoluteDelta !== 0).length,
    coverageGapCount: rows.filter((o) => o.classification === "COVERAGE_GAP").length,
  };
}
