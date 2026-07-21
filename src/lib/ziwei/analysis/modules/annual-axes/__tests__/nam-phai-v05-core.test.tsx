import { describe, expect, it, beforeEach } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { analyzeAnnualAxes } from "../analyze";
import { render, screen } from "@testing-library/react";

import { AnnualAxesSection } from "@/components/ziwei/annual-axes/AnnualAxesSection";

import {
  computeActivationGate,
  computeBucketSigned,
  computeSpatialSigned,
} from "../nam-phai-v05/bucket-formula";
import { computeNatalGainV05 } from "../nam-phai-v05/natal-gain";
import { scoreV05Domain } from "../nam-phai-v05/score-domain";
import { isAnnualActivationCandidate } from "../nam-phai-v05/annual-activation";
import { loadAnnualAxesKnowledgeV05NamPhai } from "../../../knowledge/annual-axes/v0.5";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("Nam Phái Annual Axes V0.5 calibrated core", () => {
  it("bucket intensity/polarity/signed are bounded and consistent", () => {
    const evidenceScale = 2.5;
    const epsilon = 1e-9;

    const a = computeBucketSigned({
      supportRaw: 2,
      pressureRaw: 1,
      evidenceScale,
      epsilon,
    });
    expect(a.intensity).toBeGreaterThanOrEqual(0);
    expect(a.intensity).toBeLessThanOrEqual(1);
    expect(a.polarity).toBeGreaterThanOrEqual(-1);
    expect(a.polarity).toBeLessThanOrEqual(1);
    expect(a.signed).toBeGreaterThanOrEqual(-1);
    expect(a.signed).toBeLessThanOrEqual(1);
    expect(a.signed).toBeCloseTo(a.intensity * a.polarity, 12);

    const b = computeBucketSigned({
      supportRaw: 1,
      pressureRaw: 2,
      evidenceScale,
      epsilon,
    });
    expect(b.polarity).toBeLessThan(0);
    expect(b.signed).toBeLessThan(0);

    const c = computeBucketSigned({
      supportRaw: 0,
      pressureRaw: 0,
      evidenceScale,
      epsilon,
    });
    expect(c.intensity).toBe(0);
    expect(c.polarity).toBe(0);
    expect(c.signed).toBe(0);
  });

  it("direct/TP4C 90/10 composition never exceeds ±1", () => {
    const { spatialSigned } = computeSpatialSigned(1, 1);
    expect(spatialSigned).toBeCloseTo(1, 12);

    const { spatialSigned: s2 } = computeSpatialSigned(1, -1);
    expect(s2).toBeCloseTo(0.8, 12);

    const { spatialSigned: s3 } = computeSpatialSigned(-1, 1);
    expect(s3).toBeCloseTo(-0.8, 12);

    const { spatialSigned: s4 } = computeSpatialSigned(-1, -1);
    expect(s4).toBeCloseTo(-1, 12);
  });

  it("activationGate is tanh(annualActivationRaw / activationScale) and clamps to 0 when non-positive", () => {
    expect(computeActivationGate(-1, 2)).toBe(0);
    expect(computeActivationGate(0, 2)).toBe(0);

    const gate = computeActivationGate(1, 2);
    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThanOrEqual(1);
  });

  it("annual-only activation excludes global/MF channels and untriggered natal context", () => {
    const ctxOnly = {
      geometryBucket: "context-only",
      path: {
        channel: "direct-domain",
        geometryWeight: 1,
        affinityWeight: 1,
        effectivePathWeight: 1,
        boundedPathWeight: 1,
      },
      evidence: { layer: "annual", annualTriggerIds: ["SRC"] },
    } as any;
    expect(isAnnualActivationCandidate(ctxOnly)).toBe(true);

    const global = {
      geometryBucket: "direct",
      path: {
        channel: "global",
        geometryWeight: 1,
        affinityWeight: 1,
        effectivePathWeight: 1,
        boundedPathWeight: 1,
      },
      evidence: { layer: "annual", annualTriggerIds: ["SRC"] },
    } as any;
    expect(isAnnualActivationCandidate(global)).toBe(false);

    const annual = {
      geometryBucket: "direct",
      path: {
        channel: "direct-domain",
        geometryWeight: 1,
        affinityWeight: 1,
        effectivePathWeight: 1,
        boundedPathWeight: 1,
      },
      evidence: { layer: "annual", annualTriggerIds: [] },
    } as any;
    expect(isAnnualActivationCandidate(annual)).toBe(true);

    const annualContextWithTrigger = {
      geometryBucket: "context-only",
      path: {
        channel: "direct-domain",
        geometryWeight: 1,
        affinityWeight: 1,
        effectivePathWeight: 1,
        boundedPathWeight: 1,
      },
      evidence: { layer: "annual", annualTriggerIds: ["ANNUAL-TRIGGER"] },
    } as any;
    expect(isAnnualActivationCandidate(annualContextWithTrigger)).toBe(true);

    const natalNoTrigger = {
      geometryBucket: "direct",
      path: {
        channel: "direct-domain",
        geometryWeight: 1,
        affinityWeight: 1,
        effectivePathWeight: 1,
        boundedPathWeight: 1,
      },
      evidence: { layer: "natal-activated", annualTriggerIds: [] },
    } as any;
    expect(isAnnualActivationCandidate(natalNoTrigger)).toBe(false);

    const natalWithTrigger = {
      geometryBucket: "direct",
      path: {
        channel: "direct-domain",
        geometryWeight: 1,
        affinityWeight: 1,
        effectivePathWeight: 1,
        boundedPathWeight: 1,
      },
      evidence: { layer: "natal-activated", annualTriggerIds: ["ANNUAL-TRIGGER"] },
    } as any;
    expect(isAnnualActivationCandidate(natalWithTrigger)).toBe(true);
  });

  it("no positive annual activation yields activationGate=0 and score=50", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const knowledge = loaded.knowledge;
    const domain = "wealth";

    const aggregate = {
      evidence: [],
      rawAxes: { support: 0, pressure: 0, stability: 0, activation: 0 },
      spatialBudgetTrace: {
        directBudget: 0.9,
        tp4cBudget: 0.1,
        directSupportRaw: 0,
        directPressureRaw: 0,
        directSigned: 0,
        directContribution: 0,
        tp4cSupportRaw: 0,
        tp4cPressureRaw: 0,
        tp4cSigned: 0,
        tp4cContribution: 0,
        spatialSigned: 0,
      },
      directBucket: {
        total: 0,
        intensity: 0,
        polarity: 0,
        signed: 0,
        supportRaw: 0,
        pressureRaw: 0,
      },
      tp4cBucket: {
        total: 0,
        intensity: 0,
        polarity: 0,
        signed: 0,
        supportRaw: 0,
        pressureRaw: 0,
      },
      spatialSigned: 0,
      annualActivationRaw: 0,
    } as any;

    const natalResponse = { sensitivity: 0.5, resilience: 0.5, amplitudeMultiplier: 1, provenance: [] } as any;
    const scored = scoreV05Domain({ aggregate, natalResponse, domain: domain as any, knowledge });
    expect(scored.activationGate).toBe(0);
    expect(scored.score).toBe(knowledge.scoreProfile.neutral);
  });

  it("natalGain stays inside configured bounds", () => {
    const loaded = loadAnnualAxesKnowledgeV05NamPhai();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const knowledge = loaded.knowledge;

    const natalResponseHi = { sensitivity: 1, resilience: 1 } as any;
    const g1 = computeNatalGainV05(natalResponseHi, knowledge);
    expect(g1).toBeGreaterThanOrEqual(knowledge.natalGain.minimum);
    expect(g1).toBeLessThanOrEqual(knowledge.natalGain.maximum);

    const natalResponseLo = { sensitivity: 0, resilience: 0 } as any;
    const g2 = computeNatalGainV05(natalResponseLo, knowledge);
    expect(g2).toBeGreaterThanOrEqual(knowledge.natalGain.minimum);
    expect(g2).toBeLessThanOrEqual(knowledge.natalGain.maximum);
  });

  describe("V0.5 preview flag wiring", () => {
    beforeEach(() => {
      window.sessionStorage.clear();
      window.history.replaceState({}, "", "/");
    });

    it("routes Nam Phái engine to V0.5 when ?ziweiAnnualAxesV05=1", () => {
      window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1");
      const chart = calculateNamPhai(REGRESSION);
      const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
      expect(result.versions.engineVersion).toBe("0.5.0");
    });

    it("keeps Nam Phái on V0.4.2 when preview flag is OFF", () => {
      const chart = calculateNamPhai(REGRESSION);
      const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
      expect(result.versions.engineVersion).toBe("0.4.2");
    });

    it("renders the visible V0.5 preview badge in the six-axis UI", () => {
      window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1");
      const chart = calculateNamPhai(REGRESSION);
      render(<AnnualAxesSection chart={chart} school="nam-phai" />);
      expect(
        screen.getByText(/Annual Axes Engine: Nam Phái V0.5 Preview/i),
      ).toBeInTheDocument();
    });
  });
});

