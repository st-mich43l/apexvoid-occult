import type { SupportPressureConflict } from "./types";

const HIGH = 60;

const CONFLICT_NOTE =
  "Engineering diagnostic: high normalized support and high normalized pressure together. This is not sparse evidence and does not change net-quality score.";

export function supportPressureConflict(
  support: number,
  pressure: number,
): SupportPressureConflict {
  return {
    present: support >= HIGH && pressure >= HIGH,
    support,
    pressure,
    note: CONFLICT_NOTE,
  };
}
