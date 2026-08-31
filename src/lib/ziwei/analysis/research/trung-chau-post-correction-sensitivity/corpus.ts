/**
 * Full current Trung Châu golden corpus loader (55 cases including annual-stem-*).
 * Distinct from historical V0.3 impact-compare which excludes annual-stem-*.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BirthInput, ChartData } from "@/types/chart";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";

export interface TcGoldenCase {
  id: string;
  label: string;
  input: BirthInput;
}

export interface TcCorpusCase {
  caseId: string;
  label: string;
  input: BirthInput;
  /** Live POST chart from current Calculation Core + released TC policy. */
  postChart: ChartData;
}

function goldenPath(): string {
  return resolve(process.cwd(), "tests/golden/tuvi-trung-chau.json");
}

export function loadTrungChauGoldenCaseRecords(): TcGoldenCase[] {
  const raw = JSON.parse(readFileSync(goldenPath(), "utf8")) as {
    cases: TcGoldenCase[];
  };
  return raw.cases.map((c) => ({
    id: c.id,
    label: c.label,
    input: c.input,
  }));
}

export function loadFullTrungChauCorpus(): TcCorpusCase[] {
  const cases = loadTrungChauGoldenCaseRecords();
  return cases
    .map((c) => ({
      caseId: c.id,
      label: c.label,
      input: c.input,
      postChart: calculateTrungChau(c.input),
    }))
    .sort((a, b) => (a.caseId < b.caseId ? -1 : a.caseId > b.caseId ? 1 : 0));
}

export function corpusInventory(cases: readonly TcCorpusCase[] | readonly TcGoldenCase[]) {
  const ids = cases.map((c) => ("caseId" in c ? c.caseId : c.id));
  const annualStemIds = ids.filter((id) => id.startsWith("annual-stem-")).sort();
  return {
    total: ids.length,
    annualStemCount: annualStemIds.length,
    annualStemIds,
    includesAnnualStemMau: annualStemIds.includes("annual-stem-2018"),
    includesAnnualStemNham: annualStemIds.includes("annual-stem-2022"),
    historicalNonAnnualStemCount: ids.filter((id) => !id.startsWith("annual-stem-")).length,
  };
}
