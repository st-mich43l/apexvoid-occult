import crypto from "crypto";
import fs from "fs";
import path from "path";
import type {
  DoctrineLocatorStatus,
  EvidenceDimension,
  EvidenceGapMatrixRecord,
  EvidenceStatus,
  RuntimeLocatorStatus,
} from "../schema/foundation.js";
import { calculateCandidateReadiness } from "./readiness.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);

const DIMENSION_CODES: Record<string, string> = {
  existence: "EXISTENCE",
  schoolScope: "SCHOOL-SCOPE",
  majorFortuneTemporalScope: "TEMPORAL-SCOPE",
  palaceFrame: "PALACE-FRAME",
  targetFrame: "TARGET-FRAME",
  polarity: "POLARITY",
  strength: "STRENGTH",
  pillarOwnership: "PILLAR-OWNERSHIP",
  stacking: "STACKING",
  deduplication: "DEDUPLICATION",
  exceptionPolicy: "EXCEPTION-POLICY",
  calculationCoreReadiness: "CALCULATION-CORE",
  sourceLocatorQuality: "SOURCE-LOCATOR",
  crossSourceAgreement: "CROSS-SOURCE",
  corpusMeasurability: "CORPUS-MEASURABILITY",
};

function familyCode(familyId: string): string {
  return familyId.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
}

function needsGap(status: EvidenceStatus): boolean {
  return status !== "verified" && status !== "not-applicable";
}

function doctrineEvidenceStatus(
  status: string | undefined,
): EvidenceStatus {
  switch (status) {
    case "verified":
      return "verified";
    case "contradicted":
      return "contradicted";
    case "school-specific-unresolved":
      return "partial";
    case "not-applicable":
      return "not-applicable";
    case "unverified":
    default:
      return "missing";
  }
}

export function generateEvidenceGapMatrix(opts?: {
  outputBase?: string;
}): void {
  const outputBase = opts?.outputBase ?? CANONICAL_BASE;
  const runtimeInventory = JSON.parse(
    fs.readFileSync(
      path.join(outputBase, "inventory/runtime-signal-inventory.json"),
      "utf8",
    ),
  );
  const backlogInventory = JSON.parse(
    fs.readFileSync(
      path.join(outputBase, "inventory/research-backlog-registry.json"),
      "utf8",
    ),
  );
  const contradictionLog = JSON.parse(
    fs.readFileSync(
      path.join(outputBase, "contradictions/contradiction-log.json"),
      "utf8",
    ),
  );

  const allFamilies = [...runtimeInventory, ...backlogInventory];
  const matrix: EvidenceGapMatrixRecord[] = [];

  for (const family of allFamilies) {
    const isRuntime = typeof family.runtimeStatus === "string";
    const sourceIds: string[] = family.sourceIds ?? [];
    const claimIds: string[] = family.claimIds ?? [];
    const doctrineStatus = doctrineEvidenceStatus(
      family.doctrineStatus,
    );
    const openContradictionIds = contradictionLog.contradictions
      .filter(
        (contradiction: any) =>
          contradiction.status === "open" &&
          contradiction.affectedFamilies.includes(family.signalFamilyId),
      )
      .map((contradiction: any) => contradiction.contradictionId);

    const makeDimension = (
      dimension: keyof typeof DIMENSION_CODES,
      status: EvidenceStatus,
      derivation: string,
      notes = "",
      extras?: Partial<EvidenceDimension>,
    ): EvidenceDimension => {
      const gapIds = needsGap(status)
        ? [
            `GAP-MFV05-${familyCode(family.signalFamilyId)}-` +
              `${DIMENSION_CODES[dimension]}-001`,
          ]
        : [];
      return {
        status,
        sourceIds,
        claimIds,
        gapIds,
        derivation,
        notes,
        ...extras,
      };
    };

    const schoolScope = family.schoolScope;
    const hasResolvedSchoolScope =
      Array.isArray(schoolScope) && schoolScope.length > 0;
    const schoolStatus: EvidenceStatus =
      doctrineStatus === "verified" && hasResolvedSchoolScope
        ? "verified"
        : isRuntime && hasResolvedSchoolScope
          ? "engineering-only"
          : hasResolvedSchoolScope
            ? "partial"
            : "missing";

    const frame = isRuntime ? family.frame : family.proposedFrame;
    const frameStatus: EvidenceStatus = frame
      ? isRuntime
        ? "engineering-only"
        : "partial"
      : "missing";

    const targetFrameFamilies = new Set([
      "major-fortune-transformations",
      "vcd-opposite-palace-borrowing",
      "out-of-frame-transformation-influence",
      "natal-transit-transformation-stacking",
      "natal-to-van-star-pattern-compatibility",
    ]);
    const targetApplies = targetFrameFamilies.has(
      family.signalFamilyId,
    );
    const targetFrame = isRuntime
      ? family.frame
      : family.targetFrame;
    const targetStatus: EvidenceStatus = targetApplies
      ? targetFrame && targetFrame !== "not-applicable"
        ? isRuntime
          ? "engineering-only"
          : "partial"
        : "missing"
      : "not-applicable";

    const hasEngineeringPolarity =
      Array.isArray(family.engineeringMappings) &&
      family.engineeringMappings.length > 0;
    const polarityStatus: EvidenceStatus =
      doctrineStatus === "verified"
        ? "verified"
        : hasEngineeringPolarity
          ? "engineering-only"
          : "missing";
    const strengthStatus: EvidenceStatus =
      doctrineStatus === "verified"
        ? "verified"
        : hasEngineeringPolarity &&
            family.engineeringMappings.some(
              (mapping: any) =>
                mapping.strength && mapping.strength !== "none",
            )
          ? "engineering-only"
          : "missing";

    const ownership = isRuntime
      ? family.pillarId
      : family.pillarOwnership;
    const ownershipStatus: EvidenceStatus =
      ownership && ownership !== "unresolved"
        ? isRuntime
          ? "engineering-only"
          : "partial"
        : "missing";

    const calculationCoreBlocked =
      family.runtimeStatus ===
        "production-blocked-on-calculation-core" ||
      family.blockedOnCalculationCore === true;
    const calculationCoreStatus: EvidenceStatus =
      calculationCoreBlocked ? "missing" : "verified";

    const runtimeLocatorStatus: RuntimeLocatorStatus =
      sourceIds.length > 0 && claimIds.length > 0
        ? "verified"
        : "missing";
    const doctrineLocatorStatus: DoctrineLocatorStatus =
      doctrineStatus === "verified" &&
      sourceIds.length > 0 &&
      claimIds.length > 0
        ? "verified-doctrine"
        : runtimeLocatorStatus === "verified"
          ? "verified-runtime-only"
          : doctrineStatus === "contradicted"
            ? "contradicted"
            : "missing";
    const sourceLocatorStatus: EvidenceStatus =
      doctrineLocatorStatus === "verified-doctrine"
        ? "verified"
        : doctrineLocatorStatus === "verified-runtime-only"
          ? "engineering-only"
          : doctrineLocatorStatus === "contradicted"
            ? "contradicted"
            : "missing";

    const corpusMeasurable =
      family.measurableFromCorpus === true ||
      (isRuntime &&
        family.runtimeStatus !==
          "production-blocked-on-calculation-core");

    const record: EvidenceGapMatrixRecord = {
      signalFamilyId: family.signalFamilyId,
      existence: makeDimension(
        "existence",
        doctrineStatus,
        "Mapped from maintained doctrine status; runtime existence alone is not doctrine evidence.",
      ),
      schoolScope: makeDimension(
        "schoolScope",
        schoolStatus,
        "Separated runtime school admission from source-supported doctrine scope.",
      ),
      majorFortuneTemporalScope: makeDimension(
        "majorFortuneTemporalScope",
        doctrineStatus === "verified"
          ? "verified"
          : isRuntime
            ? "engineering-only"
            : "missing",
        "Runtime context proves implementation scope only; research backlog requires Major Fortune-specific doctrine.",
      ),
      palaceFrame: makeDimension(
        "palaceFrame",
        frameStatus,
        `Observed or proposed frame: ${frame ?? "unresolved"}.`,
      ),
      targetFrame: makeDimension(
        "targetFrame",
        targetStatus,
        targetApplies
          ? `Observed or proposed target frame: ${targetFrame ?? "unresolved"}.`
          : "This family does not define a separate target frame.",
      ),
      polarity: makeDimension(
        "polarity",
        polarityStatus,
        "Separated current engineering direction from source-supported polarity.",
      ),
      strength: makeDimension(
        "strength",
        strengthStatus,
        "Separated current engineering strength from source-supported strength.",
      ),
      pillarOwnership: makeDimension(
        "pillarOwnership",
        ownershipStatus,
        `Observed or proposed pillar ownership: ${ownership ?? "unresolved"}.`,
      ),
      stacking: makeDimension(
        "stacking",
        "missing",
        "No source-supported stacking or explicit non-stacking rule is currently maintained.",
      ),
      deduplication: makeDimension(
        "deduplication",
        isRuntime ? "engineering-only" : "missing",
        isRuntime
          ? "The evaluator has engineering deduplication mechanics, but doctrine deduplication remains unverified."
          : "No deduplication policy is maintained for this research family.",
      ),
      exceptionPolicy: makeDimension(
        "exceptionPolicy",
        "missing",
        "No source-supported exception policy is maintained.",
      ),
      calculationCoreReadiness: makeDimension(
        "calculationCoreReadiness",
        calculationCoreStatus,
        calculationCoreBlocked
          ? "Required Calculation Core capability is absent."
          : "The current corpus and adapter provide the required calculation facts.",
        "",
        calculationCoreBlocked
          ? { blockerKind: "calculation-core" }
          : undefined,
      ),
      sourceLocatorQuality: makeDimension(
        "sourceLocatorQuality",
        sourceLocatorStatus,
        "Runtime declarations and doctrine locators are assessed independently.",
        "",
        {
          runtimeLocatorStatus,
          doctrineLocatorStatus,
        },
      ),
      crossSourceAgreement: makeDimension(
        "crossSourceAgreement",
        "missing",
        "Fewer than two inspected doctrine sources are available for adjudication.",
      ),
      corpusMeasurability: makeDimension(
        "corpusMeasurability",
        corpusMeasurable ? "verified" : "missing",
        corpusMeasurable
          ? "The frozen corpus exposes the required observable facts."
          : "The frozen corpus lacks the required calculation layer.",
        "",
        corpusMeasurable
          ? undefined
          : { blockerKind: "calculation-core" },
      ),
      openContradictionIds,
      candidateEligibility: "metadata-only",
    };

    record.candidateEligibility =
      calculateCandidateReadiness(record).readiness;
    matrix.push(record);
  }

  fs.mkdirSync(path.join(outputBase, "matrices"), {
    recursive: true,
  });
  const output = `${JSON.stringify(matrix, null, 2)}\n`;
  fs.writeFileSync(
    path.join(outputBase, "matrices/evidence-gap-matrix.json"),
    output,
  );
  fs.writeFileSync(
    path.join(outputBase, "matrices/evidence-gap-matrix.hash"),
    `${crypto.createHash("sha256").update(output).digest("hex")}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateEvidenceGapMatrix();
}
