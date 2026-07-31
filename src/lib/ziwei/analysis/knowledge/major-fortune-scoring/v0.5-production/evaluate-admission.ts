import type { MajorFortuneOrdinalEvidence } from "../../../modules/major-fortune/v0.3-ordinal/types";
import type { MajorFortuneProductionAdmissionRegistry, MajorFortuneProductionFamilyAdmission } from "./types";


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

export function evaluateMajorFortuneProductionAdmission(input: {
  evidence: MajorFortuneOrdinalEvidence;
  familyRegistry: MajorFortuneProductionAdmissionRegistry;
  school: "nam-phai" | "trung-chau";
}): MajorFortuneProductionAdmissionDecision {
  const { evidence, familyRegistry, school } = input;
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
  
  if (family.scoringAuthority === "source-backed" && (family.sourceObligationIds.length === 0 || family.claimAdjudicationIds.length === 0)) {
    return {
      evidenceId: evidence.evidenceId,
      signalFamilyId: evidence.signalFamilyId,
      admittedToCandidateScore: false,
      status: "invalid",
      reasonCodes: ["missing-source-obligations"],
      family,
    };
  }

  return {
    evidenceId: evidence.evidenceId,
    signalFamilyId: evidence.signalFamilyId,
    admittedToCandidateScore: true,
    status: "admitted",
    reasonCodes: [],
    family,
  };
}
