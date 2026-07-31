/**
 * Major Fortune V0.4.2 production telemetry types.
 *
 * Integration version 0.4.2 — audit truthfulness completion.
 * Model: v0.3-ordinal (unchanged).
 * Formula: v0.3-ordinal-four-pillar (unchanged).
 */

export const MAJOR_FORTUNE_INTEGRATION_VERSION = "0.4.3" as const;
export const MAJOR_FORTUNE_ADAPTER_VERSION = "0.3.3" as const;

export interface MajorFortuneScoredTelemetryEvent {
  event: "major_fortune_scored";

  integrationVersion: "0.4.3";
  modelVersion: string;
  formulaVersion: string;
  /** Sourced from result.versions.contractVersion — not knowledgeVersion. */
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
  /**
   * Count of evidence accepted in tu-hoa-sat-tinh pillar with
   * signalFamilyId === "major-fortune-transformations".
   * Must satisfy:
   *   directTransformationActivationCount
   *   <= acceptedTransformationEvidenceCount
   *   <= total accepted evidence count
   */
  acceptedTransformationEvidenceCount: number;
  directTransformationActivationCount: number;
  outOfFrameTransformationCount: number;

  fallbackState:
    | "not-applicable"
    | "v03-policy-fallback"
    | "unavailable-data"
    | "feature-disabled"
    | "invalid-context";
}

export interface MajorFortuneShadowComparedTelemetryEvent {
  event: "major_fortune_shadow_compared";
  baselineIntegrationVersion: string;
  candidateIntegrationVersion: string;
  baselineModelVersion: string;
  candidateModelVersion: string;
  formulaVersion: string;
  school: "nam-phai" | "trung-chau";

  comparisonStatus:
    | "equivalent"
    | "different"
    | "candidate-invalid"
    | "candidate-error";

  scoreEqual: boolean;
  scoreDelta: number | null;
  bandEqual: boolean;
  statusEqual: boolean;
  scoreStateEqual: boolean;

  contextCoverageDelta: number;
  scoringCoverageDelta: number;

  changedPillarIds: ("thien-thoi" | "dia-loi" | "nhan-hoa" | "tu-hoa-sat-tinh")[];

  acceptedEvidenceDifferenceCount: number;
  rejectedEvidenceDifferenceCount: number;

  blockedFamilyIds: string[];
  shadowOnlyFamilyIds: string[];
  invalidFamilyIds: string[];

  comparisonHash: string;
  failureCode: string | null;
}

export type MajorFortuneTelemetryEvent =
  | MajorFortuneScoredTelemetryEvent
  | MajorFortuneShadowComparedTelemetryEvent;

export interface MajorFortuneTelemetrySink {
  emit(event: MajorFortuneTelemetryEvent): void;
}
