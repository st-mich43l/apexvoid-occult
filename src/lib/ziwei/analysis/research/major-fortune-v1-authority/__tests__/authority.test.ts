import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildAuthorityReport,
  expandNumericPolicies,
  loadAuthorityPack,
  validateAuthorityPack,
} from "..";
import { resolveHistoricalId } from "../historical-id-resolution";
import { resolveNumericAuthority } from "../resolve-numeric-authority";
import { resolveSourceWitness } from "../resolve-source-witness";

function clonePack() {
  return structuredClone(loadAuthorityPack());
}

describe("Major Fortune V1 authority foundation", () => {
  it("keeps historical IDs quarantined and never current-verified", () => {
    const pack = loadAuthorityPack();
    expect(resolveHistoricalId(pack, "SRC-TVDS-01")?.replacementId).toBeNull();
    expect(resolveHistoricalId(pack, "CLM-DIALOI-01")?.currentAuthorityStatus).toBe("NO_CURRENT_EQUIVALENT");
    expect(pack.claims.find((claim) => claim.evidenceFamily === "principal-star")?.doctrineAuthority).toBe("UNRESOLVED");
    expect(resolveSourceWitness(pack, "WIT-MFS-EXT-001")?.canonicalSourceId).toBe("SRC-MFS-EXT-001");
  });

  it("rejects prohibited numeric source usage", () => {
    const pack = clonePack();
    const claim = pack.claims.find((item) => item.evidenceFamily === "principal-star")!;
    claim.numericAuthority = "SOURCED_NUMERIC_AUTHORITY";
    expect(validateAuthorityPack(pack).some((issue) => issue.message.includes("cannot authorize numeric scoring"))).toBe(true);
  });

  it("rejects a numeric policy sourced from a prohibited witness", () => {
    const pack = clonePack();
    const numeric = pack.numericPolicies[0]!;
    numeric.authority = "SOURCED_NUMERIC_AUTHORITY";
    numeric.sourceWitnessIds = ["WIT-MFS-EXT-001"];
    expect(validateAuthorityPack(pack).some((issue) => issue.message.includes("numeric witness WIT-MFS-EXT-001"))).toBe(true);
  });

  it("rejects verified doctrine without an exact claim locator", () => {
    const pack = clonePack();
    const claim = pack.claims.find((item) => item.evidenceFamily === "principal-star")!;
    claim.doctrineAuthority = "VERIFIED_PRIMARY_DOCTRINE";
    expect(validateAuthorityPack(pack).some((issue) => issue.message.includes("exact claim locator"))).toBe(true);
  });

  it("rejects Trung Châu-only witnesses for shared claims", () => {
    const pack = clonePack();
    const claim = pack.claims.find((item) => item.evidenceFamily === "principal-star")!;
    claim.currentWitnessIds.push("WIT-TC-REPRO-LECTURE");
    expect(validateAuthorityPack(pack).some((issue) => issue.message.includes("Trung Châu-only witness"))).toBe(true);
  });

  it("rejects contradictory duplicate admission policies", () => {
    const pack = clonePack();
    pack.admissionPolicies.push({ ...pack.admissionPolicies[0]!, currentResearchAdmission: "BLOCKED" });
    expect(validateAuthorityPack(pack).some((issue) => issue.message.includes("duplicate evidence-family admission policy"))).toBe(true);
  });

  it("accounts for every RC1 numeric surface exactly once", () => {
    const surfaces = expandNumericPolicies(loadAuthorityPack());
    expect(surfaces).toHaveLength(150);
    expect(new Set(surfaces.map((surface) => surface.surfaceId)).size).toBe(150);
    expect(surfaces.filter((surface) => surface.authority === "PLACEHOLDER")).toHaveLength(134);
    expect(resolveNumericAuthority(loadAuthorityPack(), "maleficHeuristicThreshold")).toBe("RESEARCH_HYPOTHESIS");
  });

  it("replays every emitted evidence item exactly once", () => {
    const report = buildAuthorityReport("test-base-sha");
    expect(report.authority.totalEvidence).toBe(11880);
    expect(new Set(report.resolutions.map((resolution) => resolution.occurrenceId)).size).toBe(11880);
    expect(report.authority.unclassifiedAuthorityCount).toBe(0);
    expect(report.historicalIds.idsObserved).toBe(report.historicalIds.idsResolved);
    expect(report.decision).toBe("MFV1_AUTHORITY_FOUNDATION_REBUILT");
  }, 30000);

  it("keeps authority research out of production routing", () => {
    const production = readFileSync(resolve(process.cwd(), "src/lib/ziwei/analysis/modules/major-fortune/production.ts"), "utf8");
    const timeline = readFileSync(resolve(process.cwd(), "src/lib/ziwei/analysis/modules/major-fortune/timeline.ts"), "utf8");
    const shadow = readFileSync(resolve(process.cwd(), "src/lib/ziwei/analysis/modules/major-fortune/shadow.ts"), "utf8");
    expect(production).not.toContain("major-fortune-v1-authority");
    expect(timeline).not.toContain("major-fortune-v1-authority");
    expect(shadow).not.toContain("major-fortune-v1-authority");
  });
});
