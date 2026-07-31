import type { ZiweiSchool } from "../../analysis/facts";
export const NATAL_PALACE_NAMES = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
] as const;

export type NatalPalaceName = (typeof NATAL_PALACE_NAMES)[number];

export interface PublicHuyenKhiRecord {
  sampleId: string;
  metricNamespace: "huyen-khi";
  sourceType: string;
  sourceUrl: string;
  sourceLid: string | null;
  displayTitle: string;
  displayedTotal: number;
  palaceScores: Record<NatalPalaceName, number>;
  palacesExplicitlyListed: NatalPalaceName[];
  omittedPalacesAssumedZeroForValidation: NatalPalaceName[];
  calculatedTotal: number;
  totalDelta: number;
  totalValidation: "exact" | "mismatch";
  evidenceStatus: "source-confirmed" | "output-inferred" | "experimental" | "unresolved";
  notes?: string;
}

export interface PublicHuyenKhiDataset {
  schemaVersion: string;
  datasetId: string;
  metricNamespace: "huyen-khi";
  collectionMethod: string;
  records: PublicHuyenKhiRecord[];
}

/** §3 — parsed from `displayTitle` text already present in the pack; no
 * network access. The lunar year is stem-branch only (ambiguous mod 60) —
 * see `resolve-solar-date.ts`. */
export interface ParsedBirthTitle {
  yinYang: "dương" | "âm";
  gender: "male" | "female";
  yearStem: string;
  yearBranch: string;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: string;
}

export interface SolarDateCandidate {
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  lunarYear: number;
}

export interface ResolvedSolarDate {
  yearResolution: "unique" | "ambiguous" | "unresolved";
  candidates: SolarDateCandidate[];
}

export interface HuyenKhiChartFactSnapshot {
  calculationEngineVersion: string;
  school: ZiweiSchool;
  cuc: string;
  menhPalaceIndex: number;
  thanPalaceIndex: number;
  palaces: Array<{
    index: number;
    branch: string;
    natalPalaceName: string;
    stem: string | null;
    stemBranchNapAm: string | null;
    majorStars: Array<{ canonicalName: string; brightness: string | null }>;
    minorStars: Array<{ canonicalName: string; brightness: string | null }>;
    natalTransformations: string[];
    hasTuan: boolean;
    hasTriet: boolean;
    oppositeIndex: number;
    trineIndexes: [number, number];
    adjacentIndexes: [number, number];
  }>;
}
