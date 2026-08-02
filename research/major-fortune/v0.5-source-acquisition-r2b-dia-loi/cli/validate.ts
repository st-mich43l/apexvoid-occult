import fs from 'fs';
import path from 'path';
import { sha256File } from '../src/canonical-json';

export interface PackValidationReport {
  status: 'valid' | 'invalid';
  checks: Array<{
    checkId: string;
    passed: boolean;
    observed: unknown;
    expected: unknown;
    errors: string[];
  }>;
  errors: string[];
}

export function runValidate(baseDir: string) {
  const report: PackValidationReport = {
    status: 'valid',
    checks: [],
    errors: []
  };

  const addCheck = (id: string, passed: boolean, observed: unknown, expected: unknown, msgs: string[]) => {
    report.checks.push({ checkId: id, passed, observed, expected, errors: msgs });
    if (!passed) report.errors.push(...msgs);
  };

  const loadJson = (relPath: string) => {
    const fullPath = path.join(baseDir, relPath);
    if (!fs.existsSync(fullPath)) return null;
    const text = fs.readFileSync(fullPath, 'utf8');

    // Absolute paths leak check
    const leaked = text.includes(process.cwd());
    addCheck(`no-absolute-paths:${relPath}`, !leaked, leaked, false, leaked ? [`Absolute path leaked in ${relPath}`] : []);

    return JSON.parse(text);
  };

  // 1. Obligations
  const obligations = loadJson('obligations/obligation-evaluation-registry.json');
  if (obligations && Array.isArray(obligations)) {
    addCheck('canonical-obligations-38', obligations.length === 38, obligations.length, 38, obligations.length !== 38 ? ['Expected exactly 38 canonical obligations'] : []);

    const uniqueIds = new Set(obligations.map(o => o.obligationId));
    addCheck('unique-obligation-ids', uniqueIds.size === 38, uniqueIds.size, 38, uniqueIds.size !== 38 ? ['Expected unique obligation IDs to be 38'] : []);

    const uniqueGaps = new Set(obligations.map(o => o.gapId));
    addCheck('unique-gap-ids', uniqueGaps.size === 19, uniqueGaps.size, 19, uniqueGaps.size !== 19 ? ['Expected unique gap IDs to be 19'] : []);

    const dignityCount = obligations.filter(o => o.familyId === 'principal-star-dignity').length;
    addCheck('principal-star-dignity-18', dignityCount === 18, dignityCount, 18, dignityCount !== 18 ? ['Expected 18 dignity obligations'] : []);

    const vcdCount = obligations.filter(o => o.familyId === 'vcd-opposite-palace-borrowing').length;
    addCheck('vcd-obligations-20', vcdCount === 20, vcdCount, 20, vcdCount !== 20 ? ['Expected 20 vcd obligations'] : []);
  } else {
    addCheck('obligations-exist', false, false, true, ['Obligations registry missing']);
  }

  // 2. Authorizations
  const authorizations = loadJson('authorization/dia-loi-admission-authorization.json');
  if (authorizations && Array.isArray(authorizations)) {
    addCheck('authorization-records-4', authorizations.length === 4, authorizations.length, 4, authorizations.length !== 4 ? ['Expected 4 authorization records'] : []);

    const uniqueLanes = new Set(authorizations.map(a => `${a.familyId}/${a.schoolScope}`));
    addCheck('unique-family-school-lanes-4', uniqueLanes.size === 4, uniqueLanes.size, 4, uniqueLanes.size !== 4 ? ['Expected 4 unique family-school lanes'] : []);

    const hasProductionAdmitted = authorizations.some(a => a.authorizedStatus === 'production-admitted');
    addCheck('no-production-admitted', !hasProductionAdmitted, hasProductionAdmitted, false, hasProductionAdmitted ? ['production-admitted status is not allowed in R2b'] : []);
  } else {
    addCheck('authorizations-exist', false, false, true, ['Authorizations registry missing']);
  }

  // 3. Decision
  const decision = loadJson('reports/decision.json');
  if (decision) {
    const lanes = decision.lanes || [];
    addCheck('decision-lanes-4', lanes.length === 4, lanes.length, 4, lanes.length !== 4 ? ['Expected 4 decision lanes'] : []);

    let lanesMatch = true;
    if (authorizations) {
      for (const a of authorizations) {
        const dl = lanes.find((l: any) => l.familyId === a.familyId && l.schoolScope === a.schoolScope);
        if (!dl || dl.status !== a.authorizedStatus) lanesMatch = false;
      }
    }
    addCheck('decision-lanes-match-auth', lanesMatch, lanesMatch, true, !lanesMatch ? ['Decision lanes do not match authorization records'] : []);
  } else {
    addCheck('decision-exists', false, false, true, ['Decision missing']);
  }

  // 4. Acquisition Counters
  const summary = loadJson('reports/acquisition-summary.json');
  if (summary) {
    const reconciledLeads = summary.discoveryLeads === summary.missingArtifacts + summary.artifactsAcquired;
    addCheck('discovery-leads-reconciliation', reconciledLeads, summary.discoveryLeads, summary.missingArtifacts + summary.artifactsAcquired, !reconciledLeads ? ['discoveryLeads != missingArtifacts + artifactsAcquired'] : []);

    const reconciledArtifacts = summary.artifactsAcquired === summary.acquiredUninspected + summary.inspectedUnverified + summary.verifiedCopies + summary.rejectedCopies;
    addCheck('artifacts-acquired-reconciliation', reconciledArtifacts, summary.artifactsAcquired, summary.acquiredUninspected + summary.inspectedUnverified + summary.verifiedCopies + summary.rejectedCopies, !reconciledArtifacts ? ['artifactsAcquired mismatch'] : []);
  } else {
    addCheck('summary-exists', false, false, true, ['Acquisition summary missing']);
  }

  // 5. Manifest Validation
  const manifest = loadJson('reports/artifact-manifest.json');
  if (manifest && Array.isArray(manifest)) {
    let manifestMatchDisk = true;
    let hashesMatch = true;
    let byteMatch = true;
    let noDuplicates = true;
    let noAbsolutePaths = true;
    let noTraversal = true;

    const seenPaths = new Set();
    
    // Check manifest entries
    for (const entry of manifest) {
      if (seenPaths.has(entry.relativePath)) {
        noDuplicates = false;
        addCheck('manifest-no-duplicates', false, false, true, [`Duplicate manifest entry: ${entry.relativePath}`]);
      }
      seenPaths.add(entry.relativePath);

      if (path.isAbsolute(entry.relativePath)) {
        noAbsolutePaths = false;
        addCheck('manifest-no-absolute', false, false, true, [`Absolute path in manifest: ${entry.relativePath}`]);
      }
      if (entry.relativePath.includes('..')) {
        noTraversal = false;
        addCheck('manifest-no-traversal', false, false, true, [`Path traversal in manifest: ${entry.relativePath}`]);
      }

      const fullPath = path.join(baseDir, entry.relativePath);
      if (!fs.existsSync(fullPath)) {
        manifestMatchDisk = false;
        addCheck('manifest-file-exists', false, false, true, [`Missing file on disk: ${entry.relativePath}`]);
        continue;
      }
      if (sha256File(fullPath) !== entry.sha256) {
        hashesMatch = false;
        addCheck('manifest-hash-match', false, false, true, [`Hash mismatch for: ${entry.relativePath}`]);
      }
      if (fs.statSync(fullPath).size !== entry.byteLength) {
        byteMatch = false;
        addCheck('manifest-byte-match', false, false, true, [`Byte length mismatch for: ${entry.relativePath}`]);
      }
    }

    addCheck('manifest-inventory-matches-disk', manifestMatchDisk, manifestMatchDisk, true, !manifestMatchDisk ? ['Manifest files missing on disk'] : []);
    addCheck('manifest-hashes-match', hashesMatch, hashesMatch, true, !hashesMatch ? ['Manifest hashes mismatch'] : []);
    addCheck('manifest-bytes-match', byteMatch, byteMatch, true, !byteMatch ? ['Manifest byte lengths mismatch'] : []);

    // Check for unexpected files in deterministic directories
    const checkDir = (dirRelPath: string) => {
      const fullDir = path.join(baseDir, dirRelPath);
      if (!fs.existsSync(fullDir)) return;
      const files = fs.readdirSync(fullDir);
      for (const f of files) {
        const fp = path.join(fullDir, f);
        if (fs.statSync(fp).isFile() && f.endsWith('.json')) {
          const rel = path.join(dirRelPath, f);
          if (rel !== 'reports/artifact-manifest.json' && rel !== 'reports/pack-validation.json') {
            if (!seenPaths.has(rel)) {
              addCheck('manifest-no-unexpected-files', false, false, true, [`Unexpected file on disk not in manifest: ${rel}`]);
            }
          }
        }
      }
    };
    checkDir('sources');
    checkDir('bindings');
    checkDir('obligations');
    checkDir('authorization');
    checkDir('adjudication');
    checkDir('reports');

  } else {
    addCheck('manifest-exists', false, false, true, ['Artifact manifest missing']);
  }

  // Determine final status
  if (report.errors.length > 0) report.status = 'invalid';

  fs.mkdirSync(path.join(baseDir, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'reports/pack-validation.json'), JSON.stringify(report, null, 2) + '\n');

  if (report.status === 'invalid') {
    console.error('Validation failed:');
    report.errors.forEach(e => console.error(` - ${e}`));
    process.exit(1);
  } else {
    console.log('Validation complete: valid');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runValidate(baseDir);
}
