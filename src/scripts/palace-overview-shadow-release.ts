#!/usr/bin/env tsx
/**
 * Shadow-release command. MUST fail unless GO_SHADOW conditions hold.
 */
import { assessBenchmarkReadiness } from "../lib/ziwei/analysis/modules/palace-overview/calibration/readiness";
import { getPalaceOverviewVersions } from "../lib/ziwei/analysis/knowledge";

const readiness = assessBenchmarkReadiness();
const versions = getPalaceOverviewVersions();
const decision = {
  kind: "SHADOW_RELEASE",
  release: "NO_GO" as "NO_GO" | "GO_SHADOW",
  reason: readiness.reason,
  missing: readiness.missing,
  releaseStage: versions.releaseStage,
};

if (
  !readiness.ready ||
  versions.releaseStage === "experimental" ||
  versions.calibrationVersion == null
) {
  decision.release = "NO_GO";
  console.log(`DECISION_JSON ${JSON.stringify(decision)}`);
  console.error("GO_SHADOW conditions are not satisfied.");
  process.exit(1);
}

decision.release = "GO_SHADOW";
console.log(`DECISION_JSON ${JSON.stringify(decision)}`);
process.exit(0);
