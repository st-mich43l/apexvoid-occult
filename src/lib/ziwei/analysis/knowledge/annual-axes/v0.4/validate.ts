import type { AnnualAxisDomainId } from "../schema";
import type { AnnualAxesKnowledgeV04NamPhai } from "./schema";

export interface AnnualKnowledgeV04ValidationIssue {
  path: string;
  message: string;
}

const DOMAINS: AnnualAxisDomainId[] = [
  "health",
  "family",
  "wealth",
  "career",
  "social",
  "romance",
];

function issue(path: string, message: string): AnnualKnowledgeV04ValidationIssue {
  return { path, message };
}

function isUnitInterval(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
}

/**
 * Structural validation for the V0.4 annual-delta Nam Phái knowledge pack.
 * Fail closed — invalid packs must never produce numeric scores.
 */
export function validateAnnualAxesKnowledgeV04NamPhai(
  knowledge: AnnualAxesKnowledgeV04NamPhai,
): { ok: true } | { ok: false; issues: AnnualKnowledgeV04ValidationIssue[] } {
  const issues: AnnualKnowledgeV04ValidationIssue[] = [];

  if (knowledge.channelProfile.routing.floor !== 0) {
    issues.push(issue("channelProfile.routing.floor", "V0.4 requires routing floor = 0"));
  }

  const weights = knowledge.channelProfile.channelWeights;
  const weightSum =
    weights.globalAnnualClimate +
    weights.routedHeadImpact +
    weights.directDomainImpact +
    weights.majorFortuneBackground;
  if (Math.abs(weightSum - 1) > 1e-6) {
    issues.push(issue("channelProfile.channelWeights", `channel weights must sum to 1 (got ${weightSum})`));
  }
  if (weights.globalAnnualClimate > 0.2) {
    issues.push(
      issue("channelProfile.channelWeights.globalAnnualClimate", "global channel must remain a small minority"),
    );
  }

  const delta = knowledge.deltaProfile;
  if (delta.neutralScore !== 50) {
    issues.push(issue("deltaProfile.neutralScore", "neutralScore must be 50"));
  }
  if (delta.natalResponse.responseFloor < 0 || delta.natalResponse.responseRange < 0) {
    issues.push(issue("deltaProfile.natalResponse", "response coefficients must be non-negative"));
  }

  const sourceIds = new Set(knowledge.sourceRegistry.sources.map((s) => s.sourceId));
  const seenRecordIds = new Set<string>();
  const seenStarKeys = new Set<string>();
  const seenTfKeys = new Set<string>();

  for (const record of knowledge.domainAffinity.records) {
    if (seenRecordIds.has(record.id)) {
      issues.push(issue(`domainAffinity.records.${record.id}`, "duplicate affinity record id"));
    }
    seenRecordIds.add(record.id);

    let anyNonZero = false;
    for (const domain of DOMAINS) {
      const v = record.affinities[domain];
      if (!isUnitInterval(v)) {
        issues.push(issue(`domainAffinity.records.${record.id}.affinities.${domain}`, "affinity must be in [0,1]"));
      } else if (v > 0) {
        anyNonZero = true;
      }
    }
    if (!anyNonZero) {
      issues.push(issue(`domainAffinity.records.${record.id}`, "at least one affinity must be non-zero"));
    }

    for (const sid of record.sourceIds) {
      if (!sourceIds.has(sid)) {
        issues.push(issue(`domainAffinity.records.${record.id}.sourceIds`, `unresolved source ${sid}`));
      }
    }

    if (record.subject.kind === "star") {
      const key = record.subject.canonicalStarName;
      if (seenStarKeys.has(key)) {
        issues.push(issue(`domainAffinity.records.${record.id}`, `duplicate star affinity for ${key}`));
      }
      seenStarKeys.add(key);
    }
    if (record.subject.kind === "transformation") {
      const key = record.subject.transformation;
      if (seenTfKeys.has(key)) {
        issues.push(issue(`domainAffinity.records.${record.id}`, `duplicate transformation affinity for ${key}`));
      }
      seenTfKeys.add(key);
    }
  }

  for (const domain of DOMAINS) {
    const starDefault = knowledge.domainAffinity.categoryDefaults.star[domain];
    const mutagenDefault = knowledge.domainAffinity.categoryDefaults.mutagen[domain];
    if (!isUnitInterval(starDefault) || !isUnitInterval(mutagenDefault)) {
      issues.push(issue(`domainAffinity.categoryDefaults.${domain}`, "defaults must be in [0,1]"));
    }
  }

  const enabled = knowledge.triggerPolicy.enabledTriggers.filter((t) => t.enabled);
  if (enabled.length === 0) {
    issues.push(issue("triggerPolicy.enabledTriggers", "at least one trigger must be enabled"));
  }

  const gates = knowledge.distributionGates.hardGates;
  for (const [key, value] of Object.entries(gates)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      issues.push(issue(`distributionGates.hardGates.${key}`, "gate threshold must be a finite number"));
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true };
}
