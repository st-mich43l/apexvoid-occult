import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { redactAbsolutePath } from './canonical-json';
import type { ArtifactIntakeRecord } from './types';

export interface IntakeValidationResult {
  intakeId: string;
  discoverySourceId: string;
  normalizedArtifactPath: string;
  acquisitionMethod: string;
  computedSha256: string | null;
  byteLength: number | null;
  hashMatch: boolean | null;
  errors: string[];
  isValid: boolean;
}

/**
 * Validate artifact intake records.
 * - Verifies file exists
 * - Computes actual SHA-256 from bytes (never trusts supplied hash alone)
 * - Rejects hash mismatch
 * - Enforces rights notes
 * - Enforces controlled acquisition methods
 * - Redacts absolute paths in output
 * - Detects duplicate intakes (same discoverySourceId)
 */
export function validateIntakes(
  intakes: ArtifactIntakeRecord[],
  privateBaseDir: string
): IntakeValidationResult[] {
  const results: IntakeValidationResult[] = [];
  const seenDiscoveryIds = new Set<string>();
  const seenIntakeIds = new Set<string>();

  const allowedMethods = new Set([
    'owned-physical-copy-scan',
    'licensed-digital-copy',
    'library-access',
    'public-domain-archive',
    'other-authorized-access',
  ]);

  for (const intake of intakes) {
    const errors: string[] = [];

    // Duplicate intake ID check
    if (seenIntakeIds.has(intake.intakeId)) {
      errors.push(`DUPLICATE_INTAKE_ID:${intake.intakeId}`);
    }
    seenIntakeIds.add(intake.intakeId);

    // Duplicate discovery source check
    if (seenDiscoveryIds.has(intake.discoverySourceId)) {
      errors.push(`DUPLICATE_DISCOVERY_SOURCE:${intake.discoverySourceId}`);
    }
    seenDiscoveryIds.add(intake.discoverySourceId);

    // Validate acquisition method
    if (!allowedMethods.has(intake.acquisitionMethod)) {
      errors.push(`INVALID_ACQUISITION_METHOD:${intake.acquisitionMethod}`);
    }

    // Validate rights notes
    if (!intake.rightsNotes || intake.rightsNotes.length === 0) {
      errors.push('MISSING_RIGHTS_NOTES');
    }

    // Validate normalized path (must not be absolute)
    if (intake.normalizedArtifactPath && path.isAbsolute(intake.normalizedArtifactPath)) {
      errors.push('ABSOLUTE_PATH_IN_NORMALIZED_ARTIFACT_PATH');
    }

    // Attempt to locate and hash the file
    let computedSha256: string | null = null;
    let byteLength: number | null = null;
    let hashMatch: boolean | null = null;

    const resolvedPath = intake.normalizedArtifactPath
      ? `${privateBaseDir}/${intake.normalizedArtifactPath}`
      : null;

    if (resolvedPath) {
      if (!fs.existsSync(resolvedPath)) {
        errors.push('ARTIFACT_FILE_NOT_FOUND');
      } else {
        const bytes = fs.readFileSync(resolvedPath);
        byteLength = bytes.length;
        computedSha256 = crypto.createHash('sha256').update(bytes).digest('hex');

        if (intake.providedSha256) {
          hashMatch = computedSha256 === intake.providedSha256.toLowerCase();
          if (!hashMatch) {
            errors.push('SHA256_MISMATCH');
          }
        }
      }
    }

    results.push({
      intakeId: intake.intakeId,
      discoverySourceId: intake.discoverySourceId,
      normalizedArtifactPath: redactAbsolutePath(intake.normalizedArtifactPath ?? ''),
      acquisitionMethod: intake.acquisitionMethod,
      computedSha256,
      byteLength,
      hashMatch,
      errors,
      isValid: errors.length === 0,
    });
  }

  return results;
}


