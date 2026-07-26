import fs from 'fs';
import path from 'path';
import type { EvidenceGapMatrixRecord, EvidenceDimension } from '../schema/foundation.js';
import crypto from 'crypto';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

export function generateEvidenceGapMatrix() {
  const inventory = JSON.parse(fs.readFileSync(path.join(base, 'inventory/signal-inventory.json'), 'utf-8'));
  const matrix: EvidenceGapMatrixRecord[] = [];
  
  for (const family of inventory) {
    const isProduction = family.runtimeStatus === 'production-enabled';
    const hasDoctrine = family.doctrineStatus === 'verified';
    const isMeasurable = family.runtimeStatus !== 'production-blocked-on-calculation-core';
    const hasSources = family.sourceIds.length > 0;
    const hasClaims = family.claimIds.length > 0;
    
    const mkDim = (status: EvidenceDimension["status"], derivation: string, notes: string = ""): EvidenceDimension => ({
      status,
      sourceIds: family.sourceIds,
      claimIds: family.claimIds,
      gapIds: status === "missing" ? [`GAP-${family.signalFamilyId.toUpperCase()}-001`] : [],
      derivation,
      notes
    });

    const existence = mkDim(isProduction ? "verified" : (hasDoctrine ? "verified" : "missing"), "Based on runtime/doctrine status", "Existence of phenomenon.");
    const schoolScope = mkDim(family.schoolScope.length > 0 ? "verified" : "missing", "Checked school scope array length.");
    const temporalScope = mkDim("verified", "Always Major Fortune for this context");
    const palaceFrame = mkDim(family.frame ? "verified" : "missing", `Frame is ${family.frame}`);
    const targetFrame = mkDim(family.signalFamilyId === 'major-fortune-transformations' ? "verified" : "not-applicable", "Target frame only applies to transformations.");
    const polarity = mkDim(family.engineeringMappings.length > 0 ? "engineering-only" : "missing", "Derived from engineering mappings.");
    const strength = mkDim(family.engineeringMappings.some((m: any) => m.strength && m.strength !== 'none') ? "engineering-only" : "not-applicable", "Derived from engineering strength mappings.");
    const pillarOwnership = mkDim(family.pillarId && family.pillarId !== "unresolved" ? "verified" : "missing", `Pillar is ${family.pillarId}`);
    const stacking = mkDim("not-applicable", "No stacking rules defined for current evidence.", "Needs future research.");
    const deduplication = mkDim(isProduction ? "engineering-only" : "missing", "Deduplication is currently handled by calculation core or engineering policy.");
    const exceptionPolicy = mkDim("missing", "No explicit exception policy documented.");
    
    const calculationCoreReadiness = mkDim(family.runtimeStatus === 'production-blocked-on-calculation-core' ? "missing" : (isProduction ? "verified" : "partial"), `Status is ${family.runtimeStatus}`);
    
    const sourceLocatorQuality = mkDim(hasSources && hasClaims ? "verified" : "missing", "Requires both sources and claims.");
    
    const crossSourceAgreement = mkDim("not-applicable", "Fewer than two sources to compare.");
    const corpusMeasurability = mkDim(isMeasurable ? "verified" : "missing", "Can be measured from corpus.");

    const candidateEligibilityStatus = [existence, schoolScope, temporalScope, palaceFrame, polarity, pillarOwnership, stacking, deduplication, exceptionPolicy, calculationCoreReadiness, sourceLocatorQuality, corpusMeasurability].every(d => d.status === "verified" || d.status === "not-applicable") ? "eligible-for-shape-design" : "research-blocked";
    
    const candidateEligibility = mkDim(candidateEligibilityStatus, "Derived from all mandatory dimensions.");

    matrix.push({
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
      candidateEligibility
    });
  }
  
  if (!fs.existsSync(path.join(base, 'matrices'))) fs.mkdirSync(path.join(base, 'matrices'), { recursive: true });
  
  const outStr = JSON.stringify(matrix, null, 2);
  fs.writeFileSync(path.join(base, 'matrices/evidence-gap-matrix.json'), outStr);
  
  const hash = crypto.createHash('sha256').update(outStr).digest('hex');
  fs.writeFileSync(path.join(base, 'matrices/evidence-gap-matrix.hash'), hash);
  console.log("Generated 16-dimension evidence gap matrix.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateEvidenceGapMatrix();
}
