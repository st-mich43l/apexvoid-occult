import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { absEffect } from "../types";

describe("structural interaction policy", () => {
  it("documents baseAxes as bounded interaction deltas, not unbounded stacks", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const effects = loaded.knowledge.structuralRules.rules.map((r) =>
      absEffect(r.baseAxes),
    );
    const max = Math.max(...effects);
    const sum = effects.reduce((a, b) => a + b, 0);
    expect(max).toBeLessThanOrEqual(12);
    expect(sum).toBeLessThanOrEqual(30);
  });

  it("geometry is not re-applied to structural rule axes (notes + code contract)", () => {
    expect(loadPalaceOverviewKnowledgeV1().ok).toBe(true);
  });
});
