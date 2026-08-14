import type { MonthlyFlowScoringProfile } from "../../knowledge/monthly-flow";
import type { DeepReadonly } from "../../knowledge/monthly-flow";
import type {
  MonthlyFlowConfidence,
  MonthlyFlowCoverage,
  MonthlyFlowEvidence,
  MonthlyFlowReasonCode,
} from "./types";

type ScoringProfile = DeepReadonly<MonthlyFlowScoringProfile> | MonthlyFlowScoringProfile;

const ENGINEERING_SOURCE_ID = "SRC-MONTHLY-ENG-001";

function roundPercent(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

function contributionMass(evidence: MonthlyFlowEvidence): number {
  return (
    Math.abs(evidence.weightedAxes.support) +
    Math.abs(evidence.weightedAxes.pressure) +
    Math.abs(evidence.weightedAxes.stability) +
    Math.abs(evidence.weightedAxes.activation)
  );
}

export interface DeriveMonthlyFlowCoverageInput {
  hasMonthlyFrame: boolean;
  starKnowledgeComplete: boolean;
  transformationsComplete: boolean;
  requiresDomainFrame: boolean;
  hasDomainFrame: boolean;
}

export function deriveMonthlyFlowCoverage(
  input: DeriveMonthlyFlowCoverageInput,
): MonthlyFlowCoverage {
  const components: Array<{ id: MonthlyFlowReasonCode; available: boolean }> = [
    { id: "monthly-frame", available: input.hasMonthlyFrame },
    { id: "star-knowledge", available: input.starKnowledgeComplete },
    { id: "monthly-transformations", available: input.transformationsComplete },
  ];

  if (input.requiresDomainFrame) {
    components.push({ id: "annual-domain-frame", available: input.hasDomainFrame });
  }

  const missingComponents = components
    .filter((component) => !component.available)
    .map((component) => component.id);
  const availableCount = components.length - missingComponents.length;

  return {
    coveragePercent: roundPercent((availableCount / components.length) * 100),
    missingComponents,
  };
}

/**
 * Confidence is descriptive metadata only. It is derived from the absolute
 * contribution mass after geometry/layer/diminishing weights have been
 * applied; confidence weights never participate in numeric scoring.
 * Engineering provenance is independent from approved/experimental status.
 */
export function deriveMonthlyFlowConfidence(
  evidence: readonly MonthlyFlowEvidence[],
  profile: ScoringProfile,
): MonthlyFlowConfidence {
  const totalMass = evidence.reduce((sum, item) => sum + contributionMass(item), 0);
  if (totalMass <= 0) {
    return {
      confidencePercent: 0,
      verifiedContributionPercent: 0,
      engineeringContributionPercent: 0,
      experimentalContributionPercent: 0,
    };
  }

  let approvedMass = 0;
  let experimentalMass = 0;
  let engineeringMass = 0;
  let confidenceMass = 0;

  for (const item of evidence) {
    const mass = contributionMass(item);
    confidenceMass += mass * profile.confidenceWeights[item.knowledgeStatus];

    if (item.knowledgeStatus === "approved") approvedMass += mass;
    else experimentalMass += mass;

    if (item.sourceIds.includes(ENGINEERING_SOURCE_ID)) engineeringMass += mass;
  }

  return {
    confidencePercent: roundPercent((confidenceMass / totalMass) * 100),
    verifiedContributionPercent: roundPercent((approvedMass / totalMass) * 100),
    engineeringContributionPercent: roundPercent((engineeringMass / totalMass) * 100),
    experimentalContributionPercent: roundPercent((experimentalMass / totalMass) * 100),
  };
}
