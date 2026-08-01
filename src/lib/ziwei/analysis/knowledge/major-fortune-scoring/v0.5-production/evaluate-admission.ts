import type { MajorFortuneOrdinalEvidence } from "../../../modules/major-fortune/v0.3-ordinal/types";
import type { MajorFortuneProductionAdmissionRegistry, MajorFortuneProductionFamilyAdmission } from "./types";

interface MajorFortuneAdmissionAuthorizationSnapshot {
  approvedSourceObligationIds: string[];
  approvedClaimAdjudicationIds: string[];
  openContradictionIds: string[];
  decisionIds: string[];
}

export interface EvaluateMajorFortuneProductionAdmissionInput {
  evidence: MajorFortuneOrdinalEvidence;
  familyRegistry: MajorFortuneProductionAdmissionRegistry;
  school: "nam-phai" | "trung-chau";
  candidateIntegrationVersion: string;
  authorizationSnapshot: MajorFortuneAdmissionAuthorizationSnapshot;
}

export interface MajorFortuneProductionAdmissionDecision {
  evidenceId: string;
  signalFamilyId: string;
  admittedToCandidateScore: boolean;
  status:
    | "admitted"
    | "shadow-only"
    | "blocked"
    | "excluded"
    | "invalid";
  reasonCodes: string[];
  family: MajorFortuneProductionFamilyAdmission | null;
}

function hasAll(required: string[], approved: string[]): boolean {
  return required.every((req) => approved.includes(req));
}

function compareSemverGte(a: string, b: string): boolean {
  // basic semver comparison a >= b
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return true;
    if (na < nb) return false;
  }
  return true;
}

export function evaluateMajorFortuneProductionAdmission(
  input: EvaluateMajorFortuneProductionAdmissionInput
): MajorFortuneProductionAdmissionDecision {
  const { evidence, familyRegistry, school, candidateIntegrationVersion, authorizationSnapshot } = input;
  const family = familyRegistry.families.find(f => f.signalFamilyId === evidence.signalFamilyId) ?? null;

  if (!family) {
    return {
      evidenceId: evidence.evidenceId,
      signalFamilyId: evidence.signalFamilyId,
      admittedToCandidateScore: false,
      status: "invalid",
      reasonCodes: ["unknown-family"],
      family: null,
    };
  }

  if (family.schoolScope !== "shared" && family.schoolScope !== school) {
    return {
      evidenceId: evidence.evidenceId,
      signalFamilyId: evidence.signalFamilyId,
      admittedToCandidateScore: false,
      status: "invalid",
      reasonCodes: ["school-mismatch"],
      family,
    };
  }

  if (family.pillarId !== evidence.pillarId) {
    return {
      evidenceId: evidence.evidenceId,
      signalFamilyId: evidence.signalFamilyId,
      admittedToCandidateScore: false,
      status: "invalid",
      reasonCodes: ["pillar-mismatch"],
      family,
    };
  }

  if (family.temporalScope !== evidence.temporalScope) {
    return {
      evidenceId: evidence.evidenceId,
      signalFamilyId: evidence.signalFamilyId,
      admittedToCandidateScore: false,
      status: "invalid",
      reasonCodes: ["temporal-mismatch"],
      family,
    };
  }

  if (family.productionStatus === "blocked") {
    return {
      evidenceId: evidence.evidenceId,
      signalFamilyId: evidence.signalFamilyId,
      admittedToCandidateScore: false,
      status: "blocked",
      reasonCodes: family.blockingReasonCodes.length > 0 ? family.blockingReasonCodes : ["blocked-by-policy"],
      family,
    };
  }

  if (family.productionStatus === "excluded") {
    return {
      evidenceId: evidence.evidenceId,
      signalFamilyId: evidence.signalFamilyId,
      admittedToCandidateScore: false,
      status: "excluded",
      reasonCodes: family.blockingReasonCodes.length > 0 ? family.blockingReasonCodes : ["excluded-by-policy"],
      family,
    };
  }

  if (family.productionStatus === "shadow-only") {
    return {
      evidenceId: evidence.evidenceId,
      signalFamilyId: evidence.signalFamilyId,
      admittedToCandidateScore: false,
      status: "shadow-only",
      reasonCodes: ["shadow-only"],
      family,
    };
  }

  if (family.scoringAuthority === "source-backed") {
    const missingObligations = !hasAll(family.sourceObligationIds, authorizationSnapshot.approvedSourceObligationIds);
    const missingAdjudications = !hasAll(family.claimAdjudicationIds, authorizationSnapshot.approvedClaimAdjudicationIds);

    if (missingObligations || missingAdjudications) {
      return {
        evidenceId: evidence.evidenceId,
        signalFamilyId: evidence.signalFamilyId,
        admittedToCandidateScore: false,
        status: "invalid",
        reasonCodes: [
          ...(missingObligations ? ["missing-source-obligations"] : []),
          ...(missingAdjudications ? ["missing-claim-adjudications"] : []),
        ],
        family,
      };
    }
  }

  if (family.productionStatus === "production-admitted") {
    if (!family.effectiveFromIntegrationVersion) {
      return {
        evidenceId: evidence.evidenceId,
        signalFamilyId: evidence.signalFamilyId,
        admittedToCandidateScore: false,
        status: "invalid",
        reasonCodes: ["missing-effective-version"],
        family,
      };
    }

    if (!compareSemverGte(candidateIntegrationVersion, family.effectiveFromIntegrationVersion)) {
      return {
        evidenceId: evidence.evidenceId,
        signalFamilyId: evidence.signalFamilyId,
        admittedToCandidateScore: false,
        status: "invalid",
        reasonCodes: ["candidate-version-too-low"],
        family,
      };
    }

    if (authorizationSnapshot.openContradictionIds.length > 0) {
      return {
        evidenceId: evidence.evidenceId,
        signalFamilyId: evidence.signalFamilyId,
        admittedToCandidateScore: false,
        status: "invalid",
        reasonCodes: ["open-contradictions"],
        family,
      };
    }
  }

  // legacy-engineering-admitted, source-verified-candidate (fully approved), production-admitted (fully approved)
  return {
    evidenceId: evidence.evidenceId,
    signalFamilyId: evidence.signalFamilyId,
    admittedToCandidateScore: true,
    status: "admitted",
    reasonCodes: [],
    family,
  };
}
