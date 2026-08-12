#!/usr/bin/env tsx
/**
 * R3 Generate CLI
 * Orchestrates the full R3 provenance pipeline:
 *   1. Load canonical obligations from R1 report
 *   2. Load normalized intake from tmp
 *   3. Load private inspection manifests
 *   4. Verify copies → verify locators → validate extractions
 *   5. Evaluate bindings → evaluate independence (with lineage model)
 *   6. Evaluate obligations → adjudicate claims → authorize lanes
 *   7. Write all tracked outputs
 */
import fs from 'fs';
import path from 'path';

import { loadCanonicalObligations, loadIfExists } from '../src/load-inputs';
import { verifyCopies } from '../src/verify-copy';
import { verifyLocators } from '../src/verify-locator';
import { validateExtractions } from '../src/validate-extractions';
import { evaluateBindings } from '../src/evaluate-binding';
import { buildEvidenceBearingWorks } from '../src/build-evidence';
import { generateSourceIndependenceReport } from '../src/verify-lineage';
import { evaluateObligations } from '../src/evaluate-obligations';
import { adjudicateClaims } from '../src/adjudicate-claims';
import { authorizeLanes } from '../src/authorize-lanes';
import { writePack } from '../src/write-pack';
import type {
  ArtifactIntakeRecord,
  CopyIdentityInspectionRecord,
  LocatorInspectionRecord,
  SourceExtractionInput,
  FoundationClaimBinding,
  SourceLineageRecord,
  DiscoverySourceLead,
} from '../src/types';

export function runR3Generation(
  baseDir: string,
  opts?: { privateDir?: string; tmpDir?: string }
): void {
  const ROOT = process.cwd();
  const privateDir = opts?.privateDir ?? path.resolve(ROOT, '.research-artifacts/major-fortune/dia-loi');
  const tmpDir = opts?.tmpDir ?? path.resolve(ROOT, '.tmp/major-fortune-dia-loi-r3');

  // 1. Load canonical obligations
  const obligations = loadCanonicalObligations(baseDir);

  // 2. Load discovery registry
  const discoveryRegistry = JSON.parse(
    fs.readFileSync(path.join(baseDir, 'discovery/discovery-source-registry.json'), 'utf8')
  ) as DiscoverySourceLead[];

  // 3. Load normalized intake (from tmp — written by ingest CLI)
  const intakes = loadIfExists<ArtifactIntakeRecord[]>(
    path.join(tmpDir, 'normalized-intake.json'),
    []
  );

  // 4. Load lineage registry (tracked in R3 pack)
  const lineageRegistry = loadIfExists<SourceLineageRecord[]>(
    path.join(baseDir, 'lineage/source-lineage-registry.json'),
    []
  );

  // 5. Load private inspection manifests
  const copyInspections = loadIfExists<CopyIdentityInspectionRecord[]>(
    path.join(privateDir, 'copy-identity-inspection-manifest.json'),
    []
  );

  const locatorInspections = loadIfExists<LocatorInspectionRecord[]>(
    path.join(privateDir, 'locator-inspection-manifest.json'),
    []
  );

  const extractionInputs = loadIfExists<SourceExtractionInput[]>(
    path.join(privateDir, 'extraction-manifest.json'),
    []
  );

  const bindingInputs = loadIfExists<FoundationClaimBinding[]>(
    path.join(privateDir, 'foundation-claim-binding-manifest.json'),
    []
  );

  const claimInputs = loadIfExists<Array<{ claimId: string; familyId: any; schoolScope: any }>>(
    path.join(privateDir, 'claim-registry.json'),
    []
  );

  // 6. Verify copies
  const verifiedCopies = verifyCopies(discoveryRegistry, intakes, copyInspections, privateDir);

  // 7. Verify locators
  const verifiedLocators = verifyLocators(locatorInspections, verifiedCopies);

  // 8. Validate extractions
  const validatedExtractions = validateExtractions(
    extractionInputs,
    verifiedLocators,
    verifiedCopies,
    claimInputs
  );

  // 9. Evaluate bindings
  const evaluatedBindings = evaluateBindings(bindingInputs, validatedExtractions, verifiedLocators);

  // 10. Evaluate source independence (lineage model)
  const evidenceBearingWorks = buildEvidenceBearingWorks(
    verifiedCopies,
    verifiedLocators,
    validatedExtractions,
    lineageRegistry
  );
  const independenceEntries = generateSourceIndependenceReport(evidenceBearingWorks, lineageRegistry);

  // 11. Evaluate obligations
  const obligationEvaluations = evaluateObligations(
    obligations,
    validatedExtractions,
    verifiedLocators,
    evaluatedBindings,
    independenceEntries
  );

  // 12. Adjudicate claims
  const claimAdjudications = adjudicateClaims(
    claimInputs,
    obligationEvaluations,
    validatedExtractions,
    independenceEntries
  );

  // 13. Authorize lanes
  const laneAuthorizations = authorizeLanes(
    claimAdjudications,
    obligationEvaluations,
    independenceEntries
  );

  // 14. Write tracked outputs
  writePack(path.join(baseDir, 'registries/verified-source-copy-registry.json'), verifiedCopies);
  writePack(path.join(baseDir, 'registries/verified-locator-registry.json'), verifiedLocators);
  writePack(path.join(baseDir, 'obligations/obligation-evaluation-registry.json'), obligationEvaluations);
  writePack(path.join(baseDir, 'adjudication/claim-adjudication-registry.json'), claimAdjudications);
  writePack(path.join(baseDir, 'authorization/dia-loi-admission-authorization.json'), laneAuthorizations);
  writePack(path.join(baseDir, 'bindings/foundation-claim-binding-manifest.json'), evaluatedBindings);

  // Canonical obligation claim map
  const obligationClaimMap = obligations.map(o => ({
    obligationId: o.obligationId,
    foundationClaimId: o.foundationClaimId,
    mappingStatus: o.foundationClaimId ? 'verified' : 'not-applicable',
    reasonCodes: [],
  }));
  writePack(path.join(baseDir, 'bindings/canonical-obligation-claim-map.json'), obligationClaimMap);

  console.log(`R3 generation complete.`);
  console.log(`  Verified copies: ${verifiedCopies.filter(c => c.inspectionStatus === 'verified').length}`);
  console.log(`  Verified locators: ${verifiedLocators.filter(l => l.verificationStatus === 'verified').length}`);
  console.log(`  Valid extractions: ${validatedExtractions.filter(e => e.isValid).length}`);
  console.log(`  Obligation evaluations: ${obligationEvaluations.length}`);
  console.log(`  Lane authorizations: ${laneAuthorizations.length}`);
}

// Run when called directly
const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-ingestion-r3-dia-loi');
runR3Generation(baseDir);
