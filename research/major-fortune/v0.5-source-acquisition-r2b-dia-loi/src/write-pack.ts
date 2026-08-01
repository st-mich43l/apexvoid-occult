import fs from 'fs';
import path from 'path';

export function writePack(baseDir: string, filePath: string, data: any) {
  const fullPath = path.join(baseDir, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
