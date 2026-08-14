import type { ExpertBenchmarkCase } from "../calibration/benchmark-v2-types";
import { fingerprintNatalCase } from "./case-fingerprint";
import { natalFromBirthInput } from "./natal-input";

export const CORPUS_TARGET_CHARTS = 30;
export const CORPUS_FLOOR_CHARTS = 20;
export const PILOT_CASE_TARGET = 5;

export interface CohortCounts {
  vcd: number;
  nonVcd: number;
  tuan: number;
  triet: number;
  noVoid: number;
  structuralSystem: number;
  systems: Record<string, number>;
  brightnessStrong: number;
  brightnessHamHeavy: number;
  brightnessMixed: number;
  male: number;
  female: number;
}

export function countCohorts(cases: ExpertBenchmarkCase[]): CohortCounts {
  const systems: Record<string, number> = {
    "system-tu-phu-vu-tuong": 0,
    "system-co-nguyet-dong-luong": 0,
    "system-sat-pha-tham": 0,
  };
  const counts: CohortCounts = {
    vcd: 0,
    nonVcd: 0,
    tuan: 0,
    triet: 0,
    noVoid: 0,
    structuralSystem: 0,
    systems,
    brightnessStrong: 0,
    brightnessHamHeavy: 0,
    brightnessMixed: 0,
    male: 0,
    female: 0,
  };
  for (const c of cases) {
    if (c.input.gender === "male") counts.male += 1;
    else counts.female += 1;
    const tags = new Set(c.cohortTags);
    if (tags.has("vcd")) counts.vcd += 1;
    if (tags.has("non-vcd")) counts.nonVcd += 1;
    if (tags.has("tuan")) counts.tuan += 1;
    if (tags.has("triet")) counts.triet += 1;
    if (tags.has("no-void")) counts.noVoid += 1;
    if (tags.has("structural-system")) counts.structuralSystem += 1;
    if (tags.has("brightness-strong")) counts.brightnessStrong += 1;
    if (tags.has("brightness-ham-heavy")) counts.brightnessHamHeavy += 1;
    if (tags.has("brightness-mixed")) counts.brightnessMixed += 1;
    for (const key of Object.keys(systems)) {
      if (tags.has(key)) systems[key] = (systems[key] ?? 0) + 1;
    }
  }
  return counts;
}

export function formatCoverageReport(cases: ExpertBenchmarkCase[]): string {
  const c = countCohorts(cases);
  return [
    "Palace Overview Expert Corpus",
    "",
    `Cases: ${cases.length} / ${CORPUS_TARGET_CHARTS} preferred (floor ${CORPUS_FLOOR_CHARTS})`,
    "",
    "Cohorts:",
    `  VCD             ${c.vcd}`,
    `  Non-VCD         ${c.nonVcd}`,
    `  Tuần            ${c.tuan}`,
    `  Triệt           ${c.triet}`,
    `  No void         ${c.noVoid}`,
    "",
    "Systems:",
    `  Tử Phủ Vũ Tướng       ${c.systems["system-tu-phu-vu-tuong"]}`,
    `  Cơ Nguyệt Đồng Lương   ${c.systems["system-co-nguyet-dong-luong"]}`,
    `  Sát Phá Tham           ${c.systems["system-sat-pha-tham"]}`,
    "",
    "Brightness:",
    `  strong-heavy      ${c.brightnessStrong}`,
    `  ham-heavy         ${c.brightnessHamHeavy}`,
    `  mixed             ${c.brightnessMixed}`,
    "",
    `Gender: male ${c.male} / female ${c.female}`,
  ].join("\n");
}

export function fingerprintsForCases(cases: ExpertBenchmarkCase[]) {
  return cases.map((c) => ({
    caseId: c.caseId,
    fingerprint: fingerprintNatalCase(natalFromBirthInput(c.input), "nam-phai"),
  }));
}
