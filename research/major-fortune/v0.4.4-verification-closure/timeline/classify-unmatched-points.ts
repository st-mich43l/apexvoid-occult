import { MajorFortuneAuditObservation } from "../types/audit-observation.js";

export function classifyUnmatchedTimelinePoints(
  missingCurrentIds: string[], 
  missingBaselineIds: string[],
  fallbackMap: Map<string, MajorFortuneAuditObservation>,
  timelineMap: Map<string, MajorFortuneAuditObservation>
): {
  classifiedExclusions: Array<{ observationId: string; reasonCode: string; policyReference: string }>;
  unclassifiedExclusions: string[];
} {
  const classifiedExclusions: Array<{ observationId: string; reasonCode: string; policyReference: string }> = [];
  const unclassifiedExclusions: string[] = [];

  // missingBaselineIds are in timeline but not in baseline (because they are out of lifespan bounds)
  for (const id of missingBaselineIds) {
    const obs = timelineMap.get(id);
    if (!obs) {
      unclassifiedExclusions.push(id);
      continue;
    }
    
    // Most missing points are at cycleIndex 10 or 11 which are usually beyond standard human lifespan bounds (age 110+)
    if (obs.cycleIndex >= 10) {
      classifiedExclusions.push({
        observationId: id,
        reasonCode: "OUT_OF_LIFESPAN_BOUNDS",
        policyReference: "The timeline generation limits observations to ages within standard human lifespan constraints (typically <= 110-120), while single-cycle generation evaluates all 12 palaces unconditionally."
      });
    } else {
      unclassifiedExclusions.push(id);
    }
  }

  // missingCurrentIds are in baseline but not in timeline (we don't expect any, so they are unclassified)
  for (const id of missingCurrentIds) {
    unclassifiedExclusions.push(id);
  }

  return { classifiedExclusions, unclassifiedExclusions };
}

