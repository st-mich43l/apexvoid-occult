import { isMajorFortuneV04NamPhaiTransformationsEnabled } from "../../../feature-flags";
import type { MajorFortuneOrdinalV03Analysis } from "../v0.3-ordinal-adapter/types";
import type { MajorFortuneScoredTelemetryEvent } from "./types";

export function buildMajorFortuneScoredTelemetryEvent(
  analysis: MajorFortuneOrdinalV03Analysis,
): MajorFortuneScoredTelemetryEvent {
  const isEnabled = isMajorFortuneV04NamPhaiTransformationsEnabled();

  let fallbackState: MajorFortuneScoredTelemetryEvent["fallbackState"] = "not-applicable";
  if (analysis.adapterStatus === "unavailable" || !analysis.result) {
    fallbackState = "unavailable-data";
  } else if (!isEnabled && analysis.school === "nam-phai" && analysis.result.coverage.partialPillarIds.includes("tu-hoa-sat-tinh")) {
    fallbackState = "v03-policy-fallback";
  }

  const acceptedEvidenceCount = analysis.result?.diagnostics.acceptedEvidenceCount ?? 0;
  
  // Calculate direct transformation count safely
  const directTransformations = (analysis.emittedEvidence ?? []).filter(e => {
    return e.signalFamilyId === "major-fortune-transformations" &&
      e.transformationTuple?.targetPalaceIndex === analysis.cycle?.activePalaceIndex;
  });

  const acceptedDirectTransformationIds = new Set(
    analysis.result?.pillars["tu-hoa-sat-tinh"]?.acceptedEvidenceIds ?? []
  );

  const directTransformationActivationCount = directTransformations.filter(e =>
    acceptedDirectTransformationIds.has(e.evidenceId)
  ).length;

  return {
    event: "major_fortune_scored",
    integrationVersion: "0.4.1",
    modelVersion: "v0.3-ordinal",
    formulaVersion: analysis.result?.versions.formulaVersion ?? "v0.3-ordinal-four-pillar",
    contractVersion: analysis.result?.versions.knowledgeVersion ?? "unknown",
    adapterVersion: "0.3.3",

    school: analysis.school as "nam-phai" | "trung-chau",
    scoreState: analysis.result?.scoreState ?? "unavailable",
    evaluationStatus: analysis.result?.status ?? "unavailable",

    contextCoverage: analysis.result?.coverage.contextCoverageWeight ?? 0,
    scoringCoverage: analysis.result?.coverage.scoringCoverageWeight ?? 0,
    activePillarCount: analysis.result?.coverage.scoredPillarIds.length ?? 0,
    partialPillarCount: analysis.result?.coverage.partialPillarIds.length ?? 0,
    missingPillarCount: analysis.result?.coverage.missingPillarIds.length ?? 0,

    namPhaiTransformationsEnabled: isEnabled,
    directTransformationActivationCount,
    acceptedTransformationEvidenceCount: acceptedEvidenceCount,
    outOfFrameTransformationCount: analysis.adapterDiagnostics.outOfFrameTransformationCount ?? 0,
    
    fallbackState,
  };
}
