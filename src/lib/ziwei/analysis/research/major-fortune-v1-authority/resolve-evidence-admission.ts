import type { AdmissionPolicy, AuthorityPack } from "./types";

export function resolveEvidenceAdmission(pack: AuthorityPack, evidenceFamily: string): AdmissionPolicy | null {
  return pack.admissionPolicies.find((policy) => policy.familyId === evidenceFamily) ?? null;
}
