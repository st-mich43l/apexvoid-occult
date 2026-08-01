import type { ChartData } from "@/types/chart";
import { adaptChartToMajorFortuneOrdinalInput as adaptCore } from "../v0.3-ordinal/adapter/adapt";
import type { AdaptMajorFortuneOrdinalOptions, MajorFortuneOrdinalV03Analysis, MajorFortuneOrdinalAdapterStatus, MajorFortuneOrdinalCycleMetadata, MajorFortuneOrdinalAdapterDiagnostics } from "../v0.3-ordinal-adapter/types";
import { evaluateMajorFortuneOrdinal } from "../v0.3-ordinal/evaluate";
import { buildDisplay, emptyDiagnostics } from "../v0.3-ordinal-adapter/display";
import { loadMajorFortuneProductionKnowledge, type ValidationIssue } from "../../../knowledge/major-fortune-scoring/v0.5-production/loader";
import { evaluateMajorFortuneProductionAdmission, type MajorFortuneProductionAdmissionDecision } from "../../../knowledge/major-fortune-scoring/v0.5-production/evaluate-admission";
import type { MajorFortuneAdapterDiagnostics } from "../v0.3-ordinal/adapter/types";
import type { MajorFortuneOrdinalResult } from "../v0.3-ordinal/types";

export interface MajorFortuneCandidateAnalysis {
  model: "v0.5-candidate";

  candidateStatus:
    | "valid"
    | "invalid-knowledge"
    | "invalid-admission"
    | "unavailable-context";

  result: MajorFortuneOrdinalResult | null;
  knowledgeIssues: ValidationIssue[];
  admissionDecisions: MajorFortuneProductionAdmissionDecision[];

  candidateDiagnostics: {
    admittedEvidenceCount: number;
    blockedEvidenceCount: number;
    shadowOnlyEvidenceCount: number;
    invalidEvidenceCount: number;

    blockedFamilyIds: string[];
    shadowOnlyFamilyIds: string[];
    invalidFamilyIds: string[];
  };

  adapterStatus: MajorFortuneOrdinalAdapterStatus;
  cycle: MajorFortuneOrdinalCycleMetadata | null;
  adapterDiagnostics: MajorFortuneOrdinalAdapterDiagnostics;
  emittedEvidence: MajorFortuneOrdinalV03Analysis["emittedEvidence"];
  display: MajorFortuneOrdinalV03Analysis["display"] | null;
}

function mapDiagnostics(
  raw: MajorFortuneAdapterDiagnostics,
  evaluationRejects?: {
    duplicatePhysicalFacts: string[];
    duplicateEvidenceClusters: string[];
    ownershipViolations: string[];
  },
): MajorFortuneOrdinalAdapterDiagnostics {
  const diagnostics = emptyDiagnostics();
  diagnostics.missingActiveMajorFortunePalace = [...raw.noActiveMajorFortune];
  diagnostics.missingMenhElement = [...raw.missingMenhElement];
  diagnostics.unsupportedBrightness = [...raw.unsupportedBrightness];
  diagnostics.partialAuxiliarySets = [...raw.partialPairSets];
  diagnostics.incompleteTransformations = [...raw.incompleteTransformationTuples];
  diagnostics.blockedNamPhaiTransformations = [...raw.namPhaiTransformationBlocked];
  diagnostics.forbiddenTemporalFactsDetected = [...raw.forbiddenAnnualMonthlyFieldsPresent];
  diagnostics.rejectedGeneratedEvidence = [...raw.evidenceValidationErrors];
  diagnostics.missingProvenance = raw.evidenceValidationErrors.filter((e) =>
    /empty|missing|provenance|sourceIds|claimIds|physicalFact|unknown sourceId|unknown claimId/i.test(e),
  );
  diagnostics.disabledFamilies = [...raw.disabledFamilies];
  diagnostics.notes = [...raw.notes, ...(raw.menhIndexDiagnostics ?? []).map((d) => `menh-index:${d}`)];
  diagnostics.outOfFrameTransformationCount = raw.outOfFrameTransformationCount ?? 0;
  if (evaluationRejects) {
    diagnostics.duplicatePhysicalFacts = evaluationRejects.duplicatePhysicalFacts;
    diagnostics.duplicateEvidenceClusters = evaluationRejects.duplicateEvidenceClusters;
    diagnostics.ownershipViolations = evaluationRejects.ownershipViolations;
  }
  return diagnostics;
}

function resolveAdapterStatus(
  cycle: MajorFortuneOrdinalCycleMetadata | null,
  evaluationStatus: "available" | "partial" | "unavailable" | undefined,
  pillarPartial: boolean,
): MajorFortuneOrdinalAdapterStatus {
  if (!cycle) return "unavailable";
  if (evaluationStatus === "unavailable") return "unavailable";
  if (evaluationStatus === "partial" || pillarPartial) return "partial";
  if (evaluationStatus === "available") return "ready";
  return "partial";
}

function enrichCycle(
  chart: ChartData,
  cycle: {
    cycleIndex: number;
    startAge: number;
    endAge: number;
    activePalaceIndex: number;
  } | null,
): MajorFortuneOrdinalCycleMetadata | null {
  if (!cycle) return null;
  const palace =
    chart.palaces.find((p) => p.index === cycle.activePalaceIndex) ??
    chart.majorFortunePalace ??
    null;
  return {
    ...cycle,
    activePalaceName: palace?.name ?? "?",
    activePalaceBranch: palace?.branch ?? "?",
    fortuneStem: palace?.stem ?? null,
  };
}

export function analyzeMajorFortuneCandidateV05(
  chart: ChartData,
  options: AdaptMajorFortuneOrdinalOptions,
): MajorFortuneCandidateAnalysis {
  const build = adaptCore(chart, {
    school: options.school,
    cycleOverride: options.cycleOverride,
  });

  const cycle = enrichCycle(chart, build.cycle);
  const pillarPartial = Boolean(
    build.pillarContexts &&
      Object.values(build.pillarContexts).some((p) => p.availability !== "available"),
  );

  const candidateDiagnostics = {
    admittedEvidenceCount: 0,
    blockedEvidenceCount: 0,
    shadowOnlyEvidenceCount: 0,
    invalidEvidenceCount: 0,
    blockedFamilyIds: [] as string[],
    shadowOnlyFamilyIds: [] as string[],
    invalidFamilyIds: [] as string[],
  };

  const registryResult = loadMajorFortuneProductionKnowledge();
  const admittedEvidence = [];
  const admissionDecisions: MajorFortuneProductionAdmissionDecision[] = [];

  let candidateStatus: MajorFortuneCandidateAnalysis["candidateStatus"] = "valid";
  let evaluation = null;
  const evaluationRejects = {
    duplicatePhysicalFacts: [] as string[],
    duplicateEvidenceClusters: [] as string[],
    ownershipViolations: [] as string[],
  };

  if (!build.evaluationInput) {
    candidateStatus = "unavailable-context";
  } else if (!registryResult.ok) {
    candidateStatus = "invalid-knowledge";
    build.adapterDiagnostics.notes.push("invalid-knowledge");
  } else {
    for (const ev of build.evaluationInput.evidence) {
      const admission = evaluateMajorFortuneProductionAdmission({
        evidence: ev,
        familyRegistry: registryResult.value.admissionRegistry,
        school: options.school,
        candidateIntegrationVersion: "0.5.0",
        authorizationSnapshot: {
          approvedSourceObligationIds: [],
          approvedClaimAdjudicationIds: [],
          openContradictionIds: [],
          decisionIds: [],
        },
      });

      admissionDecisions.push(admission);

      if (admission.status === "admitted") {
        candidateDiagnostics.admittedEvidenceCount++;
        admittedEvidence.push(ev);
      } else if (admission.status === "shadow-only") {
        candidateDiagnostics.shadowOnlyEvidenceCount++;
        candidateDiagnostics.shadowOnlyFamilyIds.push(ev.signalFamilyId);
      } else if (admission.status === "blocked" || admission.status === "excluded") {
        candidateDiagnostics.blockedEvidenceCount++;
        candidateDiagnostics.blockedFamilyIds.push(ev.signalFamilyId);
      } else {
        candidateDiagnostics.invalidEvidenceCount++;
        candidateDiagnostics.invalidFamilyIds.push(ev.signalFamilyId);
      }
    }

    if (candidateDiagnostics.invalidEvidenceCount > 0) {
      candidateStatus = "invalid-admission";
    }

    evaluation = evaluateMajorFortuneOrdinal({
      school: options.school,
      evidence: admittedEvidence,
      pillarContexts: build.evaluationInput.pillarContexts,
      yearInCycle: options.yearInCycle,
    });

    for (const pillar of Object.values(evaluation.pillars)) {
      for (const r of pillar.rejectedEvidence) {
        if (r.reason === "duplicate-physical-fact") {
          evaluationRejects.duplicatePhysicalFacts.push(r.evidenceId);
        }
        if (r.reason === "duplicate-evidence-cluster") {
          evaluationRejects.duplicateEvidenceClusters.push(r.evidenceId);
        }
        if (r.reason === "cross-pillar-ownership-violation") {
          evaluationRejects.ownershipViolations.push(r.evidenceId);
        }
      }
    }
  }

  candidateDiagnostics.blockedFamilyIds = [...new Set(candidateDiagnostics.blockedFamilyIds)].sort();
  candidateDiagnostics.shadowOnlyFamilyIds = [...new Set(candidateDiagnostics.shadowOnlyFamilyIds)].sort();
  candidateDiagnostics.invalidFamilyIds = [...new Set(candidateDiagnostics.invalidFamilyIds)].sort();

  const diagnostics = mapDiagnostics(build.adapterDiagnostics, evaluationRejects);
  const diaReasons = build.pillarContexts?.["dia-loi"]?.reasonCodes ?? [];
  if (diaReasons.includes("missing-brightness")) {
    diagnostics.missingBrightness.push("dia-loi:missing-brightness");
  }

  const adapterStatus = resolveAdapterStatus(
    cycle,
    evaluation?.status,
    pillarPartial,
  );

  return {
    model: "v0.5-candidate",
    candidateStatus,
    result: evaluation,
    knowledgeIssues: registryResult.ok ? [] : registryResult.issues,
    admissionDecisions,
    candidateDiagnostics,
    adapterStatus,
    cycle,
    adapterDiagnostics: diagnostics,
    emittedEvidence: admittedEvidence,
    display: evaluation ? buildDisplay(evaluation, admittedEvidence, { school: options.school }) : null,
  };
}
