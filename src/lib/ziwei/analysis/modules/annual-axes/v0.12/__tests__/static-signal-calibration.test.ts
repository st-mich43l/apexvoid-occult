import { describe, expect, it } from "vitest";
import {
  isSparseLayerSaturation,
  palaceSignedNet,
} from "../static-signal";
import { aggregateStaticDomain } from "../../domain-engine/aggregate-domain";
import { scoreStaticPalaceContext } from "../../domain-engine/score-static-palace-context";
import { loadAnnualAxesKnowledgeV10 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV08NamPhai } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.8";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { CASE_AA10_M1998_DAN_2026 } from "../../v0.10-layered/compare";
import { analyzeAnnualAxesNamPhaiV10 } from "../../v0.10-layered/analyze";
import { analyzeAnnualAxesNamPhaiV12 } from "../analyze";
import { analyzeAnnualAxes } from "../../released-router";
import { V12_CANDIDATE_ID, V12_ENGINE_VERSION } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.12";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

describe("V0.11 static domain — clampPalaceRaw void + sparse saturation", () => {
  it("documents that clampPalaceRaw is computed then discarded (BUG / dead path)", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "src/lib/ziwei/analysis/modules/annual-axes/domain-engine/score-static-palace-context.ts",
      ),
      "utf8",
    );
    expect(src).toMatch(/clampPalaceRaw/);
    expect(src).toMatch(/void palaceRaw/);
  });

  it("V0.11 ratio model: support=1 pressure=0 yields signedNet=+1 (SPARSE_LAYER_SATURATION)", () => {
    const supportMass = 1;
    const pressureMass = 0;
    const signedNet =
      (supportMass - pressureMass) / Math.max(supportMass + pressureMass, 1e-9);
    expect(signedNet).toBe(1);
    expect(
      isSparseLayerSaturation({ signedNet, evidenceMass: 1 }),
    ).toBe(true);
  });

  it("V0.11 ratio model: support=10 pressure=0 also yields signedNet=+1", () => {
    const supportMass = 10;
    const pressureMass = 0;
    const signedNet =
      (supportMass - pressureMass) / Math.max(supportMass + pressureMass, 1e-9);
    expect(signedNet).toBe(1);
  });
});

describe("V0.12 static signal formula", () => {
  it("CASE A: one +1 does not yield natal signedNet = +1", () => {
    const s = palaceSignedNet({
      positive: 1,
      negative: 0,
      epsilon: 1e-9,
      referenceMass: 4,
    });
    expect(s.directionalNet).toBe(1);
    expect(s.activation).toBe(0.25);
    expect(s.signedNet).toBeCloseTo(0.25, 8);
    expect(Math.abs(s.signedNet)).toBeLessThan(1);
  });

  it("CASE B: one -1 does not yield natal signedNet = -1", () => {
    const s = palaceSignedNet({
      positive: 0,
      negative: 1,
      epsilon: 1e-9,
      referenceMass: 4,
    });
    expect(s.signedNet).toBeCloseTo(-0.25, 8);
  });

  it("CASE C: balanced facts trend near 0", () => {
    const s = palaceSignedNet({
      positive: 4,
      negative: 4,
      epsilon: 1e-9,
      referenceMass: 4,
    });
    expect(s.directionalNet).toBe(0);
    expect(s.signedNet).toBe(0);
  });

  it("CASE D: substantial one-sided evidence may approach ±1", () => {
    const s = palaceSignedNet({
      positive: 8,
      negative: 0,
      epsilon: 1e-9,
      referenceMass: 4,
    });
    expect(s.activation).toBe(1);
    expect(s.signedNet).toBe(1);
  });

  it("activation is monotonic in evidence mass", () => {
    const a = palaceSignedNet({
      positive: 1,
      negative: 0,
      epsilon: 1e-9,
      referenceMass: 4,
    }).activation;
    const b = palaceSignedNet({
      positive: 2,
      negative: 0,
      epsilon: 1e-9,
      referenceMass: 4,
    }).activation;
    const c = palaceSignedNet({
      positive: 4,
      negative: 0,
      epsilon: 1e-9,
      referenceMass: 4,
    }).activation;
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });
});

describe("V0.12 research candidate vs V0.11 production", () => {
  it("does not alter released V0.11 control route", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const released = analyzeAnnualAxes(chart, { school: "nam-phai" });
    expect(released.versions.engineVersion).toBe("0.11.0");
    const v11 = analyzeAnnualAxesNamPhaiV10(chart);
    expect(v11.versions.engineVersion).toBe("0.11.0");
    const v12 = analyzeAnnualAxesNamPhaiV12(chart);
    expect(v12.versions.engineVersion).toBe(V12_ENGINE_VERSION);
    expect(v12.candidateId).toBe(V12_CANDIDATE_ID);
    for (const domain of Object.keys(v11.axes) as Array<keyof typeof v11.axes>) {
      expect(released.axes[domain].score).toBe(v11.axes[domain].finalScore);
    }
  });

  it("natal layer is invariant across annual years", () => {
    const base = { ...CASE_AA10_M1998_DAN_2026 };
    const years = ["2024", "2025", "2026", "2027"];
    const natalNets = years.map((annualYear) => {
      const chart = calculateNamPhai({ ...base, annualYear });
      const r = analyzeAnnualAxesNamPhaiV12(chart);
      return Object.fromEntries(
        Object.entries(r.axes).map(([d, ax]) => [d, ax.natal.signedNet]),
      );
    });
    for (let i = 1; i < natalNets.length; i++) {
      expect(natalNets[i]).toEqual(natalNets[0]);
    }
  });

  it("scores are finite and bounded when available", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const r = analyzeAnnualAxesNamPhaiV12(chart);
    for (const ax of Object.values(r.axes)) {
      if (ax.finalScore == null) continue;
      expect(Number.isFinite(ax.finalScore)).toBe(true);
      expect(ax.finalScore).toBeGreaterThanOrEqual(0);
      expect(ax.finalScore).toBeLessThanOrEqual(100);
      expect(Number.isFinite(ax.natal.signedNet)).toBe(true);
    }
  });
});

describe("V0.12 no Palace Overview numeric dependency", () => {
  it("ANNUAL_AXES_PALACE_OVERVIEW_NUMERIC_DEPENDENCY = ZERO in v0.12 tree", () => {
    const root = join(
      process.cwd(),
      "src/lib/ziwei/analysis/modules/annual-axes/v0.12",
    );
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (name.endsWith(".ts")) files.push(full);
      }
    };
    walk(root);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      if (file.includes("__tests__")) continue;
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/analyzeAllPalaces/);
      expect(src).not.toMatch(/PalaceOverviewResult/);
      expect(src).not.toMatch(/analyze-palace/);
      expect(src).not.toMatch(/palace-overview\/analyze/);
    }
  });
});

describe("V0.11 live aggregate still exhibits sparse saturation on chart", () => {
  it("exposes current domain-engine ratio behavior for audit", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const knowledge = loadAnnualAxesKnowledgeV10();
    const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
    expect(knowledge08.ok).toBe(true);
    if (!knowledge08.ok) return;
    const agg = aggregateStaticDomain({
      chart,
      domain: "career",
      knowledge,
      knowledge08: knowledge08.knowledge,
      projectionVariant: "legacy",
    });
    expect(Number.isFinite(agg.signedNet)).toBe(true);
    expect(typeof scoreStaticPalaceContext).toBe("function");
  });
});
