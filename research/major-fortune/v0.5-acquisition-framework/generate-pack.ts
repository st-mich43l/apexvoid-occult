import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  AcquisitionClaim,
  MajorFortuneResearchSource,
  SourceExtractionRecord,
  EvidencePath,
  EvidencePathAssessment,
  DimensionAggregate,
  AcquisitionPackManifest,
  SourceCoverageMatrixRow,
  SchoolEvidenceMatrixRow,
  EvidenceGapEvidenceRecord,
  AcquisitionSummary,
  EvidenceMaturity,
  EvidenceObligation,
  EvidenceScopeSnapshot,
  GapSchoolLaneAssessment,
  FinalGapAssessment,
  SourceGapReconciliation
} from "./schema/pack.js";
import { loadAndValidateAcquisitionPackInputs } from "./schema/runtime-validation.js";

export function normalizeSourceIdentity(s: MajorFortuneResearchSource): string {
  const norm = (val: string | null) => val ? val.trim().toLowerCase().normalize("NFC") : "";
  return [
    norm(s.title),
    norm(s.authorOrCompiler),
    norm(s.edition),
    norm(s.publisher),
    norm(s.publicationYear),
    norm(s.language),
    norm(s.schoolScope)
  ].join("|");
}

export function detectCrossSchoolFallback(input: {
  rowSchool: "nam-phai" | "trung-chau";
  claims: AcquisitionClaim[];
  extractions: SourceExtractionRecord[];
  sources: MajorFortuneResearchSource[];
}): boolean {
  const otherSchool = input.rowSchool === "nam-phai" ? "trung-chau" : "nam-phai";
  const claimFallback = input.claims.some(c => c.schoolScope === otherSchool);
  const sourceFallback = input.sources.some(s => s.schoolScope === otherSchool);
  return claimFallback || sourceFallback;
}

export function evaluateMaturity(s: MajorFortuneResearchSource, e: SourceExtractionRecord, l: any): EvidenceMaturity {
  const isVerifiedProvenance = s.verificationStatus === "verified-copy" && l?.locatorVerification === "verified-against-copy";

  if (isVerifiedProvenance) {
    if (e.evidenceExplicitness === "analogy") {
      return "verified-analogy";
    }
    if (e.evidenceExplicitness === "verified-inferred") {
      return "verified-inferred";
    }
    if (e.evidenceExplicitness === "verified-explicit" && e.proposedApplicationScope?.applicationKind === "direct") {
      return "verified-extraction";
    }
    return "inspected-extraction";
  }

  if (s.verificationStatus !== "metadata-only" && l?.locatorVerification !== "metadata-only") {
    // Inspected but lacks explicit verified evidence
    return "inspected-extraction";
  }

  if (e.evidenceExplicitness === "reported-unverified" || e.evidenceExplicitness === "none") {
    return "catalogued-hypothesis";
  }
  return "located-unverified";
}

export function buildEvidencePaths(
  claims: AcquisitionClaim[],
  extractions: SourceExtractionRecord[],
  sources: MajorFortuneResearchSource[]
): EvidencePath[] {
  const paths: EvidencePath[] = [];

  for (const c of claims) {
    for (const eid of c.extractionIds) {
      const e = extractions.find(x => x.extractionId === eid);
      if (!e) continue;
      if (!c.sourceIds.includes(e.sourceId)) continue;
      const s = sources.find(x => x.sourceId === e.sourceId);
      if (!s) continue;
      const l = s.locators?.find(x => x.locatorId === e.locatorId);
      if (!l) continue;

      paths.push({
        claimId: c.claimId,
        extractionId: e.extractionId,
        sourceId: s.sourceId,
        locatorId: l.locatorId,
        familyId: c.familyId,
        schoolScope: c.schoolScope as "nam-phai"|"trung-chau"|"shared",
        sourceVerificationStatus: s.verificationStatus,
        locatorVerification: l.locatorVerification,
        evidenceExplicitness: e.evidenceExplicitness,
        applicationKind: e.proposedApplicationScope?.applicationKind || "direct",
        statementForm: e.statementForm
      });
    }
  }

  paths.sort((a, b) => {
    const idA = `${a.claimId}:${a.extractionId}:${a.sourceId}:${a.locatorId}`;
    const idB = `${b.claimId}:${b.extractionId}:${b.sourceId}:${b.locatorId}`;
    return idA.localeCompare(idB);
  });

  return paths;
}

export function evaluatePathDimension(
  dim: string,
  path: EvidencePath,
  claims: AcquisitionClaim[],
  extractions: SourceExtractionRecord[],
  sources: MajorFortuneResearchSource[]
): EvidencePathAssessment | null {
  const c = claims.find(x => x.claimId === path.claimId)!;
  const e = extractions.find(x => x.extractionId === path.extractionId)!;
  const s = sources.find(x => x.sourceId === path.sourceId)!;
  const l = s.locators!.find(x => x.locatorId === path.locatorId)!;

  let requestedValue: string | null = null;
  let sourceValue: string | null = null;
  let proposedValue: string | null = null;

  if (dim === "existence") {
    // Matches all
  } else if (dim === "majorFortuneTemporalScope") {
    if (c.requestedTemporalScope !== "major-fortune") return null;
    requestedValue = c.requestedTemporalScope;
    sourceValue = e.sourceTemporalScope;
    proposedValue = e.proposedApplicationScope?.temporalScope || null;
  } else if (dim === "palaceFrame") {
    if (!c.requestedPalaceFrame || c.requestedPalaceFrame === "unresolved") return null;
    requestedValue = c.requestedPalaceFrame;
    sourceValue = e.sourcePalaceFrame;
    proposedValue = e.proposedApplicationScope?.palaceFrame || null;
  } else if (dim === "targetFrame") {
    if (!c.requestedTargetFrame || c.requestedTargetFrame === "unresolved") return null;
    requestedValue = c.requestedTargetFrame;
    sourceValue = e.sourceTargetFrame;
    proposedValue = e.proposedApplicationScope?.targetFrame || null;
  } else if (dim === "polarity") {
    if (c.polarity === null) return null;
    requestedValue = c.polarity;
  } else if (dim === "strength") {
    if (c.strength === null) return null;
    requestedValue = c.strength;
  } else if (dim === "exceptionPolicy") {
    if (e.statementForm !== "exception") return null;
  } else if (dim === "schoolScope") {
    if (c.schoolScope === "unresolved" || c.schoolScope === "shared") return null;
    requestedValue = c.schoolScope;
    sourceValue = e.schoolScope;
  } else if (dim === "sourceLocatorQuality") {
    // Evaluates quality independently of matching values
  } else if (dim === "crossSourceAgreement") {
    // Handled at aggregate level, just include path for now
  } else {
    return null;
  }

  const maturity = evaluateMaturity(s, e, l);

  const ass: EvidencePathAssessment = {
    requestedValue,
    sourceValue,
    proposedValue,
    applicationKind: path.applicationKind,
    evidenceExplicitness: path.evidenceExplicitness,
    maturity,
    outcome: "missing",
    reasons: []
  };

  if (requestedValue && sourceValue && requestedValue !== sourceValue && path.applicationKind === "direct") {
    ass.outcome = "conflicted";
    ass.reasons.push(`Scope mismatch (${requestedValue} != ${sourceValue}) with no proposed bridge.`);
    return ass;
  }

  // Evaluate outcome based on maturity and application kind
  if (maturity === "verified-extraction" && path.applicationKind === "direct" && path.evidenceExplicitness === "verified-explicit") {
    ass.outcome = "verified";
  } else if (maturity === "verified-extraction" || maturity === "inspected-extraction" || maturity === "verified-inferred" || maturity === "verified-analogy") {
    // Inspected extraction that lacks explicit verified evidence must remain partial
    // Verified analogy and inferred are also partial
    ass.outcome = "partial";
  } else if (maturity === "located-unverified") {
    ass.outcome = "partial";
  } else {
    ass.outcome = "catalogued";
  }
  
  if (path.evidenceExplicitness === "reported-unverified" || path.evidenceExplicitness === "none") {
    ass.outcome = "catalogued";
    ass.reasons.push("Evidence is metadata-only.");
  }

  if (dim === "sourceLocatorQuality") {
    if (!l) {
      ass.outcome = "missing";
    } else if (l.locatorVerification === "metadata-only") {
      ass.outcome = "catalogued";
    } else if (l.locatorVerification === "reported-unverified") {
      if (s.verificationStatus === "verified-copy") {
        ass.outcome = "partial";
      } else {
        ass.outcome = "catalogued";
      }
    } else if (s.verificationStatus === "verified-copy" && l.locatorVerification === "verified-against-copy") {
      if (s.copyIdentity?.copyId && s.copyIdentity?.editionFingerprint) {
        ass.outcome = "verified";
      } else {
        ass.outcome = "partial";
        ass.reasons.push("Lacks complete verified-copy provenance.");
      }
    } else {
      ass.outcome = "conflicted";
      ass.reasons.push("Structurally inconsistent locator.");
    }
  }

  return ass;
}

const MATURITY_LEVELS = ["catalogued-hypothesis", "located-unverified", "inspected-extraction", "verified-analogy", "verified-inferred", "verified-extraction"];

export function aggregateDimension(
  dim: string,
  paths: EvidencePath[],
  assessments: EvidencePathAssessment[],
  sources: MajorFortuneResearchSource[]
): DimensionAggregate {
  if (assessments.length === 0) {
    return {
      outcome: "missing",
      aggregateExplicitness: "none",
      minimumMaturity: "catalogued-hypothesis",
      maximumMaturity: "catalogued-hypothesis",
      bestEvidenceState: "missing",
      blockingEvidenceState: "missing",
      requestedValues: [],
      sourceValues: [],
      proposedValues: [],
      matchedPathIds: [],
      matchedClaimIds: [],
      matchedExtractionIds: [],
      matchedSourceIds: [],
      matchedLocatorIds: [],
      directPathCount: 0,
      inferredPathCount: 0,
      analogyPathCount: 0,
      reportedUnverifiedPathCount: 0,
      obligations: [],
      reasons: ["No valid paths cover this dimension."]
    };
  }

  let minMaturityIdx = 999;
  let maxMaturityIdx = -1;
  let hasConflicted = false;
  let hasVerified = false;
  let hasPartial = false;
  let hasCatalogued = false;

  const reqVals = new Set<string>();
  const srcVals = new Set<string>();
  const propVals = new Set<string>();
  
  const pathIds = new Set<string>();
  const claims = new Set<string>();
  const exts = new Set<string>();
  const srcs = new Set<string>();
  const locs = new Set<string>();
  
  const explicitnessSet = new Set<string>();

  let direct = 0, inferred = 0, analogy = 0, reported = 0;

  for (let i = 0; i < assessments.length; i++) {
    const ass = assessments[i];
    const path = paths[i];

    const mIdx = MATURITY_LEVELS.indexOf(ass.maturity);
    if (mIdx < minMaturityIdx) minMaturityIdx = mIdx;
    if (mIdx > maxMaturityIdx) maxMaturityIdx = mIdx;

    if (ass.outcome === "conflicted") hasConflicted = true;
    else if (ass.outcome === "verified") hasVerified = true;
    else if (ass.outcome === "partial") hasPartial = true;
    else if (ass.outcome === "catalogued") hasCatalogued = true;

    if (ass.requestedValue) reqVals.add(ass.requestedValue);
    if (ass.sourceValue) srcVals.add(ass.sourceValue);
    if (ass.proposedValue) propVals.add(ass.proposedValue);

    const pid = `${path.claimId}:${path.extractionId}:${path.sourceId}:${path.locatorId}`;
    pathIds.add(pid);
    claims.add(path.claimId);
    exts.add(path.extractionId);
    srcs.add(path.sourceId);
    locs.add(path.locatorId);

    if (path.applicationKind === "direct") direct++;
    else if (path.applicationKind === "inferred") inferred++;
    else if (path.applicationKind === "analogy") analogy++;

    if (path.evidenceExplicitness === "reported-unverified" || path.evidenceExplicitness === "none") reported++;
    explicitnessSet.add(path.evidenceExplicitness);
  }

  let finalOutcome: DimensionAggregate["outcome"] = "missing";
  if (hasConflicted) finalOutcome = "conflicted";
  else if (hasVerified) finalOutcome = "verified";
  else if (hasPartial) finalOutcome = "partial";
  else if (hasCatalogued) finalOutcome = "catalogued";
  
  let aggExp: "none" | "reported-unverified" | "analogy" | "verified-inferred" | "verified-explicit" | "mixed" | "conflicted" = "none";
  if (hasConflicted) {
    aggExp = "conflicted";
  } else if (explicitnessSet.size > 1) {
    aggExp = "mixed";
  } else if (explicitnessSet.size === 1) {
    aggExp = Array.from(explicitnessSet)[0] as any;
  }

  if (dim === "crossSourceAgreement") {
    const uniqueCanonicalSources = new Set<string>();
    for (const sid of srcs) {
       const s = sources.find(x => x.sourceId === sid);
       if (s) {
          uniqueCanonicalSources.add(normalizeSourceIdentity(s));
       }
    }
    if (uniqueCanonicalSources.size >= 2) {
       if (!hasConflicted) finalOutcome = "verified";
    } else {
       if (finalOutcome === "verified") finalOutcome = "partial";
    }
  }

  let bestState: SourceEvidenceState = "missing";
  if (finalOutcome === "conflicted") bestState = "conflicted";
  else if (finalOutcome === "verified") bestState = "verified-explicit";
  else if (finalOutcome === "partial") bestState = "located-unverified";
  else if (finalOutcome === "catalogued") bestState = "catalogued";

  return {
    outcome: finalOutcome,
    aggregateExplicitness: aggExp,
    minimumMaturity: MATURITY_LEVELS[minMaturityIdx] as EvidenceMaturity,
    maximumMaturity: MATURITY_LEVELS[maxMaturityIdx] as EvidenceMaturity,
    bestEvidenceState: bestState,
    blockingEvidenceState: hasConflicted ? "conflicted" : "missing",
    requestedValues: Array.from(reqVals).sort(),
    sourceValues: Array.from(srcVals).sort(),
    proposedValues: Array.from(propVals).sort(),
    matchedPathIds: Array.from(pathIds).sort(),
    matchedClaimIds: Array.from(claims).sort(),
    matchedExtractionIds: Array.from(exts).sort(),
    matchedSourceIds: Array.from(srcs).sort(),
    matchedLocatorIds: Array.from(locs).sort(),
    directPathCount: direct,
    inferredPathCount: inferred,
    analogyPathCount: analogy,
    reportedUnverifiedPathCount: reported,
    obligations: [],
    reasons: []
  };
}

export function generateAcquisitionPack(opts: {
  manifestPath: string;
  packBase: string;
  foundationBase: string;
}): void {
  const { manifest, sources, extractions, claims } = loadAndValidateAcquisitionPackInputs(opts);

  const localWriteJson = (relativePath: string, data: any) => {
    const fullPath = path.join(opts.packBase, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    const output = `${JSON.stringify(data, null, 2)}\n`;
    fs.writeFileSync(fullPath, output);
    const hash = crypto.createHash("sha256").update(output).digest("hex");
    fs.writeFileSync(fullPath.replace(".json", ".hash"), `${hash}\n`);
  };

  let foundationMatrix: any[] = [];
  if (opts.foundationBase) {
    const foundationMatrixPath = path.join(opts.foundationBase, "matrices/evidence-gap-matrix.json");
    if (fs.existsSync(foundationMatrixPath)) {
      foundationMatrix = JSON.parse(fs.readFileSync(foundationMatrixPath, "utf8"));
    }
  }

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
  const coverageMatrix: SourceCoverageMatrixRow[] = [];
  const evidenceRecords: EvidenceGapEvidenceRecord[] = [];

  const dimNames = ["existence", "majorFortuneTemporalScope", "palaceFrame", "targetFrame", "polarity", "strength", "exceptionPolicy", "sourceLocatorQuality", "crossSourceAgreement", "schoolScope"];

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

      const allPaths = buildEvidencePaths(relevantClaims, relevantExtractions, relevantSources);
      const dimensions: Record<string, DimensionAggregate> = {};

      for (const dim of dimNames) {
         const validAssessments: EvidencePathAssessment[] = [];
         const validPaths: EvidencePath[] = [];

         for (const p of allPaths) {
            const ass = evaluatePathDimension(dim, p, relevantClaims, relevantExtractions, relevantSources);
            if (ass) {
              validPaths.push(p);
              validAssessments.push(ass);
            }
         }
         dimensions[dim] = aggregateDimension(dim, validPaths, validAssessments, relevantSources);
      }

      // EvidenceSetMaturity
      let minMaturityIdx = 999;
      let maxMaturityIdx = -1;
      let allSrcVerif = relevantSources.length > 0;
      let allLocVerif = relevantSources.length > 0;
      for (const s of relevantSources) {
         if (s.verificationStatus !== "verified-copy") allSrcVerif = false;
         if (s.locators) {
           for (const l of s.locators) {
             if (l.locatorVerification !== "verified-against-copy") allLocVerif = false;
           }
         }
      }
      for (const d of Object.values(dimensions)) {
         if (d.outcome !== "missing") {
           const minIdx = MATURITY_LEVELS.indexOf(d.minimumMaturity);
           const maxIdx = MATURITY_LEVELS.indexOf(d.maximumMaturity);
           if (minIdx < minMaturityIdx) minMaturityIdx = minIdx;
           if (maxIdx > maxMaturityIdx) maxMaturityIdx = maxIdx;
         }
      }
      if (minMaturityIdx === 999) minMaturityIdx = 0;
      if (maxMaturityIdx === -1) maxMaturityIdx = 0;

      const uniqueCanonicalSources = new Set<string>();
      for (const s of relevantSources) uniqueCanonicalSources.add(`${s.title}-${s.authorOrCompiler}-${s.edition}`);
      
      const evidenceSetMaturity: EvidenceSetMaturity = {
         minimumMaturity: MATURITY_LEVELS[minMaturityIdx] as EvidenceMaturity,
         maximumMaturity: MATURITY_LEVELS[maxMaturityIdx] as EvidenceMaturity,
         allSourcesVerified: allSrcVerif,
         allLocatorsVerified: allLocVerif,
         independentSourceCount: uniqueCanonicalSources.size,
         minimumProvenanceQuality: "needs-verification",
         maximumProvenanceQuality: "verified-copy",
         unresolvedReasons: []
      };

      const openGapIds: string[] = [];
      const partialGapIds: string[] = [];
      const closedGapIds: string[] = [];
      const conflictedGapIds: string[] = [];

      if (foundationRecord) {
        const checkDimension = (dimKey: string, schemaDim: string) => {
          const agg = dimensions[schemaDim];
          if (agg && agg.outcome !== "missing" && foundationRecord[dimKey] && foundationRecord[dimKey].gapIds) {
            for (const gapId of foundationRecord[dimKey].gapIds) {
              
              let workflowState: AcquisitionWorkflowState = "source-open";
              if (agg.outcome === "conflicted") workflowState = "source-partial";
              else if (agg.outcome === "verified") workflowState = "source-closed";
              else if (agg.outcome === "partial") workflowState = "source-partial";
              
              let sourceGapState = "open";
              if (agg.outcome === "conflicted") sourceGapState = "conflicted";
              else if (agg.outcome === "verified") sourceGapState = "closed";
              else if (agg.outcome === "partial") sourceGapState = "partial";
              
              if (sourceGapState === "conflicted") conflictedGapIds.push(gapId);
              else if (sourceGapState === "closed") closedGapIds.push(gapId);
              else if (sourceGapState === "partial") partialGapIds.push(gapId);
              else openGapIds.push(gapId);

              if (relevantClaims.some(c => c.acquisitionStatus === "ready-for-adjudication" && agg.matchedClaimIds.includes(c.claimId))) {
                 workflowState = "handoff-ready";
              } else if (relevantClaims.some(c => c.acquisitionStatus === "ready-for-adjudication")) {
                 workflowState = "adjudication-open";
              }

              let status: AcquisitionEvidenceStatus = "still-open";
              if (workflowState === "handoff-ready") status = "ready-for-adjudication";
              else if (agg.bestEvidenceState === "verified-explicit" || agg.bestEvidenceState === "verified-inferred") status = "source-verified";
              else if (agg.bestEvidenceState === "conflicted" || agg.bestEvidenceState === "located-unverified") status = "partially-covered";
              else if (agg.bestEvidenceState === "catalogued") status = "metadata-only";

              const recordId = `${manifest.packId}:${gapId}:${schoolScope}:${schemaDim}:any`;

              const bestSource = sources.find(s => s.sourceId === agg.matchedSourceIds[0]);

              evidenceRecords.push({
                recordId,
                packId: manifest.packId,
                gapId,
                familyId,
                schoolScope,
                dimension: schemaDim as any,
                explicitness: "verified-explicit",
                evidenceMaturity: agg.maximumMaturity,
                provenanceQuality: bestSource?.verificationStatus ?? "needs-verification",
                status,
                sourceEvidenceState: agg.bestEvidenceState,
                workflowState,
                requestedTemporalScope: agg.requestedValues[0] || "unresolved",
                requestedPalaceFrame: agg.requestedValues[0] || "unresolved",
                requestedTargetFrame: agg.requestedValues[0] || "unresolved",
                sourceIds: agg.matchedSourceIds,
                extractionIds: agg.matchedExtractionIds,
                claimIds: agg.matchedClaimIds,
                dimensionAssessments: { [schemaDim]: agg },
                unresolvedReasons: agg.reasons
              });
            }
          }
        };

        checkDimension("existence", "existence");
        checkDimension("majorFortuneTemporalScope", "majorFortuneTemporalScope");
        checkDimension("palaceFrame", "palaceFrame");
        checkDimension("targetFrame", "targetFrame");
        checkDimension("polarity", "polarity");
        checkDimension("strength", "strength");
      }
      
      let overallSourceGapState: "open" | "partial" | "closed" | "conflicted" = "open";
      if (conflictedGapIds.length > 0) overallSourceGapState = "conflicted";
      else if (openGapIds.length === 0 && partialGapIds.length === 0 && closedGapIds.length > 0) overallSourceGapState = "closed";
      else if (closedGapIds.length > 0 || partialGapIds.length > 0) overallSourceGapState = "partial";

      const smRow: SchoolEvidenceMatrixRow = {
        familyId,
        schoolScope: schoolScope as any,
        sourceIds: relevantSources.map(s => s.sourceId).sort(),
        verifiedSourceIds: relevantSources.filter(s => s.verificationStatus === "verified-copy").map(s => s.sourceId).sort(),
        extractionIds: relevantExtractions.map(e => e.extractionId).sort(),
        claimIds: relevantClaims.map(c => c.claimId).sort(),
        directEvidenceCount: relevantExtractions.filter(e => e.proposedApplicationScope?.applicationKind === "direct" || !e.proposedApplicationScope).length,
        inferredEvidenceCount: relevantExtractions.filter(e => e.proposedApplicationScope?.applicationKind === "inferred").length,
        analogyEvidenceCount: relevantExtractions.filter(e => e.proposedApplicationScope?.applicationKind === "analogy").length,
        reportedUnverifiedCount: relevantExtractions.filter(e => e.evidenceExplicitness === "reported-unverified" || e.evidenceExplicitness === "none").length,
        independentVerifiedSourceCount: uniqueCanonicalSources.size,
        supportedDimensions: Object.keys(dimensions).filter(k => dimensions[k].outcome === "verified").sort(),
        partialDimensions: Object.keys(dimensions).filter(k => dimensions[k].outcome === "partial" || dimensions[k].outcome === "catalogued").sort(),
        missingDimensions: Object.keys(dimensions).filter(k => dimensions[k].outcome === "missing").sort(),
        conflictedDimensions: Object.keys(dimensions).filter(k => dimensions[k].outcome === "conflicted").sort(),
        sourceGapState: overallSourceGapState,
        contradictionIds: [],
        crossSchoolFallbackDetected: detectCrossSchoolFallback({
          rowSchool: schoolScope as "nam-phai" | "trung-chau",
          claims: relevantClaims,
          extractions: relevantExtractions,
          sources: relevantSources
        }),
        adjudicationReadyClaimIds: relevantClaims.filter(c => c.acquisitionStatus === "ready-for-adjudication").map(c => c.claimId).sort(),
        notes: []
      };

      const cmRow: SourceCoverageMatrixRow = {
        familyId,
        schoolScope: schoolScope as any,
        dimensions,
        evidenceSetMaturity,
        sourceIds: relevantSources.map(s => s.sourceId).sort(),
        extractionIds: relevantExtractions.map(e => e.extractionId).sort(),
        claimIds: relevantClaims.map(c => c.claimId).sort(),
        openGapIds,
        partialGapIds,
        closedGapIds,
        conflictedGapIds
      };

      schoolMatrix.push(smRow);
      coverageMatrix.push(cmRow);
    }
  }

  evidenceRecords.sort((a, b) => a.recordId.localeCompare(b.recordId));

  localWriteJson(manifest.generatedOutputs.evidenceLedger, evidenceRecords);
  localWriteJson(manifest.generatedOutputs.schoolMatrix, { schoolMatrix });
  localWriteJson(manifest.generatedOutputs.coverageMatrix, { coverageMatrix });

  const gapReconciliation: SourceGapReconciliation = {
    schemaVersion: "0.5.8.3",
    packId: manifest.packId,
    gaps: [],
    totals: {
      unique: 0,
      open: 0,
      partial: 0,
      closed: 0,
      conflicted: 0
    }
  };

  const gapIds = Array.from(new Set(evidenceRecords.map(r => r.gapId)));
  for (const gapId of gapIds) {
    const gapRecords = evidenceRecords.filter(r => r.gapId === gapId);
    const familyId = gapRecords[0].familyId;

    const schoolLanes: GapSchoolLaneAssessment[] = [];
    const requiredSchoolScopes = manifest.requiredSchoolScopes as Array<"nam-phai"|"trung-chau">;

    for (const scope of requiredSchoolScopes) {
      const laneRecords = gapRecords.filter(r => r.schoolScope === scope || r.schoolScope === ("shared" as any));
      let state: "open" | "partial" | "closed" | "conflicted" = "open";

      if (laneRecords.some(r => r.workflowState === "handoff-ready")) {
        state = "closed";
      } else if (laneRecords.some(r => r.sourceEvidenceState === "conflicted")) {
        state = "conflicted";
      } else if (laneRecords.some(r => r.workflowState === "source-closed" || r.workflowState === "source-partial")) {
        state = "partial";
      }

      schoolLanes.push({
        gapId,
        familyId,
        schoolScope: scope,
        requiredObligationIds: [],
        state,
        matchedEvidenceRecordIds: laneRecords.map(r => r.recordId),
        unresolvedReasons: []
      });
    }

    let finalState: "open" | "partial" | "closed" | "conflicted" = "open";
    if (schoolLanes.some(l => l.state === "conflicted")) {
      finalState = "conflicted";
    } else if (schoolLanes.every(l => l.state === "closed")) {
      finalState = "closed";
    } else if (schoolLanes.some(l => l.state === "closed" || l.state === "partial")) {
      finalState = "partial";
    }

    gapReconciliation.gaps.push({
      gapId,
      familyId,
      requiredSchoolScopes,
      schoolLanes,
      finalState,
      unresolvedReasons: []
    });

    gapReconciliation.totals.unique++;
    gapReconciliation.totals[finalState]++;
  }

  // Update original allTargetedGaps logic to use finalState to maintain backwards compat variables
  // (though summary uses the ones below)
  const uniqueGapsReady = new Set(gapReconciliation.gaps.filter(g => g.finalState === "closed").map(g => g.gapId));
  const uniqueGapsPartial = new Set(gapReconciliation.gaps.filter(g => g.finalState === "partial").map(g => g.gapId));
  const uniqueGapsOpen = new Set(gapReconciliation.gaps.filter(g => g.finalState === "open").map(g => g.gapId));
  const uniqueGapsConflicted = new Set(gapReconciliation.gaps.filter(g => g.finalState === "conflicted").map(g => g.gapId));
  const allTargetedGaps = new Set(gapReconciliation.gaps.map(g => g.gapId));

  if (manifest.generatedOutputs.sourceGapReconciliation) {
    localWriteJson(manifest.generatedOutputs.sourceGapReconciliation, gapReconciliation);
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
    sourceGapsConflicted: uniqueGapsConflicted.size,
    adjudicationHandoffsCreated: handoffQueue.length,
    claimGapsClosed: 0,
    calculationCoreGapsClosed: 0
  };

  localWriteJson(manifest.generatedOutputs.summary, summary);
}
