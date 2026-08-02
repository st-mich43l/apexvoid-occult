import { DiaLoiAdmissionAuthorization } from './types';

type DiaLoiR2bDecisionCode =
  | 'DIA_LOI_READY_FOR_SHADOW_ADMISSION'
  | 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS'
  | 'KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE'
  | 'KEEP_DIA_LOI_BLOCKED_MISSING_TEMPORAL_SCOPE'
  | 'KEEP_DIA_LOI_BLOCKED_INSUFFICIENT_INDEPENDENT_SOURCES'
  | 'KEEP_DIA_LOI_BLOCKED_CONFLICTED_DOCTRINE'
  | 'KEEP_DIA_LOI_BLOCKED_INCOMPLETE_ADJUDICATION'
  | 'KEEP_DIA_LOI_BLOCKED_INVALID_PACK';

export interface DiaLoiR2bDecision {
  decision: DiaLoiR2bDecisionCode;
  reasonCodes: string[];
  lanes: Array<{
    familyId: string;
    schoolScope: string;
    status: 'source-verified-candidate' | 'blocked';
    reasonCodes: string[];
  }>;
}

export function deriveDecision(authorizations: DiaLoiAdmissionAuthorization[]): DiaLoiR2bDecision {
  const lanes = authorizations.map(auth => ({
    familyId: auth.familyId,
    schoolScope: auth.schoolScope,
    status: auth.authorizedStatus,
    reasonCodes: auth.blockingReasonCodes
  }));

  const allAuthorized = lanes.every(l => l.status === 'source-verified-candidate') && lanes.length === 4;

  if (allAuthorized) {
    return {
      decision: 'DIA_LOI_READY_FOR_SHADOW_ADMISSION',
      reasonCodes: [],
      lanes
    };
  }

  // Determine the most specific blocker
  const allReasonCodes = new Set(lanes.flatMap(l => l.reasonCodes));

  let decision: DiaLoiR2bDecisionCode = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';

  if (allReasonCodes.has('CLAIMS_NOT_SUPPORTED') || allReasonCodes.has('CLAIMS_CONTRADICTED')) {
    decision = 'KEEP_DIA_LOI_BLOCKED_CONFLICTED_DOCTRINE';
  } else if (allReasonCodes.has('INSUFFICIENT_INDEPENDENT_SOURCES')) {
    decision = 'KEEP_DIA_LOI_BLOCKED_INSUFFICIENT_INDEPENDENT_SOURCES';
  } else if (allReasonCodes.has('MISSING_TEMPORAL_SCOPE') || allReasonCodes.has('REQUIRES_EXPLICIT_MAJOR_FORTUNE_SCOPE')) {
    decision = 'KEEP_DIA_LOI_BLOCKED_MISSING_TEMPORAL_SCOPE';
  } else if (allReasonCodes.has('UNVERIFIED_OBLIGATIONS')) {
    if (allReasonCodes.has('MISSING_LOCATOR') || allReasonCodes.has('UNVERIFIED_LOCATOR')) {
      decision = 'KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE';
    } else {
      decision = 'KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE';
    }
  } else if (allReasonCodes.has('MISSING_CLAIMS') || allReasonCodes.has('MISSING_OBLIGATIONS')) {
    decision = 'KEEP_DIA_LOI_BLOCKED_INCOMPLETE_ADJUDICATION';
  }

  if (allReasonCodes.has('NO_EXTRACTION_MATCHED') || allReasonCodes.has('NO_VERIFIED_EXTRACTION')) {
    decision = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';
  }

  return {
    decision,
    reasonCodes: Array.from(allReasonCodes),
    lanes
  };
}
