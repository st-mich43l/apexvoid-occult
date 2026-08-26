import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS } from "@/lib/ziwei/analysis/contracts/annual-axes";
import { loadAnnualAxesKnowledgeV10 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV08NamPhai } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.8";
import { loadAnnualAxesKnowledgeV12 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.12";
import {
  V13_CANDIDATE_ID,
  V13_ENGINE_VERSION,
  loadAnnualAxesKnowledgeV13,
} from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.13";
import { analyzeAnnualAxes } from "../../released-router";
import { CASE_AA10_M1998_DAN_2026 } from "../../v0.10-layered/compare";
import { aggregateStaticDomainV13 } from "../aggregate-domain";
import { analyzeAnnualAxesNamPhaiV13 } from "../analyze";
import { collectDoctrineFallbackEvidence } from "../doctrine-bridge";

describe("Annual Axes V0.13 doctrine bridge integrity", () => {
  it("admits only VERIFIED_PRIMARY exact-section qualitative claims", () => {
    const knowledge = loadAnnualAxesKnowledgeV13();
    expect(knowledge.bridge.claims.length).toBeGreaterThan(0);
    for (const claim of knowledge.bridge.claims) {
      expect(claim.adjudication).toBe("VERIFIED_PRIMARY");
      expect(claim.locatorType).toBe("EXACT_SECTION");
      expect(claim.numericDelta).toBeNull();
      expect(["classical-shared", "nam-phai"]).toContain(claim.school);
      expect(claim.sourceIds.length).toBeGreaterThan(0);
    }
  });

  it("keeps unspecified ordinal claims context-only", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const knowledge = loadAnnualAxesKnowledgeV13();
    const palace = chart.palaces.find((p) => p.name === "Thiên Di");
    expect(palace).toBeDefined();
    if (!palace) return;
    const evidence = collectDoctrineFallbackEvidence({
      chart,
      palaceIndex: palace.index,
      palaceName: "Thiên Di",
      knowledge,
      alreadyScoredStars: new Set(),
    });
    const thienCo = evidence.find((e) => e.starName === "Thiên Cơ");
    expect(thienCo).toBeDefined();
    expect(thienCo?.admittedForNumeric).toBe(false);
    expect(thienCo?.reason).toBe("context-only-tendency");
  });

  it("never double-counts a physical star already scored by V0.12", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const knowledge = loadAnnualAxesKnowledgeV13();
    const palace = chart.palaces.find((p) => p.name === "Tài Bạch");
    expect(palace).toBeDefined();
    if (!palace) return;
    const evidence = collectDoctrineFallbackEvidence({
      chart,
      palaceIndex: palace.index,
      palaceName: "Tài Bạch",
      knowledge,
      alreadyScoredStars: new Set(["Thái Âm"]),
    });
    const thaiAm = evidence.find(
      (e) => e.starName === "Thái Âm" && e.direction === "support",
    );
    expect(thaiAm).toBeDefined();
    expect(thaiAm?.admittedForNumeric).toBe(false);
    expect(thaiAm?.reason).toBe("v012-physical-star-already-scored");
  });
});

describe("Annual Axes V0.13 static-domain coverage", () => {
  it("fills the 1998 Tài Bạch Thái Âm gap without Palace Overview scores", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const knowledge10 = loadAnnualAxesKnowledgeV10();
    const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
    const knowledge12 = loadAnnualAxesKnowledgeV12();
    const knowledge13 = loadAnnualAxesKnowledgeV13();
    expect(knowledge08.ok).toBe(true);
    if (!knowledge08.ok) return;

    const aggregate = aggregateStaticDomainV13({
      chart,
      domain: "wealth",
      knowledge: knowledge10,
      knowledge08: knowledge08.knowledge,
      knowledge12,
      knowledge13,
      projectionVariant: "legacy",
      referenceMass: knowledge13.referenceMass,
    });

    const taiBach = aggregate.palaceContexts.find(
      (ctx) => ctx.palaceName === "Tài Bạch",
    );
    expect(taiBach).toBeDefined();
    expect(
      taiBach?.doctrineEvidence.some(
        (e) => e.claimId === "qs2-taibach-thaiam" && e.admittedForNumeric,
      ),
    ).toBe(true);
    expect(aggregate.doctrineAdmittedCount).toBeGreaterThan(0);
    expect(JSON.stringify(aggregate)).not.toMatch(/palaceOverview|rawAxes/);
  });

  it("keeps natal candidate invariant across annual years", () => {
    const years = ["2024", "2025", "2026", "2027"];
    const nets = years.map((annualYear) => {
      const chart = calculateNamPhai({
        ...CASE_AA10_M1998_DAN_2026,
        annualYear,
      });
      const result = analyzeAnnualAxesNamPhaiV13(chart);
      return Object.fromEntries(
        ANNUAL_AXIS_DOMAINS.map((domain) => [
          domain,
          result.axes[domain].natal.signedNet,
        ]),
      );
    });
    for (let i = 1; i < nets.length; i++) {
      expect(nets[i]).toEqual(nets[0]);
    }
  });

  it("does not alter the released V0.11 route", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const released = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const candidate = analyzeAnnualAxesNamPhaiV13(chart);
    expect(released.versions.engineVersion).toBe("0.11.0");
    expect(candidate.versions.engineVersion).toBe(V13_ENGINE_VERSION);
    expect(candidate.candidateId).toBe(V13_CANDIDATE_ID);
    for (const axis of Object.values(candidate.axes)) {
      if (axis.finalScore == null) continue;
      expect(Number.isFinite(axis.finalScore)).toBe(true);
      expect(axis.finalScore).toBeGreaterThanOrEqual(0);
      expect(axis.finalScore).toBeLessThanOrEqual(100);
    }
  });
});

describe("Annual Axes V0.13 import boundary", () => {
  it("has zero Palace Overview numeric/runtime imports", () => {
    const root = join(
      process.cwd(),
      "src/lib/ziwei/analysis/modules/annual-axes/v0.13",
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
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/analyzeAllPalaces/);
      expect(source).not.toMatch(/PalaceOverviewResult/);
      expect(source).not.toMatch(/palace-overview\/analyze/);
      expect(source).not.toMatch(/rawAxes/);
    }
  });
});
