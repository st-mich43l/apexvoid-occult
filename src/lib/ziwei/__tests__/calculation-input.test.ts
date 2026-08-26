/**
 * PR #249 — validated Calculation Core input boundary.
 */
import { describe, expect, it } from "vitest";
import {
  parseAnnualViewMode,
  parseAnnualYear,
  parseBirthHourBranch,
  parseSolarDate,
  parseTimezoneOffset,
  parseZiweiCalculationInput,
  ZiweiCalculationInputError,
} from "../calculation-input";

const VALID = {
  solarDate: "21/09/1991",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("parseZiweiCalculationInput", () => {
  it("accepts a valid production form input", () => {
    const v = parseZiweiCalculationInput(VALID);
    expect(v.solar).toEqual({ year: 1991, month: 9, day: 21 });
    expect(v.birthHourBranch).toBe("Dậu");
    expect(v.timezone).toBe(7);
    expect(v.annualYear).toBe(2026);
    expect(v.flowBase).toBe("luu-nien");
  });

  it("rejects malformed and impossible dates", () => {
    for (const solarDate of [
      "not-a-date",
      "31/02/1998",
      "00/01/1998",
      "01/13/1998",
      "",
    ]) {
      expect(() => parseSolarDate(solarDate)).toThrow(ZiweiCalculationInputError);
    }
  });

  it("rejects invalid birth hour (no silent Tý)", () => {
    for (const v of ["", "foo"]) {
      try {
        parseBirthHourBranch(v);
        expect.unreachable();
      } catch (e) {
        expect(e).toBeInstanceOf(ZiweiCalculationInputError);
        expect((e as ZiweiCalculationInputError).code).toBe("INVALID_BIRTH_HOUR");
      }
    }
  });

  it("rejects invalid timezone (no silent UTC+7)", () => {
    for (const v of ["", "foo", "NaN"]) {
      try {
        parseTimezoneOffset(v);
        expect.unreachable();
      } catch (e) {
        expect(e).toBeInstanceOf(ZiweiCalculationInputError);
        expect((e as ZiweiCalculationInputError).code).toBe("INVALID_TIMEZONE");
      }
    }
  });

  it("treats timezone 0 as valid UTC+0 (H4 bug retired)", () => {
    expect(parseTimezoneOffset("0")).toBe(0);
  });

  it("rejects invalid annual year without host current-year fallback", () => {
    for (const v of ["", "abc", "1899", "2101"]) {
      try {
        parseAnnualYear(v);
        expect.unreachable();
      } catch (e) {
        expect(e).toBeInstanceOf(ZiweiCalculationInputError);
        expect((e as ZiweiCalculationInputError).code).toBe("INVALID_ANNUAL_YEAR");
      }
    }
  });

  it("rejects invalid flowBase (no cast)", () => {
    for (const v of ["", "not-a-mode"]) {
      try {
        parseAnnualViewMode(v);
        expect.unreachable();
      } catch (e) {
        expect(e).toBeInstanceOf(ZiweiCalculationInputError);
        expect((e as ZiweiCalculationInputError).code).toBe("INVALID_FLOW_BASE");
      }
    }
  });

  it("calculate path fails closed for invalid composite input", () => {
    expect(() =>
      parseZiweiCalculationInput({ ...VALID, annualYear: "nope" }),
    ).toThrow(ZiweiCalculationInputError);
  });
});
