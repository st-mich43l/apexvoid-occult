/**
 * V1.3 explained-delta freeze is retired.
 * Production numeric authority is PO-FROZEN-0ac04ad — see
 * frozen-numeric-baseline.test.ts and numeric-baseline.ts.
 */
import { describe, expect, it } from "vitest";
import {
  PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
  PALACE_OVERVIEW_NUMERIC_BASELINE_ID,
  PALACE_OVERVIEW_NUMERIC_STATUS,
} from "../numeric-baseline";

describe("score-freeze-v1-3 retired", () => {
  it("defers to PO-FROZEN-0ac04ad", () => {
    expect(PALACE_OVERVIEW_NUMERIC_STATUS).toBe("FROZEN");
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_ID).toBe("PO-FROZEN-0ac04ad");
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT).toBe(
      "0ac04ad0875dd3de5b03036d8a673fa6b00b8a08",
    );
  });
});
