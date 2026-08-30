/**
 * Research-only Trung Châu Research Pack V0.
 * Must NOT be imported by production Analysis routers, engines, UI, or narrative KB.
 */
export {
  loadTrungChauResearchPackV0,
  resetTrungChauResearchPackCache,
} from "./loader";
export {
  validateTrungChauResearchPackV0,
  assertDoctrineClaimNotEngineeringOnly,
} from "./validate";
export type { ResearchClaim, ResearchSource } from "./schema";
