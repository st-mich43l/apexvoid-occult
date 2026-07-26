import fs from 'fs';
import path from 'path';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

function loadJson(relPath: string) {
  const p = path.join(base, relPath);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function reportFoundation() {
  const inventory = loadJson('inventory/signal-inventory.json') || [];
  const reconciliation = loadJson('inventory/provenance-reconciliation.json') || [];
  const matrix = loadJson('matrices/evidence-gap-matrix.json') || [];
  const readiness = loadJson('matrices/candidate-readiness-matrix.json') || [];
  const contradictions = loadJson('contradictions/contradiction-log.json') || { contradictions: [] };
  const sourceAcq = loadJson('queue/source-acquisition-queue.json') || [];
  const claimAdj = loadJson('queue/claim-adjudication-queue.json') || [];
  const calcCore = loadJson('queue/calculation-core-gap-queue.json') || [];
  const corpusReport = loadJson('reports/corpus-gap-report.json');

  const prodEnabled = inventory.filter((i: any) => i.runtimeStatus === 'production-enabled').length;
  const prodBlockedEv = inventory.filter((i: any) => i.runtimeStatus === 'production-blocked-on-evidence').length;
  const prodBlockedCore = inventory.filter((i: any) => i.runtimeStatus === 'production-blocked-on-calculation-core').length;
  
  const provenanceAuthClasses = reconciliation.reduce((acc: any, cur: any) => {
    acc[cur.authorityClass] = (acc[cur.authorityClass] || 0) + 1;
    return acc;
  }, {});

  const readys = readiness.filter((r: any) => r.readiness === "eligible-for-shape-design").length;
  const resBlocked = readiness.filter((r: any) => r.readiness === "research-blocked").length;
  const calcBlocked = readiness.filter((r: any) => r.readiness === "blocked-by-calculation-core").length;
  
  let metricCount = 0;
  if (corpusReport) {
     const t = corpusReport;
     if (t.thienThoi.evidenceEmissionCount === 0 && t.diaLoi.voChinhDieuObservations === 0 && t.nhanHoa.noEvidenceObservations === 0 && t.tuHoa.resolvedTuples === 0) {
        throw new Error("Placeholder corpus report containing all-zero metrics");
     }
     if (t.tuHoa.measurableNatalTransitCollisions === 0) {
        throw new Error("Unmeasurable metric represented as numeric zero");
     }
  }

  console.log("=== V0.5 Evidence Gap Foundation Report ===");
  console.log(`Total Families in Inventory: ${inventory.length}`);
  console.log(`  Production Enabled: ${prodEnabled}`);
  console.log(`  Blocked on Evidence: ${prodBlockedEv}`);
  console.log(`  Blocked on Calc Core: ${prodBlockedCore}`);
  console.log(`Provenance Authority Classes:`, provenanceAuthClasses);
  console.log(`Candidate Readiness:`);
  console.log(`  Ready: ${readys}`);
  console.log(`  Research Blocked: ${resBlocked}`);
  console.log(`  Blocked by Calculation Core: ${calcBlocked}`);
  console.log(`Queues:`);
  console.log(`  Source Acquisition: ${sourceAcq.length} items`);
  console.log(`  Claim Adjudication: ${claimAdj.length} items`);
  console.log(`  Calculation Core: ${calcCore.length} items`);
  console.log(`Contradictions: ${contradictions.contradictions.length}`);
  console.log("===========================================");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  reportFoundation();
}
