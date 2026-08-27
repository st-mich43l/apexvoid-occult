/**
 * Compile-time / structural contract coverage for generated ApiChartDto (PR #251).
 */
import { describe, expect, it } from "vitest";
import type { School } from "@/types/chart";
import type {
  ApiChartDto,
  ApiGender,
  ApiInterpretRequest,
  ApiSchool,
  ApiTemporalSnapshotBundle,
  BackendApiErrorCode,
} from "@/api/contracts";
import { calculateForAnnualYear, serializeChart } from "@/lib/ziwei/chart";
import type { BirthInput } from "@/types/chart";

type Assert<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type _SchoolParity = Assert<Equal<School, ApiSchool>>;
type _GenderParity = Assert<Equal<"male" | "female", ApiGender>>;
type _BackendCodes = BackendApiErrorCode;
type _Bundle = ApiTemporalSnapshotBundle;
type _Request = ApiInterpretRequest;
void 0 as unknown as _SchoolParity;
void 0 as unknown as _GenderParity;
void 0 as unknown as _BackendCodes;
void 0 as unknown as _Bundle;
void 0 as unknown as _Request;

const REQUIRED_KEYS: (keyof ApiChartDto)[] = [
  "school",
  "gender",
  "menhElement",
  "menhBranch",
  "yearStem",
  "yearBranch",
  "birthMonthStem",
  "birthMonthBranch",
  "birthDayStem",
  "birthDayBranch",
  "birthHourStem",
  "birthHourBranch",
  "annualStem",
  "annualBranch",
  "annualYear",
  "nominalAge",
  "majorFortunePalace",
  "taiTuePalace",
  "smallLimitPalace",
  "annualHeadPalace",
  "palaces",
  "natalMutagens",
  "annualMutagens",
  "majorMutagens",
];

const INPUT: BirthInput = {
  solarDate: "21/09/1991",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("API contract — serializeChart → ApiChartDto", () => {
  it("returns a complete ApiChartDto for valid input", () => {
    const dto = serializeChart(
      calculateForAnnualYear("nam-phai", INPUT, 2026),
      "nam-phai",
      "female",
    );
    expect(dto).not.toBeNull();
    for (const key of REQUIRED_KEYS) {
      expect(dto).toHaveProperty(key);
    }
    expect(dto!.school).toBe("nam-phai");
    expect(dto!.gender).toBe("female");
    expect(dto!.palaces).toHaveLength(12);
    expect(typeof dto!.annualYear).toBe("number");
  });
});
