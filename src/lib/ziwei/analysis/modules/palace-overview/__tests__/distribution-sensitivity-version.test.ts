import { describe, expect, it } from "vitest";
import { getPalaceOverviewVersions, loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import {
  collectSchoolScores,
  distributionPathological,
  summarizeScores,
  buildMatrixInputs,
} from "../calibration/distribution";
import {
  runGeometrySensitivity,
  sensitivityUnstable,
} from "../calibration/sensitivity";
import { buildParameterRegistry } from "../scoring/parameter-registry";

describe("distribution health (compact matrix)", () => {
  it("neither school saturates to 0/100 or collapses range", () => {
    const inputs = buildMatrixInputs(12);
    for (const school of ["nam-phai", "trung-chau"] as const) {
      const stats = summarizeScores(collectSchoolScores(school, inputs));
      expect(distributionPathological(stats)).toBe(false);
      expect(stats.min).toBeGreaterThanOrEqual(0);
      expect(stats.max).toBeLessThanOrEqual(100);
      expect(stats.max - stats.min).toBeGreaterThan(15);
    }
  });
});

describe("sensitivity", () => {
  it("±10% geometry/scale perturbations are not explosive on the seed chart", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const rows = runGeometrySensitivity(loaded.knowledge);
    expect(rows.length).toBeGreaterThan(0);
    expect(sensitivityUnstable(rows)).toBe(false);
  });
});

describe("version coherence", () => {
  it("manifest fields do not claim production or a calibration version", () => {
    const v = getPalaceOverviewVersions();
    expect(v.engineVersion).toBe("1.3.0");
    expect(v.knowledgeVersion).toBe("2.0.0-experimental");
    expect(v.scoringKnowledgeVersion).toBe("2.0.0-experimental");
    expect(v.calibrationVersion).toBeNull();
    expect(v.releaseStage).toBe("experimental");
    expect(v.scoringInfrastructureVersion).toBe("1.1.0");
  });

  it("parameter registry covers frozen heuristic families", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const registry = buildParameterRegistry(loaded.knowledge);
    expect(registry.some((p) => p.id === "quality.midpoint")).toBe(true);
    expect(registry.some((p) => p.id === "geometry.focus")).toBe(true);
    expect(registry.every((p) => p.numericProvenance.length > 0)).toBe(true);
  });
});
