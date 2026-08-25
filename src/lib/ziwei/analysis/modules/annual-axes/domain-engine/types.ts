import type { AnnualAxisDomain } from "../../../contracts/annual-axes";

/**
 * Annual-Axes-owned static domain evidence.
 * Must never be derived from Palace Overview support/pressure/score.
 */
export interface AnnualDomainStaticEvidence {
  domain: AnnualAxisDomain;
  palaceName: string;
  palaceRole: string;
  palaceIndex: number;
  factIds: string[];
  starName: string;
  system: string;
  polarity: "support" | "pressure" | "neutral";
  magnitudeOrdinal: number;
  sourceIds: string[];
  adjudication: "admitted" | "unresolved" | "context-only";
  temporalLayer: "natal";
}

export interface ResolvedDomainPalace {
  palaceName: string;
  palaceIndex: number;
  branch: string;
  role: string;
  originalWeight: number;
  effectiveLayerWeight: number;
}

export interface StaticPalaceContextScore {
  palaceName: string;
  palaceIndex: number;
  role: string;
  effectiveLayerWeight: number;
  supportMass: number;
  pressureMass: number;
  activation: number;
  evidence: AnnualDomainStaticEvidence[];
  /** True when V0.8 registry had no natal match — context-only placeholder. */
  unresolved: boolean;
}

export interface StaticDomainAggregate {
  domain: AnnualAxisDomain;
  supportMass: number;
  pressureMass: number;
  activation: number;
  signedNet: number;
  coverage: number;
  mappedPalaces: ResolvedDomainPalace[];
  palaceContexts: StaticPalaceContextScore[];
  evidence: AnnualDomainStaticEvidence[];
  physicalPalaceDedupCount: number;
}
