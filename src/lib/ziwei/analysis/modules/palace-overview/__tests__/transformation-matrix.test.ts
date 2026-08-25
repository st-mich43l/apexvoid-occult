import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadPalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../../../../..");

function parseTuHoaPairs(engineRel: string): Set<string> {
  const src = readFileSync(resolve(repoRoot, engineRel), "utf8");
  const block = src.match(/const TU_HOA[\s\S]*?^\};/m);
  if (!block) throw new Error(`TU_HOA not found in ${engineRel}`);
  const pairs = new Set<string>();
  for (const m of block[0].matchAll(/(Lộc|Quyền|Khoa|Kỵ):"([^"]+)"/g)) {
    pairs.add(`${m[2]}:${m[1]}`);
  }
  return pairs;
}

describe("Tứ Hóa transformation matrix", () => {
  it("has exactly the 40 union cells of both engines and never Thiên Tướng/Thất Sát", () => {
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const cells = loaded.knowledge.transformationMatrix.cells;
    expect(cells).toHaveLength(40);

    const nam = parseTuHoaPairs("src/lib/ziwei/engine-nam-phai.ts");
    const trung = parseTuHoaPairs("src/lib/ziwei/engine-trung-chau.ts");
    const union = new Set([...nam, ...trung]);
    const matrix = new Set(cells.map((c) => `${c.star}:${c.transformation}`));
    expect([...union].sort()).toEqual([...matrix].sort());
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
    console.log(`Tứ Hóa matrix fill: ${filled} / 40`);
    expect(filled).toBeGreaterThanOrEqual(12);
    expect(filled).toBeLessThanOrEqual(40);
  });
});
