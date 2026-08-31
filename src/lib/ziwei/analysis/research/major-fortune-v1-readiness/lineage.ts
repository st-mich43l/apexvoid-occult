/**
 * Historical #194/#195 asset inventory vs current master (research-only).
 * Does not restore deleted packs as current authority.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { HistoricalAssetRow } from "./types";

function asset(
  assetId: string,
  historicalPath: string,
  state: HistoricalAssetRow["state"],
  notes: string,
): HistoricalAssetRow {
  return { assetId, historicalPath, state, notes };
}

export function buildHistoricalLineageInventory(): HistoricalAssetRow[] {
  const v1PackExists = existsSync(
    resolve(process.cwd(), "research/major-fortune/v1"),
  );
  const gateInPackage = (() => {
    try {
      const pkg = JSON.parse(
        readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
      ) as { scripts?: Record<string, string> };
      return Boolean(pkg.scripts?.["release:major-fortune-v1:gate"]);
    } catch {
      return false;
    }
  })();
  const independenceExists = existsSync(
    resolve(process.cwd(), "scripts/check-v1-independence.ts"),
  );
  const engineExists = existsSync(
    resolve(
      process.cwd(),
      "src/lib/ziwei/analysis/modules/major-fortune/engine-v1/analyze.ts",
    ),
  );

  return [
    asset(
      "source-registry",
      "research/major-fortune/v1/sources/source-registry.json",
      v1PackExists ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "Deleted in 0e6c88e; held SRC-TVDS-01 / SRC-TT-01 / SRC-ENG-01. Not current authority.",
    ),
    asset(
      "claim-registry",
      "research/major-fortune/v1/claims/claim-registry.json",
      v1PackExists ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "Deleted in 0e6c88e; held CLM-DIALOI-01 / CLM-NHANHOA-01 / CLM-TUHOA-01.",
    ),
    asset(
      "school-policy-matrix",
      "research/major-fortune/v1/policies/school-policy-matrix.json",
      v1PackExists ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "Deleted with V1 research pack.",
    ),
    asset(
      "signal-family-registry",
      "research/major-fortune/v1/policies/signal-family-registry.json",
      v1PackExists ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "Deleted with V1 research pack.",
    ),
    asset(
      "golden-dataset",
      "research/major-fortune/v1/datasets/golden.json",
      v1PackExists ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "Deleted; not the Calculation Core tuvi golden corpus.",
    ),
    asset(
      "holdout-dataset",
      "research/major-fortune/v1/datasets/holdout.json",
      v1PackExists ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "Deleted; no current holdout authority for V1.",
    ),
    asset(
      "adversarial-dataset",
      "research/major-fortune/v1/datasets/adversarial.json",
      v1PackExists ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "Deleted.",
    ),
    asset(
      "calibration-dataset",
      "research/major-fortune/v1/datasets/calibration.json",
      v1PackExists ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "Deleted.",
    ),
    asset(
      "baseline-snapshot",
      "research/major-fortune/v1/baseline/v03-baseline-snapshot.json",
      v1PackExists ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "Deleted (~4800 V0.3 snapshots historically).",
    ),
    asset(
      "release-decision",
      "research/major-fortune/v1/release/major-fortune-v1-release-decision.md",
      v1PackExists ? "STILL_CURRENT" : "INVALIDATED",
      "Historical GO_SHADOW (#195) invalidated as current authority after pack deletion and #266 production isolation.",
    ),
    asset(
      "release-gate",
      "package.json#release:major-fortune-v1:gate",
      gateInPackage ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "CURRENT_MAJOR_FORTUNE_V1_RELEASE_GATE = ABSENT",
    ),
    asset(
      "independence-checker",
      "scripts/check-v1-independence.ts",
      independenceExists ? "STILL_CURRENT" : "DELETED_PROVENANCE_ONLY",
      "Deleted in 0e6c88e.",
    ),
    asset(
      "engine-v1",
      "src/lib/ziwei/analysis/modules/major-fortune/engine-v1/**",
      engineExists ? "STILL_CURRENT" : "UNKNOWN",
      "Executable candidate remains; version literal 1.0.0-rc.1 does not prove lifecycle.",
    ),
  ];
}

export function assessCurrentLifecycle(
  assets: readonly HistoricalAssetRow[],
): string {
  const engine = assets.find((a) => a.assetId === "engine-v1");
  const decision = assets.find((a) => a.assetId === "release-decision");
  const gate = assets.find((a) => a.assetId === "release-gate");
  const parts = [
    "Executable RESEARCH_CANDIDATE code remains (engine-v1).",
    engine?.state === "STILL_CURRENT"
      ? "Candidate binaries present."
      : "Candidate binaries missing.",
    decision?.state === "INVALIDATED"
      ? "Historical DECISION_RECORDED (GO_SHADOW) is INVALIDATED as current authority."
      : `Release decision state=${decision?.state ?? "UNKNOWN"}.`,
    gate?.state === "DELETED_PROVENANCE_ONLY"
      ? "No current release gate → not RELEASE_CANDIDATE under current contracts."
      : `Gate state=${gate?.state ?? "UNKNOWN"}.`,
    "No current CORPUS_AUDITED / DECISION_RECORDED artifacts under an active research pack until this generation.",
    "Lifecycle slot after this audit is decided by readiness.decision, not by the rc.1 string.",
  ];
  return parts.join(" ");
}
