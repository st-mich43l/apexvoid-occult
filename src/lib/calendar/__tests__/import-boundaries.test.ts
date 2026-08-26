import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("PR #247 import boundary invariants", () => {
  it("calendar must not import bazi or ziwei", () => {
    const files = [
      "src/lib/calendar/julian.ts",
      "src/lib/calendar/sexagenary.ts",
      "src/lib/calendar/solar-terms.ts",
      "src/lib/calendar/timezone.ts",
      "src/lib/calendar/lunar-vn.ts",
      "src/lib/calendar/domain-tokens.ts",
    ];
    for (const f of files) {
      const src = read(f);
      expect(src).not.toMatch(/from ["'].*\/bazi\//);
      expect(src).not.toMatch(/from ["'].*\/ziwei\//);
    }
  });

  it("bazi civil-display must not import ziwei engines", () => {
    const src = read("src/lib/bazi/civil-display.ts");
    expect(src).not.toMatch(/ziwei\/engine-/);
  });

  it("released annual-axes router must not import research V0.12/V0.13", () => {
    const src = read(
      "src/lib/ziwei/analysis/modules/annual-axes/released-router.ts",
    );
    expect(src).not.toMatch(/v0\.12/);
    expect(src).not.toMatch(/v0\.13/);
  });
});
