import type { BirthInput } from "@/types/chart";

/**
 * Static benchmark identity. annualYear/flowBase are Calculation Core
 * sentinels, not natal identity. Changing them must not create a new case.
 */
export interface NatalBenchmarkInput {
  solarDate: string;
  birthHour: string;
  gender: "male" | "female";
  timezone: string;
}

export const BENCHMARK_TEMPORAL_SENTINEL = {
  annualYear: "2000",
  flowBase: "luu-nien",
} as const;

export const FINGERPRINT_VERSION = "1.0.0";
export const CURRENT_RUBRIC_VERSION = "2.1.0";
export const KNOWN_RUBRIC_VERSIONS = ["2.0.0", "2.1.0"] as const;

export function natalIdentityKey(input: NatalBenchmarkInput): string {
  return JSON.stringify([
    input.solarDate,
    input.birthHour,
    input.gender,
    input.timezone,
  ]);
}

export function toBirthInput(input: NatalBenchmarkInput): BirthInput {
  return {
    solarDate: input.solarDate,
    birthHour: input.birthHour,
    gender: input.gender,
    timezone: input.timezone,
    annualYear: BENCHMARK_TEMPORAL_SENTINEL.annualYear,
    flowBase: BENCHMARK_TEMPORAL_SENTINEL.flowBase,
  };
}

export function natalFromBirthInput(input: BirthInput): NatalBenchmarkInput {
  return {
    solarDate: input.solarDate,
    birthHour: input.birthHour,
    gender: input.gender,
    timezone: input.timezone,
  };
}
