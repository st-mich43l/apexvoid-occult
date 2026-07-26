/**
 * Major Fortune V0.4.3 Canonical Audit Observation Contract.
 *
 * Replaces telemetry-event-based audit snapshots with full scoring observations
 * that can prove score, band, pillar, evidence, and coverage equivalence.
 *
 * Observation identity is stable across runs:
 *   <corpusId>:<school>:<chartFixtureId>:<cycleIndex>:<activePalaceIndex>
 *
 * Schema version: "0.4.3"
 * Does NOT contain personal birth information.
 */

export type AuditObservationMode =
  | "v033-fallback-baseline"
  | "v043-fallback"
  | "v043-nam-phai-enabled"
  | "trung-chau-baseline"
  | "v043-trung-chau-control";

export interface MajorFortuneAuditObservationPillar {
  state: string;
  level: number | null;
  delta: number;
  supportMass: number;
  pressureMass: number;
  acceptedEvidenceIds: string[];
  rejectedEvidence: Array<{ evidenceId: string; reason: string; detail?: string }>;
  physicalFactIds: string[];
  reasonCodes: string[];
}

export interface MajorFortuneAuditObservationAcceptedEvidence {
  evidenceId: string;
  pillarId: string;
  signalFamilyId: string;
  physicalFactId: string;
  evidenceClusterId: string;
  direction: string;
  strength: string;
  reasonCode: string;
  transformationTuple?: {
    fortuneStem: string;
    transformationType: string;
    transformedStar: string;
    targetPalaceIndex: number;
  };
}

export interface MajorFortuneAuditObservationTransformationSummary {
  resolvedTupleCount: number;
  completeTupleCount: number;
  /** Count of major-fortune-transformations evidence accepted in tu-hoa-sat-tinh pillar. */
  acceptedTransformationEvidenceCount: number;
  /** Count of accepted transformations where targetPalaceIndex === activePalaceIndex. */
  directTransformationActivationCount: number;
  outOfFrameTransformationCount: number;
  incompleteTransformationCount: number;
}

export interface MajorFortuneAuditObservationDiagnostics {
  acceptedEvidenceCount: number;
  rejectedEvidenceCount: number;
  duplicatePhysicalFactRejects: number;
  duplicateClusterRejects: number;
  excludedTemporalRejects: number;
  schoolGateRejects: number;
  adapterReasonCodes: string[];
}

export interface MajorFortuneAuditObservationTrace {
  baseScore: number;
  pillarDeltas: Record<string, number>;
  sumDelta: number;
  rawScoreBeforeClamp: number;
  yearInCycleIgnored: boolean;
  forbidsPerRuleRawDelta: boolean;
}

export interface MajorFortuneAuditObservation {
  schemaVersion: "0.4.3";
  observationId: string;
  corpusId: string;
  mode: AuditObservationMode;

  school: "nam-phai" | "trung-chau";

  chartFixtureId: string;
  cycleIndex: number;
  cycleOrder: number;
  startAge: number;
  endAge: number;
  activePalaceIndex: number;
  fortuneStem: string | null;

  integrationVersion: "0.4.3";
  modelVersion: string;
  formulaVersion: string;
  contractVersion: string;
  knowledgeVersion: string;
  adapterVersion: string;

  status: string;
  scoreState: string;
  score: number | null;
  band: string | null;

  contextCoverage: number;
  scoringCoverage: number;
  coverageWeight: number;

  evaluablePillarIds: string[];
  scoredPillarIds: string[];
  partialPillarIds: string[];
  missingPillarIds: string[];

  pillars: Record<string, MajorFortuneAuditObservationPillar>;

  acceptedEvidence: MajorFortuneAuditObservationAcceptedEvidence[];

  transformationSummary: MajorFortuneAuditObservationTransformationSummary;

  diagnostics: MajorFortuneAuditObservationDiagnostics;

  trace: MajorFortuneAuditObservationTrace;
}

/**
 * Build a stable observation ID from non-personal corpus identity.
 * Same logical observation → same ID across baseline, fallback, enabled, timeline, repeated runs.
 */
export function buildObservationId(
  corpusId: string,
  school: string,
  chartFixtureId: string,
  cycleIndex: number,
  activePalaceIndex: number,
): string {
  return `${corpusId}:${school}:${chartFixtureId}:${cycleIndex}:${activePalaceIndex}`;
}
