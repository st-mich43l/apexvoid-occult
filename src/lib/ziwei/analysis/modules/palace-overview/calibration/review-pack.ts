import { indexFactsByPalace, isExcludedTemporalSource, normalizeNatalFacts } from "../../../facts";
import type { NatalZiweiFact } from "../../../facts/types";
import type { BirthInput, ChartData, School } from "@/types/chart";

const FORBIDDEN_PACK_KEYS = new Set([
  "score",
  "band",
  "rawAxes",
  "axes",
  "intensity",
  "topSupportDrivers",
  "topPressureDrivers",
  "topSupportDriverIds",
  "topPressureDriverIds",
  "allEvidence",
  "palaceRatings",
  "pairwiseComparisons",
  "adjudication",
  "adjudications",
  "reviewerId",
  "numericDelta",
]);

interface ExpertReviewPalace {
  index: number;
  name: string;
  branch: string;
  isMenh: boolean;
  isThan: boolean;
  stars: Array<{
    factId: string;
    name: string;
    canonicalStarName: string;
    brightness: string | null;
    source: string;
  }>;
  transformations: Array<{
    factId: string;
    transformation: string;
    targetStar: string;
  }>;
  voidMarkers: Array<{
    factId: string;
    voidType: string;
  }>;
  changSheng: string | null;
}

export interface ExpertReviewNatalPack {
  caseId: string;
  school: School;
  blindedToEngine: true;
  natalIdentity: {
    solarDate: string;
    birthHour: string;
    gender: string;
    yearStem: string;
    yearBranch: string;
    menhBranch: string;
    menhIndex: number;
    thanIndex: number;
  };
  palaces: ExpertReviewPalace[];
  natalTransformations: ExpertReviewPalace["transformations"];
  voidMarkers: Array<{
    factId: string;
    palaceName: string;
    palaceBranch: string;
    voidType: string;
  }>;
}

function factsToPalace(palace: ChartData["palaces"][number], facts: NatalZiweiFact[]): ExpertReviewPalace {
  const stars = facts
    .filter((f) => f.kind === "star")
    .map((f) => ({
      factId: f.id,
      name: f.starName ?? "",
      canonicalStarName: f.canonicalStarName ?? "",
      brightness: f.brightness ?? null,
      source: f.source,
    }))
    .sort((a, b) => a.factId.localeCompare(b.factId));
  const transformations = facts
    .filter((f) => f.kind === "transformation")
    .map((f) => ({
      factId: f.id,
      transformation: f.transformation ?? "",
      targetStar: f.targetStar ?? "",
    }))
    .sort((a, b) => a.factId.localeCompare(b.factId));
  const voidMarkers = facts
    .filter((f) => f.kind === "void-marker")
    .map((f) => ({
      factId: f.id,
      voidType: f.voidType ?? "",
    }))
    .sort((a, b) => a.factId.localeCompare(b.factId));
  const changSheng = facts.find((f) => f.kind === "chang-sheng")?.changShengStage ?? null;
  return {
    index: palace.index,
    name: palace.name,
    branch: palace.branch,
    isMenh: Boolean(palace.isMenh),
    isThan: Boolean(palace.isThan),
    stars,
    transformations,
    voidMarkers,
    changSheng,
  };
}

export function buildExpertReviewNatalPack(input: {
  caseId: string;
  school: School;
  birth: BirthInput;
  chart: ChartData;
}): ExpertReviewNatalPack {
  const { facts } = normalizeNatalFacts(input.chart, { school: input.school });
  const byPalace = indexFactsByPalace(facts);
  const palaces = [...input.chart.palaces]
    .sort((a, b) => a.index - b.index)
    .map((p) => factsToPalace(p, byPalace.get(p.index) ?? []));
  const natalTransformations = palaces.flatMap((p) => p.transformations);
  const voidMarkers = palaces.flatMap((p) =>
    p.voidMarkers.map((v) => ({
      factId: v.factId,
      palaceName: p.name,
      palaceBranch: p.branch,
      voidType: v.voidType,
    })),
  );
  return {
    caseId: input.caseId,
    school: input.school,
    blindedToEngine: true,
    natalIdentity: {
      solarDate: input.birth.solarDate,
      birthHour: input.birth.birthHour,
      gender: input.birth.gender,
      yearStem: input.chart.yearStem,
      yearBranch: input.chart.yearBranch,
      menhBranch: input.chart.menhBranch,
      menhIndex: input.chart.menhIndex,
      thanIndex: input.chart.thanIndex,
    },
    palaces,
    natalTransformations,
    voidMarkers,
  };
}

export function assertReviewPackContainsStaticNatalFactsOnly(pack: unknown): string[] {
  const errors: string[] = [];
  const walk = (value: unknown, path: string): void => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN_PACK_KEYS.has(key)) {
        errors.push(`${path}.${key} is forbidden in a blinded review pack`);
      }
      if (key === "source" && typeof child === "string" && isExcludedTemporalSource(child)) {
        errors.push(`${path}.source=${child} is a temporal overlay`);
      }
      if (key === "layer" && child !== "natal" && path.includes("star")) {
        errors.push(`${path}.layer=${String(child)} is not natal`);
      }
      walk(child, `${path}.${key}`);
    }
  };
  walk(pack, "pack");
  return errors;
}

export function natalFactIdsFromPack(pack: ExpertReviewNatalPack): string[] {
  return [
    ...pack.palaces.flatMap((p) => [
      ...p.stars.map((s) => s.factId),
      ...p.transformations.map((t) => t.factId),
      ...p.voidMarkers.map((v) => v.factId),
    ]),
  ].sort();
}
