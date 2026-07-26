import fs from 'fs';
import path from 'path';

let baseDir = process.cwd();

export function validateFoundation(opts?: any) {
  let inventory, reconciliation, matrices, schoolPolicy, readiness, corpus, contradictions, decision;
  
  if (opts && opts.inventory) {
    // We are running in a mock context for Vitest
    inventory = opts.inventory;
    reconciliation = opts.reconciliation;
    matrices = opts.matrices;
    schoolPolicy = opts.schoolPolicy;
    readiness = opts.readiness;
    corpus = opts.corpus;
    contradictions = opts.contradictions;
    decision = opts.decision;
  } else {
    // Normal CLI run
    const base = opts?.outputBase || path.join(baseDir, 'research/major-fortune/v0.5-evidence-gap-foundation');
    const runtimeInventory = JSON.parse(fs.readFileSync(path.join(base, 'inventory/runtime-signal-inventory.json'), 'utf-8'));
    const backlogInventory = JSON.parse(fs.readFileSync(path.join(base, 'inventory/research-backlog-registry.json'), 'utf-8'));
    inventory = [...runtimeInventory, ...backlogInventory];
    reconciliation = JSON.parse(fs.readFileSync(path.join(base, 'inventory/provenance-reconciliation.json'), 'utf-8'));
    matrices = JSON.parse(fs.readFileSync(path.join(base, 'matrices/evidence-gap-matrix.json'), 'utf-8'));
    schoolPolicy = JSON.parse(fs.readFileSync(path.join(base, 'matrices/school-policy-matrix.json'), 'utf-8'));
    readiness = JSON.parse(fs.readFileSync(path.join(base, 'matrices/candidate-readiness-matrix.json'), 'utf-8'));
    corpus = JSON.parse(fs.readFileSync(path.join(base, 'reports/corpus-gap-report.json'), 'utf-8'));
    contradictions = JSON.parse(fs.readFileSync(path.join(base, 'contradictions/contradiction-log.json'), 'utf-8'));
    decision = JSON.parse(fs.readFileSync(path.join(base, 'decision.json'), 'utf-8'));
  }

  // 3. Runtime identifier omitted
  const elementRelation = inventory.find((f: any) => f.signalFamilyId === 'element-relation');
  if (elementRelation && elementRelation.runtimeStatus === 'production-enabled' && (!elementRelation.sourceIds || elementRelation.sourceIds.length === 0)) {
     throw new Error("Missing production family source for element-relation");
  }

  // 1. Exact SRC constant not extracted
  for (const rec of reconciliation) {
     if (rec.identifierKind === 'source') {
       const found = inventory.some((fam: any) => fam.sourceIds && fam.sourceIds.includes(rec.identifier));
       if (!found && rec.origin === 'runtime') {
          throw new Error("Runtime source ID does not exist in inventory");
       }
     }
  }

  // 4. Invented runtime identifier
  for (const rec of reconciliation) {
     if (rec.origin === 'runtime' && (!rec.definingPath || !rec.definingSymbol)) {
        throw new Error("Invented runtime identifier or missing path/symbol");
     }
  }

  // 7. Wrong active-palace frame for hinh-ho-set
  const hinhHo = inventory.find((f: any) => f.signalFamilyId === 'hinh-ho-set');
  if (hinhHo && hinhHo.frame === 'tam-phuong-tu-chinh') {
     throw new Error("Wrong active-palace frame for hinh-ho-set");
  }

  // 8. Wrong school gate for major-fortune-transformations
  const xf = inventory.find((f: any) => f.signalFamilyId === 'major-fortune-transformations');
  if (xf && (!xf.schoolScope.includes('nam-phai') || !xf.schoolScope.includes('trung-chau'))) {
     throw new Error("Wrong school gate for major-fortune-transformations");
  }

  // 9. same_element marked neutral
  if (elementRelation && elementRelation.engineeringMappings) {
     const sameEl = elementRelation.engineeringMappings.find((m: any) => m.scenario === 'same_element');
     if (sameEl && sameEl.direction === 'neutral') {
        throw new Error("same_element marked neutral");
     }
  }

  // 10. Backlog family omitted
  const vcdBacklog = inventory.find((f: any) => f.signalFamilyId === 'vcd-opposite-palace-borrowing');
  if (!vcdBacklog) {
     throw new Error("Backlog family omitted");
  }

  // 12. All observations reported Vô Chính Diệu
  if (corpus && corpus.diaLoi) {
     if (corpus.diaLoi.onePrincipalCases === 0 && corpus.diaLoi.twoPrincipalCases === 0) {
        throw new Error("All observations reported Vô Chính Diệu");
     }
  }

  // 13. All relation distributions empty
  if (corpus && corpus.thienThoi) {
     if (Object.keys(corpus.thienThoi.elementRelationDistribution || {}).length === 0) {
        throw new Error("All relation distributions empty");
     }
  }

  // 14. same_element count equals every observation without evidence
  if (corpus && corpus.thienThoi) {
     if (corpus.thienThoi.sameElementPolicyCount === corpus.thienThoi.noElementEvidenceObservations && corpus.thienThoi.sameElementPolicyCount > 0) {
        throw new Error("same_element count equals every observation without evidence");
     }
  }

  // 17. Evidence matrix missing a mandatory dimension
  for (const m of matrices) {
     const dimensions = ['existence', 'schoolScope', 'majorFortuneTemporalScope', 'palaceFrame', 'polarity', 'pillarOwnership', 'deduplication', 'calculationCoreReadiness', 'sourceLocatorQuality', 'corpusMeasurability'];
     for (const dim of dimensions) {
        if (!m[dim] || !m[dim].status) {
           throw new Error("Evidence matrix missing a mandatory dimension");
        }
     }
  }

  // 18. Candidate eligible without source locator
  for (const m of matrices) {
     const isElig = m.candidateEligibility === 'eligible-for-shape-design' || (m.candidateEligibility && m.candidateEligibility.status === 'eligible-for-shape-design');
     if (isElig && m.sourceLocatorQuality && m.sourceLocatorQuality.status === 'missing') {
        throw new Error("Candidate eligible without source locator");
     }
  }

  // 22. School matrix assumes shared implementation
  for (const s of schoolPolicy) {
     if (s.sharedImplementation && (!s.runtimeAdmittedByNamPhai || !s.runtimeAdmittedByTrungChau)) {
        throw new Error("School matrix assumes shared implementation");
     }
  }

  // 28. Historical contradiction removed
  if (contradictions && contradictions.contradictions) {
     if (contradictions.contradictions.length === 0) {
        throw new Error("Historical contradiction removed");
     }
  }

  // 29. Numeric candidate field introduced
  for (const fam of inventory) {
     if ('score' in fam) {
        throw new Error("Numeric candidate field introduced");
     }
  }

  // 30. Internal source labelled classical but unscoped
  for (const rec of reconciliation) {
     if (rec.authorityClass === 'school-manual-supported' && rec.origin === 'runtime') {
        throw new Error("Internal source labelled classical but unscoped");
     }
  }

  // 31. Cross-school doctrine fallback detected
  for (const s of schoolPolicy) {
     if (s.crossSchoolFallbackForbidden === false && (!s.sharedImplementation || !s.sharedDoctrine)) {
        throw new Error("Cross-school doctrine fallback detected");
     }
  }

  // 32. Claim ID used as a source ID
  for (const fam of inventory) {
     for (const clm of (fam.claimIds || [])) {
        if (clm.startsWith('SRC-')) {
           throw new Error("Claim ID used as a source ID");
        }
     }
  }
  
  if (decision && decision.decision !== 'MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN') {
    throw new Error("Invalid decision outcome.");
  }
  
  console.log("Validation passed. Foundation is structurally sound.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateFoundation();
}
