/**
 * Archived controls: 0ac04ad / 79a / f51 were wrong or inconclusive restore targets.
 * Production authority is PO-SCORING-FORMULA-V2-PR211 (closed PR #211 tip).
 */
import { describe, expect, it } from "vitest";
import {
  PALACE_OVERVIEW_HISTORICAL_CONTROL_0AC04AD,
  PALACE_OVERVIEW_HISTORICAL_CONTROL_79A,
  PALACE_OVERVIEW_HISTORICAL_CONTROL_F51,
  PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
  PALACE_OVERVIEW_NUMERIC_BASELINE_ID,
} from "../numeric-baseline";

describe("historical-control archive (not production authority)", () => {
  it("production baseline is PR #211 Scoring Formula V2", () => {
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_ID).toBe(
      "PO-SCORING-FORMULA-V2-PR211",
    );
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT).toBe(
      "8161476a279e8a5877e72ecaed65cdcae3c4b879",
    );
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT).not.toBe(
      PALACE_OVERVIEW_HISTORICAL_CONTROL_0AC04AD,
    );
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT).not.toBe(
      PALACE_OVERVIEW_HISTORICAL_CONTROL_F51,
    );
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT).not.toBe(
      PALACE_OVERVIEW_HISTORICAL_CONTROL_79A,
    );
  });
});
