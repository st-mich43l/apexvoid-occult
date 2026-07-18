import type { PalaceOverviewKnowledgeV1 } from "./schema";
import {
  assertLoadableCatalogs,
  validatePalaceOverviewKnowledge,
  type KnowledgeValidationIssue,
} from "./validate";

import profile from "./palace-overview/v1/profile.json";
import majorStars from "./palace-overview/v1/major-stars.json";
import transformations from "./palace-overview/v1/transformations.json";
import minorFamilies from "./palace-overview/v1/minor-star-families.json";
import voidEnvironment from "./palace-overview/v1/void-environment.json";
import changSheng from "./palace-overview/v1/chang-sheng.json";
import structuralRules from "./palace-overview/v1/structural-rules.json";
import sources from "./palace-overview/v1/sources.json";

export type LoadKnowledgeResult =
  | { ok: true; knowledge: PalaceOverviewKnowledgeV1 }
  | { ok: false; issues: KnowledgeValidationIssue[] };

let cached: LoadKnowledgeResult | null = null;

function buildKnowledge(): PalaceOverviewKnowledgeV1 {
  return {
    profile: profile as PalaceOverviewKnowledgeV1["profile"],
    majorStars: majorStars as PalaceOverviewKnowledgeV1["majorStars"],
    transformations:
      transformations as PalaceOverviewKnowledgeV1["transformations"],
    minorFamilies: minorFamilies as PalaceOverviewKnowledgeV1["minorFamilies"],
    voidEnvironment:
      voidEnvironment as PalaceOverviewKnowledgeV1["voidEnvironment"],
    changSheng: changSheng as PalaceOverviewKnowledgeV1["changSheng"],
    structuralRules:
      structuralRules as PalaceOverviewKnowledgeV1["structuralRules"],
    sources: sources as PalaceOverviewKnowledgeV1["sources"],
  };
}

/** Load palace-overview v1 knowledge once; validate in all environments. */
export function loadPalaceOverviewKnowledgeV1(): LoadKnowledgeResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const structural = validatePalaceOverviewKnowledge(knowledge);
  const loadable = assertLoadableCatalogs(knowledge);
  const issues = [...structural.issues, ...loadable];

  cached = issues.length === 0 ? { ok: true, knowledge } : { ok: false, issues };
  return cached;
}

/** Test helper — clear memoized knowledge. */
export function resetPalaceOverviewKnowledgeCache(): void {
  cached = null;
}
