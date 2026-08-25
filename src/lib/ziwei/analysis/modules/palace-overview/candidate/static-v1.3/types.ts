import type { PalaceEvidence, PalaceEvidenceAxes } from "../../types";

export type StaticV13CandidateId =
  | "control"
  | "context-normalized"
  | "context-diminishing"
  | "local-context";

export interface AxisBucket {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
  net: number;
  evidenceCount: number;
  contributors: Array<{
    id: string;
    label: string;
    category: string;
    palaceRole: string;
    physicalFactIds: string[];
    support: number;
    pressure: number;
    net: number;
    contributionPath: string;
    contributionKind: string;
  }>;
}

export interface PalaceStructuralDecomposition {
  palaceIndex: number;
  palaceName: string;
  palaceBranch: string;
  controlScore: number;
  local: AxisBucket;
  opposite: AxisBucket;
  oppositeBranch: string | null;
  trine: AxisBucket;
  /** Per remote branch (typically two trine partners). */
  trineByBranch: Array<{ branch: string; bucket: AxisBucket }>;
  formations: AxisBucket;
  transformations: AxisBucket;
  minor: AxisBucket;
  changSheng: AxisBucket;
  voidEnv: AxisBucket;
  context: AxisBucket;
  combinedAdditive: AxisBucket;
  localNetShare: number | null;
  remoteShare: number | null;
  flags: string[];
}

export interface CandidatePalaceScore {
  candidateId: Exclude<StaticV13CandidateId, "control">;
  score: number;
  localNet: number;
  contextNet: number;
  contextApplied: number;
  combinedNet: number;
  remoteShare: number | null;
  formulaNotes: string[];
}

export interface StaticV13Config {
  /** Logistic quality scale — must match production profile. */
  logisticScale: number;
  /** Max |context| absorbed under context-normalized. */
  contextNormalizedCap: number;
  /** Softsign scale for context-normalized. */
  contextSoftScale: number;
  /** Diminishing curve for remote evidence ranks. */
  remoteDiminishing: number[];
  /** Local primacy for local-context blend (0..1). */
  localBlendAlpha: number;
  /** Max context magnitude relative to |local|+epsilon for local-context. */
  localContextRelCap: number;
  /** Absolute floor/ceiling for context application under local-context. */
  localContextAbsCap: number;
  /**
   * When a structural-rule shares ≥2 factIds with major-star components in
   * the same palace evaluation, scale its axes by this factor (class C
   * duplicated physical quality → partial dedup).
   */
  formationOverlapScale: number;
}

export const STATIC_V13_DEFAULT_CONFIG: StaticV13Config = {
  logisticScale: 8,
  contextNormalizedCap: 6,
  contextSoftScale: 4,
  remoteDiminishing: [0.7, 0.4, 0.22, 0.12, 0.07, 0.04],
  localBlendAlpha: 0.72,
  localContextRelCap: 0.85,
  localContextAbsCap: 5.5,
  formationOverlapScale: 0.35,
};

export type EvidenceSplit = {
  local: PalaceEvidence[];
  context: PalaceEvidence[];
  all: PalaceEvidence[];
};

export function splitEvidence(all: PalaceEvidence[]): EvidenceSplit {
  const local = all.filter((e) => e.palaceRole === "focus");
  const context = all.filter(
    (e) => e.palaceRole === "opposite" || e.palaceRole === "trine",
  );
  return { local, context, all };
}

export function sumAxes(evidence: PalaceEvidence[]): PalaceEvidenceAxes {
  return evidence.reduce(
    (acc, e) => ({
      support: acc.support + e.axes.support,
      pressure: acc.pressure + e.axes.pressure,
      stability: acc.stability + e.axes.stability,
      activation: acc.activation + e.axes.activation,
    }),
    { support: 0, pressure: 0, stability: 0, activation: 0 },
  );
}
