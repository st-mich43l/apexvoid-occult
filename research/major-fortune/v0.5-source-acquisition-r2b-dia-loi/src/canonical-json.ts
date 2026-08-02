import crypto from 'crypto';
import fs from 'fs';

function canonicalStringify(value: any): string {
  if (value === null) return 'null';
  if (typeof value !== 'object') {
    if (typeof value === 'string') return JSON.stringify(value);
    return String(value);
  }

  if (Array.isArray(value)) {
    const arrayElements = value.map(canonicalStringify).join(',');
    return `[${arrayElements}]`;
  }

  const keys = Object.keys(value).sort();
  const sortedObj = keys.map(k => `${JSON.stringify(k)}:${canonicalStringify(value[k])}`).join(',');
  return `{${sortedObj}}`;
}

function sha256Bytes(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function sha256File(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const fileBuffer = fs.readFileSync(filePath);
  return sha256Bytes(fileBuffer);
}

function sha256CanonicalJson(obj: any): string {
  const str = canonicalStringify(obj);
  return sha256Bytes(Buffer.from(str, 'utf8'));
}

export function generateDeterministicId(prefix: string, seed: string): string {
  const hash = crypto.createHash('sha256').update(seed, 'utf8').digest('hex').substring(0, 12);
  return `${prefix}-${hash}`;
}
