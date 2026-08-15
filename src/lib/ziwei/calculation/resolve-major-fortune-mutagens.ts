/**
 * Pure Calculation Core helper: resolve Major Fortune transformation tuples
 * for a fortune stem against natal palace star placement.
 *
 * Reuses each school's exported `tuHoaTargets` table (same SSOT as internal
 * `getMutagenRecords`) without mutating ChartData or duplicating stem maps.
 */
import type { ChartPalace, MutagenRecord, School } from "@/types/chart";
import { getEngine } from "../chart";

function findStarPalace(
  palaces: readonly ChartPalace[],
  starName: string,
): ChartPalace | null {
  for (const palace of palaces) {
    const hit = (palace.stars ?? []).some((s) => {
      if (s.name !== starName) return false;
      const source = s.source ?? "natal";
      if (source === "annual" || source === "annual-mutagen") return false;
      if (s.name.startsWith("Lưu ")) return false;
      return true;
    });
    if (hit) return palace;
  }
  return null;
}

/**
 * Resolve Major Fortune (Đại Vận) mutagen records for a stem.
 * Semantics match Calculation Core `getMutagenRecords(stem, palaces, "major-mutagen")`.
 */
export function resolveMajorFortuneMutagensForStem(
  school: School,
  fortuneStem: string,
  palaces: readonly ChartPalace[],
): MutagenRecord[] {
  if (!fortuneStem) return [];
  const engine = getEngine(school);
  if (!engine) return [];
  const targets = engine.tuHoaTargets(fortuneStem);
  return targets.map(({ mutagen, starName }) => ({
    source: "major-mutagen",
    mutagen,
    starName,
    palace: findStarPalace(palaces, starName),
  }));
}
