import { analyzeAllPalaces } from "../../../modules/palace-overview/analyze-all-palaces";
import type { PalaceOverviewResult } from "../../../modules/palace-overview/types";
import type { CorrectionExposure } from "../types";
import { evidenceIdSet, numericDeltaStats, round6, setDiff, stableSortByKey } from "../metrics";
import type { CounterfactualPair } from "../counterfactual";

export interface PalaceOverviewObservation {
  caseId: string;
  palaceIndex: number;
  palaceName: string;
  exposed: boolean;
  exposure: CorrectionExposure;
  preScore: number;
  postScore: number;
  signedDelta: number;
  absoluteDelta: number;
  preBand: string;
  postBand: string;
  bandChanged: boolean;
  evidenceAdded: string[];
  evidenceRemoved: string[];
  topDriverBefore: string | null;
  topDriverAfter: string | null;
  topDriverReplaced: boolean;
  khoaTargetBefore: string | null;
  khoaTargetAfter: string | null;
  classification: string;
}

function topDriverId(drivers: Array<{ id: string }>): string | null {
  return drivers[0]?.id ?? null;
}

export function runPalaceOverviewSensitivity(
  caseId: string,
  pair: CounterfactualPair,
): PalaceOverviewObservation[] {
  const pre = analyzeAllPalaces(pair.preChart, { school: "trung-chau" });
  const post = analyzeAllPalaces(pair.postChart, { school: "trung-chau" });
  // PO transformation facts come only from natalMutagens.
  const exposed = pair.exposure.natalKhoaChanged;
  const khoaBefore = pair.khoaTargets.natal.pre.starName;
  const khoaAfter = pair.khoaTargets.natal.post.starName;

  const byIndex = new Map<number, PalaceOverviewResult>(
    post.results.map((r) => [r.palaceIndex, r]),
  );
  const observations: PalaceOverviewObservation[] = [];

  for (const preResult of stableSortByKey(
    pre.results,
    (r) => String(r.palaceIndex).padStart(2, "0"),
  )) {
    const postResult = byIndex.get(preResult.palaceIndex);
    if (!postResult) continue;
    const signedDelta = round6(postResult.score - preResult.score);
    const absoluteDelta = Math.abs(signedDelta);
    const preIds = evidenceIdSet(preResult.allEvidence);
    const postIds = evidenceIdSet(postResult.allEvidence);
    const evidenceAdded = setDiff(postIds, preIds);
    const evidenceRemoved = setDiff(preIds, postIds);
    const topBefore = topDriverId(preResult.topSupportDrivers);
    const topAfter = topDriverId(postResult.topSupportDrivers);
    const bandChanged = preResult.band !== postResult.band;

    let classification = "EXPECTED_ANALYSIS_RESPONSE";
    if (!exposed && absoluteDelta !== 0) classification = "UNEXPECTED_DELTA";
    else if (!exposed) classification = "EXPECTED_ANALYSIS_RESPONSE";
    else if (absoluteDelta === 0 && (evidenceAdded.length > 0 || evidenceRemoved.length > 0)) {
      classification = "PHYSICAL_CORRECTION_PROPAGATION";
    } else if (absoluteDelta !== 0) {
      classification = "EXPECTED_ANALYSIS_RESPONSE";
    } else if (
      pair.khoaTargets.natal.pre.starName !== pair.khoaTargets.natal.post.starName
    ) {
      classification = "PHYSICAL_CORRECTION_PROPAGATION";
    }

    observations.push({
      caseId,
      palaceIndex: preResult.palaceIndex,
      palaceName: preResult.palaceName,
      exposed,
      exposure: pair.exposure,
      preScore: preResult.score,
      postScore: postResult.score,
      signedDelta,
      absoluteDelta,
      preBand: preResult.band,
      postBand: postResult.band,
      bandChanged,
      evidenceAdded,
      evidenceRemoved,
      topDriverBefore: topBefore,
      topDriverAfter: topAfter,
      topDriverReplaced: topBefore !== topAfter,
      khoaTargetBefore: khoaBefore,
      khoaTargetAfter: khoaAfter,
      classification,
    });
  }

  return observations;
}

export function summarizePalaceOverview(observations: PalaceOverviewObservation[]) {
  const control = observations.filter((o) => !o.exposed);
  const exposed = observations.filter((o) => o.exposed);
  const controlDeltas = control.map((o) => o.signedDelta);
  const exposedDeltas = exposed.map((o) => o.signedDelta);
  const allDeltas = observations.map((o) => o.signedDelta);
  return {
    observations: observations.length,
    exposed: exposed.length,
    changed: observations.filter((o) => o.absoluteDelta !== 0).length,
    controlMaxAbsDelta: Math.max(0, ...control.map((o) => o.absoluteDelta)),
    controlStats: numericDeltaStats(controlDeltas),
    exposedStats: numericDeltaStats(exposedDeltas),
    allStats: numericDeltaStats(allDeltas),
    bandFlips: observations.filter((o) => o.bandChanged).length,
    unexpectedControlDeltas: control.filter((o) => o.absoluteDelta !== 0).length,
    topDriverReplacements: exposed.filter((o) => o.topDriverReplaced).length,
  };
}
