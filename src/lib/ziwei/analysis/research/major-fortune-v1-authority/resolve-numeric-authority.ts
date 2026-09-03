import type { AuthorityPack, NumericPolicyRecord } from "./types";
import { expandNumericPolicies } from "./load-authority-pack";

export function resolveNumericAuthority(pack: AuthorityPack, surfaceId: string): NumericPolicyRecord["authority"] | null {
  const matches = expandNumericPolicies(pack).filter((surface) => surface.surfaceId === surfaceId);
  return matches.length === 1 ? matches[0]!.authority : null;
}
