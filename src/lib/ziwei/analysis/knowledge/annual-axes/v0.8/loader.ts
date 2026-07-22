import { deepFreeze } from "../deep-freeze";
import type { AnnualAxesKnowledgeV08NamPhai } from "./schema";
import { V08_KNOWLEDGE_VERSION } from "./schema";
import {
  validateAnnualAxesKnowledgeV08NamPhai,
  type AnnualKnowledgeV08ValidationIssue,
} from "./validate";

import domainMapping from "./annual-domain-mapping.nam-phai.v0.8.json";
import pointClasses from "./annual-point-classes.nam-phai.v0.8.json";
import starRegistry from "./annual-star-registry.nam-phai.v0.8.json";
import starAliases from "./annual-star-aliases.nam-phai.v0.8.json";
import scoreBands from "./annual-score-bands.nam-phai.v0.8.json";
import distributionGates from "./annual-distribution-gates.v0.8.json";
import sourceRegistry from "./annual-source-registry.v0.8.json";

export type LoadAnnualAxesKnowledgeV08NamPhaiResult =
  | { ok: true; knowledge: AnnualAxesKnowledgeV08NamPhai }
  | { ok: false; issues: AnnualKnowledgeV08ValidationIssue[] };

let cached: LoadAnnualAxesKnowledgeV08NamPhaiResult | null = null;

function buildKnowledge(): AnnualAxesKnowledgeV08NamPhai {
  return {
    domainMapping: domainMapping as unknown as AnnualAxesKnowledgeV08NamPhai["domainMapping"],
    pointClasses: pointClasses as unknown as AnnualAxesKnowledgeV08NamPhai["pointClasses"],
    starRegistry: starRegistry as unknown as AnnualAxesKnowledgeV08NamPhai["starRegistry"],
    starAliases: starAliases as unknown as AnnualAxesKnowledgeV08NamPhai["starAliases"],
    scoreBands: scoreBands as unknown as AnnualAxesKnowledgeV08NamPhai["scoreBands"],
    distributionGates:
      distributionGates as unknown as AnnualAxesKnowledgeV08NamPhai["distributionGates"],
    sourceRegistry: sourceRegistry as unknown as AnnualAxesKnowledgeV08NamPhai["sourceRegistry"],
    knowledgeVersion: V08_KNOWLEDGE_VERSION,
  };
}

export function loadAnnualAxesKnowledgeV08NamPhai(): LoadAnnualAxesKnowledgeV08NamPhaiResult {
  if (cached) return cached;
  const knowledge = buildKnowledge();
  const sourceIds = new Set(knowledge.sourceRegistry.sources.map((s) => s.sourceId));
  const validation = validateAnnualAxesKnowledgeV08NamPhai(knowledge, sourceIds);
  cached = validation.ok
    ? { ok: true, knowledge: deepFreeze(knowledge) }
    : { ok: false, issues: validation.issues };
  return cached;
}

export function resetAnnualAxesKnowledgeV08NamPhaiCache(): void {
  cached = null;
}
