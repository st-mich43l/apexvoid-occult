import { describe, expect, it, vi } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS } from "@/lib/ziwei/analysis/contracts/annual-axes";
import { loadAnnualAxesKnowledgeV10 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV08NamPhai } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.8";
import { analyzeAnnualAxesNamPhaiV10 } from "@/lib/ziwei/analysis/modules/annual-axes/v0.10-layered/analyze";
import { adaptNatalFoundation } from "@/lib/ziwei/analysis/modules/annual-axes/v0.10-layered/adapt-natal-foundation";
import {
  aggregateStaticDomain,
  resolveDomainPalaces,
} from "@/lib/ziwei/analysis/modules/annual-axes/domain-engine";
import { CASE_AA10_M1998_DAN_2026 } from "@/lib/ziwei/analysis/modules/annual-axes/v0.10-layered/compare";
import * as palaceOverview from "@/lib/ziwei/analysis/modules/palace-overview";

describe("Annual Domain Engine independence", () => {
  it("ANNUAL_AXES_PALACE_OVERVIEW_NUMERIC_DEPENDENCY = ZERO (no analyzeAllPalaces call)", () => {
    const spy = vi.spyOn(palaceOverview, "analyzeAllPalaces");
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    analyzeAnnualAxesNamPhaiV10(chart, { profileId: "layered-balanced" });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("TEST E — career resolves palaces from ChartData without PalaceOverviewResult", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const knowledge = loadAnnualAxesKnowledgeV10();
    const resolved = resolveDomainPalaces({
      chart,
      knowledge,
      domain: "career",
      projectionVariant: "legacy",
    });
    expect(resolved.mappedPalaces.map((p) => p.palaceName).sort()).toEqual(
      ["Mệnh", "Quan Lộc", "Thiên Di"].sort(),
    );
  });

  it("TEST F — shared physical palace is scored once (weight combined)", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const knowledge = loadAnnualAxesKnowledgeV10();
    const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
    expect(knowledge08.ok).toBe(true);
    if (!knowledge08.ok) return;

    const family = aggregateStaticDomain({
      chart,
      domain: "family",
      knowledge,
      knowledge08: knowledge08.knowledge,
      projectionVariant: "legacy",
    });
    expect(family.physicalPalaceDedupCount).toBe(family.mappedPalaces.length);

    const career = aggregateStaticDomain({
      chart,
      domain: "career",
      knowledge,
      knowledge08: knowledge08.knowledge,
      projectionVariant: "legacy",
    });
    expect(career.physicalPalaceDedupCount).toBeLessThanOrEqual(
      career.mappedPalaces.length,
    );
    expect(career.physicalPalaceDedupCount).toBeGreaterThan(0);
  });

  it("TEST B — Annual Axes may differ temporally between 2025 and 2026", () => {
    const a = analyzeAnnualAxesNamPhaiV10(
      calculateNamPhai({ ...CASE_AA10_M1998_DAN_2026, annualYear: "2025" }),
    );
    const b = analyzeAnnualAxesNamPhaiV10(
      calculateNamPhai({ ...CASE_AA10_M1998_DAN_2026, annualYear: "2026" }),
    );
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      expect(a.axes[domain].natal.signedNet).toBe(b.axes[domain].natal.signedNet);
    }
    const aTrace = JSON.stringify(
      ANNUAL_AXIS_DOMAINS.map((d) => ({
        d,
        net: a.axes[d].annual.signedNet,
        ids: a.axes[d].annual.contributors.map((c) => c.id),
        facts: a.axes[d].annual.contributors.flatMap((c) => c.physicalFactIds),
      })),
    );
    const bTrace = JSON.stringify(
      ANNUAL_AXIS_DOMAINS.map((d) => ({
        d,
        net: b.axes[d].annual.signedNet,
        ids: b.axes[d].annual.contributors.map((c) => c.id),
        facts: b.axes[d].annual.contributors.flatMap((c) => c.physicalFactIds),
      })),
    );
    expect(aTrace !== bTrace).toBe(true);
  });

  it("TEST D — adaptNatalFoundation ignores PO even if spy would return garbage", () => {
    const spy = vi.spyOn(palaceOverview, "analyzeAllPalaces").mockReturnValue({
      results: [],
      diagnostics: { issues: [], warnings: [] },
    } as never);
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const knowledge = loadAnnualAxesKnowledgeV10();
    const bundle = adaptNatalFoundation({
      chart,
      knowledge,
      domains: ANNUAL_AXIS_DOMAINS,
      projectionVariant: "legacy",
    });
    expect(spy).not.toHaveBeenCalled();
    expect(bundle.byDomain.career.signal.availability).not.toBe("unavailable");
    expect(
      bundle.byDomain.career.signal.contributors.every(
        (c) => c.sourceModule === "annual-axes-domain-engine",
      ),
    ).toBe(true);
    spy.mockRestore();
  });

  it("ANNUAL_DOMAIN_ENGINE_INDEPENDENT = PASS", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const result = analyzeAnnualAxesNamPhaiV10(chart);
    expect(result.module).toBe("annual-axes-v0.11-domain-engine");
    expect(result.versions.engineVersion).toBe("0.11.0");
    expect(result.candidateId).toBe("CANDIDATE-AAV11-DOMAIN-ENGINE");
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const json = JSON.stringify(result.axes[domain]);
      expect(json.includes("palaceOverviewScore")).toBe(false);
      expect(json.includes("palaceOverviewRawAxes")).toBe(false);
      expect(
        result.axes[domain].natal.contributors.every(
          (c) => c.sourceModule === "annual-axes-domain-engine",
        ),
      ).toBe(true);
    }
  });
});
