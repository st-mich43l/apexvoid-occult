import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../../../../knowledge/annual-axes/v0.8";
import { analyzeAnnualAxesNamPhaiV10 } from "../analyze";
import { composeLayerNets, compositeNetToRaw } from "../compose";
import { normalizeWithV08Mapping } from "../normalize";
import { computeResonance } from "../resonance";
import { getProfileWeights, listProfiles, V10_PROFILE_IDS } from "../profiles";
import { loadAnnualAxesKnowledgeV10 } from "../../../../knowledge/annual-axes/v0.10";
import { CASE_AA10_M1998_DAN_2026 } from "../compare";
import type { AnnualLayerSignal } from "../types";

function signal(
  partial: Partial<AnnualLayerSignal> & Pick<AnnualLayerSignal, "layer" | "domain">,
): AnnualLayerSignal {
  return {
    signedNet: 0,
    supportMass: 0,
    pressureMass: 0,
    activation: 0,
    coverage: 1,
    availability: "available",
    contributors: [],
    reasonCodes: [],
    ...partial,
  };
}

describe("V0.10 profiles and compose", () => {
  it("each profile weights sum exactly to 1", () => {
    for (const id of V10_PROFILE_IDS) {
      const w = getProfileWeights(id);
      const sum =
        w.natalFoundation + w.majorFortune + w.annualTrigger + w.resonance;
      expect(sum).toBeCloseTo(1, 12);
    }
    expect(listProfiles()).toHaveLength(3);
  });

  it("compositeNet reconstructs from layer nets × weights", () => {
    const weights = getProfileWeights("layered-balanced");
    const natal = signal({ layer: "natal-foundation", domain: "career", signedNet: -0.4 });
    const decade = signal({ layer: "major-fortune", domain: "career", signedNet: -0.2 });
    const annual = signal({ layer: "annual-trigger", domain: "career", signedNet: -0.1 });
    const resonance = signal({ layer: "resonance", domain: "career", signedNet: -0.3 });
    const { compositeNet } = composeLayerNets({ natal, decade, annual, resonance, weights });
    const expected =
      weights.natalFoundation * -0.4 +
      weights.majorFortune * -0.2 +
      weights.annualTrigger * -0.1 +
      weights.resonance * -0.3;
    expect(compositeNet).toBeCloseTo(expected, 10);
  });

  it("final score reconstructs via frozen V0.8 mapping", () => {
    const loaded = loadAnnualAxesKnowledgeV08NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const raw = -2.5;
    const score = normalizeWithV08Mapping(raw, loaded.knowledge);
    const tanhScale = loaded.knowledge.pointClasses.score.tanhScale;
    const expected = Math.min(
      90,
      Math.max(10, Math.round((50 + 50 * Math.tanh(raw / tanhScale)) * 10) / 10),
    );
    expect(score).toBe(expected);
    const net = -0.3125;
    expect(compositeNetToRaw(net, loaded.knowledge)).toBeCloseTo(
      net * loaded.knowledge.pointClasses.axisRawClamp.maximum,
      10,
    );
  });
});

describe("V0.10 resonance", () => {
  const knowledge = loadAnnualAxesKnowledgeV10();

  it("negative foundation + negative annual → bounded negative resonance", () => {
    const r = computeResonance({
      domain: "career",
      natal: signal({ layer: "natal-foundation", domain: "career", signedNet: -0.5 }),
      decade: signal({ layer: "major-fortune", domain: "career", signedNet: -0.4 }),
      annual: signal({ layer: "annual-trigger", domain: "career", signedNet: -0.3 }),
      config: knowledge.resonance,
    });
    expect(r.signedNet).toBeLessThan(0);
    expect(Math.abs(r.signedNet)).toBeLessThanOrEqual(knowledge.resonance.maxMagnitude + 1e-9);
    expect(r.contributors.every((c) => c.physicalFactIds.length === 0)).toBe(true);
    expect(r.reasonCodes.some((c) => c.includes("pressure") || c.includes("triple"))).toBe(
      true,
    );
  });

  it("positive foundation + positive annual → bounded positive resonance", () => {
    const r = computeResonance({
      domain: "wealth",
      natal: signal({ layer: "natal-foundation", domain: "wealth", signedNet: 0.5 }),
      decade: signal({ layer: "major-fortune", domain: "wealth", signedNet: 0.4 }),
      annual: signal({ layer: "annual-trigger", domain: "wealth", signedNet: 0.3 }),
      config: knowledge.resonance,
    });
    expect(r.signedNet).toBeGreaterThan(0);
    expect(Math.abs(r.signedNet)).toBeLessThanOrEqual(knowledge.resonance.maxMagnitude + 1e-9);
  });

  it("rescue is partial — does not fully reverse deep adversity", () => {
    const r = computeResonance({
      domain: "romance",
      natal: signal({ layer: "natal-foundation", domain: "romance", signedNet: -0.6 }),
      decade: signal({ layer: "major-fortune", domain: "romance", signedNet: -0.5 }),
      annual: signal({ layer: "annual-trigger", domain: "romance", signedNet: 0.5 }),
      config: knowledge.resonance,
    });
    expect(r.reasonCodes).toContain("temporary-rescue-capped");
    // Still may be negative overall due to triple/alignment pressure terms
    expect(r.signedNet).toBeGreaterThan(-knowledge.resonance.maxMagnitude - 1e-9);
  });
});

describe("V0.10 six-domain + mapping", () => {
  it("returns all six domains with career 60/20/20 anchors", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const result = analyzeAnnualAxesNamPhaiV10(chart, { profileId: "layered-balanced" });
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      expect(result.axes[domain]).toBeDefined();
      expect(result.axes[domain].domain).toBe(domain);
    }
    const careerAnchors = result.axes.career.domainProjection.anchors;
    expect(careerAnchors.find((a) => a.palace === "Quan Lộc")?.originalWeight).toBe(0.6);
    expect(careerAnchors.find((a) => a.palace === "Thiên Di")?.originalWeight).toBe(0.2);
    expect(careerAnchors.find((a) => a.palace === "Mệnh")?.originalWeight).toBe(0.2);
  });

  it("legacy and expanded romance mappings use configured weights", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const legacy = analyzeAnnualAxesNamPhaiV10(chart, {
      projectionVariant: "legacy",
    });
    const expanded = analyzeAnnualAxesNamPhaiV10(chart, {
      projectionVariant: "romance-expanded",
    });
    expect(
      legacy.axes.romance.domainProjection.anchors.find((a) => a.palace === "Phu Thê")
        ?.originalWeight,
    ).toBe(0.6);
    expect(
      expanded.axes.romance.domainProjection.anchors.find((a) => a.palace === "Phu Thê")
        ?.originalWeight,
    ).toBe(0.5);
    expect(
      expanded.axes.romance.domainProjection.anchors.find((a) => a.palace === "Phúc Đức")
        ?.originalWeight,
    ).toBe(0.2);
  });

  it("is deterministic for same input/profile", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const a = analyzeAnnualAxesNamPhaiV10(chart, { profileId: "annual-heavy" });
    const b = analyzeAnnualAxesNamPhaiV10(chart, { profileId: "annual-heavy" });
    expect(JSON.stringify(a.axes)).toBe(JSON.stringify(b.axes));
  });
});
