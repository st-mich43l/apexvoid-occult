import { MajorFortuneAuditObservation, MajorFortuneAuditObservationAcceptedEvidence } from "../types/audit-observation.js";

function sortAcceptedEvidence(a: MajorFortuneAuditObservationAcceptedEvidence, b: MajorFortuneAuditObservationAcceptedEvidence): number {
  if (a.pillarId !== b.pillarId) return a.pillarId.localeCompare(b.pillarId);
  if (a.signalFamilyId !== b.signalFamilyId) return a.signalFamilyId.localeCompare(b.signalFamilyId);
  if (a.physicalFactId !== b.physicalFactId) return a.physicalFactId.localeCompare(b.physicalFactId);
  if (a.evidenceClusterId !== b.evidenceClusterId) return a.evidenceClusterId.localeCompare(b.evidenceClusterId);
  return a.evidenceId.localeCompare(b.evidenceId);
}

function sortRejectedEvidence(a: any, b: any): number {
  if (a.reason !== b.reason) return a.reason.localeCompare(b.reason);
  if (a.evidenceId !== b.evidenceId) return (a.evidenceId || "").localeCompare(b.evidenceId || "");
  return (a.detail || "").localeCompare(b.detail || "");
}

export function canonicalizeObservation(obs: MajorFortuneAuditObservation): MajorFortuneAuditObservation {
  const clone = JSON.parse(JSON.stringify(obs)) as MajorFortuneAuditObservation;

  clone.evaluablePillarIds.sort();
  clone.scoredPillarIds.sort();
  clone.partialPillarIds.sort();
  clone.missingPillarIds.sort();

  if (clone.diagnostics.adapterReasonCodes) {
    clone.diagnostics.adapterReasonCodes.sort();
  }

  for (const pillarId of Object.keys(clone.pillars).sort()) {
    const pillar = clone.pillars[pillarId];
    pillar.acceptedEvidenceIds.sort();
    pillar.physicalFactIds.sort();
    pillar.reasonCodes.sort();
    if (pillar.rejectedEvidence) {
      pillar.rejectedEvidence.sort(sortRejectedEvidence);
    }
  }

  // Sort the keys of the pillars object itself
  const sortedPillars: Record<string, any> = {};
  for (const pillarId of Object.keys(clone.pillars).sort()) {
    sortedPillars[pillarId] = clone.pillars[pillarId];
  }
  clone.pillars = sortedPillars;

  if (clone.acceptedEvidence) {
    clone.acceptedEvidence.sort(sortAcceptedEvidence);
    
    // Sort keys within transformationTuple to ensure stability if present
    for (const ev of clone.acceptedEvidence) {
      if (ev.transformationTuple) {
        const sortedTuple: any = {
          fortuneStem: ev.transformationTuple.fortuneStem,
          transformationType: ev.transformationTuple.transformationType,
          transformedStar: ev.transformationTuple.transformedStar,
          targetPalaceIndex: ev.transformationTuple.targetPalaceIndex,
        };
        ev.transformationTuple = sortedTuple;
      }
    }
  }

  return clone;
}
