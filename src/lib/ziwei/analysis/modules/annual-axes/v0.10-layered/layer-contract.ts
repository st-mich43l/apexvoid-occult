import type {
  AnnualLayerAvailability,
  AnnualLayerContributor,
  AnnualLayerId,
  AnnualLayerSignal,
} from "./types";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";

const EPSILON = 1e-9;

export function clampSignedNet(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(-1, n));
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function directionalBalance(
  support: number,
  pressure: number,
  epsilon = EPSILON,
): number {
  const denom = Math.max(support + pressure, epsilon);
  return clampSignedNet((support - pressure) / denom);
}

export function emptyLayerSignal(
  layer: AnnualLayerId,
  domain: AnnualAxisDomain,
  availability: AnnualLayerAvailability,
  reasonCodes: string[],
): AnnualLayerSignal {
  return {
    layer,
    domain,
    signedNet: 0,
    supportMass: 0,
    pressureMass: 0,
    activation: 0,
    coverage: 0,
    availability,
    contributors: [],
    reasonCodes: [...reasonCodes].sort((a, b) => a.localeCompare(b)),
  };
}

export function buildLayerSignal(input: {
  layer: AnnualLayerId;
  domain: AnnualAxisDomain;
  supportMass: number;
  pressureMass: number;
  activation: number;
  coverage: number;
  availability: AnnualLayerAvailability;
  contributors: AnnualLayerContributor[];
  reasonCodes: string[];
  signedNetOverride?: number;
}): AnnualLayerSignal {
  const signedNet =
    input.signedNetOverride !== undefined
      ? clampSignedNet(input.signedNetOverride)
      : directionalBalance(input.supportMass, input.pressureMass);
  return {
    layer: input.layer,
    domain: input.domain,
    signedNet,
    supportMass: Math.max(0, input.supportMass),
    pressureMass: Math.max(0, input.pressureMass),
    activation: clamp01(input.activation),
    coverage: clamp01(input.coverage),
    availability: input.availability,
    contributors: input.contributors,
    reasonCodes: [...input.reasonCodes].sort((a, b) => a.localeCompare(b)),
  };
}
