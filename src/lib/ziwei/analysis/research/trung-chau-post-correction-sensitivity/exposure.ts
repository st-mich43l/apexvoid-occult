import { CORRECTED_STEMS, type CorrectionExposure, type ExposureCohort } from "./types";

export function stemIsCorrected(stem: string | null | undefined): boolean {
  if (!stem) return false;
  return (CORRECTED_STEMS as readonly string[]).includes(stem);
}

export function buildLayerExposure(input: {
  natalStem: string | null;
  annualStem: string | null;
  majorStem: string | null;
}): CorrectionExposure {
  return {
    natalStem: input.natalStem,
    annualStem: input.annualStem,
    majorStem: input.majorStem,
    natalKhoaChanged: stemIsCorrected(input.natalStem),
    annualKhoaChanged: stemIsCorrected(input.annualStem),
    majorKhoaChanged: stemIsCorrected(input.majorStem),
    monthlyKhoaChanged: false,
  };
}

export function withMonthlyExposure(
  base: CorrectionExposure,
  lunarMonth: number,
  monthlyCalendarStem: string | null,
): CorrectionExposure {
  return {
    ...base,
    lunarMonth,
    monthlyCalendarStem,
    monthlyKhoaChanged: stemIsCorrected(monthlyCalendarStem),
  };
}

export function exposureCohort(exposure: CorrectionExposure): ExposureCohort {
  const layers = [
    exposure.natalKhoaChanged,
    exposure.annualKhoaChanged,
    exposure.majorKhoaChanged,
  ].filter(Boolean).length;
  if (layers === 0) return "NO_EXPOSURE";
  if (layers > 1) return "MULTI_LAYER";
  if (exposure.natalKhoaChanged) return "NATAL_ONLY";
  if (exposure.annualKhoaChanged) return "ANNUAL_ONLY";
  return "MAJOR_ONLY";
}

export function anyChartLayerExposed(exposure: CorrectionExposure): boolean {
  return (
    exposure.natalKhoaChanged ||
    exposure.annualKhoaChanged ||
    exposure.majorKhoaChanged
  );
}
