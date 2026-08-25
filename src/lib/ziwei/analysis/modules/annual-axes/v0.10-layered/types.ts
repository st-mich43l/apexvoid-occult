import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { V10LayerWeights, V10ProfileId, V10ProjectionVariantId } from "../../../knowledge/annual-axes/v0.10";

export type AnnualLayerId =
  | "natal-foundation"
  | "major-fortune"
  | "annual-trigger"
  | "resonance";

export type AnnualLayerAvailability =
  | "available"
  | "partial"
  | "unavailable";

type AnnualLayerDirection = "support" | "pressure" | "neutral";

type AnnualLayerSourceModule =
  | "annual-axes-domain-engine"
  | "major-fortune"
  | "annual-axes-v08"
  | "v010-resonance";

export interface AnnualLayerContributor {
  id: string;
  layer: AnnualLayerId;
  palaceName?: string;
  palaceIndex?: number;
  physicalFactIds: string[];
  sourceIds: string[];
  direction: AnnualLayerDirection;
  magnitude: number;
  sourceModule: AnnualLayerSourceModule;
  contextualReuse?: boolean;
  originalWeight?: number;
  effectiveLayerWeight?: number;
}

export interface AnnualLayerSignal {
  layer: AnnualLayerId;
  domain: AnnualAxisDomain;
  signedNet: number;
  supportMass: number;
  pressureMass: number;
  activation: number;
  coverage: number;
  availability: AnnualLayerAvailability;
  contributors: AnnualLayerContributor[];
  reasonCodes: string[];
}

export interface DomainProjectionTrace {
  variant: V10ProjectionVariantId;
  anchors: Array<{
    palace: string;
    originalWeight: number;
    effectiveLayerWeight: number | null;
    resolved: boolean;
    temporalOnly: boolean;
    unavailableForLayer: boolean;
  }>;
  resolvedWeight: number;
  totalConfiguredWeight: number;
  coverage: number;
  renormalized: boolean;
}

export interface V10DomainTrace {
  domain: AnnualAxisDomain;
  natal: AnnualLayerSignal;
  decade: AnnualLayerSignal;
  annual: AnnualLayerSignal;
  resonance: AnnualLayerSignal;
  profileId: V10ProfileId;
  profileWeights: V10LayerWeights;
  projectionVariant: V10ProjectionVariantId;
  domainProjection: DomainProjectionTrace;
  compositeNet: number;
  compositeRaw: number;
  finalScore: number | null;
  band: string | null;
  status: AnnualLayerAvailability;
  reasonCodes: string[];
}

interface V10AblationMode {
  disableNatal?: boolean;
  disableDecade?: boolean;
  disableResonance?: boolean;
}

export interface AnalyzeAnnualAxesV10Options {
  profileId?: V10ProfileId;
  projectionVariant?: V10ProjectionVariantId;
  ablation?: V10AblationMode;
  /** Research-only: compute frozen V0.8 control scores for comparison output. */
  includeControl?: boolean;
}

export interface AnnualAxesV10Result {
  module: "annual-axes-v0.11-domain-engine";
  status: AnnualLayerAvailability;
  school: "nam-phai";
  annualYear: number;
  controlId: "CONTROL-AAV08-2";
  candidateId: string;
  profileId: V10ProfileId;
  projectionVariant: V10ProjectionVariantId;
  versions: {
    contractVersion: string;
    engineVersion: string;
    knowledgeVersion: string;
    formulaVersion: string;
    controlEngineVersion: string;
    controlKnowledgeVersion: string;
    controlFormulaVersion: string;
  };
  axes: Record<AnnualAxisDomain, V10DomainTrace>;
  controlScores: Record<AnnualAxisDomain, number | null>;
  diagnostics: {
    missingNatal: string[];
    missingDecade: string[];
    missingAnnual: string[];
    forbiddenMonthly: string[];
    notes: string[];
  };
  releaseStage: "experimental";
  calibrated: false;
}
