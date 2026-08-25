/**
 * Archived control: PO-FROZEN-0ac04ad was the WRONG restore target (PR #235).
 * Production authority is PO-F51-PRE-ANNUAL-AXES — see f51-numeric-equality.test.ts.
 *
 * Fixtures under __fixtures__/palace-overview.numeric-baseline.0ac04ad.* remain
 * as historical-control-pre-v2 only; they must NOT gate production.
 */
import { describe, expect, it } from "vitest";
import {
  PALACE_OVERVIEW_HISTORICAL_CONTROL_0AC04AD,
  PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
  PALACE_OVERVIEW_NUMERIC_BASELINE_ID,
} from "../numeric-baseline";

describe("historical-control-pre-v2 (0ac04ad archive)", () => {
  it("production baseline is f51, not 0ac04ad", () => {
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_ID).toBe("PO-F51-PRE-ANNUAL-AXES");
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT).not.toBe(
      PALACE_OVERVIEW_HISTORICAL_CONTROL_0AC04AD,
    );
    expect(PALACE_OVERVIEW_HISTORICAL_CONTROL_0AC04AD).toBe(
      "0ac04ad0875dd3de5b03036d8a673fa6b00b8a08",
    );
  });
});
