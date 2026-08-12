import fs from 'fs';
import path from 'path';

/** Write a value as formatted JSON to a file, creating parent directories as needed */
export function writePack(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
