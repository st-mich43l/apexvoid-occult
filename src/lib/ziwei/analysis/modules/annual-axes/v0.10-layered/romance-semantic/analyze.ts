import type { ChartData } from "@/types/chart";
import type { PalaceOverviewResult } from "../../../palace-overview/types";
import {
  ALL_ROMANCE_AUDIT_PALACES,
  LEGACY_ROMANCE_ANCHORS,
  claimsForPalace,
  detectTendencyConflicts,
  loadRomanceDoctrineClaims,
  loadRomancePalaceResults,
  palaceByName,
  resolveClaimAgainstPalace,
} from "./collect";
import {
  classifySignals,
  decideResearchOutcome,
  modelBanner,
  reportStatusFromCoverage,
} from "./classify";
import { buildRomanceWarnings, summarizeCoverageNote } from "./diagnostics";
import type {
  RomancePalaceBaselineSnapshot,
  RomanceSemanticClaimResolution,
  RomanceSemanticCoverage,
  RomanceSemanticReportV01,
} from "./types";

function adjDist(claims: RomanceSemanticClaimResolution[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of claims) {
    out[c.adjudication] = (out[c.adjudication] ?? 0) + 1;
  }
  return out;
}

function buildPalaceBaseline(
  palace: PalaceOverviewResult,
  doctrineClaimCount: number,
  resolutions: RomanceSemanticClaimResolution[],
  conflictIds: string[],
): RomancePalaceBaselineSnapshot {
  const admitted = resolutions.filter((r) => r.status === "admitted");
  const rejected = resolutions.filter(
    (r) =>
      r.status === "rejected-condition" ||
      r.status === "rejected-school" ||
      r.status === "rejected-source",
  );
  const unresolved = resolutions.filter((r) => r.status === "unresolved-condition");

  return {
    palace: palace.palaceName,
    majorStars: palace.majorStars.map((m) => ({
      name: m.name,
      brightness: m.brightness,
      brightnessStatus: m.brightnessStatus,
    })),
    rawAxes: { ...palace.rawAxes },
    structureNet: palace.structureNet ?? null,
    score: palace.score,
    annotationCount: palace.annotations?.length ?? 0,
    palaceDomainCandidateCount: palace.palaceDomainCandidates?.length ?? 0,
    doctrineClaimCount,
    admittedClaimIds: admitted.map((c) => c.claimId).sort((a, b) => a.localeCompare(b)),
    rejectedClaimIds: rejected.map((c) => c.claimId).sort((a, b) => a.localeCompare(b)),
    unresolvedClaimIds: unresolved.map((c) => c.claimId).sort((a, b) => a.localeCompare(b)),
    conflictIds: [...conflictIds].sort((a, b) => a.localeCompare(b)),
    adjudicationDistribution: adjDist(resolutions),
  };
}

/**
 * Build the non-numeric Romance Semantic V0.1 report.
 * Never writes score / signedNet / masses for compose.
 */
export function analyzeRomanceSemanticV01(input: {
  chart: ChartData;
  palaceResults?: PalaceOverviewResult[];
}): RomanceSemanticReportV01 {
  const palaceResults =
    input.palaceResults ?? loadRomancePalaceResults(input.chart);
  const doctrine = loadRomanceDoctrineClaims();

  const allResolutions: RomanceSemanticClaimResolution[] = [];
  const observedMajorStars: RomanceSemanticReportV01["observedMajorStars"] = [];
  const palaceBaselines: RomancePalaceBaselineSnapshot[] = [];
  const diagnostics: string[] = [];

  let observedEligibleStars = 0;
  let starsWithAnyDoctrineClaim = 0;
  let starsWithAdmittedClaim = 0;
  let zeroEvidencePalaceCount = 0;
  const sourceTierDistribution: Record<string, number> = {};
  const palaceCoverage: RomanceSemanticCoverage["palaceCoverage"] = {};

  for (const palaceName of ALL_ROMANCE_AUDIT_PALACES) {
    const palace = palaceByName(palaceResults, palaceName);
    if (!palace) {
      diagnostics.push(`missing-palace:${palaceName}`);
      zeroEvidencePalaceCount += 1;
      palaceCoverage[palaceName] = {
        observedStars: 0,
        doctrineClaims: 0,
        admitted: 0,
        unresolved: 0,
      };
      continue;
    }

    const claims = claimsForPalace(doctrine, palaceName);
    const observedNames = new Set(palace.majorStars.map((m) => m.name));
    observedEligibleStars += palace.majorStars.length;
    for (const m of palace.majorStars) {
      observedMajorStars.push({
        palace: palaceName,
        name: m.name,
        brightness: m.brightness,
      });
    }

    // Evaluate claims whose star is observed in this palace.
    const relevant = claims.filter((c) => observedNames.has(c.star));
    const resolutions = relevant.map((c) => resolveClaimAgainstPalace(c, palace));
    allResolutions.push(...resolutions);

    const starsWithDoctrine = new Set(relevant.map((c) => c.star));
    starsWithAnyDoctrineClaim += starsWithDoctrine.size;
    const admittedHere = resolutions.filter((r) => r.status === "admitted");
    const starsAdmitted = new Set(admittedHere.map((c) => c.starOrSystem));
    starsWithAdmittedClaim += starsAdmitted.size;
    const unresolvedHere = resolutions.filter(
      (r) => r.status === "unresolved-condition",
    );

    if (admittedHere.length === 0 && relevant.length === 0) {
      zeroEvidencePalaceCount += 1;
    }

    for (const r of resolutions) {
      const tierKey = r.tier;
      sourceTierDistribution[tierKey] =
        (sourceTierDistribution[tierKey] ?? 0) + 1;
    }

    palaceCoverage[palaceName] = {
      observedStars: palace.majorStars.length,
      doctrineClaims: relevant.length,
      admitted: admittedHere.length,
      unresolved: unresolvedHere.length,
    };

    // Conflicts computed after full admit list; placeholder ids filled below.
    palaceBaselines.push(
      buildPalaceBaseline(palace, claims.length, resolutions, []),
    );
  }

  const admittedClaims = allResolutions
    .filter((r) => r.status === "admitted")
    .sort((a, b) => a.claimId.localeCompare(b.claimId));
  const unresolvedClaims = allResolutions
    .filter((r) => r.status === "unresolved-condition")
    .sort((a, b) => a.claimId.localeCompare(b.claimId));
  const rejectedClaims = allResolutions
    .filter(
      (r) =>
        r.status === "rejected-condition" ||
        r.status === "rejected-school" ||
        r.status === "rejected-source",
    )
    .sort((a, b) => a.claimId.localeCompare(b.claimId));

  const conflicts = detectTendencyConflicts(admittedClaims);
  // Mark conflicted claims (keep them admitted but status conflict for visibility).
  const conflictClaimIds = new Set(conflicts.flatMap((c) => c.claimIds));
  for (const c of admittedClaims) {
    if (conflictClaimIds.has(c.claimId)) {
      c.status = "conflict";
    }
  }
  // Spec: conflicts remain visible; move conflict-status copies into diagnostics
  // while keeping originals in admitted list as conflict status.
  const conflictResolutions = admittedClaims.filter((c) => c.status === "conflict");

  // Refresh baselines with conflict ids
  for (let i = 0; i < palaceBaselines.length; i++) {
    const b = palaceBaselines[i]!;
    const ids = conflicts
      .filter((c) => c.palace === b.palace)
      .flatMap((c) => c.claimIds);
    palaceBaselines[i] = { ...b, conflictIds: [...new Set(ids)].sort() };
  }

  const verifiedAdmitted = admittedClaims.filter(
    (c) =>
      (c.adjudication === "VERIFIED_PRIMARY" ||
        c.adjudication === "VERIFIED_SCHOOL") &&
      c.status !== "conflict",
  ).length;
  // Count conflict+admitted verified separately for coverage
  const verifiedIncludingConflict = admittedClaims.filter(
    (c) =>
      c.adjudication === "VERIFIED_PRIMARY" || c.adjudication === "VERIFIED_SCHOOL",
  ).length;
  const expertOnly = admittedClaims.filter(
    (c) => c.adjudication === "EXPERT_SYNTHESIS",
  ).length;

  const coverage: RomanceSemanticCoverage = {
    observedEligibleStars,
    starsWithAnyDoctrineClaim,
    starsWithAdmittedClaim,
    unresolvedConditionalClaimCount: unresolvedClaims.length,
    expertSynthesisOnlyClaimCount: expertOnly,
    verifiedAdmittedClaimCount: Math.max(verifiedAdmitted, verifiedIncludingConflict),
    zeroEvidencePalaceCount,
    conflictCount: conflicts.length,
    sourceTierDistribution,
    palaceCoverage,
  };

  const signals = classifySignals(
    admittedClaims.filter((c) => c.status === "admitted" || c.status === "conflict"),
  );
  const unresolvedSignals = unresolvedClaims.map(
    (c) => `${c.claimId}:${c.starOrSystem}@${c.palace}`,
  );

  const catalogPhuTheVerifiedClaims = doctrine.filter(
    (c) =>
      c.palace === "Phu Thê" &&
      (c.adjudication === "VERIFIED_PRIMARY" ||
        c.adjudication === "VERIFIED_SCHOOL"),
  ).length;
  const catalogTuTucVerifiedClaims = doctrine.filter(
    (c) =>
      c.palace === "Tử Tức" &&
      (c.adjudication === "VERIFIED_PRIMARY" ||
        c.adjudication === "VERIFIED_SCHOOL"),
  ).length;

  const researchDecision = decideResearchOutcome({
    verifiedAdmitted: coverage.verifiedAdmittedClaimCount,
    expertOnly,
    unresolved: unresolvedClaims.length,
    conflicts: conflicts.length,
    observedStars: observedEligibleStars,
    starsWithDoctrine: starsWithAnyDoctrineClaim,
    starsWithAdmitted: starsWithAdmittedClaim,
    catalogPhuTheVerifiedClaims,
    catalogTuTucVerifiedClaims,
  });

  const status = reportStatusFromCoverage(coverage, admittedClaims.length);

  const provenanceClaimIds = [
    ...new Set(allResolutions.map((r) => r.claimId)),
  ].sort((a, b) => a.localeCompare(b));
  const provenanceSourceIds = [
    ...new Set(allResolutions.flatMap((r) => r.sourceIds)),
  ].sort((a, b) => a.localeCompare(b));

  diagnostics.push(summarizeCoverageNote(coverage));
  diagnostics.push(`researchDecision=${researchDecision}`);
  if (conflictResolutions.length > 0) {
    diagnostics.push(`conflictClaims=${conflictResolutions.map((c) => c.claimId).join(",")}`);
  }
  for (const anchor of LEGACY_ROMANCE_ANCHORS) {
    const base = palaceBaselines.find((b) => b.palace === anchor);
    if (base) {
      diagnostics.push(
        `${anchor}: rawAxes support=${base.rawAxes.support.toFixed(3)} pressure=${base.rawAxes.pressure.toFixed(3)} structureNet=${base.structureNet ?? "null"} doctrineClaims=${base.doctrineClaimCount} admitted=${base.admittedClaimIds.length}`,
      );
    }
  }

  const draft: RomanceSemanticReportV01 = {
    ...modelBanner(),
    status,
    observedMajorStars: observedMajorStars.sort((a, b) =>
      `${a.palace}:${a.name}`.localeCompare(`${b.palace}:${b.name}`),
    ),
    admittedClaims,
    rejectedClaims,
    unresolvedClaims,
    conflicts,
    supportSignals: signals.supportSignals,
    pressureSignals: signals.pressureSignals,
    mixedSignals: signals.mixedSignals,
    unresolvedSignals,
    coverage,
    palaceBaselines,
    diagnostics,
    warnings: [],
    researchDecision,
    provenance: {
      sourceIds: provenanceSourceIds,
      claimIds: provenanceClaimIds,
    },
  };
  draft.warnings = buildRomanceWarnings(draft);
  return draft;
}
