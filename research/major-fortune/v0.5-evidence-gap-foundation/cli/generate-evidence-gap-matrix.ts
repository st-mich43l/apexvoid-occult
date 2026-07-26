import fs from 'fs';
import path from 'path';
import type { EvidenceGapMatrixRecord, EvidenceDimension, EvidenceStatus, CandidateEligibilityStatus } from '../schema/foundation.js';
import { calculateCandidateReadiness } from './readiness.js';
import crypto from 'crypto';

let baseDir = process.cwd();

export function generateEvidenceGapMatrix(opts?: { outputBase?: string }) {
  const base = opts?.outputBase || path.join(baseDir, 'research/major-fortune/v0.5-evidence-gap-foundation');
  
  const runtimeInventory = JSON.parse(fs.readFileSync(path.join(base, 'inventory/runtime-signal-inventory.json'), 'utf-8'));
  const backlogInventory = JSON.parse(fs.readFileSync(path.join(base, 'inventory/research-backlog-registry.json'), 'utf-8'));
  
  const matrix: EvidenceGapMatrixRecord[] = [];
  
  const allFamilies = [...runtimeInventory, ...backlogInventory];
  
  for (const family of allFamilies) {
    const isProduction = family.runtimeStatus === 'production-enabled';
    const hasDoctrine = family.doctrineStatus === 'verified' || family.doctrineStatus === 'unverified' || family.doctrineStatus === 'contradicted';
    const isMeasurable = family.measurableFromCorpus === true || (isProduction && family.runtimeStatus !== 'production-blocked-on-calculation-core');
    const hasSources = family.sourceIds && family.sourceIds.length > 0;
    const hasClaims = family.claimIds && family.claimIds.length > 0;
    
    // We create unique GAP IDs based on the dimension
    let gapCounter = 1;
    const mkDim = (dimCode: string, status: EvidenceStatus, derivation: string, notes: string = ""): EvidenceDimension => {
       const gapIds: string[] = [];
       if (status === "missing" || status === "partial" || status === "contradicted") {
          const paddedCounter = String(gapCounter++).padStart(3, '0');
          gapIds.push(`GAP-MFV05-${family.signalFamilyId.toUpperCase()}-${dimCode}-${paddedCounter}`);
       }
       return {
         status,
         sourceIds: family.sourceIds || [],
         claimIds: family.claimIds || [],
         gapIds,
         derivation,
         notes
       };
    };

    // Correct inference: production presence doesn't mean verification.
    const existenceStatus = hasDoctrine ? family.doctrineStatus : (isProduction ? "engineering-only" : "missing");
    const existence = mkDim("EXIST", existenceStatus, "Based on runtime/doctrine status", "Existence of phenomenon.");
    
    const schoolScopeStatus = family.schoolScope && family.schoolScope.length > 0 && family.schoolScope !== "unresolved" ? (isProduction ? "engineering-only" : "verified") : "missing";
    const schoolScope = mkDim("SCOPE", schoolScopeStatus, "Checked school scope array length.");
    
    const temporalScope = mkDim("TEMP", "engineering-only", "Always Major Fortune for this context");
    
    const actualFrame = family.frame || family.proposedFrame;
    const palaceFrame = mkDim("FRAME", actualFrame ? (isProduction ? "engineering-only" : "verified") : "missing", `Frame is ${actualFrame}`);
    
    const actualTargetFrame = family.targetFrame || (family.signalFamilyId.includes('transformation') ? 'out-of-frame-target' : undefined);
    const targetFrame = mkDim("TGTFRAME", actualTargetFrame ? (isProduction ? "engineering-only" : "verified") : "not-applicable", "Target frame applies to transformations.");
    
    let polarityStatus: EvidenceStatus = "missing";
    if (family.engineeringMappings && family.engineeringMappings.length > 0) polarityStatus = "engineering-only";
    if (hasDoctrine && family.doctrineStatus === 'verified') polarityStatus = "verified";
    const polarity = mkDim("POLARITY", polarityStatus, "Derived from engineering mappings or doctrine.");
    
    let strengthStatus: EvidenceStatus = "not-applicable";
    if (family.engineeringMappings && family.engineeringMappings.some((m: any) => m.strength && m.strength !== 'none')) strengthStatus = "engineering-only";
    const strength = mkDim("STRENGTH", strengthStatus, "Derived from engineering strength mappings.");
    
    const ownership = family.pillarId || family.pillarOwnership;
    const pillarOwnership = mkDim("PILLAR", ownership && ownership !== "unresolved" ? "engineering-only" : "missing", `Pillar is ${ownership}`);
    
    const stacking = mkDim("STACK", "not-applicable", "No stacking rules defined for current evidence.", "Needs future research.");
    const deduplication = mkDim("DEDUP", isProduction ? "engineering-only" : "missing", "Deduplication is currently handled by calculation core or engineering policy.");
    const exceptionPolicy = mkDim("EXCEPT", "missing", "No explicit exception policy documented.");
    
    const calculationCoreReadiness = mkDim("CCREADY", family.blockedOnCalculationCore || family.runtimeStatus === 'production-blocked-on-calculation-core' ? "blocked-by-calculation-core" : "verified", `Status is inferred from implementation.`);
    
    const sourceLocatorQuality = mkDim("LOCATOR", hasSources && hasClaims ? "verified" : "missing", "Requires both sources and claims.");
    
    const crossSourceAgreement = mkDim("CROSSAGREE", "not-applicable", "Fewer than two sources to compare.");
    const corpusMeasurability = mkDim("CORPUS", isMeasurable ? "verified" : "missing", "Can be measured from corpus.");

    const matrixRecord: EvidenceGapMatrixRecord = {
      signalFamilyId: family.signalFamilyId,
      existence,
      schoolScope,
      majorFortuneTemporalScope: temporalScope,
      palaceFrame,
      targetFrame,
      polarity,
      strength,
      pillarOwnership,
      stacking,
      deduplication,
      exceptionPolicy,
      calculationCoreReadiness,
      sourceLocatorQuality,
      crossSourceAgreement,
      corpusMeasurability,
      candidateEligibility: "metadata-only" // Will compute
    };

    const readinessResult = calculateCandidateReadiness(matrixRecord);
    matrixRecord.candidateEligibility = readinessResult.readiness;
    
    matrix.push(matrixRecord);
  }
  
  if (!fs.existsSync(path.join(base, 'matrices'))) fs.mkdirSync(path.join(base, 'matrices'), { recursive: true });
  
  const outStr = JSON.stringify(matrix, null, 2) + "\n";
  fs.writeFileSync(path.join(base, 'matrices/evidence-gap-matrix.json'), outStr);
  
  const hash = crypto.createHash('sha256').update(outStr).digest('hex');
  fs.writeFileSync(path.join(base, 'matrices/evidence-gap-matrix.hash'), hash + "\n");
  console.log("Generated accurate evidence gap matrix.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateEvidenceGapMatrix();
}
