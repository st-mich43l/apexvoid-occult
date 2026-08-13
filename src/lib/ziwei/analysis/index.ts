/**
 * Zi Wei Analysis — Calculation Core is separate; modules interpret natal facts.
 */

export type {
  ZiweiAnalysisModule,
  ZiweiAnalysisStatus,
} from "./contracts/common";
export { getAnalysisStatus } from "./contracts/common";
export type {
  AnnualAxisDomain,
} from "./contracts/annual-axes";
export * from "./facts";
export * from "./frame";
export * from "./knowledge";
export * from "./modules/palace-overview";
export * from "./modules/annual-axes";
export * from "./modules/major-fortune";

export { isPalaceOverviewV1Enabled } from "./feature-flags";
