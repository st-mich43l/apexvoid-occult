#!/usr/bin/env tsx
/** R3 Cleanup CLI — removes tmp scratch directory */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const TMP_DIR = path.resolve(ROOT, '.tmp/major-fortune-dia-loi-r3');

if (fs.existsSync(TMP_DIR)) {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log(`Cleaned up: ${TMP_DIR}`);
} else {
  console.log('Nothing to clean up.');
}
