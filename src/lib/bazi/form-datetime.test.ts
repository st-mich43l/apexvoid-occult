import { describe, expect, it } from "vitest";
import {
  clampCivilDate,
  daysInUtcMonth,
  ddMmYyyyToIso,
  isoToDdMmYyyy,
  maskDdMmYyyy,
  maskHhMm,
  normalizeDdMmYyyy,
  parseDdMmYyyy,
  parseHhMm,
} from "./form-datetime";

describe("form-datetime", () => {
  it("masks digits into dd/mm/yyyy", () => {
    expect(maskDdMmYyyy("2")).toBe("2");
    expect(maskDdMmYyyy("21")).toBe("21");
    expect(maskDdMmYyyy("2109")).toBe("21/09");
    expect(maskDdMmYyyy("21091991")).toBe("21/09/1991");
  });

  it("parses only valid calendar dates in dd/mm/yyyy", () => {
    expect(parseDdMmYyyy("21/09/1991")).toEqual({ year: 1991, month: 9, day: 21 });
    expect(parseDdMmYyyy("31/02/1991")).toBeNull();
    expect(parseDdMmYyyy("1991-09-21")).toBeNull();
  });

  it("clamps day to the last valid day of the month", () => {
    expect(daysInUtcMonth(1991, 9)).toBe(30);
    expect(daysInUtcMonth(1992, 2)).toBe(29);
    expect(clampCivilDate(1991, 2, 31)).toEqual({ year: 1991, month: 2, day: 28 });
    expect(clampCivilDate(1991, 13, 1)).toBeNull();
  });

  it("converts iso without changing the civil day", () => {
    expect(ddMmYyyyToIso("21/09/1991")).toBe("1991-09-21");
    expect(isoToDdMmYyyy("1991-09-21")).toBe("21/09/1991");
    expect(normalizeDdMmYyyy("1991-09-21")).toBe("21/09/1991");
  });

  it("masks and parses HH:mm", () => {
    expect(maskHhMm("1830")).toBe("18:30");
    expect(parseHhMm("18:30")).toEqual({ hour: 18, minute: 30 });
    expect(parseHhMm("24:00")).toBeNull();
  });
});
