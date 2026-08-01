import type { ChartData } from "@/types/chart";
import { isMajorFortuneV05ShadowEnabled } from "../../feature-flags";
import { analyzeMajorFortuneOrdinalV03 } from "./v0.3-ordinal-adapter/analyze";
import type { AdaptMajorFortuneOrdinalOptions, MajorFortuneOrdinalV03Analysis } from "./v0.3-ordinal-adapter/types";
import { emitMajorFortuneShadowComparedTelemetry } from "./telemetry/emit";
import { MAJOR_FORTUNE_PRODUCTION_VERSION } from "./version";
import { analyzeMajorFortuneCandidateV05 } from "./v0.5-candidate/candidate";
import { compareMajorFortuneAnalyses, type MajorFortuneShadowComparison } from "./shadow-comparison";

export { analyzeMajorFortuneCandidateV05, type MajorFortuneShadowComparison };

export function analyzeMajorFortuneProduction(
  chart: ChartData,
  options: AdaptMajorFortuneOrdinalOptions,
): MajorFortuneOrdinalV03Analysis {
  return analyzeMajorFortuneOrdinalV03(chart, options);
}

export function compareMajorFortuneShadowV05(
  chart: ChartData,
  options: AdaptMajorFortuneOrdinalOptions,
): MajorFortuneShadowComparison {
  const baseline = analyzeMajorFortuneProduction(chart, options);

  let candidate;
  try {
    candidate = analyzeMajorFortuneCandidateV05(chart, options);
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.error("[Major Fortune] Shadow analysis failed:", error);
    }
    // create a fake candidate for error
    candidate = {
      model: "v0.5-candidate",
      candidateStatus: "invalid-knowledge",
      result: null,
      knowledgeIssues: [],
      admissionDecisions: [],
      candidateDiagnostics: {
        admittedEvidenceCount: 0,
        blockedEvidenceCount: 0,
        shadowOnlyEvidenceCount: 0,
        invalidEvidenceCount: 0,
        blockedFamilyIds: [],
        shadowOnlyFamilyIds: [],
        invalidFamilyIds: [],
      },
      adapterStatus: "unavailable",
      cycle: null,
      adapterDiagnostics: {
        missingActiveMajorFortunePalace: [],
        missingMenhElement: [],
        unsupportedBrightness: [],
        partialAuxiliarySets: [],
        incompleteTransformations: [],
        blockedNamPhaiTransformations: [],
        forbiddenTemporalFactsDetected: [],
        rejectedGeneratedEvidence: [],
        missingProvenance: [],
        disabledFamilies: [],
        notes: ["candidate-error"],
        outOfFrameTransformationCount: 0,
        duplicatePhysicalFacts: [],
        duplicateEvidenceClusters: [],
        ownershipViolations: [],
      },
      emittedEvidence: [],
      display: null,
    } as any;
  }

  const comparison = compareMajorFortuneAnalyses(baseline, candidate);

  if (isMajorFortuneV05ShadowEnabled()) {
    emitMajorFortuneShadowComparedTelemetry({
      event: "major_fortune_shadow_compared",
      baselineIntegrationVersion: MAJOR_FORTUNE_PRODUCTION_VERSION.productionIntegrationVersion,
      candidateIntegrationVersion: "0.5.0",
      baselineModelVersion: MAJOR_FORTUNE_PRODUCTION_VERSION.baselineModelVersion,
      candidateModelVersion: MAJOR_FORTUNE_PRODUCTION_VERSION.candidateModelVersion,
      formulaVersion: MAJOR_FORTUNE_PRODUCTION_VERSION.formulaVersion,
      school: options.school,
      comparisonStatus: comparison.status,
      scoreEqual: comparison.comparison.scoreEqual,
      scoreDelta: baseline.result?.score != null && candidate.result?.score != null ? candidate.result.score - baseline.result.score : null,
      bandEqual: comparison.comparison.bandEqual,
      statusEqual: comparison.comparison.resultStatusEqual,
      scoreStateEqual: comparison.comparison.scoreStateEqual,
      contextCoverageDelta: baseline.result && candidate.result ? candidate.result.coverage.contextCoverageWeight - baseline.result.coverage.contextCoverageWeight : 0,
      scoringCoverageDelta: baseline.result && candidate.result ? candidate.result.coverage.scoringCoverageWeight - baseline.result.coverage.scoringCoverageWeight : 0,
      changedPillarIds: Object.entries(comparison.comparison.pillarComparisons).filter(([_, c]) =>
        !c.budgetEqual || !c.stateEqual || !c.levelEqual || !c.deltaEqual || !c.supportMassEqual || !c.pressureMassEqual || !c.acceptedEvidenceIdsEqual || !c.rejectedEvidenceEqual || !c.physicalFactIdsEqual || !c.reasonCodesEqual
      ).map(([p]) => p as any),
      acceptedEvidenceDifferenceCount: 0, // This is derived below
      rejectedEvidenceDifferenceCount: 0, // This is derived below
      blockedFamilyIds: candidate.candidateDiagnostics.blockedFamilyIds,
      shadowOnlyFamilyIds: candidate.candidateDiagnostics.shadowOnlyFamilyIds,
      invalidFamilyIds: candidate.candidateDiagnostics.invalidFamilyIds,
      comparisonHash: comparison.comparisonHash,
      failureCode: (comparison.comparison.differenceCodes.length > 0 ? comparison.comparison.differenceCodes[0] : null) ?? null,
    });
  }

  return comparison;
}
