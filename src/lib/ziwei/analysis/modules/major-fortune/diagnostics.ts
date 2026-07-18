import { emptyMajorFortuneDiagnostics, type MajorFortuneDiagnostics } from "./types";

export { emptyMajorFortuneDiagnostics };

/** Collapse duplicate diagnostic entries accumulated across overall + all
 * twelve domains into a stable, deterministically ordered list per field. */
export function dedupeMajorFortuneDiagnostics(
  diagnostics: MajorFortuneDiagnostics,
): MajorFortuneDiagnostics {
  const dedupeSorted = (values: string[]): string[] => Array.from(new Set(values)).sort();

  return {
    invalidKnowledge: dedupeSorted(diagnostics.invalidKnowledge),
    invalidResolvedContext: dedupeSorted(diagnostics.invalidResolvedContext),
    noActiveMajorFortune: dedupeSorted(diagnostics.noActiveMajorFortune),
    incompleteMajorPalaceLabels: dedupeSorted(diagnostics.incompleteMajorPalaceLabels),
    duplicateMajorPalaceLabels: dedupeSorted(diagnostics.duplicateMajorPalaceLabels),
    missingFrameNodes: dedupeSorted(diagnostics.missingFrameNodes),
    unknownStars: dedupeSorted(diagnostics.unknownStars),
    unresolvedTransformationTargets: dedupeSorted(diagnostics.unresolvedTransformationTargets),
    forbiddenSchoolTransformations: dedupeSorted(diagnostics.forbiddenSchoolTransformations),
    forbiddenAnnualFacts: dedupeSorted(diagnostics.forbiddenAnnualFacts),
    duplicatePhysicalFacts: dedupeSorted(diagnostics.duplicatePhysicalFacts),
    disabledInteractionHits: dedupeSorted(diagnostics.disabledInteractionHits),
    missingSourceIds: dedupeSorted(diagnostics.missingSourceIds),
    unsupportedSchoolCapability: dedupeSorted(diagnostics.unsupportedSchoolCapability),
    missingCalculationPolicyProfile: dedupeSorted(diagnostics.missingCalculationPolicyProfile),
  };
}
