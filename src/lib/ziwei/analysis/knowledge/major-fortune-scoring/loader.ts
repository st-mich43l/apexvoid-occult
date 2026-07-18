import type { MajorFortuneScoringKnowledgeV0 } from "./schema";
import {
  validateMajorFortuneScoringKnowledge,
  type MajorFortuneKnowledgeValidationIssue,
} from "./validate";
import { deepFreeze, type DeepReadonly } from "./deep-freeze";

import domainDefinitions from "./major-fortune-domain-definitions.v0.json";
import scoringProfile from "./major-fortune-scoring-profile.v0.json";
import structuralActivations from "./major-fortune-structural-activations.v0.json";
import transformationImpact from "./major-fortune-transformation-impact.v0.json";
import interactionRules from "./major-fortune-interaction-rules.v0.json";
import schoolCapabilities from "./major-fortune-school-capabilities.v0.json";
import periodPhase from "./major-fortune-period-phase.v0.json";
import sourceRegistry from "./major-fortune-source-registry.v0.json";
import calibrationFixtures from "./major-fortune-calibration-fixtures.v0.json";

export type LoadMajorFortuneScoringKnowledgeResult =
  | { ok: true; knowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> }
  | { ok: false; issues: MajorFortuneKnowledgeValidationIssue[] };

let cached: LoadMajorFortuneScoringKnowledgeResult | null = null;

function buildKnowledge(): MajorFortuneScoringKnowledgeV0 {
  return {
    domainDefinitions:
      domainDefinitions as unknown as MajorFortuneScoringKnowledgeV0["domainDefinitions"],
    scoringProfile: scoringProfile as unknown as MajorFortuneScoringKnowledgeV0["scoringProfile"],
    structuralActivations:
      structuralActivations as unknown as MajorFortuneScoringKnowledgeV0["structuralActivations"],
    transformationImpact:
      transformationImpact as unknown as MajorFortuneScoringKnowledgeV0["transformationImpact"],
    interactionRules:
      interactionRules as unknown as MajorFortuneScoringKnowledgeV0["interactionRules"],
    schoolCapabilities:
      schoolCapabilities as unknown as MajorFortuneScoringKnowledgeV0["schoolCapabilities"],
    periodPhase: periodPhase as unknown as MajorFortuneScoringKnowledgeV0["periodPhase"],
    sourceRegistry: sourceRegistry as unknown as MajorFortuneScoringKnowledgeV0["sourceRegistry"],
    calibrationFixtures:
      calibrationFixtures as unknown as MajorFortuneScoringKnowledgeV0["calibrationFixtures"],
  };
}

/** Load Major Fortune Scoring V0 knowledge once; validate then deep-freeze. */
export function loadMajorFortuneScoringKnowledgeV0(): LoadMajorFortuneScoringKnowledgeResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const validation = validateMajorFortuneScoringKnowledge(knowledge);

  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

/** Test helper — clear memoized knowledge. */
export function resetMajorFortuneScoringKnowledgeCache(): void {
  cached = null;
}
