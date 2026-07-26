import type { MajorFortuneV02CycleObservation } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus.js";

export type MutationId = 
  | "annualYear+1"
  | "annualYear-1"
  | "annualYear-end"
  | "flowMonths+6"
  | "timezone-shift";

export interface TemporalMutationCase {
  id: MutationId;
  description: string;
  apply(obs: MajorFortuneV02CycleObservation): MajorFortuneV02CycleObservation | null;
}

export const TEMPORAL_MUTATIONS: TemporalMutationCase[] = [
  {
    id: "annualYear+1",
    description: "Shift annualYear forward by 1, simulating scoring at a later point in the same cycle.",
    apply: (obs) => {
      const nextAge = (obs.selectedAnnualYear + 1) - Number(obs.input.solarDate.split("-")[0]) + 1; // Approx
      // The only strict rule for temporal independence is that we must stay within the [startAge, endAge] bounds
      // of the cycle.
      // But wait, the exact mapping is `candidateYear = lunarYear + age - 1`. 
      // If we increment selectedAnnualYear by 1, the new age is age + 1.
      // We don't have the lunar year here, but we know selectedAnnualYear mapped to SOME age in [startAge, endAge].
      // We can just increment annualYear by 1. If it happens to jump out of the cycle, the sentinel should catch it
      // or we can just blindly mutate and the test suite / sentinel will fail if it's invalid.
      // Actually, if we just mutate `selectedAnnualYear` and `input.annualYear`, that's the mutation.
      return {
        ...obs,
        selectedAnnualYear: obs.selectedAnnualYear + 1,
        input: {
          ...obs.input,
          annualYear: String(obs.selectedAnnualYear + 1),
        },
      };
    },
  },
  {
    id: "annualYear-1",
    description: "Shift annualYear backward by 1.",
    apply: (obs) => {
      return {
        ...obs,
        selectedAnnualYear: obs.selectedAnnualYear - 1,
        input: {
          ...obs.input,
          annualYear: String(obs.selectedAnnualYear - 1),
        },
      };
    },
  },
  {
    id: "timezone-shift",
    description: "Change the timezone, which shifts the absolute UTC time but should not change the local astrological evaluation.",
    apply: (obs) => {
      return {
        ...obs,
        input: {
          ...obs.input,
          timezone: "8", // was "7"
        },
      };
    },
  },
];
