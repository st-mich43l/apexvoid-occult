import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  MajorFortuneResearchSource,
  SourceExtractionRecord,
  AcquisitionClaim,
  SourceCoverageMatrixRow,
  AcquisitionSummary,
  EvidenceGapEvidenceRecord,
  AcquisitionEvidenceStatus
} from "../schema/acquisition.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-source-acquisition-r1b-nhan-hoa",
);

export function generateAcquisitionPack(opts?: { 
  inputBase?: string;
  outputBase?: string;
  foundationBase?: string;
}): void {
  const inputBase = opts?.inputBase ?? CANONICAL_BASE;
  const outputBase = opts?.outputBase ?? CANONICAL_BASE;
  const foundationBase = opts?.foundationBase ?? path.join(ROOT, "research/major-fortune/v0.5-evidence-gap-foundation");

  const localWriteJson = (relativePath: string, data: any) => {
    const fullPath = path.join(outputBase, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    // deterministic stringify
    const output = `${JSON.stringify(data, null, 2)}\n`;
    fs.writeFileSync(fullPath, output);
    const hash = crypto.createHash("sha256").update(output).digest("hex");
    fs.writeFileSync(fullPath.replace(".json", ".hash"), `${hash}\n`);
  };

  const sources: MajorFortuneResearchSource[] = JSON.parse(
    fs.readFileSync(path.join(inputBase, "sources/source-registry.json"), "utf8"),
  );
  const extractions: SourceExtractionRecord[] = JSON.parse(
    fs.readFileSync(path.join(inputBase, "extractions/extraction-ledger.json"), "utf8"),
  );
  const claims: AcquisitionClaim[] = JSON.parse(
    fs.readFileSync(path.join(inputBase, "claims/claim-registry.json"), "utf8"),
  );

  const foundationMatrixPath = path.join(
    foundationBase,
    "matrices/evidence-gap-matrix.json"
  );
  const foundationMatrix = JSON.parse(fs.readFileSync(foundationMatrixPath, "utf8"));

  // Queues
  const missingLocatorQueue = sources
    .filter((s) => s.verificationStatus === "verified-copy" && s.locators.length === 0)
    .map((s) => s.sourceId);

  const unresolvedSchoolQueue = claims
    .filter((c) => c.schoolScope === "unresolved")
    .map((c) => c.claimId);

  const handoffQueue = claims
    .filter((c) => c.acquisitionStatus === "ready-for-adjudication")
    .map((c) => c.claimId);

  localWriteJson("queue/missing-source-locator-queue.json", missingLocatorQueue);
  localWriteJson("queue/unresolved-school-scope-queue.json", unresolvedSchoolQueue);
  localWriteJson("queue/claim-adjudication-handoff.json", handoffQueue);

  // Matrices
  const targetFamilies = ["principal-star-dignity", "vcd-opposite-palace-borrowing"] as const;
  const targetSchools = ["nam-phai", "trung-chau"] as const;

  const coverageMatrix: SourceCoverageMatrixRow[] = [];
  const evidenceRecords: EvidenceGapEvidenceRecord[] = [];

  let explicitlyCoveredDimensions = 0;
  let inferredCoveredDimensions = 0;
  let partiallyCoveredDimensions = 0;
  let missingDimensions = 0;

  for (const familyId of targetFamilies) {
    const foundationRecord = foundationMatrix.find((r: any) => r.signalFamilyId === familyId);

    for (const schoolScope of targetSchools) {
      const relevantClaims = claims.filter(
        (c) => c.familyId === familyId && (c.schoolScope === schoolScope || c.schoolScope === "shared"),
      );
      const relevantExtractions = extractions.filter(
        (e) => e.familyId === familyId && (e.schoolScope === schoolScope || e.schoolScope === "shared"),
      );
      const relevantSources = sources.filter(
        (s) =>
          s.supportedFamilyIds.includes(familyId) &&
          (s.schoolScope === schoolScope || s.schoolScope === "shared"),
      );

      const hasExplicitClaim = relevantClaims.some(
        (c) => c.requestedTemporalScope === "major-fortune" &&
               c.extractionIds.some(eid => extractions.find(e => e.extractionId === eid)?.statementType === "explicit-rule")
      );
      const hasInferredClaim = relevantClaims.some(
        (c) => c.requestedTemporalScope === "major-fortune" &&
               c.extractionIds.some(eid => extractions.find(e => e.extractionId === eid)?.statementType === "inference")
      );

      const cov = {
        existence: relevantClaims.length > 0 ? "covered" : "missing",
        temporalScope: relevantClaims.some((c) => c.requestedTemporalScope !== "unresolved") ? "covered" : "missing",
        palaceFrame: relevantClaims.some((c) => c.requestedPalaceFrame !== "unresolved") ? "covered" : "missing",
        targetFrame: relevantClaims.some((c) => c.requestedTargetFrame !== "unresolved") ? "covered" : "missing",
        polarity: relevantClaims.some((c) => c.polarity !== null) ? "covered" : "missing",
        strength: relevantClaims.some((c) => c.strength !== null) ? "covered" : "missing",
        exceptionPolicy: "missing",
      } as const;

      coverageMatrix.push({
        familyId,
        schoolScope,
        inspectedSourceCount: relevantSources.length,
        verifiedLocatorCount: relevantSources.reduce(
          (acc, s) => acc + s.locators.length,
          0,
        ),
        explicitMajorFortuneClaimCount: relevantClaims.filter(
          (c) => c.requestedTemporalScope === "major-fortune" &&
                 c.extractionIds.some(eid => extractions.find(e => e.extractionId === eid)?.statementType === "explicit-rule")
        ).length,
        natalOnlyClaimCount: relevantClaims.filter(
          (c) => c.requestedTemporalScope === "natal"
        ).length,
        unresolvedTemporalScopeCount: relevantClaims.filter(
          (c) => c.requestedTemporalScope === "unresolved"
        ).length,
        conflictingClaimCount: relevantClaims.filter(
          (c) => c.acquisitionStatus === "blocked-scope-ambiguity" || c.acquisitionStatus === "blocked-missing-provenance" || c.acquisitionStatus === "blocked-missing-locator" || c.acquisitionStatus === "blocked-school-ambiguity"
        ).length,
        coverage: cov
      });

      const counts = Object.values(cov);
      explicitlyCoveredDimensions += hasExplicitClaim ? counts.filter(x => x === "covered").length : 0;
      inferredCoveredDimensions += (!hasExplicitClaim && hasInferredClaim) ? counts.filter(x => x === "covered").length : 0;
      if (!hasExplicitClaim && !hasInferredClaim) {
        missingDimensions += counts.filter(x => x === "missing" || x === "covered").length;
      } else {
        missingDimensions += counts.filter(x => x === "missing").length;
        partiallyCoveredDimensions += counts.filter(x => x === "partial").length;
      }

      if (foundationRecord) {
        const checkDimension = (dimKey: string, schemaDim: string, isCovered: boolean) => {
          if (isCovered && foundationRecord[dimKey] && foundationRecord[dimKey].gapIds) {
            for (const gapId of foundationRecord[dimKey].gapIds) {
              
              const relevantSourceIds = Array.from(new Set(relevantSources.map(s => s.sourceId))).sort();
              const relevantExtractionIds = Array.from(new Set(relevantExtractions.map(e => e.extractionId))).sort();
              const relevantClaimIds = Array.from(new Set(relevantClaims.map(c => c.claimId))).sort();

              const explicitness = hasExplicitClaim ? "explicit" : hasInferredClaim ? "inferred" : "none";
              const recordId = `${gapId}:${schoolScope}:${schemaDim}:${explicitness}`;

              let status: AcquisitionEvidenceStatus = "still-open";
              if (relevantClaims.some(c => c.acquisitionStatus === "ready-for-adjudication")) {
                status = "ready-for-adjudication";
              } else if (relevantClaims.some(c => c.acquisitionStatus === "blocked-missing-provenance" || c.acquisitionStatus === "blocked-scope-ambiguity" || c.acquisitionStatus === "blocked-school-ambiguity" || c.acquisitionStatus === "blocked-missing-locator")) {
                status = "partially-covered";
              } else if (relevantSources.some(s => s.acquisitionStatus === "acquired")) {
                status = "source-acquired";
              }

              evidenceRecords.push({
                recordId,
                gapId,
                familyId,
                schoolScope,
                dimension: schemaDim as any,
                explicitness,
                requestedTemporalScope: "major-fortune",
                requestedPalaceFrame: null,
                requestedTargetFrame: null,
                status,
                sourceIds: relevantSourceIds,
                extractionIds: relevantExtractionIds,
                claimIds: relevantClaimIds,
                unresolvedReasons: []
              });
            }
          }
        };

        checkDimension("existence", "existence", cov.existence === "covered");
        checkDimension("majorFortuneTemporalScope", "majorFortuneTemporalScope", cov.temporalScope === "covered");
        checkDimension("palaceFrame", "palaceFrame", cov.palaceFrame === "covered");
        checkDimension("targetFrame", "targetFrame", cov.targetFrame === "covered");
        checkDimension("polarity", "polarity", cov.polarity === "covered");
        checkDimension("strength", "strength", cov.strength === "covered");
      }
    }
  }

  // Ensure deterministic sort for evidence records
  evidenceRecords.sort((a, b) => {
    return a.recordId.localeCompare(b.recordId);
  });

  localWriteJson("queue/evidence-gap-evidence-ledger.json", evidenceRecords);
  // Deprecated compatibility alias
  localWriteJson("queue/evidence-gap-closure-ledger.json", evidenceRecords);
  
  localWriteJson("matrices/source-coverage-matrix.json", coverageMatrix);
  localWriteJson("matrices/school-evidence-matrix.json", { coverageMatrix });

  // Compute unique gaps closed by looking at evidence records that are ready for adjudication
  const uniqueGapsReady = new Set<string>();
  for (const record of evidenceRecords) {
    if (record.status === "ready-for-adjudication") {
      uniqueGapsReady.add(record.gapId);
    }
  }

  // Summary
  const summary: AcquisitionSummary = {
    sourcesTargeted: sources.length,
    sourcesAcquired: sources.filter((s) => s.acquisitionStatus === "acquired").length,

    verifiedCopySources: sources.filter(s => s.verificationStatus === "verified-copy").length,
    metadataOnlySources: sources.filter(s => s.verificationStatus === "metadata-only").length,
    sourcesNeedingVerification: sources.filter(s => s.verificationStatus === "needs-verification").length,

    extractionsCollected: extractions.length,

    claimsUnadjudicated: claims.filter((c) => c.acquisitionStatus === "unadjudicated").length,
    claimsReadyForAdjudication: claims.filter((c) => c.acquisitionStatus === "ready-for-adjudication").length,
    claimsBlockedByProvenance: claims.filter((c) => c.acquisitionStatus === "blocked-missing-provenance").length,
    claimsBlockedByScope: claims.filter((c) => c.acquisitionStatus === "blocked-scope-ambiguity" || c.acquisitionStatus === "blocked-school-ambiguity").length,

    familiesTargeted: targetFamilies.length,
    familiesFullyCovered: 0,
    familiesPartiallyCovered: targetFamilies.filter(f => claims.some(c => c.familyId === f)).length,

    dimensionsCoveredExplicitly: explicitlyCoveredDimensions,
    dimensionsCoveredByInference: inferredCoveredDimensions,
    dimensionsPartiallyCovered: partiallyCoveredDimensions,
    dimensionsStillOpen: missingDimensions,

    gapClosuresEmitted: evidenceRecords.length,
    gapsStillOpen: 0
  };

  let totalFoundationGaps = 0;
  let uniqueFoundationGaps = new Set<string>();
  for (const record of foundationMatrix) {
    if (targetFamilies.includes(record.signalFamilyId as any)) {
      for (const key of Object.keys(record)) {
         if (record[key] && record[key].gapIds) {
           for (const g of record[key].gapIds) {
             uniqueFoundationGaps.add(g);
           }
         }
      }
    }
  }
  
  summary.gapsStillOpen = uniqueFoundationGaps.size - uniqueGapsReady.size;

  localWriteJson("reports/acquisition-summary.json", summary);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAcquisitionPack();
}
