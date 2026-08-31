import { describe, expect, it } from "vitest";
import { loadPalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2";
import { NAM_PHAI_TU_HOA } from "@/lib/ziwei/schools/nam-phai-policy";
import { TRUNG_CHAU_TU_HOA } from "@/lib/ziwei/schools/trung-chau-policy";
import type { TuHoaTable } from "@/lib/ziwei/schools/policy-types";
import type { ZiweiMutagen } from "@/lib/ziwei/schools/policy-types";

const MUTAGENS: readonly ZiweiMutagen[] = ["Lộc", "Quyền", "Khoa", "Kỵ"];

function tuHoaPairs(table: TuHoaTable): Set<string> {
  const pairs = new Set<string>();
  for (const stem of Object.keys(table) as Array<keyof TuHoaTable>) {
    const row = table[stem];
    for (const mutagen of MUTAGENS) {
      pairs.add(`${row[mutagen]}:${mutagen}`);
    }
  }
  return pairs;
}

describe("Tứ Hóa transformation matrix", () => {
  it("has exactly the Nam∪TC union cells and never Thiên Tướng/Thất Sát", () => {
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const cells = loaded.knowledge.transformationMatrix.cells;
    expect(cells).toHaveLength(41);

    const union = new Set([
      ...tuHoaPairs(NAM_PHAI_TU_HOA),
      ...tuHoaPairs(TRUNG_CHAU_TU_HOA),
    ]);
    const matrix = new Set(cells.map((c) => `${c.star}:${c.transformation}`));
    expect([...union].sort()).toEqual([...matrix].sort());
    expect(union.has("Thái Dương:Khoa")).toBe(true);
    expect(union.has("Hữu Bật:Khoa")).toBe(true);
    expect([...matrix].some((k) => k.startsWith("Thiên Tướng:"))).toBe(false);
    expect([...matrix].some((k) => k.startsWith("Thất Sát:"))).toBe(false);
  });

  it("logs fill progress and does not fail on a low fill rate", () => {
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const cells = loaded.knowledge.transformationMatrix.cells;
    const filled = cells.filter((c) => !c.usesFallback).length;
    // Knowledge-progress metric only — must not fail closed on a low ratio.
    console.log(`Tứ Hóa matrix fill: ${filled} / 41`);
    expect(filled).toBeGreaterThanOrEqual(12);
    expect(filled).toBeLessThanOrEqual(41);
  });
});
