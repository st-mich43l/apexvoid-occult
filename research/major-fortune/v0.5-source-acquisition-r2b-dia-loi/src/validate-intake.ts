import { SourceArtifactIntakeRecord } from './types';
import { computeFileSha256 } from './canonical-json';
import { ValidationError } from './errors';
import fs from 'fs';
import path from 'path';

export function validateIntakeManifest(manifestPath: string, allowedMethods: string[], requireRightsNotes: boolean): SourceArtifactIntakeRecord[] {
  if (!fs.existsSync(manifestPath)) {
    return [];
  }
  
  let records: SourceArtifactIntakeRecord[];
  try {
    records = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    throw new ValidationError(`Failed to parse intake manifest: ${e}`);
  }

  for (const record of records) {
    if (!record.localArtifactPath) {
      continue;
    }

    const artifactAbsPath = path.resolve(process.cwd(), record.localArtifactPath);
    if (!fs.existsSync(artifactAbsPath)) {
      throw new ValidationError(`Artifact file not found: ${record.localArtifactPath}`);
    }

    const stat = fs.statSync(artifactAbsPath);
    if (stat.size === 0) {
      throw new ValidationError(`Artifact file is empty: ${record.localArtifactPath}`);
    }

    if (!allowedMethods.includes(record.acquisitionMethod)) {
      throw new ValidationError(`Invalid acquisition method: ${record.acquisitionMethod}`);
    }

    if (requireRightsNotes && (!record.rightsNotes || record.rightsNotes.length === 0)) {
      throw new ValidationError(`Rights notes are required for intake: ${record.intakeId}`);
    }

    // Hash computation happens later, but we can verify it's computable
    computeFileSha256(artifactAbsPath);
  }

  return records;
}
