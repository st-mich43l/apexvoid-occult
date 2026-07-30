import fs from "fs";
import path from "path";
import {
  EvidenceDimension,
  EvidenceGapMatrixRecord,
} from "../schema/foundation.js";

const ROOT = process.cwd();
const DEFAULT_CANONICAL_BASE = path.join(
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
  foundationInputBase?: string;
  foundationOutputBase?: string;
  packRegistryPath?: string;
  registryBase?: string;
}): void {
  const inputBase = opts?.foundationInputBase ?? DEFAULT_CANONICAL_BASE;
  const outputBase = opts?.foundationOutputBase ?? inputBase;
  const registryPath = opts?.packRegistryPath ?? path.join(inputBase, "acquisition-pack-registry.json");
  const registryBase = opts?.registryBase ?? DEFAULT_CANONICAL_BASE;

  const runtimeInventory = JSON.parse(
    fs.readFileSync(
      path.join(inputBase, "inventory/runtime-signal-inventory.json"),
      "utf8",
    ),
  );
  const matrix: EvidenceGapMatrixRecord[] = JSON.parse(
    fs.readFileSync(
      path.join(inputBase, "matrices/evidence-gap-matrix.json"),
      "utf8",
    ),
  );
  const runtimeFamilyIds = new Set<string>(
    runtimeInventory.map((family: any) => family.signalFamilyId),
  );

  const packRegistry: Array<any> = JSON.parse(fs.readFileSync(registryPath, "utf8"));

  const gapReconciliations = new Map<string, any>();

  for (const pack of packRegistry) {
    if (pack.enabled) {
      if (pack.sourceGapReconciliationPath) {
        const p = path.resolve(registryBase, pack.sourceGapReconciliationPath);
        if (fs.existsSync(p)) {
          const packRecon = JSON.parse(fs.readFileSync(p, "utf8"));
          for (const gap of packRecon.gaps) {
            // merge if multiple packs? Typically one gap maps to one main pack, but we append packIds.
            if (!gapReconciliations.has(gap.gapId)) {
              gapReconciliations.set(gap.gapId, { ...gap, sourcePackIds: [packRecon.packId] });
            } else {
              const existing = gapReconciliations.get(gap.gapId);
              existing.sourcePackIds.push(packRecon.packId);
              // Simplified merging for the sake of the task
              if (gap.finalState === "conflicted") existing.finalState = "conflicted";
              else if (existing.finalState !== "conflicted" && gap.finalState === "partial") existing.finalState = "partial";
              // Update lane states
              for (const lane of gap.schoolLanes) {
                const exLane = existing.schoolLanes.find((l: any) => l.schoolScope === lane.schoolScope);
                if (exLane) {
                   if (lane.state === "conflicted") exLane.state = "conflicted";
                   else if (exLane.state !== "conflicted" && lane.state === "partial") exLane.state = "partial";
                   exLane.requiredObligationIds = Array.from(new Set([...exLane.requiredObligationIds, ...lane.requiredObligationIds]));
                }
              }
            }
          }
        }
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
    const recon = gapReconciliations.get(gapId) || {
      finalState: "open",
      stageStatus: { claimAdjudication: "open" },
      schoolLanes: [],
      sourcePackIds: [],
      unresolvedReasons: ["No source pack targets this gap."]
    };

    if (recon.finalState !== "closed") {
      const priority = priorityFor(familyId, runtimeFamilyIds);
      if (!seenSource.has(gapId)) {
        sourceAcquisition.push({
          gapId,
          familyId,
          sourceAcquisitionState: recon.finalState,
          schoolLanes: recon.schoolLanes.map((l: any) => ({
            schoolScope: l.schoolScope,
            state: l.state,
            requiredObligationIds: l.requiredObligationIds || []
          })),
          sourcePackIds: recon.sourcePackIds,
          unresolvedReasons: recon.unresolvedReasons || []
        });
        seenSource.add(gapId);
      }
    }

    if (recon.stageStatus.claimAdjudication !== "closed") { // It will always be open or handoff-ready
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
