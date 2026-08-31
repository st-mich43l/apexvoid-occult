import { deepFreeze } from "../annual-axes/deep-freeze";
import type {
  ResearchValidationIssue,
  TrungChauResearchPackV0,
} from "./schema";
import { validateTrungChauResearchPackV0 } from "./validate";

import sourceRegistry from "./source-registry.v0.json";
import runtimeObservations from "./runtime-observations.v0.json";
import doctrineMatrix from "./doctrine-matrix.v0.json";
import terminology from "./terminology.v0.json";
import contradictions from "./contradictions.v0.json";
import expertReview from "./expert-review.v0.json";
import tuHoaAudit from "./trung-chau-tu-hoa-audit.v0.1.json";
import placementAudit from "./trung-chau-placement-audit.v0.2.json";
import temporalAudit from "./trung-chau-temporal-audit.v0.2.json";
import erq005DecisionPacket from "./erq-005-decision-packet.v0.3.json";
import erq005CandidateImpact from "./erq-005-candidate-impact.v0.3.json";
import tuHoaImpactAudit from "./trung-chau-tu-hoa-impact-audit.v0.3.json";

export type LoadTrungChauResearchPackResult =
  | { ok: true; pack: TrungChauResearchPackV0 }
  | { ok: false; issues: ResearchValidationIssue[] };

let cached: LoadTrungChauResearchPackResult | null = null;

function buildPack(): TrungChauResearchPackV0 {
  const registry = sourceRegistry as TrungChauResearchPackV0["sourceRegistry"];
  return {
    meta: registry.meta,
    sourceRegistry: registry,
    runtimeObservations:
      runtimeObservations as TrungChauResearchPackV0["runtimeObservations"],
    doctrineMatrix: doctrineMatrix as TrungChauResearchPackV0["doctrineMatrix"],
    terminology: terminology as TrungChauResearchPackV0["terminology"],
    contradictions: contradictions as TrungChauResearchPackV0["contradictions"],
    expertReview: expertReview as TrungChauResearchPackV0["expertReview"],
    tuHoaAudit: tuHoaAudit as TrungChauResearchPackV0["tuHoaAudit"],
    placementAudit: placementAudit as TrungChauResearchPackV0["placementAudit"],
    temporalAudit: temporalAudit as TrungChauResearchPackV0["temporalAudit"],
    erq005DecisionPacket:
      erq005DecisionPacket as TrungChauResearchPackV0["erq005DecisionPacket"],
    erq005CandidateImpact:
      erq005CandidateImpact as TrungChauResearchPackV0["erq005CandidateImpact"],
    tuHoaImpactAudit:
      tuHoaImpactAudit as TrungChauResearchPackV0["tuHoaImpactAudit"],
  };
}

/** Load Research Pack V0 from committed local JSON only (no network). */
export function loadTrungChauResearchPackV0(): LoadTrungChauResearchPackResult {
  if (cached) return cached;

  const pack = buildPack();
  const result = validateTrungChauResearchPackV0(pack);
  cached = result.ok
    ? { ok: true, pack: deepFreeze(pack) }
    : { ok: false, issues: result.issues };
  return cached;
}

/** Test helper — clear memoized pack. */
export function resetTrungChauResearchPackCache(): void {
  cached = null;
}
