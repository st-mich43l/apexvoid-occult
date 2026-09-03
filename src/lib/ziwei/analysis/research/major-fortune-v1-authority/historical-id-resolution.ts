import type { AuthorityPack, HistoricalMigration } from "./types";

export function resolveHistoricalId(pack: AuthorityPack, historicalId: string): HistoricalMigration | null {
  return pack.historicalMigrations.find((record) => record.historicalId === historicalId) ?? null;
}
