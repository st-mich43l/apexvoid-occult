import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import { analyzeAnnualAxes } from "../../../modules/annual-axes/released-router";
import type { AnnualAxisResult } from "../../../modules/annual-axes/released-types";
import { exposureCohort, anyChartLayerExposed } from "../exposure";
import { evidenceIdSet, numericDeltaStats, round6, setDiff } from "../metrics";
import type { CounterfactualPair } from "../counterfactual";
import type { CorrectionExposure, ExposureCohort } from "../types";

export interface AnnualAxesObservation {
  caseId: string;
  domain: AnnualAxisDomain;
  cohort: ExposureCohort;
  exposure: CorrectionExposure;
  exposed: boolean;
  preScore: number | null;
  postScore: number | null;
  signedDelta: number;
  absoluteDelta: number;
  preBand: string | null;
  postBand: string | null;
  bandChanged: boolean;
  signCrossing: boolean;
  domainRankBefore: number | null;
  domainRankAfter: number | null;
  rankingChanged: boolean;
  evidenceAdded: string[];
  evidenceRemoved: string[];
  topDriverBefore: string | null;
  topDriverAfter: string | null;
  topDriverReplaced: boolean;
  classification: string;
}

function scoreOf(axis: AnnualAxisResult): number | null {
  return axis.status === "unavailable" ? null : axis.score;
}

function bandOf(axis: AnnualAxisResult): string | null {
  return axis.status === "unavailable" ? null : axis.band;
}

function evidenceList(axis: AnnualAxisResult): Array<{ id: string }> {
  if (axis.status === "unavailable") return [];
  if ("evidence" in axis && Array.isArray(axis.evidence)) {
    return axis.evidence as Array<{ id: string }>;
  }
  if ("v08Evidence" in axis && Array.isArray(axis.v08Evidence)) {
    return (axis.v08Evidence as Array<{ id?: string; evidenceId?: string }>).map((e, i) => ({
      id: e.id ?? e.evidenceId ?? `v08-${i}`,
    }));
  }
  return [];
}

function topSupport(axis: AnnualAxisResult): string | null {
  if (axis.status === "unavailable") return null;
  if ("topSupportDrivers" in axis && Array.isArray(axis.topSupportDrivers)) {
    return (axis.topSupportDrivers[0] as { id?: string } | undefined)?.id ?? null;
  }
  if ("topSupportDriversV08" in axis && Array.isArray(axis.topSupportDriversV08)) {
    return (axis.topSupportDriversV08[0] as { id?: string } | undefined)?.id ?? null;
  }
  return null;
}

function domainRanks(
  axes: Record<AnnualAxisDomain, AnnualAxisResult>,
): Map<AnnualAxisDomain, number> {
  const scored = ANNUAL_AXIS_DOMAINS.map((domain) => ({
    domain,
    score: scoreOf(axes[domain]),
  }))
    .filter((x) => x.score != null)
    .sort((a, b) => (b.score! - a.score!) || a.domain.localeCompare(b.domain));
  const ranks = new Map<AnnualAxisDomain, number>();
  scored.forEach((row, i) => ranks.set(row.domain, i + 1));
  return ranks;
}

export function runAnnualAxesSensitivity(
  caseId: string,
  pair: CounterfactualPair,
): AnnualAxesObservation[] {
  const pre = analyzeAnnualAxes(pair.preChart, { school: "trung-chau" });
  const post = analyzeAnnualAxes(pair.postChart, { school: "trung-chau" });
  const exposed = anyChartLayerExposed(pair.exposure);
  const cohort = exposureCohort(pair.exposure);
  const preRanks = domainRanks(pre.axes);
  const postRanks = domainRanks(post.axes);
  const out: AnnualAxesObservation[] = [];

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const preAxis = pre.axes[domain];
    const postAxis = post.axes[domain];
    const preScore = scoreOf(preAxis);
    const postScore = scoreOf(postAxis);
    const signedDelta =
      preScore == null || postScore == null ? 0 : round6(postScore - preScore);
    const absoluteDelta = Math.abs(signedDelta);
    const preBand = bandOf(preAxis);
    const postBand = bandOf(postAxis);
    const preIds = evidenceIdSet(evidenceList(preAxis));
    const postIds = evidenceIdSet(evidenceList(postAxis));
    const evidenceAdded = setDiff(postIds, preIds);
    const evidenceRemoved = setDiff(preIds, postIds);
    const topBefore = topSupport(preAxis);
    const topAfter = topSupport(postAxis);
    const rankBefore = preRanks.get(domain) ?? null;
    const rankAfter = postRanks.get(domain) ?? null;
    const signCrossing =
      preScore != null &&
      postScore != null &&
      ((preScore < 50 && postScore >= 50) || (preScore >= 50 && postScore < 50));

    let classification = "EXPECTED_ANALYSIS_RESPONSE";
    if (!exposed && absoluteDelta !== 0) classification = "UNEXPECTED_DELTA";
    else if (exposed && absoluteDelta !== 0) classification = "EXPECTED_ANALYSIS_RESPONSE";
    else if (
      exposed &&
      (evidenceAdded.length > 0 || evidenceRemoved.length > 0)
    ) {
      classification = "PHYSICAL_CORRECTION_PROPAGATION";
    }

    out.push({
      caseId,
      domain,
      cohort,
      exposure: pair.exposure,
      exposed,
      preScore,
      postScore,
      signedDelta,
      absoluteDelta,
      preBand,
      postBand,
      bandChanged: preBand !== postBand,
      signCrossing,
      domainRankBefore: rankBefore,
      domainRankAfter: rankAfter,
      rankingChanged: rankBefore !== rankAfter,
      evidenceAdded,
      evidenceRemoved,
      topDriverBefore: topBefore,
      topDriverAfter: topAfter,
      topDriverReplaced: topBefore !== topAfter,
      classification,
    });
  }

  return out;
}

export function summarizeAnnualAxes(observations: AnnualAxesObservation[]) {
  const control = observations.filter((o) => !o.exposed);
  const exposed = observations.filter((o) => o.exposed);
  const cohortCounts: Record<ExposureCohort, number> = {
    NATAL_ONLY: 0,
    ANNUAL_ONLY: 0,
    MAJOR_ONLY: 0,
    MULTI_LAYER: 0,
    NO_EXPOSURE: 0,
  };
  for (const o of observations) {
    cohortCounts[o.cohort] += 1;
  }
  return {
    observations: observations.length,
    exposed: exposed.length,
    changed: observations.filter((o) => o.absoluteDelta !== 0).length,
    controlMaxAbsDelta: Math.max(0, ...control.map((o) => o.absoluteDelta)),
    controlStats: numericDeltaStats(control.map((o) => o.signedDelta)),
    exposedStats: numericDeltaStats(exposed.map((o) => o.signedDelta)),
    allStats: numericDeltaStats(observations.map((o) => o.signedDelta)),
    bandFlips: observations.filter((o) => o.bandChanged).length,
    signCrossings: observations.filter((o) => o.signCrossing).length,
    rankingChanges: observations.filter((o) => o.rankingChanged).length,
    topDriverReplacements: exposed.filter((o) => o.topDriverReplaced).length,
    unexpectedControlDeltas: control.filter((o) => o.absoluteDelta !== 0).length,
    cohortCounts,
    coverageGaps: [
      cohortCounts.NATAL_ONLY === 0 ? "NATAL_ONLY" : null,
      cohortCounts.ANNUAL_ONLY === 0 ? "ANNUAL_ONLY" : null,
      cohortCounts.MAJOR_ONLY === 0 ? "MAJOR_ONLY" : null,
      cohortCounts.MULTI_LAYER === 0 ? "MULTI_LAYER" : null,
      cohortCounts.NO_EXPOSURE === 0 ? "NO_EXPOSURE" : null,
    ].filter(Boolean),
  };
}
