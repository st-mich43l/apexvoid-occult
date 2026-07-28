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
  AcquisitionEvidenceStatus,
  AcquisitionPackManifest,
  EvidenceMaturity,
  CoverageEvaluation
} from "./schema/pack.js";

function evaluateMaturity(source: MajorFortuneResearchSource, extraction?: SourceExtractionRecord): EvidenceMaturity {
  if (source.verificationStatus === "verified-copy") {
    if (extraction && extraction.statementType === "explicit-rule") {
      return "verified-extraction";
    }
    return "inspected-extraction";
  }
  if (extraction) {
    if (extraction.statementType === "reported-rule" || extraction.statementType === "catalogued-rule" || extraction.statementType === "unverified-rule") {
      return "catalogued-hypothesis";
    }
    return "located-unverified";
  }
  return "catalogued-hypothesis";
}

function evaluateCoverage(
  dimension: string,
  relevantClaims: AcquisitionClaim[],
  relevantExtractions: SourceExtractionRecord[],
  relevantSources: MajorFortuneResearchSource[]
): CoverageEvaluation {
  const result: CoverageEvaluation = {
    status: "missing",
    explicitness: "none",
    sourceIds: Array.from(new Set(relevantSources.map(s => s.sourceId))).sort(),
    extractionIds: Array.from(new Set(relevantExtractions.map(e => e.extractionId))).sort(),
    claimIds: Array.from(new Set(relevantClaims.map(c => c.claimId))).sort(),
    unresolvedReasons: []
  };

  if (relevantClaims.length === 0) {
    result.unresolvedReasons.push("No claims found for this family and school lane.");
    return result;
  }

  const hasExplicit = relevantClaims.some(c => c.extractionIds.some(eid => {
    const ext = relevantExtractions.find(e => e.extractionId === eid);
    return ext && ext.statementType === "explicit-rule";
  }));
  const hasInferred = relevantClaims.some(c => c.extractionIds.some(eid => {
    const ext = relevantExtractions.find(e => e.extractionId === eid);
    return ext && ext.statementType === "inference";
  }));
  const hasUnverified = relevantClaims.some(c => c.extractionIds.some(eid => {
    const ext = relevantExtractions.find(e => e.extractionId === eid);
    return ext && (ext.statementType === "unverified-rule" || ext.statementType === "catalogued-rule" || ext.statementType === "reported-rule");
  }));

  result.explicitness = hasExplicit ? "explicit" : hasInferred ? "inferred" : hasUnverified ? "unverified" : "none";

  let covered = false;
  let partial = false;
  
  // Custom logic per dimension
  switch (dimension) {
    case "existence":
      covered = relevantClaims.length > 0;
      break;
    case "temporalScope":
      covered = relevantClaims.some(c => c.requestedTemporalScope !== "unresolved");
      break;
    case "palaceFrame":
      covered = relevantClaims.some(c => c.requestedPalaceFrame !== "unresolved");
      break;
    case "targetFrame":
      covered = relevantClaims.some(c => c.requestedTargetFrame !== "unresolved");
      break;
    case "polarity":
      covered = relevantClaims.some(c => c.polarity !== null);
      break;
    case "strength":
      covered = relevantClaims.some(c => c.strength !== null);
      break;
    case "exceptionPolicy":
      covered = false; // Usually missing for these basic claims
      break;
    case "sourceLocatorQuality":
      covered = relevantSources.some(s => s.locators.length > 0 && s.verificationStatus === "verified-copy");
      if (!covered && relevantSources.some(s => s.locators.length > 0)) {
        partial = true;
      }
      break;
    case "crossSourceAgreement":
      covered = relevantSources.length > 1; // Needs at least 2 sources agreeing
      break;
    case "schoolScope":
      covered = relevantClaims.some(c => c.schoolScope !== "unresolved");
      break;
    default:
      covered = false;
  }

  if (covered) {
    if (result.explicitness === "unverified" || result.explicitness === "none") {
      result.status = "catalogued";
      result.unresolvedReasons.push(`Dimension ${dimension} has claims, but evidence is unverified metadata-only.`);
    } else {
      result.status = "verified";
    }
  } else if (partial) {
    result.status = "partial";
    result.unresolvedReasons.push(`Dimension ${dimension} is only partially covered.`);
  } else {
    result.status = "missing";
    result.unresolvedReasons.push(`Dimension ${dimension} is missing required data.`);
  }

  return result;
}

export function generateAcquisitionPack(opts: { 
  manifestPath: string;
  packBase: string;
  foundationBase: string;
}): void {
  const manifest: AcquisitionPackManifest = JSON.parse(fs.readFileSync(opts.manifestPath, "utf8"));
  
  const localWriteJson = (relativePath: string, data: any) => {
    const fullPath = path.join(opts.packBase, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    const output = `${JSON.stringify(data, null, 2)}\n`;
    fs.writeFileSync(fullPath, output);
    const hash = crypto.createHash("sha256").update(output).digest("hex");
    fs.writeFileSync(fullPath.replace(".json", ".hash"), `${hash}\n`);
  };

  const sources: MajorFortuneResearchSource[] = JSON.parse(fs.readFileSync(path.join(opts.packBase, manifest.maintainedInputs.sourceRegistry), "utf8"));
  const extractions: SourceExtractionRecord[] = JSON.parse(fs.readFileSync(path.join(opts.packBase, manifest.maintainedInputs.extractionLedger), "utf8"));
  const claims: AcquisitionClaim[] = JSON.parse(fs.readFileSync(path.join(opts.packBase, manifest.maintainedInputs.claimRegistry), "utf8"));

  const foundationMatrixPath = path.join(opts.foundationBase, "matrices/evidence-gap-matrix.json");
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
  localWriteJson(manifest.generatedOutputs.handoffQueue, handoffQueue);

  const coverageMatrix: SourceCoverageMatrixRow[] = [];
  const evidenceRecords: EvidenceGapEvidenceRecord[] = [];

  let explicitlyCoveredDimensions = 0;
  let inferredCoveredDimensions = 0;
  let partiallyCoveredDimensions = 0;
  let missingDimensions = 0;

  for (const familyId of manifest.targetFamilyIds) {
    const foundationRecord = foundationMatrix.find((r: any) => r.signalFamilyId === familyId);

    for (const schoolScope of manifest.requiredSchoolScopes) {
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

      const evaluations: Record<string, CoverageEvaluation> = {
        existence: evaluateCoverage("existence", relevantClaims, relevantExtractions, relevantSources),
        temporalScope: evaluateCoverage("temporalScope", relevantClaims, relevantExtractions, relevantSources),
        palaceFrame: evaluateCoverage("palaceFrame", relevantClaims, relevantExtractions, relevantSources),
        targetFrame: evaluateCoverage("targetFrame", relevantClaims, relevantExtractions, relevantSources),
        polarity: evaluateCoverage("polarity", relevantClaims, relevantExtractions, relevantSources),
        strength: evaluateCoverage("strength", relevantClaims, relevantExtractions, relevantSources),
        exceptionPolicy: evaluateCoverage("exceptionPolicy", relevantClaims, relevantExtractions, relevantSources),
        sourceLocatorQuality: evaluateCoverage("sourceLocatorQuality", relevantClaims, relevantExtractions, relevantSources),
        crossSourceAgreement: evaluateCoverage("crossSourceAgreement", relevantClaims, relevantExtractions, relevantSources),
        schoolScope: evaluateCoverage("schoolScope", relevantClaims, relevantExtractions, relevantSources),
      };

      const cov = {
        existence: evaluations.existence.status === "verified" ? "covered" : evaluations.existence.status === "missing" ? "missing" : "partial",
        temporalScope: evaluations.temporalScope.status === "verified" ? "covered" : evaluations.temporalScope.status === "missing" ? "missing" : "partial",
        palaceFrame: evaluations.palaceFrame.status === "verified" ? "covered" : evaluations.palaceFrame.status === "missing" ? "missing" : "partial",
        targetFrame: evaluations.targetFrame.status === "verified" ? "covered" : evaluations.targetFrame.status === "missing" ? "missing" : "partial",
        polarity: evaluations.polarity.status === "verified" ? "covered" : evaluations.polarity.status === "missing" ? "missing" : "partial",
        strength: evaluations.strength.status === "verified" ? "covered" : evaluations.strength.status === "missing" ? "missing" : "partial",
        exceptionPolicy: evaluations.exceptionPolicy.status === "verified" ? "covered" : evaluations.exceptionPolicy.status === "missing" ? "missing" : "partial",
        sourceLocatorQuality: evaluations.sourceLocatorQuality.status === "verified" ? "covered" : evaluations.sourceLocatorQuality.status === "missing" ? "missing" : "partial",
        crossSourceAgreement: evaluations.crossSourceAgreement.status === "verified" ? "covered" : evaluations.crossSourceAgreement.status === "missing" ? "missing" : "partial",
        schoolScope: evaluations.schoolScope.status === "verified" ? "covered" : evaluations.schoolScope.status === "missing" ? "missing" : "partial"
      } as const;

      coverageMatrix.push({
        familyId,
        schoolScope,
        inspectedSourceCount: relevantSources.length,
        verifiedLocatorCount: relevantSources.reduce((acc, s) => acc + s.locators.length, 0),
        explicitMajorFortuneClaimCount: relevantClaims.filter(c => c.requestedTemporalScope === "major-fortune" && c.extractionIds.some(eid => extractions.find(e => e.extractionId === eid)?.statementType === "explicit-rule")).length,
        natalOnlyClaimCount: relevantClaims.filter(c => c.requestedTemporalScope === "natal").length,
        unresolvedTemporalScopeCount: relevantClaims.filter(c => c.requestedTemporalScope === "unresolved").length,
        conflictingClaimCount: relevantClaims.filter(c => c.acquisitionStatus === "blocked-scope-ambiguity" || c.acquisitionStatus === "blocked-missing-provenance" || c.acquisitionStatus === "blocked-missing-locator" || c.acquisitionStatus === "blocked-school-ambiguity").length,
        coverage: cov
      });

      const counts = Object.values(cov);
      const hasExplicitClaim = evaluations.existence.explicitness === "explicit";
      const hasInferredClaim = evaluations.existence.explicitness === "inferred";
      
      explicitlyCoveredDimensions += hasExplicitClaim ? counts.filter(x => x === "covered").length : 0;
      inferredCoveredDimensions += (!hasExplicitClaim && hasInferredClaim) ? counts.filter(x => x === "covered").length : 0;
      if (!hasExplicitClaim && !hasInferredClaim) {
        missingDimensions += counts.filter(x => x === "missing" || x === "covered").length; // If catalogued, we still consider them open
      } else {
        missingDimensions += counts.filter(x => x === "missing").length;
        partiallyCoveredDimensions += counts.filter(x => x === "partial").length;
      }

      if (foundationRecord) {
        const checkDimension = (dimKey: string, schemaDim: string, evalResult: CoverageEvaluation) => {
          if (evalResult.status !== "missing" && foundationRecord[dimKey] && foundationRecord[dimKey].gapIds) {
            for (const gapId of foundationRecord[dimKey].gapIds) {
              const recordId = `${manifest.packId}:${gapId}:${schoolScope}:${schemaDim}:${evalResult.explicitness}`;

              // Determine maturity from the first source mapped, or catalogued-hypothesis
              const sourceForMaturity = relevantSources[0];
              const extForMaturity = relevantExtractions[0];
              const evidenceMaturity = sourceForMaturity ? evaluateMaturity(sourceForMaturity, extForMaturity) : "catalogued-hypothesis";
              
              let status: AcquisitionEvidenceStatus = "still-open";
              if (relevantClaims.some(c => c.acquisitionStatus === "ready-for-adjudication")) {
                status = "ready-for-adjudication";
              } else if (evidenceMaturity === "verified-extraction") {
                status = "source-verified";
              } else if (relevantClaims.some(c => c.acquisitionStatus.startsWith("blocked-"))) {
                status = "partially-covered";
              } else if (evidenceMaturity === "catalogued-hypothesis" || evidenceMaturity === "located-unverified") {
                status = "metadata-only";
              }

              evidenceRecords.push({
                recordId,
                packId: manifest.packId,
                gapId,
                familyId,
                schoolScope,
                dimension: schemaDim as any,
                explicitness: evalResult.explicitness,
                evidenceMaturity,
                provenanceQuality: sourceForMaturity?.verificationStatus ?? "needs-verification",
                requestedTemporalScope: "major-fortune",
                requestedPalaceFrame: null,
                requestedTargetFrame: null,
                status,
                sourceIds: evalResult.sourceIds,
                extractionIds: evalResult.extractionIds,
                claimIds: evalResult.claimIds,
                unresolvedReasons: evalResult.unresolvedReasons
              });
            }
          }
        };

        checkDimension("existence", "existence", evaluations.existence);
        checkDimension("majorFortuneTemporalScope", "majorFortuneTemporalScope", evaluations.temporalScope);
        checkDimension("palaceFrame", "palaceFrame", evaluations.palaceFrame);
        checkDimension("targetFrame", "targetFrame", evaluations.targetFrame);
        checkDimension("polarity", "polarity", evaluations.polarity);
        checkDimension("strength", "strength", evaluations.strength);
      }
    }
  }

  evidenceRecords.sort((a, b) => a.recordId.localeCompare(b.recordId));

  localWriteJson(manifest.generatedOutputs.evidenceLedger, evidenceRecords);
  localWriteJson(manifest.generatedOutputs.coverageMatrix, coverageMatrix);
  localWriteJson(manifest.generatedOutputs.schoolMatrix, { coverageMatrix });

  const uniqueGapsReady = new Set<string>();
  for (const record of evidenceRecords) {
    if (record.status === "ready-for-adjudication") {
      uniqueGapsReady.add(record.gapId);
    }
  }

  const summary: AcquisitionSummary = {
    packId: manifest.packId,
    pillarId: manifest.pillarId,
    familiesTargeted: manifest.targetFamilyIds.length,
    schoolLanesTargeted: manifest.requiredSchoolScopes.length,
    sourcesTotal: sources.length,
    sourcesVerified: sources.filter(s => s.verificationStatus === "verified-copy").length,
    sourcesMetadataOnly: sources.filter(s => s.verificationStatus === "metadata-only").length,
    claimsTotal: claims.length,
    claimsReadyForAdjudication: claims.filter((c) => c.acquisitionStatus === "ready-for-adjudication").length,
    claimsBlockedByProvenance: claims.filter((c) => c.acquisitionStatus === "blocked-missing-provenance").length,
    claimsBlockedByScope: claims.filter((c) => c.acquisitionStatus === "blocked-scope-ambiguity" || c.acquisitionStatus === "blocked-school-ambiguity").length,
    
    evidenceRecordsEmitted: evidenceRecords.length,
    verifiedEvidenceRecords: evidenceRecords.filter(r => r.evidenceMaturity === "verified-extraction").length,
    partialEvidenceRecords: evidenceRecords.filter(r => r.status === "partially-covered").length,
    cataloguedEvidenceRecords: evidenceRecords.filter(r => r.status === "metadata-only").length,
    openEvidenceRecords: evidenceRecords.filter(r => r.status === "still-open").length,

    sourceGapsClosed: uniqueGapsReady.size,
    sourceGapsPartial: 0,
    sourceGapsOpen: 0,
    adjudicationHandoffsCreated: handoffQueue.length,
    claimGapsClosed: 0,
    calculationCoreGapsClosed: 0
  };

  localWriteJson(manifest.generatedOutputs.summary, summary);
}
