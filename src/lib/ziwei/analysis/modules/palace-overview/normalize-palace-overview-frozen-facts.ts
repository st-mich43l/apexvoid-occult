/**
 * Palace Overview–only natal fact normalization for the frozen V1.2 numeric
 * contract. Uses Calculation Core chart output, then applies the narrow
 * 0ac04ad brightness compatibility overlay. Does not mutate ChartData and
 * must not be used by Major Fortune / Annual Axes / UI chart rendering.
 */
import type { ChartData } from "@/types/chart";
import {
  normalizeNatalFacts,
  type ZiweiSchool,
} from "../../facts";
import type {
  NormalizeNatalFactsResult,
  ZiweiBrightness,
} from "../../facts/types";
import frozenBrightnessCompat from "../../knowledge/palace-overview/v1/frozen-brightness-compat.0ac04ad.json";

const BRIGHTNESS = new Set<ZiweiBrightness>([
  "Miếu",
  "Vượng",
  "Đắc",
  "Bình",
  "Hãm",
]);

type Override = {
  star: string;
  branch: string;
  brightness: string;
};

const OVERRIDES = (frozenBrightnessCompat.overrides as Override[]).map((o) => ({
  star: o.star,
  branch: o.branch,
  brightness: o.brightness,
}));

function applyFrozenBrightnessCompat(
  result: NormalizeNatalFactsResult,
): NormalizeNatalFactsResult {
  if (OVERRIDES.length === 0) return result;
  const facts = result.facts.map((fact) => {
    if (fact.kind !== "star" || !fact.canonicalStarName || !fact.palaceBranch) {
      return fact;
    }
    const hit = OVERRIDES.find(
      (o) =>
        o.star === fact.canonicalStarName && o.branch === fact.palaceBranch,
    );
    if (!hit) return fact;
    if (!BRIGHTNESS.has(hit.brightness as ZiweiBrightness)) return fact;
    if (fact.brightness === hit.brightness) return fact;
    return {
      ...fact,
      brightness: hit.brightness as ZiweiBrightness,
    };
  });
  return { facts, duplicateIds: result.duplicateIds };
}

/** Natal facts for production Palace Overview frozen numeric path only. */
export function normalizePalaceOverviewFrozenFacts(
  chart: ChartData,
  options: { school: ZiweiSchool },
): NormalizeNatalFactsResult {
  const base = normalizeNatalFacts(chart, {
    school: options.school,
    // Start from engine brightness; teacher "corrected" overlay is NOT the
    // historical PO contract.
    brightnessMode: "engine",
  });
  return applyFrozenBrightnessCompat(base);
}
