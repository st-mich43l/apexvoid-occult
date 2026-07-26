import { MajorFortuneAuditObservation } from "../types/audit-observation.js";
import { compareMajorFortuneObservationSets } from "../comparison/compare-observations.js";
import { TimelineModeEquivalenceReport } from "../types/reports.js";
import { classifyUnmatchedTimelinePoints } from "./classify-unmatched-points.js";

export function evaluateTimelineModeEquivalence(
  mode: "nam-phai-fallback" | "nam-phai-enabled" | "trung-chau-control",
  expectedObservations: MajorFortuneAuditObservation[],
  timelinePoints: MajorFortuneAuditObservation[]
): TimelineModeEquivalenceReport {
  
  const comp = compareMajorFortuneObservationSets(expectedObservations, timelinePoints, { profile: "timeline-equivalence" });

  const fallbackMap = new Map<string, MajorFortuneAuditObservation>();
  for (const obs of expectedObservations) {
    fallbackMap.set(obs.observationId, obs);
  }

  const timelineMap = new Map<string, MajorFortuneAuditObservation>();
  for (const obs of timelinePoints) {
    timelineMap.set(obs.observationId, obs);
  }

  const classification = classifyUnmatchedTimelinePoints(comp.missingCurrentIds, comp.missingBaselineIds, fallbackMap, timelineMap);

  return {
    mode,
    expectedObservationCount: expectedObservations.length,
    singleCycleObservationCount: expectedObservations.length,
    timelineObservationCount: timelinePoints.length,
    comparedObservationCount: comp.comparedObservationCount,
    missingSingleCycleIds: comp.missingCurrentIds, // Ids in baseline but missing in timeline
    missingTimelineIds: comp.missingBaselineIds, // Ids in timeline but missing in baseline
    duplicateSingleCycleIds: [], // handled inherently
    duplicateTimelineIds: [],
    classifiedExclusions: classification.classifiedExclusions,
    unclassifiedExclusions: classification.unclassifiedExclusions,
    mismatchingObservationCount: comp.mismatchingObservationCount,
    semanticDifferenceCount: comp.differenceRowCount,
    differences: comp.differences,
    passed: comp.mismatchingObservationCount === 0 && classification.unclassifiedExclusions.length === 0,
  };
}

