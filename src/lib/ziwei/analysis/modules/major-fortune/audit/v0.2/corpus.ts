import type { BirthInput } from "@/types/chart";

const HOUR_BRANCHES = [
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

export interface MajorFortuneV02CorpusContract {
  corpusId: string;
  seed: number;
  chartCount: number;
  trainCount: number;
  holdoutCount: number;
  timezone: string;
  baseAnnualYear: number;
  flowBase: "luu-nien";
}

export const MF_V02_FULL_CORPUS: MajorFortuneV02CorpusContract = {
  corpusId: "major-fortune-v0.2-audit-corpus",
  seed: 20260723,
  chartCount: 100,
  trainCount: 80,
  holdoutCount: 20,
  timezone: "7",
  baseAnnualYear: 2026,
  flowBase: "luu-nien",
};

export const MF_V02_FAST_CORPUS: MajorFortuneV02CorpusContract = {
  ...MF_V02_FULL_CORPUS,
  corpusId: "major-fortune-v0.2-audit-fast",
  chartCount: 8,
  trainCount: 6,
  holdoutCount: 2,
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledRange(rand: () => number, count: number): number[] {
  const values = Array.from({ length: count }, (_, i) => i);
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [values[i], values[j]] = [values[j]!, values[i]!];
  }
  return values;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function buildMajorFortuneV02BirthInputs(
  contract: MajorFortuneV02CorpusContract,
): BirthInput[] {
  const rand = mulberry32(contract.seed);
  const out: BirthInput[] = [];
  const yearOffsets = shuffledRange(rand, 40);
  const monthOffsets = shuffledRange(rand, 12);
  const dayOffsets = shuffledRange(rand, 28);
  const hourOffsets = shuffledRange(rand, HOUR_BRANCHES.length);

  for (let i = 0; i < contract.chartCount; i++) {
    const gender = i % 2 === 0 ? "female" : "male";
    const year = 1960 + yearOffsets[(i * 7) % yearOffsets.length]!;
    const month = 1 + monthOffsets[(i * 5) % monthOffsets.length]!;
    const day = 1 + dayOffsets[(i * 11) % dayOffsets.length]!;
    const hour = HOUR_BRANCHES[hourOffsets[(i * 7) % hourOffsets.length]!]!;
    out.push({
      solarDate: `${year}-${pad2(month)}-${pad2(day)}`,
      birthHour: hour,
      gender,
      timezone: contract.timezone,
      annualYear: String(contract.baseAnnualYear),
      flowBase: contract.flowBase,
    });
  }
  return out;
}

export function splitTrainHoldout<T>(
  items: readonly T[],
  trainCount: number,
): { train: T[]; holdout: T[] } {
  return {
    train: items.slice(0, trainCount) as T[],
    holdout: items.slice(trainCount) as T[],
  };
}
