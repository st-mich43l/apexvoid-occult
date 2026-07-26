import fs from "fs";
import path from "path";
import type {
  CandidateReadinessMatrixRecord,
  EvidenceGapMatrixRecord,
  EvidenceStatus,
} from "../schema/foundation.js";
import { generateDecision } from "./decision-foundation.js";
import { calculateCandidateReadiness } from "./readiness.js";
import { reportFoundation } from "./report-foundation.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);

const EVIDENCE_DIMENSIONS = [
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

const EVIDENCE_STATUSES = new Set<EvidenceStatus>([
  "verified",
  "partial",
  "engineering-only",
  "missing",
  "contradicted",
  "not-applicable",
]);

const REQUIRED_BACKLOG_FAMILIES = new Set([
  "vcd-opposite-palace-borrowing",
  "partial-auxiliary-pair-semantics",
  "hinh-ho-set",
  "severe-pressure-evidence",
  "tuan-triet",
  "tam-khong",
  "natal-to-van-star-pattern-compatibility",
  "natal-palace-groups",
  "out-of-frame-transformation-influence",
  "natal-transit-transformation-stacking",
]);

function readJson(base: string, relativePath: string): any {
  return JSON.parse(
    fs.readFileSync(path.join(base, relativePath), "utf8"),
  );
}

function arraysEqual(left: unknown[], right: unknown[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validateFoundation(opts?: any): void {
  const outputBase =
    opts?.outputBase ??
    (opts?.inventory ? null : CANONICAL_BASE);

  const runtimeInventory = opts?.runtimeInventory
    ? opts.runtimeInventory
    : opts?.inventory
      ? opts.inventory.filter(
          (family: any) =>
            typeof family.runtimeStatus === "string",
        )
      : readJson(
          outputBase,
          "inventory/runtime-signal-inventory.json",
        );
  const backlogInventory = opts?.backlogInventory
    ? opts.backlogInventory
    : opts?.inventory
      ? opts.inventory.filter(
          (family: any) =>
            typeof family.runtimeStatus !== "string",
        )
      : readJson(
          outputBase,
          "inventory/research-backlog-registry.json",
        );
  const reconciliation =
    opts?.reconciliation ??
    readJson(
      outputBase,
      "inventory/provenance-reconciliation.json",
    );
  const matrices: EvidenceGapMatrixRecord[] =
    opts?.matrices ??
    readJson(outputBase, "matrices/evidence-gap-matrix.json");
  const schoolPolicy =
    opts?.schoolPolicy ??
    readJson(outputBase, "matrices/school-policy-matrix.json");
  const readiness: CandidateReadinessMatrixRecord[] =
    opts?.readiness ??
    readJson(
      outputBase,
      "matrices/candidate-readiness-matrix.json",
    );
  const corpus =
    opts?.corpus ??
    readJson(outputBase, "reports/corpus-gap-report.json");
  const contradictions =
    opts?.contradictions ??
    readJson(outputBase, "contradictions/contradiction-log.json");
  const decision =
    opts?.decision ??
    (outputBase
      ? readJson(outputBase, "decision.json")
      : undefined);
  const sourceQueue =
    opts?.sourceQueue ??
    (outputBase
      ? readJson(
          outputBase,
          "queue/source-acquisition-queue.json",
        )
      : []);
  const claimQueue =
    opts?.claimQueue ??
    (outputBase
      ? readJson(
          outputBase,
          "queue/claim-adjudication-queue.json",
        )
      : []);
  const coreQueue =
    opts?.coreQueue ??
    (outputBase
      ? readJson(
          outputBase,
          "queue/calculation-core-gap-queue.json",
        )
      : []);

  const familyIds = [
    ...runtimeInventory,
    ...backlogInventory,
  ].map((family: any) => family.signalFamilyId);
  if (new Set(familyIds).size !== familyIds.length) {
    throw new Error("Duplicate signal family ID.");
  }

  const runtimeFamilyIds = new Set(
    runtimeInventory.map((family: any) => family.signalFamilyId),
  );
  if (
    !arraysEqual(
      [...runtimeFamilyIds].sort(),
      [
        "element-relation",
        "major-fortune-transformations",
        "principal-star-dignity",
        "support-pressure-auxiliary-sets",
      ].sort(),
    )
  ) {
    throw new Error("Runtime inventory family set is not canonical.");
  }

  const backlogIds = new Set(
    backlogInventory.map((family: any) => family.signalFamilyId),
  );
  for (const requiredId of REQUIRED_BACKLOG_FAMILIES) {
    if (!backlogIds.has(requiredId)) {
      throw new Error(`Backlog family omitted: ${requiredId}`);
    }
  }

  for (const family of runtimeInventory) {
    if (
      family.runtimeStatus === "production-enabled" &&
      (family.sourceIds.length === 0 ||
        family.claimIds.length === 0)
    ) {
      throw new Error(
        `Missing production family provenance for ${family.signalFamilyId}.`,
      );
    }
    if (family.sourceIds.some((id: string) => !id.startsWith("SRC-"))) {
      throw new Error("Claim ID used as a source ID.");
    }
    if (family.claimIds.some((id: string) => !id.startsWith("CLM-"))) {
      throw new Error("Source ID used as a claim ID.");
    }
    if ("score" in family) {
      throw new Error("Numeric candidate field introduced.");
    }
  }

  const sameElement = runtimeInventory
    .find(
      (family: any) =>
        family.signalFamilyId === "element-relation",
    )
    ?.engineeringMappings.find(
      (mapping: any) => mapping.scenario === "same_element",
    );
  if (
    !sameElement ||
    sameElement.direction !== "support" ||
    sameElement.strength !== "normal"
  ) {
    throw new Error("same_element policy is not support/normal.");
  }

  const vcd = backlogInventory.find(
    (family: any) =>
      family.signalFamilyId ===
      "vcd-opposite-palace-borrowing",
  );
  if (
    vcd?.proposedFrame !== "proposed-opposite-palace" ||
    vcd?.targetFrame !== "proposed-opposite-palace"
  ) {
    throw new Error("VCD opposite-palace frame is incorrect.");
  }

  const partialPairs = backlogInventory.find(
    (family: any) =>
      family.signalFamilyId ===
      "partial-auxiliary-pair-semantics",
  );
  if (!partialPairs?.emittedAsDiagnosticOnly) {
    throw new Error(
      "Partial auxiliary pairs are not marked diagnostic-only.",
    );
  }

  const inventorySourceIds = new Set(
    runtimeInventory.flatMap((family: any) => family.sourceIds),
  );
  const inventoryClaimIds = new Set(
    runtimeInventory.flatMap((family: any) => family.claimIds),
  );
  for (const record of reconciliation) {
    if (
      record.origin === "runtime" &&
      (!record.runtimeExists ||
        !record.definingPath ||
        !record.definingSymbol)
    ) {
      throw new Error(
        `Invented runtime identifier: ${record.identifier}`,
      );
    }
    if (
      record.identifierKind === "source" &&
      !inventorySourceIds.has(record.identifier)
    ) {
      throw new Error(
        `Runtime source ID does not exist in inventory: ${record.identifier}`,
      );
    }
    if (
      record.identifierKind === "claim" &&
      !inventoryClaimIds.has(record.identifier)
    ) {
      throw new Error(
        `Runtime claim ID does not exist in inventory: ${record.identifier}`,
      );
    }
    if (
      record.origin === "runtime" &&
      record.authorityClass === "school-manual-supported"
    ) {
      throw new Error(
        "Internal runtime source labelled as classical doctrine.",
      );
    }
  }

  const allGapIds = new Set<string>();
  for (const matrix of matrices) {
    for (const dimensionName of EVIDENCE_DIMENSIONS) {
      const dimension = matrix[dimensionName];
      if (!dimension || !EVIDENCE_STATUSES.has(dimension.status)) {
        throw new Error(
          `Invalid or missing evidence dimension ${dimensionName} for ${matrix.signalFamilyId}.`,
        );
      }
      for (const gapId of dimension.gapIds) {
        if (allGapIds.has(gapId)) {
          throw new Error(`Duplicate gap ID: ${gapId}`);
        }
        allGapIds.add(gapId);
      }
    }
    if (!Array.isArray(matrix.openContradictionIds)) {
      throw new Error("Matrix contradiction IDs are missing.");
    }
    if (
      matrix.stacking.status === "not-applicable" &&
      /research|unresolved/i.test(matrix.stacking.notes)
    ) {
      throw new Error(
        "Unresolved stacking rule marked not-applicable.",
      );
    }
    if (
      matrix.sourceLocatorQuality.status === "verified" &&
      matrix.sourceLocatorQuality.doctrineLocatorStatus !==
        "verified-doctrine"
    ) {
      throw new Error(
        "Runtime locator falsely marked as doctrine-verified.",
      );
    }

    const calculated = calculateCandidateReadiness(matrix);
    if (matrix.candidateEligibility !== calculated.readiness) {
      throw new Error(
        `Stale candidate eligibility for ${matrix.signalFamilyId}.`,
      );
    }
    if (
      calculated.readiness === "eligible-for-shape-design" &&
      matrix.sourceLocatorQuality.doctrineLocatorStatus !==
        "verified-doctrine"
    ) {
      throw new Error(
        "Candidate eligible without doctrine locator.",
      );
    }
  }

  const readinessByFamily = new Map(
    readiness.map((record) => [record.signalFamilyId, record]),
  );
  for (const matrix of matrices) {
    const expected = calculateCandidateReadiness(matrix);
    const committed = readinessByFamily.get(matrix.signalFamilyId);
    if (
      !committed ||
      committed.readiness !== expected.readiness ||
      !arraysEqual(
        committed.blockingDimensions,
        expected.blockingDimensions,
      )
    ) {
      throw new Error(
        `Candidate readiness matrix is stale for ${matrix.signalFamilyId}.`,
      );
    }
  }

  for (const policy of schoolPolicy) {
    if (
      policy.sharedImplementation &&
      (!policy.runtimeAdmittedByNamPhai ||
        !policy.runtimeAdmittedByTrungChau)
    ) {
      throw new Error(
        "School matrix assumes shared implementation.",
      );
    }
    if (
      !policy.crossSchoolFallbackForbidden &&
      !policy.sharedDoctrine
    ) {
      throw new Error(
        "Cross-school doctrine fallback detected.",
      );
    }
  }

  if (
    corpus.diaLoi.onePrincipalCases === 0 &&
    corpus.diaLoi.twoPrincipalCases === 0
  ) {
    throw new Error("All observations reported Vô Chính Diệu.");
  }
  if (
    Object.keys(corpus.thienThoi.elementRelationDistribution).length ===
    0
  ) {
    throw new Error("All relation distributions are empty.");
  }
  if (
    corpus.tuHoa.completeTuples +
      corpus.tuHoa.incompleteTuples !==
    corpus.tuHoa.resolvedTuples
  ) {
    throw new Error("Transformation tuple totals do not reconcile.");
  }
  if (
    corpus.tuHoa.acceptedTransformationEvidence > 0 &&
    (corpus.tuHoa.directActivePalaceTuples === 0 ||
      corpus.tuHoa.completeTuples === 0 ||
      corpus.tuHoa.resolvedTuples === 0)
  ) {
    throw new Error(
      "Accepted transformation evidence has zero tuple metrics.",
    );
  }
  if (
    corpus.tuHoa.directActivePalaceTuples !==
    corpus.tuHoa.acceptedTransformationEvidence
  ) {
    throw new Error(
      "Direct tuple and accepted evidence counts differ.",
    );
  }
  if (
    typeof corpus.tuHoa.featureEnabledProductionState !== "boolean"
  ) {
    throw new Error("Transformation feature state is not boolean.");
  }

  if (
    !contradictions.contradictions.some(
      (contradiction: any) =>
        contradiction.contradictionId === "CTR-MFV02-LOC-001",
    )
  ) {
    throw new Error("Historical contradiction removed.");
  }

  if (decision) {
    const expectedCounts = {
      "source-acquisition": sourceQueue.length,
      "claim-adjudication": claimQueue.length,
      "calculation-core-gap": coreQueue.length,
    };
    if (
      JSON.stringify(decision.openQueueCounts) !==
      JSON.stringify(expectedCounts)
    ) {
      throw new Error("Decision queue counts are stale.");
    }

    const mismatch =
      corpus.reconciliation.status === "mismatched" ||
      runtimeInventory.some(
        (family: any) =>
          family.runtimeStatus === "production-enabled" &&
          (family.sourceIds.length === 0 ||
            family.claimIds.length === 0),
      );
    if (
      mismatch &&
      decision.decision !==
        "CURRENT_PRODUCTION_PROVENANCE_MISMATCH"
    ) {
      throw new Error(
        "Production mismatch is not reflected in decision.",
      );
    }
  }

  if (outputBase === CANONICAL_BASE) {
    for (const scratch of [
      path.join(ROOT, "tmp/mf-v05-run-a"),
      path.join(ROOT, "tmp/mf-v05-run-b"),
    ]) {
      if (fs.existsSync(scratch)) {
        throw new Error(
          "Repository-local deterministic scratch output exists.",
        );
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  reportFoundation();
  generateDecision();
  validateFoundation();
}
