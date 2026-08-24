import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type {
  AnnualAxisBand,
  AnnualAxisResult as LegacyAnnualAxisResult,
  AnnualAxesResult as LegacyAnnualAxesResult,
} from "./types";

export interface AnnualAxisLayerV10 {
  signedNet: number;
  supportMass: number;
  pressureMass: number;
  activation: number;
  coverage: number;
  availability: "available" | "partial" | "unavailable";
}

export interface AnnualAxisTraceV10 {
  profileId: string;
  projectionVariant: string;
  profileWeights: {
    natalFoundation: number;
    majorFortune: number;
    annualTrigger: number;
    resonance: number;
  };
  natal: AnnualAxisLayerV10;
  decade: AnnualAxisLayerV10;
  annual: AnnualAxisLayerV10;
  resonance: AnnualAxisLayerV10;
  compositeNet: number;
  compositeRaw: number;
}

export type AnnualAxisNamPhaiV10Result =
  | {
      domain: AnnualAxisDomain;
      engine: "v0.10";
      status: "available" | "partial-data";
      score: number;
      band: AnnualAxisBand;
      reasonCodes: string[];
      v10Trace: AnnualAxisTraceV10;
    }
  | {
      domain: AnnualAxisDomain;
      engine: "v0.10";
      status: "unavailable";
      score: null;
      band: null;
      reasonCodes: string[];
      v10Trace: AnnualAxisTraceV10;
    };

/** Released axis contract: active V0.10 plus still-supported Trung Châu/V0.2. */
export type AnnualAxisResult =
  | LegacyAnnualAxisResult
  | AnnualAxisNamPhaiV10Result;

/**
 * Released module result.
 *
 * The internal legacy result remains untouched so V0.8 research-control tests
 * can stay frozen. Public consumers use this widened contract instead.
 */
export interface AnnualAxesResult
  extends Omit<LegacyAnnualAxesResult, "axes"> {
  axes: Record<AnnualAxisDomain, AnnualAxisResult>;
  /** Present on Nam Phái V0.10 runtime; omitted on Trung Châu V0.2. */
  releaseStage?: "experimental" | "calibration" | "shadow" | "production";
  /** Explicit epistemic honesty for the active Nam Phái engine. */
  calibrated?: boolean;
}
