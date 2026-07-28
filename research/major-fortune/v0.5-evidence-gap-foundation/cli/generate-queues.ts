import fs from "fs";
import path from "path";
import {
  EvidenceDimension,
  EvidenceGapMatrixRecord,
} from "../schema/foundation.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);
const REGISTRY_PATH = path.join(CANONICAL_BASE, "acquisition-pack-registry.json");

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

interface GapStageReconciliation {
  sourceAcquisition: "open" | "partial" | "closed";
  claimAdjudication: "open" | "handoff-ready" | "closed";
  calculationCore: "open";
  matchedEvidenceRecordIds: string[];
  unresolvedReasons: string[];
}

function reconcileAcquisitionEvidenceInput(gapId: string, evidenceRecords: any[]): GapStageReconciliation {
  const gapRecords = evidenceRecords.filter(r => r.gapId === gapId);
  const result: GapStageReconciliation = {
    sourceAcquisition: "open",
    claimAdjudication: "open",
    calculationCore: "open",
    matchedEvidenceRecordIds: gapRecords.map(r => r.recordId),
    unresolvedReasons: []
  };

  if (gapRecords.length === 0) {
    result.unresolvedReasons.push("No evidence records found for this gap.");
    return result;
  }

  const namPhaiRecords = gapRecords.filter(r => r.schoolScope === "nam-phai");
  const trungChauRecords = gapRecords.filter(r => r.schoolScope === "trung-chau");

  const checkSchoolLane = (records: any[]) => {
    if (records.length === 0) return { source: "open", claim: "open" };
    if (records.some(r => r.status === "ready-for-adjudication")) return { source: "closed", claim: "handoff-ready" };
    if (records.some(r => r.status === "source-verified")) return { source: "closed", claim: "open" };
    if (records.some(r => r.status === "partially-covered")) return { source: "open", claim: "open" };
    return { source: "open", claim: "open" }; // metadata-only, still-open
  };

  const namPhaiRes = checkSchoolLane(namPhaiRecords);
  const trungChauRes = checkSchoolLane(trungChauRecords);

  if (namPhaiRes.source === "closed" && trungChauRes.source === "closed") {
    result.sourceAcquisition = "closed";
  } else if (namPhaiRes.source === "closed" || trungChauRes.source === "closed" || namPhaiRecords.some(r => r.status === "partially-covered") || trungChauRecords.some(r => r.status === "partially-covered")) {
    result.sourceAcquisition = "partial";
  }

  if (namPhaiRes.claim === "handoff-ready" && trungChauRes.claim === "handoff-ready") {
    result.claimAdjudication = "handoff-ready";
  }

  return result;
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

  const packRegistry: Array<any> = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  
  let evidenceRecords: any[] = [];
  const recordIds = new Set<string>();

  for (const pack of packRegistry) {
    if (pack.enabled) {
      const ledgerPath = path.resolve(CANONICAL_BASE, pack.evidenceLedgerPath);
      if (!fs.existsSync(ledgerPath)) {
        throw new Error(`Missing evidence ledger for pack ${pack.packId} at ${ledgerPath}`);
      }
      const records = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
      for (const record of records) {
        if (recordIds.has(record.recordId)) {
          throw new Error(`Duplicate recordId found across packs: ${record.recordId}`);
        }
        recordIds.add(record.recordId);
        evidenceRecords.push(record);
      }
    }
  }

  const sourceAcquisition: any[] = [];
  const claimAdjudication: any[] = [];
  const calculationCoreGap: any[] = [];
  const seenSource = new Set<string>();
  const seenClaim = new Set<string>();
  const seenCore = new Set<string>();

  const addResearchGap = (
    familyId: string,
    dimension: string,
    gapId: string,
    evidence: EvidenceDimension,
  ) => {
    const reconciliation = reconcileAcquisitionEvidenceInput(gapId, evidenceRecords);

    if (reconciliation.sourceAcquisition !== "closed") {
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
    }

    if (reconciliation.claimAdjudication !== "closed") { // It will always be open or handoff-ready
      const priority = priorityFor(familyId, runtimeFamilyIds);
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
