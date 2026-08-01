import { MF_V02_FULL_CORPUS, calculateChart, expandAllMajorFortuneCycleObservations } from "../v0.2/corpus";
import { compareMajorFortuneShadowV05 } from "../../shadow";
import type { MajorFortuneShadowComparison } from "../../shadow-comparison";

interface MajorFortuneShadowAuditObservation {
  observationId: string;
  fixtureId?: string;
  school: "nam-phai" | "trung-chau";
  cycleIndex: number;
  baselineScore: number | null;
  candidateScore: number | null;
  comparisonStatus: MajorFortuneShadowComparison["status"];
  differenceCodes: string[];
  comparisonHash: string;
  blockedFamilyIds: string[];
  shadowOnlyFamilyIds: string[];
  invalidFamilyIds: string[];
}

export function runMajorFortuneV05ShadowAudit() {
  const observations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  const auditObservations: MajorFortuneShadowAuditObservation[] = [];

  const metrics = {
    totalObservations: 0,
    namPhaiObservations: 0,
    trungChauObservations: 0,
    scoreMismatches: 0,
    bandMismatches: 0,
    statusMismatches: 0,
    scoreStateMismatches: 0,
    pillarBudgetMismatches: 0,
    pillarStateMismatches: 0,
    pillarLevelMismatches: 0,
    pillarDeltaMismatches: 0,
    pillarMassMismatches: 0,
    contextCoverageMismatches: 0,
    scoringCoverageMismatches: 0,
    acceptedEvidenceMismatches: 0,
    rejectedEvidenceMismatches: 0,
    diagnosticMismatches: 0,
    candidateInvalidCount: 0,
    candidateErrorCount: 0,
    blockedFamilyAdmissions: 0,
    severePressureAdmissions: 0,
    timelineMismatches: 0,
    temporalContaminations: 0,
    telemetryViolations: 0,
    determinismMismatches: 0,
    artifactHashMismatches: 0,
  };

  const coverage = {
    namPhai: {
      contextCoverage: [] as number[],
      scoringCoverage: [] as number[],
      scoredPillarCount: [] as number[],
      partialPillarCount: [] as number[],
      missingPillarCount: [] as number[],
      transformationsEnabled: 0,
      transformationsDisabled: 0,
    },
    trungChau: {
      contextCoverage: [] as number[],
      scoringCoverage: [] as number[],
      scoredPillarCount: [] as number[],
      partialPillarCount: [] as number[],
      missingPillarCount: [] as number[],
      transformationsEnabled: 0,
      transformationsDisabled: 0,
    },
  };

  for (const obs of observations) {
    metrics.totalObservations++;
    if (obs.school === "nam-phai") metrics.namPhaiObservations++;
    if (obs.school === "trung-chau") metrics.trungChauObservations++;

    const chart = calculateChart(obs.school, obs.input);
    const cycleOverride = {
      cycleIndex: obs.cycleIndex,
      startAge: obs.startAge,
      endAge: obs.endAge,
      activePalaceIndex: obs.activePalaceIndex,
    };
    const options = { school: obs.school, cycleOverride };

    const comparison = compareMajorFortuneShadowV05(chart, options);

    auditObservations.push({
      observationId: (obs as any).observationId || `${obs.school}:${obs.cycleIndex}`,
      fixtureId: (obs as any).fixtureId || (obs as any).observationId,
      school: obs.school,
      cycleIndex: obs.cycleIndex,
      baselineScore: comparison.baseline.result?.score ?? null,
      candidateScore: comparison.candidate.result?.score ?? null,
      comparisonStatus: comparison.status,
      differenceCodes: comparison.comparison.differenceCodes,
      comparisonHash: comparison.comparisonHash,
      blockedFamilyIds: comparison.candidate.candidateDiagnostics.blockedFamilyIds,
      shadowOnlyFamilyIds: comparison.candidate.candidateDiagnostics.shadowOnlyFamilyIds,
      invalidFamilyIds: comparison.candidate.candidateDiagnostics.invalidFamilyIds,
    });

    const diffs = comparison.comparison.differenceCodes;

    if (diffs.includes("score-mismatch")) metrics.scoreMismatches++;
    if (diffs.includes("band-mismatch")) metrics.bandMismatches++;
    if (diffs.includes("result-status-mismatch")) metrics.statusMismatches++;
    if (diffs.includes("score-state-mismatch")) metrics.scoreStateMismatches++;
    if (diffs.includes("context-coverage-mismatch")) metrics.contextCoverageMismatches++;
    if (diffs.includes("scoring-coverage-mismatch")) metrics.scoringCoverageMismatches++;
    if (diffs.includes("diagnostics-mismatch") || diffs.includes("adapter-diagnostics-mismatch")) metrics.diagnosticMismatches++;

    if (comparison.status === "candidate-invalid") metrics.candidateInvalidCount++;
    if (diffs.includes("candidate-error")) metrics.candidateErrorCount++;

    for (const p of ["thien-thoi", "dia-loi", "nhan-hoa", "tu-hoa-sat-tinh"]) {
      if (diffs.includes(`pillar-budget-${p}`)) metrics.pillarBudgetMismatches++;
      if (diffs.includes(`pillar-state-${p}`)) metrics.pillarStateMismatches++;
      if (diffs.includes(`pillar-level-${p}`)) metrics.pillarLevelMismatches++;
      if (diffs.includes(`pillar-delta-${p}`)) metrics.pillarDeltaMismatches++;
      if (diffs.includes(`pillar-support-mass-${p}`) || diffs.includes(`pillar-pressure-mass-${p}`)) metrics.pillarMassMismatches++;
      if (diffs.includes(`pillar-accepted-evidence-${p}`)) metrics.acceptedEvidenceMismatches++;
      if (diffs.includes(`pillar-rejected-evidence-${p}`)) metrics.rejectedEvidenceMismatches++;
    }

    if (comparison.candidate.emittedEvidence.some(e => e.signalFamilyId === "severe-pressure-evidence")) {
      metrics.severePressureAdmissions++;
    }

    // Check coverage
    const res = comparison.baseline.result;
    if (res) {
      const cov = coverage[obs.school === "nam-phai" ? "namPhai" : "trungChau"];
      cov.contextCoverage.push(res.coverage.contextCoverageWeight);
      cov.scoringCoverage.push(res.coverage.scoringCoverageWeight);

      let scored = 0;
      let partial = 0;
      let missing = 0;
      for (const p of ["thien-thoi", "dia-loi", "nhan-hoa", "tu-hoa-sat-tinh"] as const) {
        if (!(res.pillars as any)[p]) missing++;
        else if ((res.pillars as any)[p].state === "partial-data") partial++;
        else scored++;
      }
      cov.scoredPillarCount.push(scored);
      cov.partialPillarCount.push(partial);
      cov.missingPillarCount.push(missing);

      // nam-phai transformations feature toggle was disabled in V0.3, so it should be false here
      // But we just track what it is
      const tuHoaAcceptedIds = res.pillars["tu-hoa-sat-tinh"]?.acceptedEvidenceIds ?? [];
      const enabled = comparison.baseline.emittedEvidence.some(e =>
        e.signalFamilyId === "major-fortune-transformations" && tuHoaAcceptedIds.includes(e.evidenceId)
      );
      if (enabled) cov.transformationsEnabled++;
      else cov.transformationsDisabled++;
    }
  }

  return {
    corpusId: MF_V02_FULL_CORPUS.corpusId,
    auditObservations,
    metrics,
    coverage,
  };
}
