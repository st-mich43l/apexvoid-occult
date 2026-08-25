import type { ZiweiBrightness, ZiweiTransformation } from "../../../facts";

export interface PalaceOverviewFormulaV2 {
  id: string;
  version: string;
  status: string;
  schoolProfiles: string[];
  sourceIds: string[];
  formationMultiplierEnabled: boolean;
  brightnessScores: Record<ZiweiBrightness | "voidMajor", number> & {
    Miếu: number;
    Vượng: number;
    Đắc: number;
    Bình: number;
    Hãm: number;
    voidMajor: number;
  };
  transformations: Record<ZiweiTransformation, number>;
  lucCat: { scoreEach: number; canonicalNames: string[] };
  lucSat: { scoreEach: number; canonicalNames: string[] };
  tuanTriet: {
    positiveFactor: number;
    negativeAbsFactor: number;
    zeroPolicy: "identity-zero";
  };
  network: {
    self: number;
    opposite: number;
    trine: number;
    vcdSelf: number;
    vcdOpposite: number;
    vcdTrine: number;
  };
  qualityNormalization: {
    method: "logistic";
    scale: number;
    midpoint: number;
  };
  bandThresholds: {
    lowMaxInclusive: number;
    guardedMaxExclusive: number;
    balancedMaxExclusive: number;
    supportiveMaxExclusive: number;
  };
}

export interface PalaceV2BaseParts {
  majorContribution: number;
  transformContribution: number;
  lucCatContribution: number;
  lucSatContribution: number;
  sBase: number;
  isVcd: boolean;
  hasTuanTriet: boolean;
}

export interface PalaceV2NetworkWeights {
  self: number;
  opposite: number;
  trine1: number;
  trine2: number;
}

export interface PalaceV2Breakdown {
  palaceIndex: number;
  palaceName: string;
  palaceBranch: string;
  isVcd: boolean;
  hasTuanTriet: boolean;
  majorContribution: number;
  transformContribution: number;
  lucCatContribution: number;
  lucSatContribution: number;
  sBase: number;
  sAfterTt: number;
  weights: PalaceV2NetworkWeights;
  neighborIndexes: {
    opposite: number | null;
    trine1: number | null;
    trine2: number | null;
  };
  sCung: number;
  score: number;
  band: "low" | "guarded" | "balanced" | "supportive" | "strong";
}
