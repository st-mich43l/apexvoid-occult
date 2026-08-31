/**
 * Dual-school golden corpus + valid Major Fortune cycle enumeration.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BirthInput, ChartData } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { CycleOverride, ZiweiSchoolId } from "./types";

interface GoldenCaseRecord {
  id: string;
  label?: string;
  input: BirthInput;
}

export interface CorpusCase {
  school: ZiweiSchoolId;
  caseId: string;
  input: BirthInput;
  chart: ChartData;
}

export interface CorpusObservation {
  school: ZiweiSchoolId;
  caseId: string;
  cycle: CycleOverride;
  chart: ChartData;
}

function loadGolden(school: ZiweiSchoolId): GoldenCaseRecord[] {
  const raw = JSON.parse(
    readFileSync(resolve(process.cwd(), `tests/golden/tuvi-${school}.json`), "utf8"),
  ) as { cases: GoldenCaseRecord[] };
  return raw.cases;
}

function listValidCycles(chart: ChartData): CycleOverride[] {
  const cycles: CycleOverride[] = [];
  for (const palace of chart.palaces) {
    const mf = palace.majorFortune;
    if (
      !mf ||
      mf.order === undefined ||
      mf.start === undefined ||
      mf.end === undefined
    ) {
      continue;
    }
    cycles.push({
      cycleIndex: mf.order,
      startAge: mf.start,
      endAge: mf.end,
      activePalaceIndex: palace.index,
    });
  }
  return cycles.sort(
    (a, b) =>
      a.cycleIndex - b.cycleIndex || a.activePalaceIndex - b.activePalaceIndex,
  );
}

export function loadSchoolCorpus(school: ZiweiSchoolId): CorpusCase[] {
  const calc = school === "nam-phai" ? calculateNamPhai : calculateTrungChau;
  return loadGolden(school)
    .map((c) => ({
      school,
      caseId: c.id,
      input: c.input,
      chart: calc(c.input),
    }))
    .sort((a, b) => (a.caseId < b.caseId ? -1 : a.caseId > b.caseId ? 1 : 0));
}

export function loadFullCorpus(): CorpusCase[] {
  return [...loadSchoolCorpus("nam-phai"), ...loadSchoolCorpus("trung-chau")];
}

export function enumerateObservations(corpus: readonly CorpusCase[]): CorpusObservation[] {
  const out: CorpusObservation[] = [];
  for (const c of corpus) {
    for (const cycle of listValidCycles(c.chart)) {
      out.push({
        school: c.school,
        caseId: c.caseId,
        cycle,
        chart: c.chart,
      });
    }
  }
  return out.sort((a, b) => {
    const ka = `${a.school}|${a.caseId}|${a.cycle.cycleIndex}|${a.cycle.activePalaceIndex}`;
    const kb = `${b.school}|${b.caseId}|${b.cycle.cycleIndex}|${b.cycle.activePalaceIndex}`;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

export function observationKey(o: {
  school: string;
  caseId: string;
  cycle: CycleOverride;
}): string {
  return `${o.school}|${o.caseId}|${o.cycle.cycleIndex}|${o.cycle.activePalaceIndex}`;
}
