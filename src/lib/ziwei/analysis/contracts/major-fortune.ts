/**
 * Module: major-fortune (Đại vận)
 *
 * V0.1 — deterministic scoring of an already-resolved Major Fortune decade.
 * Calculation Core (engines + research/major-fortune policies) owns
 * starting age/direction/boundary/traversal/active palace/palace stem —
 * this module only reads those already-resolved ChartData facts.
 *
 * Scope:
 * - một Đại vận phải độc lập annualYear;
 * - không đọc sao lưu niên;
 * - không đọc sao lưu nguyệt;
 * - Tứ Hóa Đại vận phụ thuộc school profile;
 * - không dùng scorer Lưu Nguyệt.
 */

import type { ZiweiAnalysisModule } from "./common";
import type { MajorFortuneScoringResult } from "../modules/major-fortune";

export const MAJOR_FORTUNE_MODULE: ZiweiAnalysisModule = "major-fortune";

/** ASCII-only stable public IDs. Vietnamese lives in labelVi / majorPalaceName. */
export type MajorFortuneDomain =
  | "menh"
  | "huynh-de"
  | "phu-the"
  | "tu-tuc"
  | "tai-bach"
  | "tat-ach"
  | "thien-di"
  | "no-boc"
  | "quan-loc"
  | "dien-trach"
  | "phuc-duc"
  | "phu-mau";

export const MAJOR_FORTUNE_DOMAINS: readonly MajorFortuneDomain[] = [
  "menh",
  "huynh-de",
  "phu-the",
  "tu-tuc",
  "tai-bach",
  "tat-ach",
  "thien-di",
  "no-boc",
  "quan-loc",
  "dien-trach",
  "phuc-duc",
  "phu-mau",
] as const;

export type MajorFortuneContract = {
  module: "major-fortune";
  independentOfAnnualYear: true;
  domains: readonly MajorFortuneDomain[];
  outputSchema: MajorFortuneScoringResult;
};
