import type { AuthorityPack, ClaimAuthority } from "./types";

export function resolveClaimAuthority(pack: AuthorityPack, evidenceFamily: string): ClaimAuthority | null {
  return pack.claims.find((claim) => claim.evidenceFamily === evidenceFamily) ?? null;
}
