import type { ChartData } from "@/types/chart";
import { adaptChartToMajorFortuneOrdinalInput as adaptCore } from "../v0.3-ordinal/adapter/adapt";
import type { AdaptMajorFortuneOrdinalOptions, MajorFortuneOrdinalV03Analysis, MajorFortuneOrdinalAdapterStatus, MajorFortuneOrdinalCycleMetadata, MajorFortuneOrdinalAdapterDiagnostics } from "../v0.3-ordinal-adapter/types";
import { evaluateMajorFortuneOrdinal } from "../v0.3-ordinal/evaluate";
import { buildDisplay, emptyDiagnostics } from "../v0.3-ordinal-adapter/display";
import { loadAdmittedFamilyRegistry } from "../../../knowledge/major-fortune-scoring/v0.5-production/loader";
import { evaluateMajorFortuneProductionAdmission } from "../../../knowledge/major-fortune-scoring/v0.5-production/evaluate-admission";
import type { MajorFortuneAdapterDiagnostics } from "../v0.3-ordinal/adapter/types";

export interface MajorFortuneCandidateAnalysis {
  model: "v0.5-candidate";
  adapterStatus: MajorFortuneOrdinalAdapterStatus;
  cycle: MajorFortuneOrdinalCycleMetadata | null;
  result: MajorFortuneOrdinalV03Analysis["result"];
  adapterDiagnostics: MajorFortuneOrdinalAdapterDiagnostics;
  emittedEvidence: MajorFortuneOrdinalV03Analysis["emittedEvidence"];
  candidateDiagnostics: {
    blockedFamilyIds: string[];
    shadowOnlyFamilyIds: string[];
    invalidAdmissionCount: number;
    schoolMismatchCount: number;
    pillarMismatchCount: number;
    temporalMismatchCount: number;
  };
  display: MajorFortuneOrdinalV03Analysis["display"];
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
    blockedFamilyIds: [] as string[],
    shadowOnlyFamilyIds: [] as string[],
    invalidAdmissionCount: 0,
    schoolMismatchCount: 0,
    pillarMismatchCount: 0,
    temporalMismatchCount: 0,
  };

  const registryResult = loadAdmittedFamilyRegistry();
  const admittedEvidence = [];
  
  if (build.evaluationInput) {
    if (registryResult.ok) {
      for (const ev of build.evaluationInput.evidence) {
        const admission = evaluateMajorFortuneProductionAdmission({
          evidence: ev,
          familyRegistry: registryResult.value,
          school: options.school,
        });

        if (admission.status === "admitted") {
          admittedEvidence.push(ev);
        } else if (admission.status === "shadow-only") {
          candidateDiagnostics.shadowOnlyFamilyIds.push(ev.signalFamilyId);
        } else if (admission.status === "blocked" || admission.status === "excluded") {
          candidateDiagnostics.blockedFamilyIds.push(ev.signalFamilyId);
        } else {
          candidateDiagnostics.invalidAdmissionCount++;
          if (admission.reasonCodes.includes("school-mismatch")) candidateDiagnostics.schoolMismatchCount++;
          if (admission.reasonCodes.includes("pillar-mismatch")) candidateDiagnostics.pillarMismatchCount++;
          if (admission.reasonCodes.includes("temporal-mismatch")) candidateDiagnostics.temporalMismatchCount++;
        }
      }
    } else {
      build.adapterDiagnostics.notes.push("failed-to-load-registry");
    }
  }

  candidateDiagnostics.blockedFamilyIds = [...new Set(candidateDiagnostics.blockedFamilyIds)].sort();
  candidateDiagnostics.shadowOnlyFamilyIds = [...new Set(candidateDiagnostics.shadowOnlyFamilyIds)].sort();

  const evaluation = build.evaluationInput
    ? evaluateMajorFortuneOrdinal({
        school: options.school,
        evidence: admittedEvidence,
        pillarContexts: build.evaluationInput.pillarContexts,
        yearInCycle: options.yearInCycle,
      })
    : null;

  const evaluationRejects = {
    duplicatePhysicalFacts: [] as string[],
    duplicateEvidenceClusters: [] as string[],
    ownershipViolations: [] as string[],
  };
  
  if (evaluation) {
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
    adapterStatus,
    cycle,
    result: evaluation,
    adapterDiagnostics: diagnostics,
    emittedEvidence: admittedEvidence,
    candidateDiagnostics,
    display: buildDisplay(evaluation, admittedEvidence, { school: options.school }),
  };
}
