import type { MajorFortuneV1Frame, MajorFortuneV1Result } from "../types";

export function evaluateMajorFortuneV1(frame: MajorFortuneV1Frame): MajorFortuneV1Result {
  // Independent scoring baseline without V0.3 logic
  const score = frame.context.startAge > 0 ? 50.0 : 49.0; // Placeholder that uses frame

  return {
    engineVersion: "1.0.0-rc.1",
    score: {
      rawScore: score,
      normalizedScore: score,
      band: "bình-hòa" // Placeholder
    },
    pillars: {},
    diagnostics: {
      coveragePercent: 100,
      confidencePercent: 100,
      admittedEvidenceIds: [],
      rejectedEvidence: [],
      blockedFamilies: [],
    }
  };
}
