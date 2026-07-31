export type AnnualAxisDomain =
  | "health"
  | "family"
  | "wealth"
  | "career"
  | "social"
  | "romance";
export const ANNUAL_AXIS_DOMAINS: readonly AnnualAxisDomain[] = [
  "health",
  "family",
  "wealth",
  "career",
  "social",
  "romance",
] as const;
