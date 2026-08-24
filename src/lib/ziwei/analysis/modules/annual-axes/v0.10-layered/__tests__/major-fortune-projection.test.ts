import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeMajorFortune } from "../../../major-fortune";
import { analyzeAnnualAxesNamPhaiV10 } from "../analyze";
import { CASE_AA10_M1998_DAN_2026 } from "../compare";

const DIAGNOSTIC_DOMAINS = ["career", "social"] as const;

describe("V0.10 Major Fortune domain projection hardening", () => {
  it("reuses only evidence accepted by the upstream ordinal evaluator", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const majorFortune = analyzeMajorFortune(chart, { school: "nam-phai" });
    const result = analyzeAnnualAxesNamPhaiV10(chart, {
      profileId: "layered-balanced",
      projectionVariant: "legacy",
    });

    expect(majorFortune.result).not.toBeNull();
    if (!majorFortune.result) return;

    const acceptedIds = new Set(
      Object.values(majorFortune.result.pillars).flatMap((pillar) =>
        pillar.acceptedEvidenceIds,
      ),
    );

    for (const domain of Object.keys(result.axes) as Array<keyof typeof result.axes>) {
      const prefix = `mf:${domain}:`;
      for (const contributor of result.axes[domain].decade.contributors) {
        expect(contributor.id.startsWith(prefix)).toBe(true);
        expect(acceptedIds.has(contributor.id.slice(prefix.length))).toBe(true);
      }
    }
  });

  it("does not let sparse one-sided decade evidence saturate a domain to +/-1", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const result = analyzeAnnualAxesNamPhaiV10(chart, {
      profileId: "layered-balanced",
      projectionVariant: "legacy",
    });

    const sparseOneSided = DIAGNOSTIC_DOMAINS.map(
      (domain) => result.axes[domain].decade,
    ).filter((layer) => {
      const totalMass = layer.supportMass + layer.pressureMass;
      return (
        totalMass > 0 &&
        totalMass < 4 &&
        (layer.supportMass === 0 || layer.pressureMass === 0)
      );
    });

    // This is the PR #228 diagnostic shape: career/social previously reached
    // signedNet = -1 from sparse pressure-only Major Fortune evidence.
    expect(sparseOneSided.length).toBeGreaterThan(0);

    for (const layer of sparseOneSided) {
      const totalMass = layer.supportMass + layer.pressureMass;
      const directionalNet =
        (layer.supportMass - layer.pressureMass) / totalMass;
      const expectedActivation = Math.min(1, totalMass / 4);

      expect(layer.activation).toBeCloseTo(expectedActivation, 10);
      expect(layer.signedNet).toBeCloseTo(
        directionalNet * expectedActivation,
        10,
      );
      expect(Math.abs(layer.signedNet)).toBeLessThan(1);
      expect(layer.reasonCodes).toContain("decade-sparse-evidence-damped");
    }
  });
});
