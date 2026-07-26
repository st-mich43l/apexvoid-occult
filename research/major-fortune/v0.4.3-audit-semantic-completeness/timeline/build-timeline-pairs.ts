import { MajorFortuneAuditObservation } from "../types/audit-observation.js";
import { compareMajorFortuneObservationSets } from "../comparison/compare-observations.js";
import { TimelineEquivalenceReport } from "../types/reports.js";

export function evaluateTimelineEquivalence(
  fallbackObservations: MajorFortuneAuditObservation[],
  timelinePoints: MajorFortuneAuditObservation[]
): TimelineEquivalenceReport {
  // Timeline points are only evaluated for Nam Phai usually, so we filter fallback to Nam Phai.
  const namPhaiFallback = fallbackObservations.filter(o => o.school === "nam-phai");

  const comp = compareMajorFortuneObservationSets(namPhaiFallback, timelinePoints, { profile: "timeline-equivalence" });

  const mismatches = comp.differences.flatMap(diff => 
    diff.differences.map(d => ({
      observationId: diff.observationId,
      field: d.path,
      singleCycleValue: d.baseValue,
      timelineValue: d.currentValue,
    }))
  );

  return {
    ...comp,
    schemaVersion: "0.4.3",
    mismatches,
    timelineMismatchCount: mismatches.length,
    passed: comp.mismatchingObservationCount === 0 && comp.missingCurrentIds.length === 0,
  };
}
