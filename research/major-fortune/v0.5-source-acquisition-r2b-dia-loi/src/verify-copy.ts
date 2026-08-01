import { SourceArtifactIntakeRecord, SourceCopyVerificationResult } from './types';
import { computeFileSha256, generateDeterministicId } from './canonical-json';
import path from 'path';

export function verifyCopies(
  discoverySources: any[],
  intakes: SourceArtifactIntakeRecord[]
): SourceCopyVerificationResult[] {
  const results: SourceCopyVerificationResult[] = [];

  for (const discovery of discoverySources) {
    const intake = intakes.find(i => i.discoverySourceId === discovery.discoverySourceId);
    
    if (!intake || !intake.localArtifactPath) {
      results.push({
        sourceId: `SRC-${discovery.schoolScope.toUpperCase()}-001`,
        canonicalWorkId: discovery.canonicalWorkId,
        editionIdentityId: discovery.expectedEditionIdentityId || 'UNKNOWN-EDITION',
        copyIdentityId: 'UNVERIFIED-COPY',
        title: discovery.title,
        authorOrCompiler: null,
        translatorOrEditor: null,
        publisher: null,
        publicationYear: null,
        language: 'vi',
        acquisitionMethod: 'metadata-only',
        archiveLocator: '',
        artifactSha256: '',
        inspectionStatus: 'not-acquired',
        verificationNotes: ['Metadata only. No physical or digital copy available for R2 inspection.']
      });
      continue;
    }

    const artifactAbsPath = path.resolve(process.cwd(), intake.localArtifactPath);
    const sha256 = computeFileSha256(artifactAbsPath);

    const canonicalWorkId = intake.expectedCanonicalWorkId || discovery.canonicalWorkId;
    const editionId = intake.expectedEditionIdentityId || discovery.expectedEditionIdentityId || 'UNKNOWN-EDITION';
    const seed = `${canonicalWorkId}|${editionId}|${sha256}`;
    const copyId = generateDeterministicId('COPY-VERIFIED', seed);

    results.push({
      sourceId: `SRC-${discovery.schoolScope.toUpperCase()}-001`,
      canonicalWorkId: canonicalWorkId,
      editionIdentityId: editionId,
      copyIdentityId: copyId,
      title: intake.suppliedMetadata.title || discovery.title,
      authorOrCompiler: intake.suppliedMetadata.authorOrCompiler,
      translatorOrEditor: intake.suppliedMetadata.translatorOrEditor,
      publisher: intake.suppliedMetadata.publisher,
      publicationYear: intake.suppliedMetadata.publicationYear,
      language: intake.suppliedMetadata.language || 'vi',
      acquisitionMethod: intake.acquisitionMethod,
      archiveLocator: `redacted-archive/${sha256.substring(0, 8)}`,
      artifactSha256: sha256,
      inspectionStatus: 'verified',
      verificationNotes: ['Artifact inspected and verified locally.']
    });
  }

  // Check for duplicate copy IDs among verified ones
  const copyIds = results.filter(r => r.inspectionStatus === 'verified').map(r => r.copyIdentityId);
  const uniqueCopyIds = new Set(copyIds);
  if (copyIds.length !== uniqueCopyIds.size) {
    throw new Error('Duplicate copy identity generated. Hash collision or duplicate artifacts provided.');
  }

  return results;
}
