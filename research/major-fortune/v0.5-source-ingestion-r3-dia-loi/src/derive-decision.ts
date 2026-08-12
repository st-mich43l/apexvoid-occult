import type { LaneAuthorization, R3Decision, R3DecisionCode } from './types';

export function deriveDecision(laneAuthorizations: LaneAuthorization[]): R3Decision {
  const promotedLanes = laneAuthorizations
    .filter(l => l.authorizedStatus === 'source-verified-candidate')
    .map(l => ({ familyId: l.familyId, schoolScope: l.schoolScope }));

  const blockedLanes = laneAuthorizations
    .filter(l => l.authorizedStatus === 'blocked')
    .map(l => ({
      familyId: l.familyId,
      schoolScope: l.schoolScope,
      reasonCodes: l.primaryBlockingReasonCodes,
    }));

  const lanes = laneAuthorizations.map(l => ({
    familyId: l.familyId,
    schoolScope: l.schoolScope,
    status: l.authorizedStatus,
    reasonCodes: l.primaryBlockingReasonCodes,
  }));

  if (promotedLanes.length > 0) {
    return {
      decision: 'PROMOTE_DIA_LOI_LANES_TO_SOURCE_VERIFIED_CANDIDATE',
      reasonCodes: [],
      promotedLanes,
      blockedLanes,
      lanes,
    };
  }

  const allReasonCodes = new Set(blockedLanes.flatMap(l => l.reasonCodes));

  const hasConflict = allReasonCodes.has('CONFLICTED_DOCTRINE');
  const hasIncompleteAdjudication = allReasonCodes.has('INCOMPLETE_ADJUDICATION');
  const hasInsufficientIndependent = allReasonCodes.has('INSUFFICIENT_INDEPENDENT_SOURCES');
  const hasMissingTemporalScope = allReasonCodes.has('MISSING_TEMPORAL_SCOPE');
  const hasMissingProvenance = allReasonCodes.has('MISSING_PROVENANCE');

  const allLanesHaveMissingArtifacts = blockedLanes.length === 4 && blockedLanes.every(l =>
    l.reasonCodes.includes('MISSING_ARTIFACTS')
  );

  let decision: R3DecisionCode;

  if (hasConflict) {
    decision = 'KEEP_DIA_LOI_BLOCKED_CONFLICTED_DOCTRINE';
  } else if (allLanesHaveMissingArtifacts) {
    decision = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';
  } else if (hasIncompleteAdjudication && !hasInsufficientIndependent && !hasMissingTemporalScope) {
    decision = 'KEEP_DIA_LOI_BLOCKED_INCOMPLETE_ADJUDICATION';
  } else if (hasInsufficientIndependent) {
    decision = 'KEEP_DIA_LOI_BLOCKED_INSUFFICIENT_INDEPENDENT_SOURCES';
  } else if (hasMissingTemporalScope) {
    decision = 'KEEP_DIA_LOI_BLOCKED_MISSING_TEMPORAL_SCOPE';
  } else if (hasMissingProvenance) {
    decision = 'KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE';
  } else {
    decision = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';
  }

  return {
    decision,
    reasonCodes: [...allReasonCodes],
    promotedLanes,
    blockedLanes,
    lanes,
  };
}
