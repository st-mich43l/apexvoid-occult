import fs from 'fs';
import path from 'path';

export function runCleanup() {
  const tmpDir = path.resolve(process.cwd(), '.tmp/major-fortune-dia-loi-r2b');
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(`Cleaned up temporary directory: ${tmpDir}`);
  } else {
    console.log(`Temporary directory does not exist: ${tmpDir}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCleanup();
}
