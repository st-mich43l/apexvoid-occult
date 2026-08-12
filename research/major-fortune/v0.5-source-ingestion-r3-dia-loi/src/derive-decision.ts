import type { LaneAuthorization, R3Decision, R3DecisionCode } from './types';

/**
 * Derive the overall R3 decision from lane authorizations.
 *
 * Precedence (most specific blocker wins, evaluated from most-specific to least):
 *   CONFLICTED_DOCTRINE              → KEEP_DIA_LOI_BLOCKED_CONFLICTED_DOCTRINE
 *   INCOMPLETE_ADJUDICATION          → KEEP_DIA_LOI_BLOCKED_INCOMPLETE_ADJUDICATION
 *   INSUFFICIENT_INDEPENDENT_SOURCES → KEEP_DIA_LOI_BLOCKED_INSUFFICIENT_INDEPENDENT_SOURCES
 *   MISSING_TEMPORAL_SCOPE           → KEEP_DIA_LOI_BLOCKED_MISSING_TEMPORAL_SCOPE
 *   UNVERIFIED_OBLIGATIONS / MISSING_PROVENANCE → KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE
 *   NO_EXTRACTION_MATCHED (all lanes have zero extractions) → KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS
 *
 * CRITICAL: Per-lane blockers must NOT overwrite each other.
 * If one lane has INSUFFICIENT_INDEPENDENT_SOURCES and another has NO_EXTRACTION_MATCHED,
 * the overall decision is INSUFFICIENT_INDEPENDENT_SOURCES (more specific).
 *
 * At least one promoted lane → PROMOTE_DIA_LOI_LANES_TO_SOURCE_VERIFIED_CANDIDATE
 */
export function deriveDecision(laneAuthorizations: LaneAuthorization[]): R3Decision {
  const promotedLanes = laneAuthorizations
    .filter(l => l.authorizedStatus === 'source-verified-candidate')
    .map(l => ({ familyId: l.familyId, schoolScope: l.schoolScope }));

  const blockedLanes = laneAuthorizations
    .filter(l => l.authorizedStatus === 'blocked')
    .map(l => ({
      familyId: l.familyId,
      schoolScope: l.schoolScope,
      reasonCodes: l.blockingReasonCodes,
    }));

  const lanes = laneAuthorizations.map(l => ({
    familyId: l.familyId,
    schoolScope: l.schoolScope,
    status: l.authorizedStatus,
    reasonCodes: l.blockingReasonCodes,
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

  // Collect all reason codes from all blocked lanes
  const allReasonCodes = new Set(blockedLanes.flatMap(l => l.reasonCodes));

  // Collect most specific blockers from any lane
  // Note: a lane with NO_EXTRACTION_MATCHED does NOT mask another lane's INSUFFICIENT_INDEPENDENT_SOURCES
  const hasConflict = allReasonCodes.has('CONFLICTED_DOCTRINE');
  const hasIncompleteAdjudication = allReasonCodes.has('CLAIMS_NOT_SUPPORTED') || allReasonCodes.has('MISSING_CLAIMS');
  const hasInsufficientIndependent = allReasonCodes.has('INSUFFICIENT_INDEPENDENT_SOURCES');
  const hasMissingTemporalScope = allReasonCodes.has('MISSING_TEMPORAL_SCOPE');
  const hasMissingProvenance = allReasonCodes.has('UNVERIFIED_OBLIGATIONS') || allReasonCodes.has('MISSING_EVIDENCE_VERIFIED_BINDING');

  // Check if ALL lanes have NO_EXTRACTION_MATCHED (zero artifact state)
  // This takes precedence over INSUFFICIENT_INDEPENDENT_SOURCES and UNVERIFIED_OBLIGATIONS
  const allLanesHaveNoExtractions = blockedLanes.length === 4 && blockedLanes.every(l =>
    l.reasonCodes.includes('NO_EXTRACTION_MATCHED')
  );

  let decision: R3DecisionCode;

  if (hasConflict) {
    decision = 'KEEP_DIA_LOI_BLOCKED_CONFLICTED_DOCTRINE';
  } else if (allLanesHaveNoExtractions) {
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
    // Fallback — something blocked but no recognized pattern
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
