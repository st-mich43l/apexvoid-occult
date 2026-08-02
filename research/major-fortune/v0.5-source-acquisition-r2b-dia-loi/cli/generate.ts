import fs from 'fs';
import path from 'path';
import { mapObligationClaims } from "../src/map-obligation-claims";
import { loadCanonicalObligations } from '../src/load-inputs';
import { verifyCopies } from '../src/verify-copy';
import { verifyLocators } from '../src/verify-locator';
import { evaluateIndependence } from '../src/evaluate-independence';
import { evaluateBinding } from '../src/evaluate-binding';
import { evaluateObligations } from '../src/evaluate-obligations';
import { adjudicateClaims } from '../src/adjudicate-claims';
import { authorizeLanes } from '../src/authorize-lanes';
import { writePack } from '../src/write-pack';
import { validateExtractions } from '../src/validate-extractions';
// no deriveDecision import
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

  const normalizedIntakePath = path.resolve(process.cwd(), '.tmp/major-fortune-dia-loi-r2b/normalized-intake.json');
  let intakes = [];
  if (fs.existsSync(normalizedIntakePath)) {
    intakes = JSON.parse(fs.readFileSync(normalizedIntakePath, 'utf8'));
  }

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
  const extractions = validateExtractions(extractionsInput, locators, verifiedCopies, claimsInput);

  // 5. Evaluate Bindings
  const bindings = evaluateBinding(bindingsInput, extractions, claimsInput);

  // 6. Independence
  const independenceResults = [];
  const families = ['principal-star-dignity', 'vcd-opposite-palace-borrowing'] as const;
  const schools = ['nam-phai', 'trung-chau'] as const;

  const obligationsInputRaw = loadCanonicalObligations();
  const obligationsInput = mapObligationClaims(baseDir, obligationsInputRaw);

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

  // 7. Obligations
  const obligations = evaluateObligations(obligationsInput, extractions, locators, bindings, independenceResults);

  // 8. Adjudicate
  const adjudications = adjudicateClaims(claimsInput, obligations, extractions, contradictionsInput);

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

  // Decision is now written by cli/decision.ts
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runGeneration(baseDir);
}
