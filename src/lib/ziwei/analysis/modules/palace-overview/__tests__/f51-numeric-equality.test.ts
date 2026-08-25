/**
 * Historical archive: f51 V2 structure-quality equality is NOT production authority.
 * Production is PO-SCORING-FORMULA-V2-PR211.
 */
import { describe, expect, it } from "vitest";
import {
  PALACE_OVERVIEW_HISTORICAL_CONTROL_F51,
  PALACE_OVERVIEW_NUMERIC_BASELINE_ID,
} from "../numeric-baseline";

describe("f51 structure-quality archive (not production)", () => {
  it("does not define production baseline", () => {
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_ID).toBe(
      "PO-SCORING-FORMULA-V2-PR211",
    );
    expect(PALACE_OVERVIEW_HISTORICAL_CONTROL_F51).toBe(
      "f51ff20c40f9354cd7872ae259bb5e7485d1f3a2",
    );
  });
});
