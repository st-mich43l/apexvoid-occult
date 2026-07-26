/**
 * Build a Major Fortune V0.4.2 scored telemetry event from an analysis result.
 *
 * Telemetry semantics (V0.4.2 corrections):
 * - contractVersion sourced from result.versions.contractVersion (not knowledgeVersion)
 * - acceptedTransformationEvidenceCount counts only major-fortune-transformations
 *   evidence accepted in tu-hoa-sat-tinh pillar
 * - directTransformationActivationCount is a strict subset of the above
 *
 * Invariant:
 *   directTransformationActivationCount
 *   <= acceptedTransformationEvidenceCount
 *   <= result.diagnostics.acceptedEvidenceCount
 */
import { isMajorFortuneV04NamPhaiTransformationsEnabled } from "../../../feature-flags";
import type { MajorFortuneOrdinalV03Analysis } from "../v0.3-ordinal-adapter/types";
import type { MajorFortuneScoredTelemetryEvent } from "./types";
import { MAJOR_FORTUNE_INTEGRATION_VERSION, MAJOR_FORTUNE_ADAPTER_VERSION } from "./types";

export function buildMajorFortuneScoredTelemetryEvent(
  analysis: MajorFortuneOrdinalV03Analysis,
): MajorFortuneScoredTelemetryEvent {
  const isEnabled = isMajorFortuneV04NamPhaiTransformationsEnabled();

  let fallbackState: MajorFortuneScoredTelemetryEvent["fallbackState"] = "not-applicable";
  if (analysis.adapterStatus === "unavailable" || !analysis.result) {
    fallbackState = "unavailable-data";
  } else if (
    !isEnabled &&
    analysis.school === "nam-phai" &&
    analysis.result.coverage.partialPillarIds.includes("tu-hoa-sat-tinh")
  ) {
    fallbackState = "v03-policy-fallback";
  }

  // Accepted transformation evidence IDs in tu-hoa-sat-tinh pillar.
  const acceptedInTuHoa = new Set(
    analysis.result?.pillars["tu-hoa-sat-tinh"]?.acceptedEvidenceIds ?? [],
  );

  // All emitted evidence with transformation family accepted in tu-hoa-sat-tinh.
  const acceptedTransformationEvidence = (analysis.emittedEvidence ?? []).filter(
    (e) =>
      e.signalFamilyId === "major-fortune-transformations" && acceptedInTuHoa.has(e.evidenceId),
  );

  const acceptedTransformationEvidenceCount = acceptedTransformationEvidence.length;

  // Direct activations: in-frame (targetPalaceIndex === activePalaceIndex).
  const directTransformationActivationCount = acceptedTransformationEvidence.filter(
    (e) => e.transformationTuple?.targetPalaceIndex === analysis.cycle?.activePalaceIndex,
  ).length;

  return {
    event: "major_fortune_scored",
    integrationVersion: MAJOR_FORTUNE_INTEGRATION_VERSION,
    modelVersion: analysis.model,
    formulaVersion: analysis.result?.versions.formulaVersion ?? "v0.3-ordinal-four-pillar",
    // V0.4.2 fix: use contractVersion, not knowledgeVersion.
    contractVersion: analysis.result?.versions.contractVersion ?? "unknown",
    adapterVersion: MAJOR_FORTUNE_ADAPTER_VERSION,

    school: analysis.school as "nam-phai" | "trung-chau",
    scoreState: analysis.result?.scoreState ?? "unavailable",
    evaluationStatus: analysis.result?.status ?? "unavailable",

    contextCoverage: analysis.result?.coverage.contextCoverageWeight ?? 0,
    scoringCoverage: analysis.result?.coverage.scoringCoverageWeight ?? 0,
    activePillarCount: analysis.result?.coverage.scoredPillarIds.length ?? 0,
    partialPillarCount: analysis.result?.coverage.partialPillarIds.length ?? 0,
    missingPillarCount: analysis.result?.coverage.missingPillarIds.length ?? 0,

    namPhaiTransformationsEnabled: isEnabled,
    acceptedTransformationEvidenceCount,
    directTransformationActivationCount,
    outOfFrameTransformationCount: analysis.adapterDiagnostics.outOfFrameTransformationCount ?? 0,

    fallbackState,
  };
}
