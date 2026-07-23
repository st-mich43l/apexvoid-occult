import type { BirthInput, ChartData } from "../../../../../../types/chart";
import { calculate as calculateNamPhai } from "../../../../engine-nam-phai";
import { calculate as calculateTrungChau } from "../../../../engine-trung-chau";
import { analyzeMajorFortuneOrdinalV03 } from "./analyze";
import type { MajorFortuneOrdinalEvidence } from "../v0.3-ordinal/types";

export const MF_V03_SMOKE_BIRTH: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

export interface MajorFortuneV03SmokeCase {
  id: string;
  description: string;
  school: "nam-phai" | "trung-chau";
  run: () => {
    adapterStatus: string;
    score: number | null;
    band: string | null;
    evidenceCount: number;
    notes: string[];
  };
}

export const MF_V03_SMOKE_CASES: MajorFortuneV03SmokeCase[] = [
  {
    id: "nam-phai-partial-xf",
    description: "Nam Phái with three evaluable pillars and partial Tứ Hóa",
    school: "nam-phai",
    run: () => {
      const a = analyzeMajorFortuneOrdinalV03(calculateNamPhai(MF_V03_SMOKE_BIRTH), {
        school: "nam-phai",
      });
      return {
        adapterStatus: a.adapterStatus,
        score: a.result?.score ?? null,
        band: a.result?.band ?? null,
        evidenceCount: a.emittedEvidence.length,
        notes: a.adapterDiagnostics.blockedNamPhaiTransformations.slice(0, 1),
      };
    },
  },
  {
    id: "trung-chau-xf-present",
    description: "Trung Châu with Major Fortune transformations present",
    school: "trung-chau",
    run: () => {
      const a = analyzeMajorFortuneOrdinalV03(calculateTrungChau(MF_V03_SMOKE_BIRTH), {
        school: "trung-chau",
      });
      return {
        adapterStatus: a.adapterStatus,
        score: a.result?.score ?? null,
        band: a.result?.band ?? null,
        evidenceCount: a.emittedEvidence.filter(
          (e: MajorFortuneOrdinalEvidence) =>
            e.signalFamilyId === "major-fortune-transformations",
        ).length,
        notes: [],
      };
    },
  },
  {
    id: "trung-chau-hoa-ky",
    description: "Trung Châu emits Hóa Kỵ when present in Core tuple",
    school: "trung-chau",
    run: () => {
      const a = analyzeMajorFortuneOrdinalV03(calculateTrungChau(MF_V03_SMOKE_BIRTH), {
        school: "trung-chau",
      });
      const ky = a.emittedEvidence.filter(
        (e: MajorFortuneOrdinalEvidence) => e.reasonCode === "transformation:Hóa Kỵ",
      );
      return {
        adapterStatus: a.adapterStatus,
        score: a.result?.score ?? null,
        band: a.result?.band ?? null,
        evidenceCount: ky.length,
        notes: ky.map((e: MajorFortuneOrdinalEvidence) => e.evidenceId),
      };
    },
  },
  {
    id: "missing-menh-element",
    description: "Missing Mệnh element → Thiên Thời unavailable",
    school: "nam-phai",
    run: () => {
      const chart = {
        ...calculateNamPhai(MF_V03_SMOKE_BIRTH),
        menhElement: undefined,
      } as unknown as ChartData;
      const a = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
      return {
        adapterStatus: a.adapterStatus,
        score: a.result?.score ?? null,
        band: a.result?.band ?? null,
        evidenceCount: a.emittedEvidence.filter(
          (e: MajorFortuneOrdinalEvidence) => e.pillarId === "thien-thoi",
        ).length,
        notes: a.adapterDiagnostics.missingMenhElement,
      };
    },
  },
  {
    id: "no-active-palace",
    description: "No active Major Fortune palace → unavailable",
    school: "nam-phai",
    run: () => {
      const chart = { ...calculateNamPhai(MF_V03_SMOKE_BIRTH), majorFortunePalace: null };
      const a = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
      return {
        adapterStatus: a.adapterStatus,
        score: a.result?.score ?? null,
        band: a.result?.band ?? null,
        evidenceCount: a.emittedEvidence.length,
        notes: a.adapterDiagnostics.missingActiveMajorFortunePalace,
      };
    },
  },
  {
    id: "annual-monthly-equivalence",
    description: "Annual/monthly mutation leaves score unchanged",
    school: "nam-phai",
    run: () => {
      const chart = calculateNamPhai(MF_V03_SMOKE_BIRTH);
      const host = chart.palaces[0]!;
      const a = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
      const b = analyzeMajorFortuneOrdinalV03(
        {
          ...chart,
          annualStars: [{ name: "Lưu Hóa Lộc", source: "annual", palace: host }],
          monthlyPalaces: [{ month: 1, palace: host }],
        },
        { school: "nam-phai", yearInCycle: 3 },
      );
      const equal = a.result?.score === b.result?.score;
      return {
        adapterStatus: a.adapterStatus,
        score: a.result?.score ?? null,
        band: a.result?.band ?? null,
        evidenceCount: a.emittedEvidence.length,
        notes: [equal ? "temporal-independent:ok" : "temporal-independent:FAIL"],
      };
    },
  },
];

export function runMajorFortuneV03SmokeFixtures() {
  return MF_V03_SMOKE_CASES.map((c) => ({
    id: c.id,
    description: c.description,
    school: c.school,
    ...c.run(),
  }));
}
