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
