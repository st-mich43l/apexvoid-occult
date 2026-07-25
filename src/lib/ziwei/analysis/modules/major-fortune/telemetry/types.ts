export interface MajorFortuneScoredTelemetryEvent {
  event: "major_fortune_scored";

  integrationVersion: "0.4.1";
  modelVersion: string;
  formulaVersion: string;
  contractVersion: string;
  adapterVersion: string;

  school: "nam-phai" | "trung-chau";
  scoreState: string;
  evaluationStatus: string;

  contextCoverage: number;
  scoringCoverage: number;
  activePillarCount: number;
  partialPillarCount: number;
  missingPillarCount: number;

  namPhaiTransformationsEnabled: boolean;
  directTransformationActivationCount: number;
  acceptedTransformationEvidenceCount: number;
  outOfFrameTransformationCount: number;

  fallbackState:
    | "not-applicable"
    | "v03-policy-fallback"
    | "unavailable-data"
    | "feature-disabled"
    | "invalid-context";
}

export interface MajorFortuneTelemetrySink {
  emit(event: MajorFortuneScoredTelemetryEvent): void;
}
