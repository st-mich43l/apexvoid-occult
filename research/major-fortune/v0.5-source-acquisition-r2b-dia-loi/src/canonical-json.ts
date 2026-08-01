import crypto from 'crypto';

export function createCanonicalJsonHash(obj: any): string {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') return String(obj);
  
  if (Array.isArray(obj)) {
    const arrayElements = obj.map(createCanonicalJsonHash).join(',');
    return crypto.createHash('sha256').update(`[${arrayElements}]`).digest('hex');
  }

  const keys = Object.keys(obj).sort();
  const sortedObj = keys.map(k => `${k}:${createCanonicalJsonHash(obj[k])}`).join(',');
  return crypto.createHash('sha256').update(`{${sortedObj}}`).digest('hex');
}

export function computeFileSha256(filePath: string): string {
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export function generateDeterministicId(prefix: string, seed: string): string {
  const hash = crypto.createHash('sha256').update(seed).digest('hex').substring(0, 12);
  return `${prefix}-${hash}`;
}
