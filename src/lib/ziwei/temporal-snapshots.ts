import type { BirthInput, School } from "@/types/chart";
import type { ApiChartDto, ApiTemporalSnapshotBundle } from "@/api/contracts";
import { calculateForAnnualYear, serializeChart } from "@/lib/ziwei/chart";

export interface AiSubmissionContext {
  chartText: string;
  chart: ApiChartDto;
  profile: {
    name: string;
    occupationStatus: string;
    relationshipStatus: string;
  };
  /** Captured at submit — used for snapshot generation (race-safe). */
  school: School;
  gender: "male" | "female";
  birthInput: BirthInput;
  buildTemporalSnapshots(years: number[]): ApiTemporalSnapshotBundle;
}

const ANNUAL_YEAR_MIN = 1900;
const ANNUAL_YEAR_MAX = 2100;

/**
 * Build foreign-year ChartDTO snapshots via TypeScript Calculation Core only.
 * Does not mutate React chart state. Never patches annual fields onto the anchor DTO.
 */
export function buildTemporalSnapshotsFromCore(
  school: School,
  gender: "male" | "female",
  birthInput: BirthInput,
  anchorAnnualYear: number,
  years: number[],
): ApiTemporalSnapshotBundle {
  const unique = [...new Set(years)].filter((y) => y !== anchorAnnualYear).sort((a, b) => a - b);
  if (unique.length > 5) {
    throw new Error("TEMPORAL_RANGE_TOO_LARGE");
  }
  if (unique.length < 1) {
    throw new Error("TEMPORAL_NEGOTIATION_FAILED");
  }
  const snapshots: ApiChartDto[] = [];
  for (const year of unique) {
    if (year < ANNUAL_YEAR_MIN || year > ANNUAL_YEAR_MAX) {
      throw new Error("TEMPORAL_YEAR_OUT_OF_RANGE");
    }
    const data = calculateForAnnualYear(school, birthInput, year);
    const dto = serializeChart(data, school, gender);
    if (!dto || dto.annualYear !== year) {
      throw new Error("TEMPORAL_NEGOTIATION_FAILED");
    }
    snapshots.push(dto);
  }
  return { anchorAnnualYear, snapshots };
}
