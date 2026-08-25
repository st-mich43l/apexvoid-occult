import type { PalaceOverviewKnowledgeV1 } from "./schema";
import {
  assertLoadableCatalogs,
  validatePalaceOverviewKnowledge,
  type KnowledgeValidationIssue,
} from "./validate";

import profile from "../palace-overview/v1/profile.research-v2.json";
import majorStars from "../palace-overview/v1/major-stars.research-v2.json";
import transformations from "../palace-overview/v1/transformations.json";
import transformationMatrix from "../palace-overview/v1/transformation-matrix.v1.json";
import minorFamilies from "../palace-overview/v1/minor-star-families.json";
import minorStars from "../palace-overview/v1/minor-stars.json";
import minorStateModifiers from "../palace-overview/v1/minor-star-state-modifiers.json";
import starAliases from "../palace-overview/v1/canonical-star-aliases.json";
import schoolCoverage from "../palace-overview/v1/school-star-coverage.json";
import voidEnvironment from "../palace-overview/v1/void-environment.research-v2.json";
import changSheng from "../palace-overview/v1/chang-sheng.json";
import structuralRules from "../palace-overview/v1/structural-rules.research-v2.json";
import starSystems from "../palace-overview/v1/nam-phai-star-systems.v1.json";
import formula from "../palace-overview/v1/formula.v2.json";
import gapMatrix from "../palace-overview/v1/research/gap-matrix.v1.json";
import palaceBranchDignity from "../palace-overview/v1/palace-branch-dignity.v1.json";
import sources from "../palace-overview/v1/sources.json";

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
    transformationMatrix:
      transformationMatrix as PalaceOverviewKnowledgeV1["transformationMatrix"],
    minorFamilies: minorFamilies as PalaceOverviewKnowledgeV1["minorFamilies"],
    minorStars: minorStars as PalaceOverviewKnowledgeV1["minorStars"],
    minorStateModifiers:
      minorStateModifiers as PalaceOverviewKnowledgeV1["minorStateModifiers"],
    starAliases: starAliases as PalaceOverviewKnowledgeV1["starAliases"],
    schoolCoverage: schoolCoverage as PalaceOverviewKnowledgeV1["schoolCoverage"],
    voidEnvironment:
      voidEnvironment as PalaceOverviewKnowledgeV1["voidEnvironment"],
    changSheng: changSheng as PalaceOverviewKnowledgeV1["changSheng"],
    structuralRules:
      structuralRules as PalaceOverviewKnowledgeV1["structuralRules"],
    starSystems: starSystems as PalaceOverviewKnowledgeV1["starSystems"],
    formula: formula as PalaceOverviewKnowledgeV1["formula"],
    gapMatrix: gapMatrix as PalaceOverviewKnowledgeV1["gapMatrix"],
    palaceBranchDignity:
      palaceBranchDignity as PalaceOverviewKnowledgeV1["palaceBranchDignity"],
    sources: sources as PalaceOverviewKnowledgeV1["sources"],
  };
}

/** Load research-only Palace Overview V2 knowledge (not production freeze). */
export function loadPalaceOverviewKnowledgeV1(): LoadKnowledgeResult {
  if (cached) return cached;

  const knowledge = buildKnowledge();
  const structural = validatePalaceOverviewKnowledge(knowledge);
  const loadable = assertLoadableCatalogs(knowledge);
  const issues = [...structural.issues, ...loadable];

  cached = issues.length === 0 ? { ok: true, knowledge } : { ok: false, issues };
  return cached;
}

/** Test helper — clear memoized research knowledge. */
export function resetPalaceOverviewKnowledgeCache(): void {
  cached = null;
}
