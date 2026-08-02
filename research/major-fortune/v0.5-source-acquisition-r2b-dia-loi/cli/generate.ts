import fs from 'fs';
import path from 'path';
import { loadCanonicalObligations } from '../src/load-inputs';
import { validateIntakeManifest } from '../src/validate-intake';
import { verifyCopies } from '../src/verify-copy';
import { verifyLocators } from '../src/verify-locator';
import { evaluateIndependence } from '../src/evaluate-independence';
import { evaluateBinding } from '../src/evaluate-binding';
import { evaluateObligations } from '../src/evaluate-obligations';
import { adjudicateClaims } from '../src/adjudicate-claims';
import { authorizeLanes } from '../src/authorize-lanes';
import { writePack } from '../src/write-pack';
import { validateExtractions } from '../src/validate-extractions';
import { deriveDecision } from '../src/derive-decision';

function loadIfExists(filePath: string, defaultVal: any = []) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return defaultVal;
}

export function runGeneration(baseDir: string) {
  const privateDir = path.resolve(process.cwd(), '.research-artifacts/major-fortune/dia-loi');
  
  // 1. Load inputs
  const discoveryRegistryPath = path.join(baseDir, 'discovery/discovery-source-registry.json');
  const discoveryRegistry = JSON.parse(fs.readFileSync(discoveryRegistryPath, 'utf8'));

  const intakeManifestPath = path.join(privateDir, 'artifact-intake-manifest.json');
  const policyPath = path.join(baseDir, 'config/acquisition-policy.json');
  let allowedMethods = ["owned-physical-copy-scan", "licensed-digital-copy", "library-access", "public-domain-archive", "other-authorized-access"];
  if (fs.existsSync(policyPath)) {
    allowedMethods = JSON.parse(fs.readFileSync(policyPath, 'utf8')).allowedMethods || allowedMethods;
  }
  const intakes = validateIntakeManifest(intakeManifestPath, allowedMethods, true);
  
  const copyInspections = loadIfExists(path.join(privateDir, 'copy-identity-inspection-manifest.json'));
  const locatorInspections = loadIfExists(path.join(privateDir, 'locator-inspection-manifest.json'));
  const extractionsInput = loadIfExists(path.join(privateDir, 'extraction-manifest.json'));
  const bindingsInput = loadIfExists(path.join(privateDir, 'foundation-claim-binding-manifest.json'));
  const claimsInput = loadIfExists(path.join(privateDir, 'claim-registry.json'));
  const contradictionsInput = loadIfExists(path.join(privateDir, 'contradiction-manifest.json'));
  
  // 2. Verify copies
  const verifiedCopies = verifyCopies(discoveryRegistry, intakes, copyInspections);
  
  // 3. Verify locators
  const locators = verifyLocators(locatorInspections, verifiedCopies);
  
  // 4. Validate Extractions
  const extractions = validateExtractions(extractionsInput, locators);

  // 5. Evaluate Bindings
  const bindings = evaluateBinding(bindingsInput, extractions);
  
  // 6. Obligations
  const obligationsInput = loadCanonicalObligations();
  const obligations = evaluateObligations(obligationsInput, extractions, locators, bindings);
  
  // 7. Independence
  const independenceResults = [];
  const families = ['principal-star-dignity', 'vcd-opposite-palace-borrowing'] as const;
  const schools = ['nam-phai', 'trung-chau'] as const;

  // Independence should be evaluated per dimension and claim. Since R1 is 38 obligations, we iterate over them.
  for (const obs of obligations) {
    if (obs.dimension === 'crossSourceAgreement' || obs.dimension === 'source-independence' || true) {
      // Actually, evaluate for all just to be safe, or just collect from what is available.
      // Let's just evaluate independence for the families and schools where we have claims.
      // Wait, we need it per claim & dimension.
    }
  }

  // To simplify for the R2b CI closure: we need to run evaluateIndependence per lane. The required output expects one per family/school (like the original scaffold).
  // Wait, I changed evaluateIndependence to require dimension and claimId. Let's revert that part if we just need it per family/school?
  // "Independence must be evaluated only from sources that support the same: family, school, dimension, claim."
  // So I'll loop over all unique claims and dimensions.
  const uniqueClaims = new Set(extractions.map(e => e.claimId));
  const uniqueDimensions = new Set(obligationsInput.map(o => o.dimension));
  
  for (const f of families) {
    for (const s of schools) {
      for (const claimId of uniqueClaims) {
        for (const dim of uniqueDimensions) {
          const result = evaluateIndependence(f, s, dim, claimId, extractions, locators, verifiedCopies);
          if (result.status !== 'not-required') {
            independenceResults.push(result);
          }
        }
      }
      
      // If we have no claims, we still need an independence result for the lane?
      // No, authorizeLanes looks for independenceResults for the family/school.
      // Wait, if no claims, it's missing claims anyway. But authorizeLanes expects `find(i => i.familyId === family && i.schoolScope === school)`.
      // I will generate a fallback independence result if none generated.
      if (!independenceResults.find(i => i.familyId === f && i.schoolScope === s)) {
        independenceResults.push({
          familyId: f,
          schoolScope: s,
          dimension: 'overall',
          claimId: 'none',
          candidateCanonicalWorkIds: [],
          independentCanonicalWorkIds: [],
          status: 'insufficient',
          reasonCodes: ['NO_CLAIMS_FOR_INDEPENDENCE']
        });
      }
    }
  }

  // 8. Adjudicate
  const adjudications = adjudicateClaims(claimsInput, obligations, extractions);
  
  // 9. Authorize Lanes
  const authorizations = authorizeLanes(adjudications, obligations, independenceResults);
  
  // 10. Write outputs
  writePack(baseDir, 'sources/copy-registry.json', verifiedCopies);
  writePack(baseDir, 'sources/locator-registry.json', locators);
  writePack(baseDir, 'bindings/foundation-claim-bindings.json', bindings);
  writePack(baseDir, 'obligations/obligation-evaluation-registry.json', obligations);
  writePack(baseDir, 'reports/cross-source-agreement-report.json', independenceResults);
  writePack(baseDir, 'adjudication/claim-adjudication-registry.json', adjudications);
  writePack(baseDir, 'authorization/dia-loi-admission-authorization.json', authorizations);

  const decision = deriveDecision(authorizations);
  writePack(baseDir, 'reports/decision.json', decision);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runGeneration(baseDir);
}
