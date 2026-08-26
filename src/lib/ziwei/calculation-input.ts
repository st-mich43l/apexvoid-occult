/**
 * Validated Calculation Core input boundary (PR #249).
 *
 * Raw UI/form strings → parseZiweiCalculationInput → ZiweiCalculationInput.
 * Engines must not silently replace malformed values with astrology defaults.
 */
import type { AnnualViewMode } from "./annual-flow";

const ZIWEI_HOUR_BRANCHES = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

export type ZiweiHourBranch = (typeof ZIWEI_HOUR_BRANCHES)[number];

const ANNUAL_VIEW_MODES = ["luu-nien", "tieu-han", "dai-van"] as const;

const ANNUAL_YEAR_MIN = 1900;
const ANNUAL_YEAR_MAX = 2100;

export interface RawZiweiFormInput {
  solarDate: string;
  birthHour: string;
  gender: "male" | "female";
  timezone: string;
  annualYear: string;
  flowBase: string;
}

export interface ZiweiCalculationInput {
  solar: { year: number; month: number; day: number };
  birthHourBranch: ZiweiHourBranch;
  gender: "male" | "female";
  timezone: number;
  annualYear: number;
  flowBase: AnnualViewMode;
}

export class ZiweiCalculationInputError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ZiweiCalculationInputError";
    this.code = code;
  }
}

function isValidDateParts(day: number, month: number, year: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || year < 1) return false;
  return day <= new Date(year, month, 0).getDate();
}

/** Parse solar date; fail closed (no silent 1990-06-15). */
export function parseSolarDate(
  value: string,
): { year: number; month: number; day: number } {
  const raw = String(value ?? "").trim();
  let match = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (isValidDateParts(day, month, year)) return { year, month, day };
  }
  match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (isValidDateParts(day, month, year)) return { year, month, day };
  }
  throw new ZiweiCalculationInputError(
    "INVALID_SOLAR_DATE",
    `Invalid solar date: ${JSON.stringify(value)}`,
  );
}

export function parseTimezoneOffset(value: string): number {
  const raw = String(value ?? "").trim();
  if (raw === "") {
    throw new ZiweiCalculationInputError("INVALID_TIMEZONE", "timezone is empty");
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new ZiweiCalculationInputError(
      "INVALID_TIMEZONE",
      `timezone must be an integer offset, got ${JSON.stringify(value)}`,
    );
  }
  // Accept any finite integer offset in a sane range; UI currently offers 7/8.
  if (n < -12 || n > 14) {
    throw new ZiweiCalculationInputError(
      "INVALID_TIMEZONE",
      `timezone out of range: ${n}`,
    );
  }
  return n;
}

export function parseBirthHourBranch(value: string): ZiweiHourBranch {
  const raw = String(value ?? "").trim();
  if ((ZIWEI_HOUR_BRANCHES as readonly string[]).includes(raw)) {
    return raw as ZiweiHourBranch;
  }
  throw new ZiweiCalculationInputError(
    "INVALID_BIRTH_HOUR",
    `birthHour must be a Zi Wei hour branch, got ${JSON.stringify(value)}`,
  );
}

export function parseAnnualYear(value: string): number {
  const raw = String(value ?? "").trim();
  if (raw === "") {
    throw new ZiweiCalculationInputError("INVALID_ANNUAL_YEAR", "annualYear is empty");
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new ZiweiCalculationInputError(
      "INVALID_ANNUAL_YEAR",
      `annualYear must be an integer, got ${JSON.stringify(value)}`,
    );
  }
  if (n < ANNUAL_YEAR_MIN || n > ANNUAL_YEAR_MAX) {
    throw new ZiweiCalculationInputError(
      "INVALID_ANNUAL_YEAR",
      `annualYear out of range ${ANNUAL_YEAR_MIN}..${ANNUAL_YEAR_MAX}: ${n}`,
    );
  }
  return n;
}

export function parseAnnualViewMode(value: string): AnnualViewMode {
  const raw = String(value ?? "").trim();
  if ((ANNUAL_VIEW_MODES as readonly string[]).includes(raw)) {
    return raw as AnnualViewMode;
  }
  throw new ZiweiCalculationInputError(
    "INVALID_FLOW_BASE",
    `flowBase must be one of ${ANNUAL_VIEW_MODES.join("|")}, got ${JSON.stringify(value)}`,
  );
}

function parseGender(value: string): "male" | "female" {
  if (value === "male" || value === "female") return value;
  throw new ZiweiCalculationInputError(
    "INVALID_GENDER",
    `gender must be male|female, got ${JSON.stringify(value)}`,
  );
}

export function parseZiweiCalculationInput(
  raw: RawZiweiFormInput,
): ZiweiCalculationInput {
  return {
    solar: parseSolarDate(raw.solarDate),
    birthHourBranch: parseBirthHourBranch(raw.birthHour),
    gender: parseGender(raw.gender),
    timezone: parseTimezoneOffset(raw.timezone),
    annualYear: parseAnnualYear(raw.annualYear),
    flowBase: parseAnnualViewMode(raw.flowBase),
  };
}

/** Pure helper: same birth, different annual year. */
export function withAnnualYear(
  input: ZiweiCalculationInput,
  annualYear: number,
): ZiweiCalculationInput {
  if (
    !Number.isInteger(annualYear) ||
    annualYear < ANNUAL_YEAR_MIN ||
    annualYear > ANNUAL_YEAR_MAX
  ) {
    throw new ZiweiCalculationInputError(
      "INVALID_ANNUAL_YEAR",
      `annualYear out of range: ${annualYear}`,
    );
  }
  return { ...input, annualYear };
}
