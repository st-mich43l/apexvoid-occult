import { Pillar } from "../calendar/sexagenary";
import { BaziFullChart } from "./bazi-engine";
import { BaziConventions, DEFAULT_CONVENTIONS } from "./conventions";
import { getAnnualPillar } from "./luck-pillars";
import { getTenGod } from "./ten-gods";
import { getLifeStage } from "./life-stages";

export interface AnnualYear {
  /** Gregorian display year label for the Li-Chun-cycle row (not an exact interval). */
  year: number;
  age: number; // tuổi (quy ước: nominal hay chronological)
  pillar: Pillar; // can-chi năm (label for that Li-Chun cycle year number)
  tenGod: string;
  lifeStage: string;
  luckPillarIndex: number;
}

function resolveCivilBirthYear(chart: BaziFullChart): number {
  if (chart.metadata.civil?.solarYear != null) {
    return chart.metadata.civil.solarYear;
  }
  // Fallback: civil clock reconstructed from TST is wrong — use UTC year of TST
  // only when civil display was never attached (should not happen in generateBaziChart).
  return chart.metadata.trueSolarTime.getUTCFullYear();
}

/**
 * Gregorian year of a UTC instant (host-timezone independent).
 * Luck pillar `startDate` values are absolute UTC instants.
 */
export function utcGregorianYear(instant: Date): number {
  return instant.getUTCFullYear();
}

/**
 * Tính bảng lưu niên (Annual Years) cho một khoảng thời gian.
 *
 * Each row's `year` is a Gregorian display year used as a label for the
 * Li-Chun-based annual cycle via `getAnnualPillar(year)`. It is NOT an exact
 * `[LiChun, nextLiChun)` interval model — see `getAnnualPillarAtInstant`.
 */
export function getAnnualYears(
  chart: BaziFullChart,
  fromYear?: number,
  toYear?: number,
  conventions: BaziConventions = DEFAULT_CONVENTIONS,
): AnnualYear[] {
  const birthYear = resolveCivilBirthYear(chart);
  const start = fromYear ?? birthYear;
  const end = toYear ?? birthYear + 80;
  const dayMaster = chart.day.stem;

  const results: AnnualYear[] = [];

  for (let year = start; year <= end; year++) {
    const pillar = getAnnualPillar(year);

    let age = 0;
    if (conventions.annualAgeMethod === "nominal") {
      age = year - birthYear + 1;
    } else {
      age = year - birthYear;
    }
    if (age < 0) age = 0;

    let foundIndex = -1;
    for (let i = chart.luck.pillars.length - 1; i >= 0; i--) {
      const lpStartYear = utcGregorianYear(chart.luck.pillars[i]!.startDate);
      if (year >= lpStartYear) {
        foundIndex = i;
        break;
      }
    }

    results.push({
      year,
      age,
      pillar,
      tenGod: getTenGod(dayMaster, pillar.stem),
      lifeStage: getLifeStage(dayMaster, pillar.branch, conventions),
      luckPillarIndex: foundIndex,
    });
  }

  return results;
}
