import { describe, expect, it } from "vitest";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../../knowledge/major-fortune-scoring";
import { normalizeMajorFortuneAxes } from "../normalize";

describe("normalizeMajorFortuneAxes — major-fortune-calibration-fixtures.v0", () => {
  const loaded = loadMajorFortuneScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("major fortune scoring knowledge failed to load");
  const { scoringProfile, calibrationFixtures } = loaded.knowledge;

  it.each(calibrationFixtures.cases)("$fixtureId — $label", (fixture) => {
    const result = normalizeMajorFortuneAxes(fixture.rawAxes, scoringProfile);

    expect(result.score).toBeCloseTo(fixture.expected.score, 1);
    expect(result.intensity).toBe(fixture.expected.intensity);
    expect(result.conflict).toBe(fixture.expected.conflict);
    expect(result.normalizedAxes.support).toBeCloseTo(fixture.expected.normalized.support, 5);
    expect(result.normalizedAxes.pressure).toBeCloseTo(fixture.expected.normalized.pressure, 5);
    expect(result.normalizedAxes.stability).toBeCloseTo(fixture.expected.normalized.stability, 5);
    expect(result.normalizedAxes.activation).toBeCloseTo(fixture.expected.normalized.activation, 5);
  });
});
