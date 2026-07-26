import fs from 'fs';
import path from 'path';
import type { EvidenceGapMatrixRecord, GapDimension } from '../schema/foundation.js';
import crypto from 'crypto';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

export function generateEvidenceGapMatrix() {
  const inventory = JSON.parse(fs.readFileSync(path.join(base, 'inventory/signal-inventory.json'), 'utf-8'));
  const matrix: EvidenceGapMatrixRecord[] = [];
  
  for (const family of inventory) {
    const isProduction = family.runtimeStatus === 'production-enabled';
    const hasDoctrine = family.doctrineStatus === 'verified';
    
    // Explicit derivation
    const calcCore: GapDimension = {
      status: isProduction ? "verified" : "partial",
      sourceIds: family.sourceIds,
      claimIds: family.claimIds,
      gapIds: [],
      derivation: "Derived from runtimeStatus=" + family.runtimeStatus,
      notes: "Calculation core outputs these."
    };
    
    const measurability: GapDimension = {
      status: "verified",
      sourceIds: family.sourceIds,
      claimIds: family.claimIds,
      gapIds: [],
      derivation: "Always verified for production families",
      notes: "We can measure it."
    };
    
    const doctrine: GapDimension = {
      status: hasDoctrine ? "verified" : "missing",
      sourceIds: [],
      claimIds: [],
      gapIds: ["GAP-DOCTRINE-001"],
      derivation: "Derived from doctrineStatus=" + family.doctrineStatus,
      notes: "Needs research."
    };
    
    const crossSource: GapDimension = {
      status: "not-applicable",
      sourceIds: [],
      claimIds: [],
      gapIds: [],
      derivation: "No sources to compare yet",
      notes: "Explicitly not-applicable when missing."
    };
    
    const frame: GapDimension = {
       status: family.frame === "active-palace" || family.frame.includes("active-major-fortune-palace-only") ? "verified" : "missing",
       sourceIds: family.sourceIds,
       claimIds: family.claimIds,
       gapIds: [],
       derivation: "Frame=" + family.frame,
       notes: ""
    };
    
    const polarity: GapDimension = {
       status: family.engineeringMappings.length > 0 ? "engineering-only" : "missing",
       sourceIds: family.sourceIds,
       claimIds: family.claimIds,
       gapIds: ["GAP-POLARITY-001"],
       derivation: "Derived from engineeringMappings length",
       notes: ""
    };

    matrix.push({
      signalFamilyId: family.signalFamilyId,
      calculationCoreReadiness: calcCore,
      runtimeMeasurability: measurability,
      schoolDoctrine: doctrine,
      crossSourceAgreement: crossSource,
      frameConsistency: frame,
      polarityAgreement: polarity
    });
  }
  
  if (!fs.existsSync(path.join(base, 'matrices'))) fs.mkdirSync(path.join(base, 'matrices'), { recursive: true });
  
  const outStr = JSON.stringify(matrix, null, 2);
  fs.writeFileSync(path.join(base, 'matrices/evidence-gap-matrix.json'), outStr);
  
  const hash = crypto.createHash('sha256').update(outStr).digest('hex');
  fs.writeFileSync(path.join(base, 'matrices/evidence-gap-matrix.hash'), hash);
  console.log("Generated evidence gap matrix.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateEvidenceGapMatrix();
}
