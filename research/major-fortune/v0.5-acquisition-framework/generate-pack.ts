import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  MajorFortuneResearchSource,
  SourceExtractionRecord,
  AcquisitionClaim,
  SchoolEvidenceMatrixRow,
  AcquisitionSummary,
  EvidenceGapEvidenceRecord,
  AcquisitionEvidenceStatus,
  AcquisitionWorkflowState,
  SourceEvidenceState,
  AcquisitionPackManifest,
  EvidenceMaturity,
  DimensionAssessment
} from "./schema/pack.js";

function evaluateMaturity(source: MajorFortuneResearchSource, extraction?: SourceExtractionRecord): EvidenceMaturity {
  if (source.verificationStatus === "verified-copy") {
    if (extraction && extraction.statementForm === "rule" && extraction.evidenceExplicitness === "verified-explicit") {
      return "verified-extraction";
    }
    return "inspected-extraction";
  }
  if (extraction) {
    if (extraction.evidenceExplicitness === "reported-unverified" || extraction.evidenceExplicitness === "none") {
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
): DimensionAssessment & { matchedClaimIds: string[], matchedExtractionIds: string[], matchedSourceIds: string[] } {

  const result = {
    requestedValue: null as string | null,
    sourceValue: null as string | null,
    proposedValue: null as string | null,
    applicationKind: "unresolved" as DimensionAssessment["applicationKind"],
    evidenceExplicitness: "none" as DimensionAssessment["evidenceExplicitness"],
    maturity: "catalogued-hypothesis" as DimensionAssessment["maturity"],
    outcome: "missing" as DimensionAssessment["outcome"],
    reasons: [] as string[],
    matchedClaimIds: [] as string[],
    matchedExtractionIds: [] as string[],
    matchedSourceIds: [] as string[]
  };

  let matchedClaims: AcquisitionClaim[] = [];
  
  switch (dimension) {
    case "existence":
      matchedClaims = relevantClaims;
      break;
    case "majorFortuneTemporalScope":
      matchedClaims = relevantClaims.filter(c => c.requestedTemporalScope === "major-fortune");
      break;
    case "palaceFrame":
      matchedClaims = relevantClaims.filter(c => c.requestedPalaceFrame && c.requestedPalaceFrame !== "unresolved");
      break;
    case "targetFrame":
      matchedClaims = relevantClaims.filter(c => c.requestedTargetFrame && c.requestedTargetFrame !== "unresolved");
      break;
    case "polarity":
      matchedClaims = relevantClaims.filter(c => c.polarity !== null);
      break;
    case "strength":
      matchedClaims = relevantClaims.filter(c => c.strength !== null);
      break;
    case "exceptionPolicy":
      matchedClaims = [];
      break;
    case "schoolScope":
      matchedClaims = relevantClaims.filter(c => c.schoolScope !== "unresolved" && c.schoolScope !== "shared");
      break;
    default:
      matchedClaims = relevantClaims;
  }

  if (matchedClaims.length === 0) {
    result.reasons.push(`No valid claims cover the ${dimension} dimension.`);
    return result;
  }

  result.matchedClaimIds = Array.from(new Set(matchedClaims.map(c => c.claimId))).sort();
  const c0 = matchedClaims[0];

  // Map requested values
  if (dimension === "majorFortuneTemporalScope") result.requestedValue = "major-fortune";
  if (dimension === "palaceFrame") result.requestedValue = c0.requestedPalaceFrame;
  if (dimension === "targetFrame") result.requestedValue = c0.requestedTargetFrame;

  const exts = relevantExtractions.filter(e => matchedClaims.some(c => c.extractionIds.includes(e.extractionId)));
  const srcs = relevantSources.filter(s => matchedClaims.some(c => c.sourceIds.includes(s.sourceId)));

  if (exts.length === 0) {
    result.reasons.push(`Claims exist but lack associated extractions.`);
    return result;
  }

  result.matchedExtractionIds = Array.from(new Set(exts.map(e => e.extractionId))).sort();
  result.matchedSourceIds = Array.from(new Set(srcs.map(s => s.sourceId))).sort();

  const ext0 = exts[0];
  const src0 = srcs.find(s => s.sourceId === ext0.sourceId)!;

  if (dimension === "majorFortuneTemporalScope") result.sourceValue = ext0.sourceTemporalScope || null;
  if (dimension === "palaceFrame") result.sourceValue = ext0.sourcePalaceFrame || null;
  if (dimension === "targetFrame") result.sourceValue = ext0.sourceTargetFrame || null;

  result.applicationKind = ext0.proposedApplicationScope?.applicationKind || "direct";
  result.evidenceExplicitness = ext0.evidenceExplicitness;
  result.maturity = evaluateMaturity(src0, ext0);

  if (result.requestedValue && result.sourceValue && result.requestedValue !== result.sourceValue && result.applicationKind === "direct") {
     result.outcome = "conflicted";
     result.reasons.push(`Scope mismatch (${result.requestedValue} != ${result.sourceValue}) with no proposed bridge.`);
     return result;
  }

  if (result.evidenceExplicitness === "reported-unverified" || result.evidenceExplicitness === "none") {
    result.outcome = "catalogued";
    result.reasons.push(`Evidence is metadata-only.`);
  } else {
    result.outcome = "verified";
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

  const missingLocatorQueue = sources
    .filter((s) => s.verificationStatus === "verified-copy" && (!s.locators || s.locators.length === 0))
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

  const schoolMatrix: SchoolEvidenceMatrixRow[] = [];
  const evidenceRecords: EvidenceGapEvidenceRecord[] = [];

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

      const evaluations: Record<string, ReturnType<typeof evaluateCoverage>> = {
        existence: evaluateCoverage("existence", relevantClaims, relevantExtractions, relevantSources),
        majorFortuneTemporalScope: evaluateCoverage("majorFortuneTemporalScope", relevantClaims, relevantExtractions, relevantSources),
        palaceFrame: evaluateCoverage("palaceFrame", relevantClaims, relevantExtractions, relevantSources),
        targetFrame: evaluateCoverage("targetFrame", relevantClaims, relevantExtractions, relevantSources),
        polarity: evaluateCoverage("polarity", relevantClaims, relevantExtractions, relevantSources),
        strength: evaluateCoverage("strength", relevantClaims, relevantExtractions, relevantSources),
        exceptionPolicy: evaluateCoverage("exceptionPolicy", relevantClaims, relevantExtractions, relevantSources),
        schoolScope: evaluateCoverage("schoolScope", relevantClaims, relevantExtractions, relevantSources),
      };

      const matrixRow: SchoolEvidenceMatrixRow = {
        familyId,
        schoolScope: schoolScope as any,
        sourceIds: relevantSources.map(s => s.sourceId).sort(),
        verifiedSourceIds: relevantSources.filter(s => s.verificationStatus === "verified-copy").map(s => s.sourceId).sort(),
        extractionIds: relevantExtractions.map(e => e.extractionId).sort(),
        claimIds: relevantClaims.map(c => c.claimId).sort(),
        directEvidenceCount: relevantExtractions.filter(e => e.proposedApplicationScope?.applicationKind === "direct" || !e.proposedApplicationScope).length,
        inferredEvidenceCount: relevantExtractions.filter(e => e.proposedApplicationScope?.applicationKind === "inferred").length,
        analogyEvidenceCount: relevantExtractions.filter(e => e.proposedApplicationScope?.applicationKind === "analogy").length,
        reportedUnverifiedCount: relevantExtractions.filter(e => e.evidenceExplicitness === "reported-unverified").length,
        verifiedLocatorCount: relevantSources.reduce((acc, s) => acc + (s.locators?.filter(l => l.locatorVerification === "verified-against-copy").length || 0), 0),
        unresolvedLocatorCount: relevantSources.reduce((acc, s) => acc + (s.locators?.filter(l => l.locatorVerification !== "verified-against-copy").length || 0), 0),
        supportedDimensions: [],
        partialDimensions: [],
        missingDimensions: [],
        conflictedDimensions: [],
        contradictionIds: [],
        crossSchoolFallbackDetected: relevantClaims.some(c => c.schoolScope === "shared" && relevantSources.some(s => s.schoolScope === "shared" && s.sourceIds?.includes(s.sourceId))),
        adjudicationReadyClaimIds: relevantClaims.filter(c => c.acquisitionStatus === "ready-for-adjudication").map(c => c.claimId).sort(),
        notes: []
      };

      for (const [dim, evalResult] of Object.entries(evaluations)) {
         if (evalResult.outcome === "verified") matrixRow.supportedDimensions.push(dim);
         else if (evalResult.outcome === "catalogued" || evalResult.outcome === "partial") matrixRow.partialDimensions.push(dim);
         else if (evalResult.outcome === "conflicted") matrixRow.conflictedDimensions.push(dim);
         else matrixRow.missingDimensions.push(dim);
      }

      schoolMatrix.push(matrixRow);

      if (foundationRecord) {
        const checkDimension = (dimKey: string, schemaDim: string, evalResult: ReturnType<typeof evaluateCoverage>) => {
          if (evalResult.outcome !== "missing" && foundationRecord[dimKey] && foundationRecord[dimKey].gapIds) {
            for (const gapId of foundationRecord[dimKey].gapIds) {
              const recordId = `${manifest.packId}:${gapId}:${schoolScope}:${schemaDim}:${evalResult.evidenceExplicitness}`;

              let sourceEvidenceState: SourceEvidenceState = "missing";
              let workflowState: AcquisitionWorkflowState = "source-open";
              
              if (evalResult.outcome === "conflicted") {
                sourceEvidenceState = "conflicted";
                workflowState = "source-partial";
              } else if (evalResult.maturity === "verified-extraction") {
                sourceEvidenceState = "verified-explicit";
                workflowState = "source-closed";
              } else if (evalResult.maturity === "inspected-extraction") {
                sourceEvidenceState = "verified-inferred";
                workflowState = "source-partial";
              } else if (evalResult.maturity === "located-unverified") {
                sourceEvidenceState = "located-unverified";
                workflowState = "source-partial";
              } else if (evalResult.maturity === "catalogued-hypothesis") {
                sourceEvidenceState = "catalogued";
                workflowState = "source-open";
              }

              if (relevantClaims.some(c => c.acquisitionStatus === "ready-for-adjudication" && evalResult.matchedClaimIds.includes(c.claimId))) {
                 workflowState = "handoff-ready";
              } else if (relevantClaims.some(c => c.acquisitionStatus === "ready-for-adjudication")) {
                 workflowState = "adjudication-open";
              }

              let status: AcquisitionEvidenceStatus = "still-open";
              if (workflowState === "handoff-ready") status = "ready-for-adjudication";
              else if (sourceEvidenceState === "verified-explicit" || sourceEvidenceState === "verified-inferred") status = "source-verified";
              else if (sourceEvidenceState === "conflicted" || sourceEvidenceState === "located-unverified") status = "partially-covered";
              else if (sourceEvidenceState === "catalogued") status = "metadata-only";

              // Carry exact requested frames from the claims
              const claimsForGap = claims.filter(c => evalResult.matchedClaimIds.includes(c.claimId));
              const requestedTemporalScope = claimsForGap.map(c => c.requestedTemporalScope).find(x => x && x !== "unresolved") || "unresolved";
              const requestedPalaceFrame = claimsForGap.map(c => c.requestedPalaceFrame).find(x => x && x !== "unresolved") || "unresolved";
              const requestedTargetFrame = claimsForGap.map(c => c.requestedTargetFrame).find(x => x && x !== "unresolved") || "unresolved";

              const dimAss: DimensionAssessment = {
                requestedValue: evalResult.requestedValue,
                sourceValue: evalResult.sourceValue,
                proposedValue: evalResult.proposedValue,
                applicationKind: evalResult.applicationKind,
                evidenceExplicitness: evalResult.evidenceExplicitness,
                maturity: evalResult.maturity,
                outcome: evalResult.outcome,
                reasons: evalResult.reasons
              };

              const bestSource = sources.find(s => s.sourceId === evalResult.matchedSourceIds[0]);

              evidenceRecords.push({
                recordId,
                packId: manifest.packId,
                gapId,
                familyId,
                schoolScope,
                dimension: schemaDim as any,
                explicitness: evalResult.evidenceExplicitness as any,
                evidenceMaturity: evalResult.maturity,
                provenanceQuality: bestSource?.verificationStatus ?? "needs-verification",
                status,
                sourceEvidenceState,
                workflowState,
                requestedTemporalScope,
                requestedPalaceFrame,
                requestedTargetFrame,
                sourceIds: evalResult.matchedSourceIds,
                extractionIds: evalResult.matchedExtractionIds,
                claimIds: evalResult.matchedClaimIds,
                dimensionAssessments: { [schemaDim]: dimAss },
                unresolvedReasons: evalResult.reasons
              });
            }
          }
        };

        checkDimension("existence", "existence", evaluations.existence);
        checkDimension("majorFortuneTemporalScope", "majorFortuneTemporalScope", evaluations.majorFortuneTemporalScope);
        checkDimension("palaceFrame", "palaceFrame", evaluations.palaceFrame);
        checkDimension("targetFrame", "targetFrame", evaluations.targetFrame);
        checkDimension("polarity", "polarity", evaluations.polarity);
        checkDimension("strength", "strength", evaluations.strength);
      }
    }
  }

  evidenceRecords.sort((a, b) => a.recordId.localeCompare(b.recordId));

  localWriteJson(manifest.generatedOutputs.evidenceLedger, evidenceRecords);
  localWriteJson(manifest.generatedOutputs.schoolMatrix, { coverageMatrix: schoolMatrix });

  // Note: we still export 'coverageMatrix' key internally if consumers expect it there, 
  // but it's populated with SchoolEvidenceMatrixRow data. Wait, prompt says: 
  // "Generate the new SchoolEvidenceMatrixRow format instead of aliasing the coverageMatrix."
  // So we just output a school matrix.
  // Wait, the schema says: 
  localWriteJson(manifest.generatedOutputs.coverageMatrix, schoolMatrix); // Keep old path for compat or overwrite

  const uniqueGapsReady = new Set<string>();
  const uniqueGapsPartial = new Set<string>();
  const uniqueGapsOpen = new Set<string>();
  const allTargetedGaps = new Set<string>();

  for (const record of evidenceRecords) {
    allTargetedGaps.add(record.gapId);
    if (record.workflowState === "handoff-ready") {
      uniqueGapsReady.add(record.gapId);
    } else if (record.workflowState === "source-closed" || record.workflowState === "source-partial") {
      uniqueGapsPartial.add(record.gapId);
    } else {
      uniqueGapsOpen.add(record.gapId);
    }
  }

  const summary: AcquisitionSummary = {
    packId: manifest.packId,
    pillarId: manifest.pillarId,
    familiesTargeted: manifest.targetFamilyIds.length,
    schoolLanesTargeted: manifest.requiredSchoolScopes.length,
    sourcesTotal: sources.length,
    cataloguedSourceCount: sources.filter(s => s.verificationStatus === "metadata-only").length,
    inspectedSourceCount: sources.filter(s => s.verificationStatus === "needs-verification" || s.verificationStatus === "verified-copy").length,
    verifiedSourceCount: sources.filter(s => s.verificationStatus === "verified-copy").length,
    sourcesMetadataOnly: sources.filter(s => s.verificationStatus === "metadata-only").length,
    sourcesNeedingVerification: sources.filter(s => s.verificationStatus === "needs-verification").length,
    claimsTotal: claims.length,
    claimsReadyForAdjudication: claims.filter((c) => c.acquisitionStatus === "ready-for-adjudication").length,
    blockedClaimCount: claims.filter((c) => c.acquisitionStatus.startsWith("blocked-")).length,
    conflictingClaimCount: claims.filter((c) => c.acquisitionStatus === "blocked-scope-ambiguity" || c.acquisitionStatus === "blocked-school-ambiguity").length,
    claimsBlockedByProvenance: claims.filter((c) => c.acquisitionStatus === "blocked-missing-provenance").length,
    claimsBlockedByScope: claims.filter((c) => c.acquisitionStatus === "blocked-scope-ambiguity" || c.acquisitionStatus === "blocked-school-ambiguity").length,

    evidenceRecordsEmitted: evidenceRecords.length,
    verifiedEvidenceRecords: evidenceRecords.filter(r => r.sourceEvidenceState === "verified-explicit" || r.sourceEvidenceState === "verified-inferred").length,
    partialEvidenceRecords: evidenceRecords.filter(r => r.workflowState === "source-partial").length,
    cataloguedEvidenceRecords: evidenceRecords.filter(r => r.sourceEvidenceState === "catalogued").length,
    openEvidenceRecords: evidenceRecords.filter(r => r.workflowState === "source-open").length,

    uniqueTargetedSourceGaps: allTargetedGaps.size,
    sourceGapsClosed: uniqueGapsReady.size,
    sourceGapsPartial: uniqueGapsPartial.size,
    sourceGapsOpen: uniqueGapsOpen.size,
    adjudicationHandoffsCreated: handoffQueue.length,
    claimGapsClosed: 0,
    calculationCoreGapsClosed: 0
  };

  localWriteJson(manifest.generatedOutputs.summary, summary);
}

