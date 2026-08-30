/**
 * Pure Calculation Core helper: resolve Major Fortune transformation tuples
 * for a fortune stem against natal palace star placement.
 *
 * Uses the school policy registry + shared getTuHoaTargets (same SSOT as
 * engine mutagen resolution) without importing chart routing / getEngine.
 * Does not mutate ChartData or duplicate stem maps.
 */
import type { ChartPalace, MutagenRecord, School } from "@/types/chart";
import { getTuHoaTargets } from "./shared-mutagens";
import { getZiweiStaticSchoolPolicy } from "../schools/policy-registry";

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
 * Semantics match Calculation Core resolveMutagenRecords(..., "major-mutagen")
 * with the natal-eligible star finder (rejects annual / Lưu layers).
 */
export function resolveMajorFortuneMutagensForStem(
  school: School,
  fortuneStem: string,
  palaces: readonly ChartPalace[],
): MutagenRecord[] {
  if (!fortuneStem) return [];
  const { tuHoa } = getZiweiStaticSchoolPolicy(school);
  const targets = getTuHoaTargets(tuHoa, fortuneStem);
  return targets.map(({ mutagen, starName }) => ({
    source: "major-mutagen",
    mutagen,
    starName,
    palace: findStarPalace(palaces, starName),
  }));
}
