import { DiaLoiAdmissionAuthorization } from './types';

export function deriveDecision(authorizations: DiaLoiAdmissionAuthorization[]): { decision: string, reasonCodes: string[] } {
  let hasMissingArtifacts = false;
  let hasInsufficientSources = false;
  let allBlocked = true;
  let missingProvenance = false;

  for (const auth of authorizations) {
    if (auth.authorizedStatus === 'source-verified-candidate') {
      allBlocked = false;
    } else {
      if (auth.blockingReasonCodes.includes('MISSING_OBLIGATIONS')) {
        missingProvenance = true; // No extractions -> missing provenance/artifacts
      }
      if (auth.blockingReasonCodes.includes('UNVERIFIED_OBLIGATIONS')) {
        hasMissingArtifacts = true; // Artifacts exist but obligations unverified means something failed in inspection/artifacts. Wait, or it could be missing artifacts.
      }
      if (auth.blockingReasonCodes.includes('INSUFFICIENT_INDEPENDENT_SOURCES')) {
        hasInsufficientSources = true;
      }
    }
  }

  // Fallback default for CI where nothing is provided:
  if (allBlocked) {
    return {
      decision: 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS',
      reasonCodes: ['NO_VERIFIED_ARTIFACTS_SUPPLIED']
    };
  }

  return {
    decision: 'PROMOTE_DIA_LOI_LANES_TO_SOURCE_VERIFIED_CANDIDATE',
    reasonCodes: []
  };
}
