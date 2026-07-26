import fs from 'fs';
import path from 'path';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

export function validateFoundation(mocks?: any) {
  const inventory = mocks?.inventory || JSON.parse(fs.readFileSync(path.join(base, 'inventory/signal-inventory.json'), 'utf-8'));
  const reconciliation = mocks?.reconciliation || JSON.parse(fs.readFileSync(path.join(base, 'inventory/provenance-reconciliation.json'), 'utf-8'));
  const matrices = mocks?.matrices || JSON.parse(fs.readFileSync(path.join(base, 'matrices/evidence-gap-matrix.json'), 'utf-8'));
  const schoolPolicy = mocks?.schoolPolicy || JSON.parse(fs.readFileSync(path.join(base, 'matrices/school-policy-matrix.json'), 'utf-8'));
  const readiness = mocks?.readiness || JSON.parse(fs.readFileSync(path.join(base, 'matrices/candidate-readiness-matrix.json'), 'utf-8'));
  const corpus = mocks?.corpus || JSON.parse(fs.readFileSync(path.join(base, 'reports/corpus-gap-report.json'), 'utf-8'));
  
  // 1. Structure rules
  for (const f of inventory) {
    if (!f.signalFamilyId) throw new Error("Missing signalFamilyId");
    if (!f.pillarId) throw new Error("Missing pillarId");
    if (f.schoolScope && !Array.isArray(f.schoolScope) && f.schoolScope !== "unresolved") throw new Error("Missing school scope array");
    // if numeric field exists, fail
    if ((f as any).score || (f as any).baseScore || (f as any).multiplier) throw new Error("Numeric candidate field introduced");
  }

  // 2. Cross-reference rules
  for (const f of inventory) {
    if (f.runtimeStatus === 'production-enabled') {
      if (f.sourceIds.length === 0) throw new Error(`Missing production family source for ${f.signalFamilyId}`);
    }
  }

  for (const rec of reconciliation) {
    // Identifier used as wrong kind
    const asSrc = inventory.some((f: any) => f.sourceIds.includes(rec.identifier));
    const asClm = inventory.some((f: any) => f.claimIds.includes(rec.identifier));
    if (rec.identifierKind === 'source' && asClm) throw new Error(`Source ID used as a claim ID: ${rec.identifier}`);
    if (rec.identifierKind === 'claim' && asSrc) throw new Error(`Claim ID used as a source ID: ${rec.identifier}`);
    
    // Identifier doesn't exist
    if (!asSrc && !asClm) {
      if (rec.identifierKind === 'source') throw new Error(`Runtime source ID does not exist in inventory: ${rec.identifier}`);
      if (rec.identifierKind === 'claim') throw new Error(`Runtime claim ID does not exist in inventory: ${rec.identifier}`);
    }
    
    // Missing school scope
    if (!rec.schoolScope || rec.schoolScope.length === 0) throw new Error(`Missing school scope on reconciliation record ${rec.identifier}`);
    
    // Unscoped doctrine check
    if (rec.authorityClass === 'school-manual-supported' && rec.schoolScope.includes('nam-phai') && rec.schoolScope.includes('trung-chau')) {
       throw new Error(`Internal source labelled classical but unscoped: ${rec.identifier}`);
    }
    
    if (rec.origin === 'runtime' && (!rec.definingPath || !rec.definingSymbol)) {
      throw new Error(`Invented runtime identifier or missing path/symbol: ${rec.identifier}`);
    }
  }
  
  // 3. Matrix dimension rules
  for (const m of matrices) {
     if (!m.existence || !m.schoolScope || !m.corpusMeasurability || !m.candidateEligibility) throw new Error(`Evidence matrix missing a mandatory dimension for ${m.signalFamilyId}`);
  }
  
  // 4. Candidate readiness rules
  for (const r of readiness) {
    const mat = matrices.find((m: any) => m.signalFamilyId === r.signalFamilyId);
    if (r.readiness === 'eligible-for-shape-design') {
      if (mat.sourceLocatorQuality.status !== 'verified') throw new Error("Candidate eligible without source locator");
      if (mat.stacking.status !== 'verified' && mat.stacking.status !== 'not-applicable') throw new Error("Candidate eligible without stacking");
      if (mat.exceptionPolicy.status !== 'verified' && mat.exceptionPolicy.status !== 'not-applicable') throw new Error("Candidate eligible without exception policy");
      if (mat.deduplication.status !== 'verified' && mat.deduplication.status !== 'not-applicable' && mat.deduplication.status !== 'engineering-only') throw new Error("Candidate eligible without deduplication policy");
    }
  }

  // 5. Corpus sanity rules
  if (corpus.diaLoi.voChinhDieuObservations > 0 && corpus.diaLoi.voChinhDieuObservations === (corpus.diaLoi.voChinhDieuObservations + corpus.diaLoi.onePrincipalCases + corpus.diaLoi.twoPrincipalCases)) {
     // Usually means the query was badly constructed in simulation
     // In a real corpus of 8000+ there should be some non-VCD cases
     // Let's actually check if 100% of observations were reported VCD by comparing to the total we know
     // If all are VCD, it's simulated.
     throw new Error("All observations reported Vô Chính Diệu - simulated metrics detected");
  }
  
  if (Object.keys(corpus.thienThoi.elementRelationDistribution).length === 0) {
     throw new Error("All relation distributions empty - simulated metrics detected");
  }
  
  if (corpus.thienThoi.sameElementPolicyCount > 0 && corpus.thienThoi.sameElementPolicyCount === corpus.thienThoi.noElementEvidenceObservations) {
     throw new Error("same_element count equals every observation without evidence - simulated metrics detected");
  }
  
  // 6. School policy rules
  for (const s of schoolPolicy) {
     if (!s.crossSchoolFallbackForbidden) throw new Error("Cross-school doctrine fallback detected");
     if (s.sharedImplementation && (!s.runtimeAdmittedByNamPhai || !s.runtimeAdmittedByTrungChau)) throw new Error("School matrix assumes shared implementation without both schools admitting");
  }

  // 7. Extra rules
  const backlogFamilyCheck = inventory.find((f: any) => f.signalFamilyId === 'vcd-opposite-palace-borrowing');
  if (!backlogFamilyCheck) throw new Error("Backlog family omitted");
  
  const hinhHoCheck = inventory.find((f: any) => f.signalFamilyId === 'hinh-ho-set');
  if (hinhHoCheck && hinhHoCheck.frame === 'tam-phuong-tu-chinh') throw new Error("Wrong active-palace frame for hinh-ho-set");
  
  const xfCheck = inventory.find((f: any) => f.signalFamilyId === 'major-fortune-transformations');
  if (xfCheck && !xfCheck.schoolScope.includes('nam-phai')) throw new Error("Wrong school gate for major-fortune-transformations");

  const elementCheck = inventory.find((f: any) => f.signalFamilyId === 'element-relation');
  if (elementCheck && elementCheck.engineeringMappings.some((m: any) => m.scenario === 'same_element' && m.direction === 'neutral')) {
     throw new Error("same_element marked neutral");
  }
  
  const contradictions = mocks?.contradictions || (fs.existsSync(path.join(base, 'contradictions/contradiction-log.json')) ? JSON.parse(fs.readFileSync(path.join(base, 'contradictions/contradiction-log.json'), 'utf-8')) : { contradictions: [] });
  if (!contradictions.contradictions.some((c: any) => c.contradictionId === 'CTR-MFV02-LOC-001')) {
    throw new Error("Historical contradiction removed");
  }
  
  console.log("Validation passed.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateFoundation();
}
