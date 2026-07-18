import type { ChartData, MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../facts";
import type { MajorFortuneScoringKnowledgeV0 } from "../../knowledge/major-fortune-scoring";
import type { DeepReadonly } from "../../knowledge/major-fortune-scoring";
import type { MajorFortuneDiagnostics } from "./types";

/**
 * Recognize disabled V0 interaction candidate patterns and record
 * diagnostics without emitting scoring evidence.
 */
export function detectDisabledInteractionHits(
  chart: ChartData,
  majorTransformations: readonly MutagenRecord[] | undefined,
  knowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> | MajorFortuneScoringKnowledgeV0,
  diagnostics: MajorFortuneDiagnostics,
): void {
  const disabledRules = knowledge.interactionRules.records.filter((r) => !r.enabled);
  if (disabledRules.length === 0) return;

  const majorByTarget = new Map<string, Set<string>>();
  for (const record of majorTransformations ?? []) {
    const target = canonicalStarName(record.starName);
    const set = majorByTarget.get(target) ?? new Set();
    set.add(record.mutagen);
    majorByTarget.set(target, set);
  }

  const natalByTarget = new Map<string, Set<string>>();
  for (const record of chart.natalMutagens ?? []) {
    const target = canonicalStarName(record.starName);
    const set = natalByTarget.get(target) ?? new Set();
    set.add(record.mutagen);
    natalByTarget.set(target, set);
  }

  const hit = (ruleId: string, detail: string) => {
    if (disabledRules.some((r) => r.ruleId === ruleId)) {
      diagnostics.disabledInteractionHits.push(`${ruleId}:${detail}`);
    }
  };

  for (const [target, mutagens] of majorByTarget) {
    if (mutagens.has("Khoa") && mutagens.has("Kỵ")) {
      hit("RULE-MFS-KHOA-KY-MODERATION-CANDIDATE", target);
    }
    if (mutagens.has("Lộc") && mutagens.has("Kỵ")) {
      hit("RULE-MFS-LOC-KY-TENSION-CANDIDATE", target);
    }
    const natal = natalByTarget.get(target);
    if (natal && natal.size > 0 && mutagens.size > 0) {
      hit("RULE-MFS-NATAL-MAJOR-SAME-TRANSFORMATION-CANDIDATE", target);
    }
  }
}
