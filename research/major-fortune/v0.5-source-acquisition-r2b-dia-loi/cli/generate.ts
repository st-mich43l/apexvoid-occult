import fs from 'fs';
import path from 'path';
import { getExpectedObligations, getDiaLoiGaps } from '../src/load-inputs';
import { validateIntakeManifest } from '../src/validate-intake';
import { verifyCopies } from '../src/verify-copy';
import { verifyLocators } from '../src/verify-locator';
import { evaluateIndependence } from '../src/evaluate-independence';
import { evaluateBinding } from '../src/evaluate-binding';
import { evaluateObligations } from '../src/evaluate-obligations';
import { adjudicateClaims } from '../src/adjudicate-claims';
import { authorizeLanes } from '../src/authorize-lanes';
import { writePack } from '../src/write-pack';

export function runGeneration(baseDir: string) {
  // 1. Load inputs
  const discoveryRegistryPath = path.join(baseDir, 'discovery/discovery-source-registry.json');
  const discoveryRegistry = JSON.parse(fs.readFileSync(discoveryRegistryPath, 'utf8'));

  const intakeManifestPath = path.join(process.cwd(), '.research-artifacts/major-fortune/dia-loi/artifact-intake-manifest.json');
  const allowedMethods = ["owned-physical-copy-scan", "licensed-digital-copy", "library-access", "public-domain-archive", "other-authorized-access"];
  
  const intakes = validateIntakeManifest(intakeManifestPath, allowedMethods, true);
  
  // 2. Verify copies
  const verifiedCopies = verifyCopies(discoveryRegistry, intakes);
  
  // 3. Verify locators
  // In reality, we'd have a locator inspection manifest from researchers. Since we don't have one provided in the instructions,
  // we default to empty if not found, resulting in unverified locators.
  const locators = verifyLocators([], verifiedCopies);
  
  // 4. Extract claims/bindings/extractions (Mocking the researcher's explicit input for now, since it wasn't supplied in intake)
  // For CI baseline, these are empty since there are no verified copies.
  const extractions: any[] = [];
  const bindingsInput: any[] = [];
  const claimsInput: any[] = [];
  
  const bindings = evaluateBinding(bindingsInput, extractions);
  
  // 5. Obligations
  const gaps = getDiaLoiGaps();
  const obligations = evaluateObligations(gaps, extractions, locators);
  
  // 6. Independence
  const independenceResults = [
    evaluateIndependence('principal-star-dignity', 'nam-phai', verifiedCopies, true),
    evaluateIndependence('principal-star-dignity', 'trung-chau', verifiedCopies, true),
    evaluateIndependence('vcd-opposite-palace-borrowing', 'nam-phai', verifiedCopies, true),
    evaluateIndependence('vcd-opposite-palace-borrowing', 'trung-chau', verifiedCopies, true)
  ];
  
  // 7. Adjudicate
  const adjudications = adjudicateClaims(claimsInput, obligations, extractions);
  
  // 8. Authorize Lanes
  const authorizations = authorizeLanes(adjudications, obligations, independenceResults);
  
  // 9. Write outputs
  writePack(baseDir, 'sources/copy-registry.json', verifiedCopies);
  writePack(baseDir, 'sources/locator-registry.json', locators);
  writePack(baseDir, 'bindings/foundation-claim-bindings.json', bindings);
  writePack(baseDir, 'obligations/obligation-evaluation-registry.json', obligations);
  writePack(baseDir, 'reports/cross-source-agreement-report.json', independenceResults);
  writePack(baseDir, 'adjudication/claim-adjudication-registry.json', adjudications);
  writePack(baseDir, 'authorization/dia-loi-admission-authorization.json', authorizations);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runGeneration(baseDir);
}
