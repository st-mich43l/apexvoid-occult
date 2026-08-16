import { isAnnualStar } from "@/lib/ziwei/star-classification";
import type { ChartData, ChartStar } from "@/types/chart";
import {
  canonicalStarName,
  isMutagenMarkerName,
  isVoidStarName,
} from "./canonical-star-name";
import { correctedBrightness } from "../knowledge/corrected-brightness";
import type {
  NatalZiweiFact,
  NormalizeNatalFactsOptions,
  NormalizeNatalFactsResult,
  ZiweiStarClass,
  ZiweiTransformation,
  ZiweiVoidType,
} from "./types";

const TRANSFORMATIONS = new Set<ZiweiTransformation>([
  "Lộc",
  "Quyền",
  "Khoa",
  "Kỵ",
]);

function starClassFor(star: ChartStar): ZiweiStarClass {
  if (star.layer === "major") return "major";
  return "neutral";
}

export const TEMPORAL_FACT_SOURCES = [
  "annual",
  "annual-mutagen",
  "major-mutagen",
  "monthly-flow",
] as const;

function isExcludedTemporalSource(source: string | undefined): boolean {
  return (
    source === "annual" ||
    source === "annual-mutagen" ||
    source === "major-mutagen" ||
    source === "monthly-flow"
  );
}

export { isExcludedTemporalSource };

function shouldSkipStar(star: ChartStar): boolean {
  if (isAnnualStar(star)) return true;
  if (isExcludedTemporalSource(star.source)) return true;
  if (star.source === "natal-mutagen") return true;
  if (isMutagenMarkerName(star.name)) return true;
  if (isVoidStarName(star.name)) return true;
  return false;
}

function pushUnique(
  byId: Map<string, NatalZiweiFact>,
  duplicates: string[],
  fact: NatalZiweiFact,
): void {
  if (byId.has(fact.id)) {
    duplicates.push(fact.id);
    return;
  }
  byId.set(fact.id, fact);
}

/**
 * Normalize static natal facts from Calculation Core.
 * Does not mutate ChartData. Does not include annual/major-flow stars.
 */
export function normalizeNatalFacts(
  chart: ChartData,
  options: NormalizeNatalFactsOptions,
): NormalizeNatalFactsResult {
  const school = options.school;
  const byId = new Map<string, NatalZiweiFact>();
  const duplicates: string[] = [];

  for (const palace of chart.palaces) {
    for (const star of palace.stars ?? []) {
      if (shouldSkipStar(star)) continue;
      const name = canonicalStarName(star.name);
      const id = `natal:star:${palace.index}:${name}`;
      pushUnique(byId, duplicates, {
        id,
        layer: "natal",
        kind: "star",
        school,
        palaceIndex: palace.index,
        palaceName: palace.name,
        palaceBranch: palace.branch,
        source: star.source ?? "natal",
        starName: star.name,
        canonicalStarName: name,
        starClass: starClassFor(star),
        brightness: (() => {
          const raw = correctedBrightness(name, palace.branch, star.brightness);
          return raw === "Miếu" ||
            raw === "Vượng" ||
            raw === "Đắc" ||
            raw === "Bình" ||
            raw === "Hãm"
            ? raw
            : undefined;
        })(),
      });
    }

    const stage = palace.changSheng?.trim();
    if (stage) {
      const id = `natal:chang-sheng:${palace.index}:${stage}`;
      pushUnique(byId, duplicates, {
        id,
        layer: "natal",
        kind: "chang-sheng",
        school,
        palaceIndex: palace.index,
        palaceName: palace.name,
        palaceBranch: palace.branch,
        source: "natal",
        changShengStage: stage,
      });
    }
  }

  for (const record of chart.natalMutagens ?? []) {
    const mutagen = record.mutagen as ZiweiTransformation;
    if (!TRANSFORMATIONS.has(mutagen)) continue;
    const palace = record.palace;
    if (!palace) continue;
    const target = record.starName;
    const id = `natal:transform:${palace.index}:${mutagen}:${target}`;
    pushUnique(byId, duplicates, {
      id,
      layer: "natal",
      kind: "transformation",
      school,
      palaceIndex: palace.index,
      palaceName: palace.name,
      palaceBranch: palace.branch,
      source: "natal-mutagen",
      transformation: mutagen,
      targetStar: target,
    });
  }

  for (const marker of chart.voidMarkers ?? []) {
    const voidType = marker.type as ZiweiVoidType;
    if (voidType !== "Tuần" && voidType !== "Triệt") continue;
    for (const branch of marker.branches) {
      if (!branch) continue;
      const palace = chart.palaces.find((p) => p.branch === branch);
      if (!palace) continue;
      const id = `natal:void:${palace.index}:${voidType}`;
      pushUnique(byId, duplicates, {
        id,
        layer: "natal",
        kind: "void-marker",
        school,
        palaceIndex: palace.index,
        palaceName: palace.name,
        palaceBranch: palace.branch,
        source: "natal",
        voidType,
      });
    }
  }

  return { facts: [...byId.values()], duplicateIds: duplicates };
}

export function indexFactsByPalace(
  facts: NatalZiweiFact[],
): Map<number, NatalZiweiFact[]> {
  const map = new Map<number, NatalZiweiFact[]>();
  for (const fact of facts) {
    const list = map.get(fact.palaceIndex) ?? [];
    list.push(fact);
    map.set(fact.palaceIndex, list);
  }
  return map;
}
