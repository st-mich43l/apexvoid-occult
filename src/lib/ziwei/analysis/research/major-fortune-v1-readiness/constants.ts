/**
 * Shared constants mirroring V1 RC1 catalog / principal lists (read-only audit).
 * These are copied for research accounting — do not treat as authority to retune.
 */
import { RC1_STAR_CATALOG } from "../../modules/major-fortune/engine-v1/scoring/star-catalog";

/** Hard-coded principal list as used by engine-v1/frame/build-frame.ts */
const V1_PRINCIPAL_STAR_NAMES = [
  "Tử Vi",
  "Thiên Cơ",
  "Thái Dương",
  "Vũ Khúc",
  "Thiên Đồng",
  "Liêm Trinh",
  "Thiên Phủ",
  "Thái Âm",
  "Tham Lang",
  "Cự Môn",
  "Thiên Tướng",
  "Thiên Lương",
  "Thất Sát",
  "Phá Quân",
] as const;

export const V1_CATALOG_STAR_NAMES = Object.keys(RC1_STAR_CATALOG).sort();

export const V1_CATALOG_SET = new Set(V1_CATALOG_STAR_NAMES);
export const V1_PRINCIPAL_SET = new Set<string>(V1_PRINCIPAL_STAR_NAMES);

export const RESEARCH_SCHEMA_VERSION = "pr267-major-fortune-v1-readiness.v1";
export const RESEARCH_GENERATION_ID = "major-fortune/v1-release-readiness-v0.1";
export const CANDIDATE_IDENTITY = "major-fortune-engine-v1@1.0.0-rc.1";
export const BASELINE_IDENTITY = "major-fortune-v0.5-production";

/** Current-repo MF provenance IDs admissible for resolution checks. */
export function loadCurrentProvenanceIds(): {
  sourceIds: Set<string>;
  claimIds: Set<string>;
} {
  // Inline known current registry IDs (verified against knowledge packs on master).
  // Historical deleted V1 pack IDs are intentionally absent.
  const sourceIds = new Set([
    "SRC-MFS-ENG-001",
    "SRC-MFS-EXT-001",
    "SRC-MFS-EXT-002",
    "SRC-MFS-EXT-003",
    "SRC-MFS-EXT-004",
    "SRC-MF-V03-ADAPTER-ELEMENT",
    "SRC-MF-V03-ADAPTER-DIGNITY",
    "SRC-MF-V03-ADAPTER-AUX",
    "SRC-MF-V03-ADAPTER-XF",
    "SRC-MF-V03-ADAPTER-FRAME",
  ]);
  const claimIds = new Set([
    "CLM-MFS-ENG-001",
    "CLM-MFS-ENG-002",
    "CLM-MF-V03-ADAPTER-ELEMENT",
    "CLM-MF-V03-ADAPTER-DIGNITY",
    "CLM-MF-V03-ADAPTER-AUX",
    "CLM-MF-V03-ADAPTER-XF",
    "CLM-MF-V03-ADAPTER-FRAME",
  ]);
  return { sourceIds, claimIds };
}
