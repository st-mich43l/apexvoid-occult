import fs from 'fs';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2-dia-loi');

function readJson(filePath: string) {
  const fullPath = path.join(BASE_DIR, filePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

export function validate() {
  const copies = readJson('sources/copy-registry.json');
  if (!copies) {
    console.error('Missing sources/copy-registry.json');
    process.exit(1);
  }
  for (const c of copies) {
    if (c.inspectionStatus === 'verified' && !c.artifactSha256) {
      console.error(`Copy ${c.copyIdentityId} is marked verified but has no artifactSha256.`);
      process.exit(1);
    }
  }

  const locators = readJson('sources/locator-registry.json');
  for (const l of (locators || [])) {
    if (l.verificationStatus === 'verified' && l.copyIdentityId) {
      const copy = copies.find((c: any) => c.copyIdentityId === l.copyIdentityId);
      if (!copy || copy.inspectionStatus !== 'verified') {
        console.error(`Locator ${l.locatorId} cannot be verified if copy is not verified.`);
        process.exit(1);
      }
    }
  }

  const bindings = readJson('bindings/foundation-claim-bindings.json');
  for (const b of (bindings || [])) {
    if (b.schoolScope !== 'nam-phai' && b.schoolScope !== 'trung-chau') {
      console.error(`Invalid school scope: ${b.schoolScope}`);
      process.exit(1);
    }
    if (b.familyId !== 'principal-star-dignity' && b.familyId !== 'vcd-opposite-palace-borrowing') {
      console.error(`Invalid family id: ${b.familyId}`);
      process.exit(1);
    }
  }

  console.log('Validation passed.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validate();
}
