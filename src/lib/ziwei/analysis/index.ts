/**
 * Zi Wei Analysis — Calculation Core is separate; modules interpret natal facts.
 */

export type {
  ZiweiAnalysisModule,
  ZiweiAnalysisStatus,
} from "./contracts/common";
export {
  getAnalysisStatus,
  ANALYSIS_MODULES,
} from "./contracts/common";
export type {
  AnnualAxisDomain,
} from "./contracts/annual-axes";
export * from "./facts";
export * from "./frame";
export * from "./knowledge";
export * from "./modules/palace-overview";
export * from "./modules/annual-axes";
export * from "./modules/major-fortune";

export {
  isPalaceOverviewV1Enabled,
  isHuyenKhiPreviewV01Enabled,
  HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG
} from "./feature-flags";
