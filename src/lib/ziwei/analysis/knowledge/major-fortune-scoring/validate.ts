import { MAJOR_FORTUNE_DOMAINS } from "../../contracts/major-fortune";
import type { DeepReadonly } from "./deep-freeze";
import type { MajorFortuneAxisWeights, MajorFortuneScoringKnowledgeV0 } from "./schema";

export interface MajorFortuneKnowledgeValidationIssue {
  path: string;
  message: string;
}

export interface MajorFortuneKnowledgeValidationResult {
  ok: boolean;
  issues: MajorFortuneKnowledgeValidationIssue[];
}

function isAxes(value: unknown): value is MajorFortuneAxisWeights {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.support === "number" &&
    typeof v.pressure === "number" &&
    typeof v.stability === "number" &&
    typeof v.activation === "number"
  );
}

/**
 * Validate Major Fortune Scoring V0 knowledge structurally. Independent of
 * the Annual Axes / Palace Overview validators — a broken Major Fortune
 * pack must never affect the other modules' loadable status.
 */
export function validateMajorFortuneScoringKnowledge(
  knowledge: MajorFortuneScoringKnowledgeV0 | DeepReadonly<MajorFortuneScoringKnowledgeV0>,
): MajorFortuneKnowledgeValidationResult {
  const issues: MajorFortuneKnowledgeValidationIssue[] = [];

  // Twelve domains exactly match the contract.
  const domainSet = new Set(knowledge.domainDefinitions.domains.map((d) => d.domainId));
  if (domainSet.size !== MAJOR_FORTUNE_DOMAINS.length) {
    issues.push({
      path: "domainDefinitions.domains",
      message: `expected ${MAJOR_FORTUNE_DOMAINS.length} domains, got ${domainSet.size}`,
    });
  }
  for (const domain of MAJOR_FORTUNE_DOMAINS) {
    if (!domainSet.has(domain)) {
      issues.push({ path: "domainDefinitions.domains", message: `missing domain: ${domain}` });
    }
  }
  for (const domainId of domainSet) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(domainId)) {
      issues.push({
        path: "domainDefinitions.domains",
        message: `domainId must be ASCII slug: ${domainId}`,
      });
    }
  }

  // Bands contiguous over 0-100.
  const bands = [...knowledge.scoringProfile.output.bands].sort(
    (a, b) => a.minInclusive - b.minInclusive,
  );
  let expectedStart = knowledge.scoringProfile.output.scoreMin;
  for (const band of bands) {
    if (band.minInclusive !== expectedStart) {
      issues.push({
        path: `scoringProfile.output.bands.${band.id}`,
        message: `band gap: expected minInclusive ${expectedStart}, got ${band.minInclusive}`,
      });
    }
    expectedStart = band.maxExclusive ?? band.maxInclusive ?? expectedStart;
  }
  const last = bands[bands.length - 1];
  if (last && (last.maxInclusive ?? last.maxExclusive) !== knowledge.scoringProfile.output.scoreMax) {
    issues.push({ path: "scoringProfile.output.bands", message: "bands do not reach scoreMax" });
  }

  // Global ruleId uniqueness across every catalog that declares one.
  const seenRuleIds = new Set<string>();
  const addRuleId = (ruleId: string, path: string) => {
    if (seenRuleIds.has(ruleId)) {
      issues.push({ path, message: `duplicate ruleId: ${ruleId}` });
    }
    seenRuleIds.add(ruleId);
  };
  for (const record of knowledge.structuralActivations.records) {
    addRuleId(record.ruleId, `structuralActivations.${record.markerId}`);
    if (!isAxes(record.axes)) {
      issues.push({ path: `structuralActivations.${record.markerId}`, message: "invalid axes shape" });
    }
  }
  for (const record of knowledge.transformationImpact.records) {
    addRuleId(record.ruleId, `transformationImpact.${record.mutagen}`);
    if (!isAxes(record.axes)) {
      issues.push({ path: `transformationImpact.${record.mutagen}`, message: "invalid axes shape" });
    }
  }
  for (const record of knowledge.interactionRules.records) {
    addRuleId(record.ruleId, `interactionRules.${record.ruleId}`);
  }

  // Disabled interaction rules must remain disabled — hard gate.
  if (knowledge.interactionRules.defaultEnabled !== false) {
    issues.push({
      path: "interactionRules.defaultEnabled",
      message: "defaultEnabled must be false for V0",
    });
  }
  for (const rule of knowledge.interactionRules.records) {
    if (rule.enabled !== false) {
      issues.push({
        path: `interactionRules.${rule.ruleId}`,
        message: "V0 requires every interaction rule to stay enabled:false",
      });
    }
    if (rule.enabled && rule.sourceRefs.length === 0) {
      issues.push({
        path: `interactionRules.${rule.ruleId}`,
        message: "an enabled interaction rule must carry sourceRefs",
      });
    }
  }

  // Nam Phái must never support Major Fortune transformations in V0.
  if (knowledge.schoolCapabilities.profiles["nam-phai"].supportsMajorFortuneTransformations) {
    issues.push({
      path: "schoolCapabilities.profiles.nam-phai",
      message: "Nam Phái must not support Major Fortune transformations in V0",
    });
  }

  // Every enabled numeric record must trace to the internal-architecture
  // source (SRC-MFS-ENG-001, formula_design usage).
  const hasArchitectureSource = knowledge.sourceRegistry.sources.some(
    (s) => s.sourceType === "internal_architecture" && s.allowedUsage.includes("formula_design"),
  );
  if (!hasArchitectureSource) {
    issues.push({
      path: "sourceRegistry",
      message:
        "no internal_architecture source with formula_design usage found to cover the experimental numeric coefficients",
    });
  }

  return { ok: issues.length === 0, issues };
}
