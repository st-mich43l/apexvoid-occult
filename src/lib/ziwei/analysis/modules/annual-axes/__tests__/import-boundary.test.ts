/**
 * Import-boundary lock for the annual-axes module tree.
 *
 * Production numeric Annual Axes must remain independent of Palace Overview
 * analyzers/scores, Monthly Flow, and legacy trend symbols. Research-only
 * romance-semantic may still inspect Palace Overview doctrine for
 * explainability and is excluded from this walk.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src/lib/ziwei/analysis/modules/annual-axes");
const PO_ROOT = join(process.cwd(), "src/lib/ziwei/analysis/modules/palace-overview");

function walkFiles(
  dir: string,
  out: string[] = [],
  skipNames: Set<string> = new Set(["__tests__", "audit", "romance-semantic"]),
): string[] {
  for (const name of readdirSync(dir)) {
    if (skipNames.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkFiles(full, out, skipNames);
    } else if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

const FORBIDDEN_TOKENS = [
  "PalaceOverviewResult",
  "analyzeAllPalaces",
  "analyzePalace",
  "analyzeMajorFortune",
  "analyzeMonthlyFlow",
  "getAnnualMajorFortuneIndex",
  "assignSmallLimits",
  "engine-nam-phai",
  "engine-trung-chau",
  "SCORING_WEIGHTS",
  "RADAR_WEIGHTS",
  "scoreFortuneFrame",
  "scoreLuuNguyetFrame",
  "getPalaceStrengths",
  "getAnnualAxisStrengths",
  "getDaiVanTrend",
  "getLuuNienTrend",
  "STAR_SCORES",
  "star-scores.csv",
];

/** Research helpers may build charts via Calculation Core. */
const ALLOW_ENGINE_IMPORT = new Set([
  join(ROOT, "v0.10-layered/compare.ts"),
  join(ROOT, "v0.10-layered/corpus.ts"),
  join(ROOT, "v0.12/corpus.ts"),
  join(ROOT, "v0.12/audits.ts"),
]);

const FORBIDDEN_IMPORT_PATHS = [
  /from ["'][^"']*\/modules\/palace-overview(?:\/(?!doctrine)[^"']*)?["']/,
  /from ["'][^"']*\/modules\/major-fortune["']/,
  /from ["'][^"']*\/modules\/monthly-flow["']/,
  /from ["'][^"']*\/lib\/ziwei\/trend[/"']/,
];

// Major Fortune adapter is allowed to import MF analyzer for decade domain layer.
const ALLOW_MAJOR_FORTUNE_IMPORT = new Set([
  join(ROOT, "v0.10-layered/adapt-major-fortune.ts"),
]);

describe("annual-axes module import boundary", () => {
  const files = walkFiles(ROOT);

  it("finds a non-empty module tree including domain-engine + v0.10-layered", () => {
    expect(files.some((f) => f.includes("domain-engine"))).toBe(true);
    expect(files.some((f) => f.includes("adapt-natal-foundation"))).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  it("does not reference forbidden analyzers or legacy scoring symbols", () => {
    const hits: string[] = [];
    for (const path of files) {
      const text = readFileSync(path, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      for (const token of FORBIDDEN_TOKENS) {
        if (token === "analyzeMajorFortune" && ALLOW_MAJOR_FORTUNE_IMPORT.has(path)) {
          continue;
        }
        if (
          (token === "engine-nam-phai" || token === "engine-trung-chau") &&
          ALLOW_ENGINE_IMPORT.has(path)
        ) {
          continue;
        }
        if (text.includes(token)) {
          hits.push(`${path}: ${token}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("does not import palace-overview runtime, monthly-flow, or legacy trend paths", () => {
    const hits: string[] = [];
    for (const path of files) {
      const text = readFileSync(path, "utf8");
      for (const pattern of FORBIDDEN_IMPORT_PATHS) {
        if (
          pattern.source.includes("major-fortune") &&
          ALLOW_MAJOR_FORTUNE_IMPORT.has(path)
        ) {
          continue;
        }
        if (pattern.test(text)) {
          hits.push(`${path}: matches ${pattern.source}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("palace-overview production does not import annual-axes runtime", () => {
    const poFiles = walkFiles(PO_ROOT, [], new Set(["__tests__", "candidate", "research", "calibration"]));
    const hits: string[] = [];
    for (const path of poFiles) {
      const text = readFileSync(path, "utf8");
      if (/from ["'][^"']*\/modules\/annual-axes/.test(text)) {
        hits.push(path);
      }
    }
    expect(hits).toEqual([]);
  });
});
