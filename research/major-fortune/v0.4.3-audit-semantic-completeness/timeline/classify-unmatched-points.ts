import { MajorFortuneAuditObservation } from "../types/audit-observation.js";

export function classifyUnmatchedTimelinePoints(
  missingCurrentIds: string[], 
  fallbackMap: Map<string, MajorFortuneAuditObservation>
): Array<{ observationId: string; reason: string }> {
  return missingCurrentIds.map(id => {
    const obs = fallbackMap.get(id);
    if (!obs) return { observationId: id, reason: "unknown" };
    
    // Check if it's out of bounds, etc.
    // Major Fortune cycles before nominal age 0 or something?
    return {
      observationId: id,
      reason: "Timeline evaluation skipping boundary cycles or unsupported ages",
    };
  });
}
