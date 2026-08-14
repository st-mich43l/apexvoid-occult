import type { PalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { getPalaceOverviewVersions } from "../../../knowledge";
import type {
  PalaceOverviewCalibrationMetadata,
  PalaceOverviewConfidence,
} from "../types";

const BENCHMARK_VERSION = "palace-overview-expert-benchmark-v2";

export function buildPalaceOverviewConfidence(
  evidenceCompletenessPercent: number,
  reviewedLabelCount: number,
): PalaceOverviewConfidence {
  const reasons: string[] = [];
  if (reviewedLabelCount < 20) {
    reasons.push("expert-benchmark-below-minimum");
  }
  reasons.push("numeric-coefficients-are-heuristic-seeds");
  reasons.push("sourceConfidence-unavailable-not-fabricated");

  return {
    evidenceCompletenessPercent,
    sourceConfidencePercent: null,
    calibrationConfidence: "unvalidated",
    reasons,
  };
}

export function buildPalaceOverviewCalibrationMetadata(
  knowledge: PalaceOverviewKnowledgeV1,
): PalaceOverviewCalibrationMetadata {
  const versions = getPalaceOverviewVersions();
  return {
    profileVersion: knowledge.profile.version,
    benchmarkVersion: BENCHMARK_VERSION,
    calibrationVersion: versions.calibrationVersion,
    releaseStage: versions.releaseStage,
    scoringInfrastructureVersion: versions.scoringInfrastructureVersion,
  };
}
