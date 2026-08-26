import { describe, expect, it } from "vitest";
import { loadAnnualAxesKnowledgeV13 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.13";
import { loadDoctrinePack } from "@/lib/ziwei/analysis/modules/palace-overview/doctrine/loader";

describe("Annual Axes V0.13 doctrine snapshot provenance", () => {
  it("keeps every copied claim faithful to the canonical qualitative source claim", () => {
    const snapshot = loadAnnualAxesKnowledgeV13().bridge.claims;
    const sourceClaims = new Map(
      loadDoctrinePack().conditionalClaims.map((claim) => [claim.claimId, claim]),
    );

    expect(snapshot.length).toBeGreaterThan(0);
    for (const claim of snapshot) {
      const source = sourceClaims.get(claim.claimId);
      expect(source, `missing source claim ${claim.claimId}`).toBeDefined();
      if (!source) continue;

      expect(claim.star).toBe(source.star);
      expect(claim.palace).toBe(source.palace);
      expect(claim.school).toBe(source.school);
      expect(claim.conditions).toEqual(source.conditions ?? {});
      expect(claim.tendency).toEqual(source.tendency);
      expect(claim.magnitudeOrdinal).toBe(source.magnitudeOrdinal);
      expect(claim.sourceIds).toEqual(source.sourceIds);
      expect(claim.locator).toBe(source.locator);
      expect(claim.locatorType).toBe(source.locatorType);
      expect(claim.adjudication).toBe(source.adjudication);
      expect(claim.numericDelta).toBeNull();
    }
  });
});
