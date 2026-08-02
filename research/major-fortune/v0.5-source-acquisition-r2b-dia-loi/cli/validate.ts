import fs from 'fs';
import path from 'path';

export function runValidate(baseDir: string) {
  const errors: string[] = [];

  const loadJson = (relPath: string) => {
    const fullPath = path.join(baseDir, relPath);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing required report: ${relPath}`);
      return null;
    }
    const text = fs.readFileSync(fullPath, 'utf8');
    if (text.includes(process.cwd())) {
      errors.push(`Absolute path leaked in ${relPath}`);
    }
    return JSON.parse(text);
  };

  const obligations = loadJson('obligations/obligation-evaluation-registry.json');
  if (obligations && Array.isArray(obligations)) {
    if (obligations.length !== 38) {
      errors.push(`Expected exactly 38 obligations, found ${obligations.length}`);
    }
    const ids = new Set(obligations.map(o => o.obligationId));
    if (ids.size !== obligations.length) {
      errors.push(`Duplicate obligation IDs found`);
    }
  }

  const authorizations = loadJson('authorization/dia-loi-admission-authorization.json');
  if (authorizations && Array.isArray(authorizations)) {
    if (authorizations.length !== 4) {
      errors.push(`Expected exactly 4 lane authorizations, found ${authorizations.length}`);
    }
    for (const auth of authorizations) {
      if (auth.authorizedStatus === 'production-admitted') {
        errors.push(`production-admitted status is not allowed in R2b (${auth.familyId}/${auth.schoolScope})`);
      }
    }
  }

  const decision = loadJson('reports/decision.json');
  if (decision && decision.decision === 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS') {
    // Expected baseline
  }

  const result = {
    status: errors.length === 0 ? 'valid' : 'invalid',
    errors
  };

  fs.mkdirSync(path.join(baseDir, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'reports/pack-validation.json'), JSON.stringify(result, null, 2) + '\n');
  
  if (errors.length > 0) {
    console.error('Validation failed:');
    errors.forEach(e => console.error(` - ${e}`));
    process.exit(1);
  } else {
    console.log('Validation complete: valid');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runValidate(baseDir);
}
