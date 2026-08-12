import type {
  DiscoverySourceLead,
  ArtifactIntakeRecord,
  CopyIdentityInspectionRecord,
  VerifiedSourceCopy,
} from './types';
import { generateDeterministicId } from './canonical-json';
import { validateIntakes } from './validate-intake';
import crypto from 'crypto';
import fs from 'fs';

/**
 * Build VerifiedSourceCopy records from:
 *   - discovery leads (establishes canonical work candidate linkage)
 *   - artifact intakes (provides the actual artifact path)
 *   - copy identity inspections (human-verified identity metadata)
 *   - private base dir (where artifact files reside)
 *
 * A copy is only marked 'verified' if:
 *   1. The artifact file was found and hashed
 *   2. A human copy-identity inspection exists for this discoverySourceId
 *   3. The inspection decision is 'verified'
 *   4. verificationNotes are non-empty
 *
 * Fail-closed: missing, ambiguous, or rejected inspections produce 'rejected' or 'inspected-unverified' status.
 */
export function verifyCopies(
  discoveryLeads: DiscoverySourceLead[],
  intakes: ArtifactIntakeRecord[],
  copyInspections: CopyIdentityInspectionRecord[],
  privateBaseDir: string
): VerifiedSourceCopy[] {
  const copies: VerifiedSourceCopy[] = [];

  // Validate intakes first
  const validatedIntakes = validateIntakes(intakes, privateBaseDir);

  for (const lead of discoveryLeads) {
    const intake = intakes.find(i => i.discoverySourceId === lead.discoverySourceId);
    if (!intake) {
      // No intake for this lead — no copy record
      continue;
    }

    const intakeResult = validatedIntakes.find(r => r.intakeId === intake.intakeId);
    if (!intakeResult || !intakeResult.isValid) {
      // Invalid intake — skip
      continue;
    }

    const inspection = copyInspections.find(c => c.discoverySourceId === lead.discoverySourceId);

    // Determine canonical work ID (from inspection if available, else from lead candidate)
    const canonicalWorkId = inspection?.canonicalWorkId ?? lead.canonicalWorkCandidateId ?? 'UNKNOWN';

    // Deterministic copy identity ID based on stable attributes
    const seed = `${canonicalWorkId}|${inspection?.editionIdentityId ?? 'no-edition'}|${intakeResult.computedSha256 ?? 'no-hash'}`;
    const copyIdentityId = `CID-${generateDeterministicId(seed)}`;

    let inspectionStatus: VerifiedSourceCopy['inspectionStatus'] = 'acquired-uninspected';
    let identityDecision: VerifiedSourceCopy['identityDecision'] = 'unresolved';
    let verifiedBy: string | null = null;
    const verificationNotes: string[] = [];

    if (inspection) {
      identityDecision = inspection.identityDecision;
      verifiedBy = inspection.verifiedBy;
      verificationNotes.push(...inspection.verificationNotes);

      if (inspection.identityDecision === 'verified' && verificationNotes.length > 0) {
        inspectionStatus = 'verified';
      } else if (inspection.identityDecision === 'rejected') {
        inspectionStatus = 'rejected';
      } else {
        inspectionStatus = 'inspected-unverified';
      }
    }

    copies.push({
      copyIdentityId,
      canonicalWorkId,
      editionIdentityId: inspection?.editionIdentityId ?? null,
      schoolScope: lead.schoolScope,
      sha256: intakeResult.computedSha256!,
      byteLength: intakeResult.byteLength!,
      inspectionStatus,
      identityDecision,
      verifiedBy,
      verificationNotes,
      lineageStatus: inspection?.lineageStatus ?? 'unknown',
    });
  }

  return copies;
}
