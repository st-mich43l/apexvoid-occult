import { SourceArtifactIntakeRecord, SourceDiscoveryLead, VerifiedSourceCopy, CopyIdentityInspectionRecord } from './types';
import { sha256File, generateDeterministicId } from './canonical-json';
import path from 'path';

export function verifyCopies(
  discoverySources: SourceDiscoveryLead[],
  intakes: SourceArtifactIntakeRecord[],
  inspections: CopyIdentityInspectionRecord[]
): VerifiedSourceCopy[] {
  const results: VerifiedSourceCopy[] = [];

  // Validate intakes
  const discoveryIds = new Set(discoverySources.map(d => d.discoverySourceId));
  const intakeSourceIds = new Set();
  
  for (const intake of intakes) {
    if (!discoveryIds.has(intake.discoverySourceId)) {
      throw new Error(`Intake for an unknown discovery source: ${intake.discoverySourceId}`);
    }
    if (intakeSourceIds.has(intake.discoverySourceId)) {
      throw new Error(`Duplicate intake for discovery source: ${intake.discoverySourceId}`);
    }
    intakeSourceIds.add(intake.discoverySourceId);
  }

  for (const discovery of discoverySources) {
    const intake = intakes.find(i => i.discoverySourceId === discovery.discoverySourceId);

    if (!intake || !intake.localArtifactPath) {
      // Phase 4: No artifact supplied -> no copy record
      continue;
    }

    const artifactAbsPath = path.resolve(process.cwd(), intake.localArtifactPath);

    let computedSha256: string;
    try {
      computedSha256 = sha256File(artifactAbsPath);
    } catch (e) {
      // Missing file locally although registered in intake
      continue;
    }

    if (intake.providedSha256 && intake.providedSha256 !== computedSha256) {
      throw new Error(`Hash mismatch for ${intake.discoverySourceId}. Provided: ${intake.providedSha256}, Computed: ${computedSha256}`);
    }

    const inspection = inspections.find(i => i.discoverySourceId === discovery.discoverySourceId);

    let inspectionStatus: 'acquired-uninspected' | 'inspected-unverified' | 'verified' | 'rejected' = 'acquired-uninspected';
    let identityDecision: 'unresolved' | 'verified' | 'rejected' = 'unresolved';
    let verifiedBy = null;
    let verificationNotes: string[] = ['Artifact acquired but not inspected for identity.'];
    let canonicalWorkId = discovery.canonicalWorkCandidateId || '';
    let editionId = discovery.editionCandidateId || null;
    let copyId = '';

    if (inspection) {
      canonicalWorkId = inspection.canonicalWorkId;
      editionId = inspection.editionIdentityId;
      identityDecision = inspection.identityDecision;
      verifiedBy = inspection.verifiedBy;
      verificationNotes = inspection.verificationNotes;

      if (identityDecision === 'verified') {
        if (!verifiedBy || verifiedBy.trim() === '') {
          throw new Error(`Verification rejected: verifiedBy is null or blank for ${discovery.discoverySourceId}`);
        }
        if (!verificationNotes || verificationNotes.length === 0 || verificationNotes.every(n => n.trim() === '')) {
          throw new Error(`Verification rejected: verificationNotes is empty for ${discovery.discoverySourceId}`);
        }
        inspectionStatus = 'verified';
      } else if (identityDecision === 'rejected') {
        inspectionStatus = 'rejected';
      } else {
        inspectionStatus = 'inspected-unverified';
      }
    }

    if (inspectionStatus === 'verified') {
      const seed = `${canonicalWorkId}|${editionId || 'UNKNOWN'}|${computedSha256}`;
      copyId = generateDeterministicId('COPY-VERIFIED', seed);
    } else {
      const seed = `UNVERIFIED|${computedSha256}`;
      copyId = generateDeterministicId('COPY-UNVERIFIED', seed);
    }

    // Generate stable sourceId from the discovery source identity
    const sourceId = discovery.discoverySourceId.replace('DISCOVERY-', 'SRC-');

    results.push({
      sourceId,
      canonicalWorkId,
      editionIdentityId: editionId,
      copyIdentityId: copyId,
      artifactSha256: computedSha256,
      inspectionStatus,
      identityDecision,
      verifiedBy,
      verificationNotes
    });
  }

  // Check for duplicate copy IDs among verified ones
  const verifiedCopies = results.filter(r => r.inspectionStatus === 'verified');
  const copyIds = verifiedCopies.map(r => r.copyIdentityId);
  const uniqueCopyIds = new Set(copyIds);
  if (copyIds.length !== uniqueCopyIds.size) {
    throw new Error('Duplicate copy identity generated. Hash collision or duplicate artifacts provided.');
  }

  return results;
}
