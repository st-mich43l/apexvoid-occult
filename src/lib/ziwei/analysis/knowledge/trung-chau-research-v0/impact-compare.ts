/**
 * Research-only Trung Châu Tứ Hóa candidate impact comparison.
 * Does NOT mutate released school policy or ChartData.
 * Uses table-injected shared helpers on physical golden palaces.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ChartPalace, MutagenRecord } from "@/types/chart";
import type { TuHoaTable } from "@/lib/ziwei/schools/policy-types";
import { TRUNG_CHAU_TU_HOA } from "@/lib/ziwei/schools/trung-chau-policy";
import {
  getTuHoaTargets,
  resolveMutagenRecords,
  resolvePhiFlows,
} from "@/lib/ziwei/calculation/shared-mutagens";
import { stemBranchForLunarMonth } from "@/lib/ziwei/calculation/shared-primitives";
import type { ZiweiWorkingPalace } from "@/lib/ziwei/calculation/shared-primitives";
import candidateJson from "./tc-wang-tuhoa-candidate.v0.3.json";

export const CANDIDATE_TU_HOA: TuHoaTable = candidateJson.table as TuHoaTable;

export function khoaTarget(table: TuHoaTable, stem: string): string {
  return getTuHoaTargets(table, stem).find((t) => t.mutagen === "Khoa")?.starName ?? "";
}

/** Structural diff: only Mậu.Khoa and Nhâm.Khoa may differ. */
export function candidateCellDifferences(
  current: TuHoaTable = TRUNG_CHAU_TU_HOA,
  candidate: TuHoaTable = CANDIDATE_TU_HOA,
): Array<{ stem: string; mutagen: string; from: string; to: string }> {
  const diffs: Array<{ stem: string; mutagen: string; from: string; to: string }> = [];
  const stems = Object.keys(current) as Array<keyof TuHoaTable>;
  for (const stem of stems) {
    for (const mutagen of ["Lộc", "Quyền", "Khoa", "Kỵ"] as const) {
      const from = current[stem][mutagen];
      const to = candidate[stem][mutagen];
      if (from !== to) diffs.push({ stem, mutagen, from, to });
    }
  }
  return diffs;
}

function asWorkingPalaces(palaces: ChartPalace[]): ZiweiWorkingPalace[] {
  return palaces.map((p) => ({
    ...p,
    stars: [...(p.stars ?? [])],
  }));
}

function khoaRecord(records: MutagenRecord[]): MutagenRecord | undefined {
  return records.find((r) => r.mutagen === "Khoa");
}

interface LayerDelta {
  changed: boolean;
  stem: string | null;
  currentTargetStar: string | null;
  candidateTargetStar: string | null;
  currentTargetPalaceIndex: number | null;
  candidateTargetPalaceIndex: number | null;
  currentResolved: boolean;
  candidateResolved: boolean;
}

interface PhiFlowDelta {
  sourcePalaceIndex: number;
  sourcePalaceName: string;
  sourcePalaceStem: string;
  mutagen: "Khoa";
  currentTargetStar: string;
  candidateTargetStar: string;
  currentTargetPalaceIndex: number | null;
  candidateTargetPalaceIndex: number | null;
  currentResolved: boolean;
  candidateResolved: boolean;
  changed: boolean;
}

interface CaseImpact {
  caseId: string;
  yearStem: string;
  annualStem: string;
  majorFortuneStem: string | null;
  palaceStems: string[];
  hasPalaceStemMau: boolean;
  hasPalaceStemNham: boolean;
  natal: LayerDelta;
  annual: LayerDelta;
  majorFortune: LayerDelta;
  phiFlows: PhiFlowDelta[];
  phiFlowChanged: boolean;
  decoration: {
    natalKhoaDecorationWouldMove: boolean;
    annualKhoaDecorationWouldMove: boolean;
    majorKhoaDecorationWouldMove: boolean;
  };
  anyMutagenDelta: boolean;
}

function layerFromStem(
  stem: string | null | undefined,
  palaces: ZiweiWorkingPalace[],
  source: string,
): LayerDelta {
  if (!stem) {
    return {
      changed: false,
      stem: null,
      currentTargetStar: null,
      candidateTargetStar: null,
      currentTargetPalaceIndex: null,
      candidateTargetPalaceIndex: null,
      currentResolved: false,
      candidateResolved: false,
    };
  }
  const cur = khoaRecord(resolveMutagenRecords(TRUNG_CHAU_TU_HOA, stem, palaces, source));
  const cand = khoaRecord(resolveMutagenRecords(CANDIDATE_TU_HOA, stem, palaces, source));
  const currentTargetStar = cur?.starName ?? null;
  const candidateTargetStar = cand?.starName ?? null;
  const currentTargetPalaceIndex = cur?.palace?.index ?? null;
  const candidateTargetPalaceIndex = cand?.palace?.index ?? null;
  return {
    changed:
      currentTargetStar !== candidateTargetStar ||
      currentTargetPalaceIndex !== candidateTargetPalaceIndex,
    stem,
    currentTargetStar,
    candidateTargetStar,
    currentTargetPalaceIndex,
    candidateTargetPalaceIndex,
    currentResolved: currentTargetPalaceIndex != null,
    candidateResolved: candidateTargetPalaceIndex != null,
  };
}

function activeMajorStem(palaces: ChartPalace[]): string | null {
  const active = palaces.find(
    (p) => p.majorFortune && (p.majorFortune as { active?: boolean }).active === true,
  );
  return active?.stem ?? null;
}

function phiFlowDeltas(palaces: ZiweiWorkingPalace[]): PhiFlowDelta[] {
  const out: PhiFlowDelta[] = [];
  for (const source of palaces) {
    const stem = source.stem ?? "";
    if (stem !== "Mậu" && stem !== "Nhâm") continue;
    const currentStar = khoaTarget(TRUNG_CHAU_TU_HOA, stem);
    const candidateStar = khoaTarget(CANDIDATE_TU_HOA, stem);
    const curFlows = resolvePhiFlows(TRUNG_CHAU_TU_HOA, palaces).filter(
      (f) => f.source.index === source.index && f.mutagen === "Khoa",
    );
    const candFlows = resolvePhiFlows(CANDIDATE_TU_HOA, palaces).filter(
      (f) => f.source.index === source.index && f.mutagen === "Khoa",
    );
    const cur = curFlows[0];
    const cand = candFlows[0];
    const currentTargetPalaceIndex = cur?.target?.index ?? null;
    const candidateTargetPalaceIndex = cand?.target?.index ?? null;
    out.push({
      sourcePalaceIndex: source.index,
      sourcePalaceName: source.name,
      sourcePalaceStem: stem,
      mutagen: "Khoa",
      currentTargetStar: currentStar,
      candidateTargetStar: candidateStar,
      currentTargetPalaceIndex,
      candidateTargetPalaceIndex,
      currentResolved: currentTargetPalaceIndex != null,
      candidateResolved: candidateTargetPalaceIndex != null,
      changed:
        currentStar !== candidateStar ||
        currentTargetPalaceIndex !== candidateTargetPalaceIndex,
    });
  }
  return out;
}

interface GoldenCaseRecord {
  id: string;
  output: {
    yearStem: string;
    annualStem: string;
    palaces: ChartPalace[];
  };
}

function loadTrungChauGoldenCases(): GoldenCaseRecord[] {
  const raw = JSON.parse(
    readFileSync(resolve(process.cwd(), "tests/golden/tuvi-trung-chau.json"), "utf8"),
  ) as { cases: GoldenCaseRecord[] };
  return raw.cases;
}

function characterizeCase(c: GoldenCaseRecord): CaseImpact {
  const palaces = asWorkingPalaces(c.output.palaces);
  const yearStem = c.output.yearStem;
  const annualStem = c.output.annualStem;
  const majorStem = activeMajorStem(c.output.palaces);
  const natal = layerFromStem(yearStem, palaces, "natal");
  const annual = layerFromStem(annualStem, palaces, "annual");
  const majorFortune = layerFromStem(majorStem, palaces, "major-mutagen");
  const phiFlows = phiFlowDeltas(palaces);
  const phiFlowChanged = phiFlows.some((p) => p.changed);
  const palaceStems = [...new Set(palaces.map((p) => p.stem ?? "").filter(Boolean))];
  return {
    caseId: c.id,
    yearStem,
    annualStem,
    majorFortuneStem: majorStem,
    palaceStems,
    hasPalaceStemMau: palaceStems.includes("Mậu"),
    hasPalaceStemNham: palaceStems.includes("Nhâm"),
    natal,
    annual,
    majorFortune,
    phiFlows,
    phiFlowChanged,
    decoration: {
      natalKhoaDecorationWouldMove: natal.changed,
      annualKhoaDecorationWouldMove: annual.changed,
      majorKhoaDecorationWouldMove: majorFortune.changed,
    },
    anyMutagenDelta:
      natal.changed || annual.changed || majorFortune.changed || phiFlowChanged,
  };
}

interface MonthlyStemMonth {
  annualStem: string;
  lunarMonth: number;
  calendarStem: string;
  calendarBranch: string;
  currentKhoa: string;
  candidateKhoa: string;
  changed: boolean;
}

function characterizeMonthlyCalendarTuHoa(): MonthlyStemMonth[] {
  const stems = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
  const rows: MonthlyStemMonth[] = [];
  for (const annualStem of stems) {
    for (let lunarMonth = 1; lunarMonth <= 12; lunarMonth += 1) {
      const { stem, branch } = stemBranchForLunarMonth(annualStem, lunarMonth);
      const currentKhoa = khoaTarget(TRUNG_CHAU_TU_HOA, stem);
      const candidateKhoa = khoaTarget(CANDIDATE_TU_HOA, stem);
      rows.push({
        annualStem,
        lunarMonth,
        calendarStem: stem,
        calendarBranch: branch,
        currentKhoa,
        candidateKhoa,
        changed: currentKhoa !== candidateKhoa,
      });
    }
  }
  return rows;
}

interface ImpactSummary {
  goldenCasesTotal: number;
  goldenCasesWithNatalDelta: number;
  goldenCasesWithAnnualDelta: number;
  goldenCasesWithMajorDelta: number;
  goldenCasesWithPhiFlowDelta: number;
  goldenCasesWithDecorationDelta: number;
  goldenCasesWithAnyMutagenDelta: number;
  directNatalTriggerCases: number;
  directAnnualTriggerCases: number;
  majorFortuneStemMauOrNhamCases: number;
  casesWithPalaceStemMau: number;
  casesWithPalaceStemNham: number;
  casesWithBothPalaceStemsMauNham: number;
  annualStemMauOrNhamCoverage: number;
  monthlyRowsTotal: number;
  monthlyRowsWithMauOrNhamCalendarStem: number;
  monthlyRowsWithKhoaDelta: number;
  v02Note: string;
}

export function computeImpactSummary(): {
  summary: ImpactSummary;
  cases: CaseImpact[];
  monthly: MonthlyStemMonth[];
  diffs: ReturnType<typeof candidateCellDifferences>;
} {
  const cases = loadTrungChauGoldenCases().map(characterizeCase);
  const monthly = characterizeMonthlyCalendarTuHoa();
  const diffs = candidateCellDifferences();
  const summary: ImpactSummary = {
    goldenCasesTotal: cases.length,
    goldenCasesWithNatalDelta: cases.filter((c) => c.natal.changed).length,
    goldenCasesWithAnnualDelta: cases.filter((c) => c.annual.changed).length,
    goldenCasesWithMajorDelta: cases.filter((c) => c.majorFortune.changed).length,
    goldenCasesWithPhiFlowDelta: cases.filter((c) => c.phiFlowChanged).length,
    goldenCasesWithDecorationDelta: cases.filter(
      (c) =>
        c.decoration.natalKhoaDecorationWouldMove ||
        c.decoration.annualKhoaDecorationWouldMove ||
        c.decoration.majorKhoaDecorationWouldMove,
    ).length,
    goldenCasesWithAnyMutagenDelta: cases.filter((c) => c.anyMutagenDelta).length,
    directNatalTriggerCases: cases.filter(
      (c) => c.yearStem === "Mậu" || c.yearStem === "Nhâm",
    ).length,
    directAnnualTriggerCases: cases.filter(
      (c) => c.annualStem === "Mậu" || c.annualStem === "Nhâm",
    ).length,
    majorFortuneStemMauOrNhamCases: cases.filter(
      (c) => c.majorFortuneStem === "Mậu" || c.majorFortuneStem === "Nhâm",
    ).length,
    casesWithPalaceStemMau: cases.filter((c) => c.hasPalaceStemMau).length,
    casesWithPalaceStemNham: cases.filter((c) => c.hasPalaceStemNham).length,
    casesWithBothPalaceStemsMauNham: cases.filter(
      (c) => c.hasPalaceStemMau && c.hasPalaceStemNham,
    ).length,
    annualStemMauOrNhamCoverage: cases.filter(
      (c) => c.annualStem === "Mậu" || c.annualStem === "Nhâm",
    ).length,
    monthlyRowsTotal: monthly.length,
    monthlyRowsWithMauOrNhamCalendarStem: monthly.filter(
      (m) => m.calendarStem === "Mậu" || m.calendarStem === "Nhâm",
    ).length,
    monthlyRowsWithKhoaDelta: monthly.filter((m) => m.changed).length,
    v02Note:
      "V0.2 goldenCasesPotentiallyAffected=9 counted yearStem/annualStem∈{Mậu,Nhâm} stem-hits (4+5 natal; 0 annual), not full ChartData/PhiFlow blast radius. V0.2 goldenCasesInspected=92 was incorrect (TC golden has 45 cases).",
  };
  return { summary, cases, monthly, diffs };
}
