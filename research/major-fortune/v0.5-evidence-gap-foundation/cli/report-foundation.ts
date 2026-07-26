import fs from "fs";
import path from "path";
import type { FoundationSummary } from "../schema/foundation.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);

function readJson(base: string, relativePath: string): any {
  return JSON.parse(
    fs.readFileSync(path.join(base, relativePath), "utf8"),
  );
}

export function reportFoundation(opts?: {
  outputBase?: string;
}): FoundationSummary {
  const outputBase = opts?.outputBase ?? CANONICAL_BASE;
  const runtimeInventory = readJson(
    outputBase,
    "inventory/runtime-signal-inventory.json",
  );
  const backlogInventory = readJson(
    outputBase,
    "inventory/research-backlog-registry.json",
  );
  const readiness = readJson(
    outputBase,
    "matrices/candidate-readiness-matrix.json",
  );
  const contradictions = readJson(
    outputBase,
    "contradictions/contradiction-log.json",
  );
  const sourceQueue = readJson(
    outputBase,
    "queue/source-acquisition-queue.json",
  );
  const claimQueue = readJson(
    outputBase,
    "queue/claim-adjudication-queue.json",
  );
  const coreQueue = readJson(
    outputBase,
    "queue/calculation-core-gap-queue.json",
  );
  const corpus = readJson(
    outputBase,
    "reports/corpus-gap-report.json",
  );

  const summary: FoundationSummary = {
    schemaVersion: "0.5.0",
    runtimeFamilyCount: runtimeInventory.length,
    backlogFamilyCount: backlogInventory.length,
    productionEnabledCount: runtimeInventory.filter(
      (family: any) =>
        family.runtimeStatus === "production-enabled",
    ).length,
    researchBlockedCount: readiness.filter(
      (record: any) => record.readiness === "research-blocked",
    ).length,
    calculationCoreBlockedCount: readiness.filter(
      (record: any) =>
        record.readiness === "blocked-by-calculation-core",
    ).length,
    eligibleFamilyCount: readiness.filter(
      (record: any) =>
        record.readiness === "eligible-for-shape-design",
    ).length,
    openContradictionCount: contradictions.contradictions.filter(
      (contradiction: any) => contradiction.status === "open",
    ).length,
    queueCounts: {
      sourceAcquisition: sourceQueue.length,
      claimAdjudication: claimQueue.length,
      calculationCore: coreQueue.length,
    },
    corpusReconciliationStatus: corpus.reconciliation.status,
  };

  fs.mkdirSync(path.join(outputBase, "reports"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(outputBase, "reports/foundation-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );

  console.log("=== Major Fortune V0.5 Foundation ===");
  console.log(`Runtime families: ${summary.runtimeFamilyCount}`);
  console.log(`Research backlog: ${summary.backlogFamilyCount}`);
  console.log(`Research blocked: ${summary.researchBlockedCount}`);
  console.log(
    `Calculation Core blocked: ${summary.calculationCoreBlockedCount}`,
  );
  console.log(`Eligible: ${summary.eligibleFamilyCount}`);
  console.log(
    `Corpus reconciliation: ${summary.corpusReconciliationStatus}`,
  );

  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  reportFoundation();
}
