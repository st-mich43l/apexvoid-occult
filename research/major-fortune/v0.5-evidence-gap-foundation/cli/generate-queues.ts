import fs from "fs";
import path from "path";
import type {
  EvidenceDimension,
  EvidenceGapMatrixRecord,
} from "../schema/foundation.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);

const DIMENSIONS = [
  "existence",
  "schoolScope",
  "majorFortuneTemporalScope",
  "palaceFrame",
  "targetFrame",
  "polarity",
  "strength",
  "pillarOwnership",
  "stacking",
  "deduplication",
  "exceptionPolicy",
  "calculationCoreReadiness",
  "sourceLocatorQuality",
  "crossSourceAgreement",
  "corpusMeasurability",
] as const;

function priorityFor(
  familyId: string,
  runtimeFamilyIds: Set<string>,
): "high" | "medium" {
  return runtimeFamilyIds.has(familyId) ? "high" : "medium";
}

export function generateQueues(opts?: {
  outputBase?: string;
}): void {
  const outputBase = opts?.outputBase ?? CANONICAL_BASE;
  const runtimeInventory = JSON.parse(
    fs.readFileSync(
      path.join(outputBase, "inventory/runtime-signal-inventory.json"),
      "utf8",
    ),
  );
  const matrix: EvidenceGapMatrixRecord[] = JSON.parse(
    fs.readFileSync(
      path.join(outputBase, "matrices/evidence-gap-matrix.json"),
      "utf8",
    ),
  );
  const runtimeFamilyIds = new Set<string>(
    runtimeInventory.map((family: any) => family.signalFamilyId),
  );

  const sourceAcquisition: any[] = [];
  const claimAdjudication: any[] = [];
  const calculationCoreGap: any[] = [];
  const seenSource = new Set<string>();
  const seenClaim = new Set<string>();
  const seenCore = new Set<string>();

  const diaLoiLedgerPath = path.join(
    ROOT,
    "research/major-fortune/v0.5-source-acquisition-r1-dia-loi/queue/evidence-gap-closure-ledger.json"
  );
  const closedGapIds = new Set<string>();
  if (fs.existsSync(diaLoiLedgerPath)) {
    const closures = JSON.parse(fs.readFileSync(diaLoiLedgerPath, "utf8"));
    closures.forEach((c: any) => closedGapIds.add(c.gapId));
  }

  const addResearchGap = (
    familyId: string,
    dimension: string,
    gapId: string,
    evidence: EvidenceDimension,
  ) => {
    if (closedGapIds.has(gapId)) {
      return;
    }

    const priority = priorityFor(familyId, runtimeFamilyIds);
    if (!seenSource.has(gapId)) {
      sourceAcquisition.push({
        queueId: `SRCQ-${gapId}`,
        gapId,
        signalFamilyId: familyId,
        dimension,
        priority,
        reason: evidence.derivation,
      });
      seenSource.add(gapId);
    }
    if (!seenClaim.has(gapId)) {
      claimAdjudication.push({
        queueId: `CLMQ-${gapId}`,
        gapId,
        signalFamilyId: familyId,
        dimension,
        priority,
        reason:
          "Adjudicate the acquired evidence against the maintained claim and school-policy model.",
      });
      seenClaim.add(gapId);
    }
  };

  for (const record of matrix) {
    for (const dimension of DIMENSIONS) {
      const evidence = record[dimension];
      for (const gapId of evidence.gapIds) {
        if (
          evidence.blockerKind === "calculation-core" ||
          dimension === "calculationCoreReadiness"
        ) {
          if (!seenCore.has(gapId)) {
            calculationCoreGap.push({
              queueId: `CCQ-${gapId}`,
              gapId,
              signalFamilyId: record.signalFamilyId,
              dimension,
              priority: "high",
              reason: evidence.derivation,
            });
            seenCore.add(gapId);
          }
          continue;
        }
        addResearchGap(
          record.signalFamilyId,
          dimension,
          gapId,
          evidence,
        );
      }
    }

    for (const contradictionId of record.openContradictionIds) {
      const gapId =
        `CTR-GAP-${record.signalFamilyId.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-` +
        contradictionId;
      addResearchGap(
        record.signalFamilyId,
        "openContradictions",
        gapId,
        {
          status: "contradicted",
          sourceIds: [],
          claimIds: [],
          gapIds: [gapId],
          derivation: `Resolve open contradiction ${contradictionId}.`,
          notes: "",
        },
      );
    }
  }

  fs.mkdirSync(path.join(outputBase, "queue"), { recursive: true });
  fs.writeFileSync(
    path.join(outputBase, "queue/source-acquisition-queue.json"),
    `${JSON.stringify(sourceAcquisition, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outputBase, "queue/claim-adjudication-queue.json"),
    `${JSON.stringify(claimAdjudication, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outputBase, "queue/calculation-core-gap-queue.json"),
    `${JSON.stringify(calculationCoreGap, null, 2)}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateQueues();
}
