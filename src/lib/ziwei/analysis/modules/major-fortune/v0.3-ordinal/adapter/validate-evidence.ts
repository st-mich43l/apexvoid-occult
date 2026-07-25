import type { MajorFortuneOrdinalEvidence } from "../types";
import engineeringProvenance from "./policy/engineering-provenance.v0.3.json";

export interface AdapterEvidenceValidationIssue {
  evidenceId: string;
  message: string;
}

const REGISTERED_SOURCE_IDS = new Set(
  (engineeringProvenance.entries as Array<{ sourceId: string }>).map((e) => e.sourceId),
);
const REGISTERED_CLAIM_IDS = new Set(
  (engineeringProvenance.entries as Array<{ claimId: string }>).map((e) => e.claimId),
);

/** Adapter output must require physicalFactKind even if core type allows omitting it. */
export function validateAdapterEvidence(
  evidence: MajorFortuneOrdinalEvidence[],
): AdapterEvidenceValidationIssue[] {
  const issues: AdapterEvidenceValidationIssue[] = [];
  for (const e of evidence) {
    const id = e.evidenceId || "<missing-evidenceId>";
    if (!e.evidenceId?.trim()) issues.push({ evidenceId: id, message: "empty evidenceId" });
    if (!e.physicalFactId?.trim()) issues.push({ evidenceId: id, message: "empty physicalFactId" });
    if (!(e as { physicalFactKind?: string }).physicalFactKind?.trim()) {
      issues.push({ evidenceId: id, message: "empty physicalFactKind (required for adapter output)" });
    }
    if (!e.evidenceClusterId?.trim()) {
      issues.push({ evidenceId: id, message: "empty evidenceClusterId" });
    }
    if (!e.signalFamilyId?.trim()) issues.push({ evidenceId: id, message: "empty signalFamilyId" });
    if (!e.direction) issues.push({ evidenceId: id, message: "missing direction" });
    if (!e.strength) issues.push({ evidenceId: id, message: "missing strength" });
    if (e.temporalScope !== "major-fortune") {
      issues.push({ evidenceId: id, message: `temporalScope must be major-fortune, got ${e.temporalScope}` });
    }
    if (!e.factIds?.length) issues.push({ evidenceId: id, message: "empty factIds" });
    if (!e.sourceIds?.length) issues.push({ evidenceId: id, message: "empty sourceIds" });
    if (!e.claimIds?.length) issues.push({ evidenceId: id, message: "empty claimIds" });
    if (!e.policyStatus) issues.push({ evidenceId: id, message: "missing policyStatus" });
    if (!e.schoolScope?.length) issues.push({ evidenceId: id, message: "empty schoolScope" });
    if (!e.reasonCode?.trim()) issues.push({ evidenceId: id, message: "empty reasonCode" });

    // V0.3.3: Referential integrity — validate sourceIds and claimIds against provenance registry.
    for (const srcId of e.sourceIds ?? []) {
      if (!REGISTERED_SOURCE_IDS.has(srcId)) {
        issues.push({
          evidenceId: id,
          message: `unknown sourceId not in provenance registry: ${srcId} (signalFamily=${e.signalFamilyId})`,
        });
      }
    }
    for (const clmId of e.claimIds ?? []) {
      if (!REGISTERED_CLAIM_IDS.has(clmId)) {
        issues.push({
          evidenceId: id,
          message: `unknown claimId not in provenance registry: ${clmId} (signalFamily=${e.signalFamilyId})`,
        });
      }
    }
  }
  return issues;
}
