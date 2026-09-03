import type { AuthorityPack, SourceWitness } from "./types";

export function resolveSourceWitness(pack: AuthorityPack, witnessId: string): SourceWitness | null {
  return pack.witnesses.find((witness) => witness.witnessId === witnessId) ?? null;
}
