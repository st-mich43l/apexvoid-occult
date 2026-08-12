import crypto from 'crypto';
import fs from 'fs';

/** Canonical JSON: sort keys, no extra whitespace */
function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/** SHA-256 of a string (hex) */
function sha256String(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/** SHA-256 of a file on disk (hex) */
export function sha256File(filePath: string): string {
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

/** Deterministic ID from a seed string */
export function generateDeterministicId(seed: string): string {
  return sha256String(seed).slice(0, 32);
}

/** Redact absolute paths from a string, replacing with a normalized relative form */
export function redactAbsolutePath(input: string): string {
  // Replace /home/..., /Users/..., C:\Users\... etc.
  return input
    .replace(/\/home\/[^/\s"]+\//g, '<home>/')
    .replace(/\/Users\/[^/\s"]+\//g, '<home>/')
    .replace(/[A-Z]:\\Users\\[^\\s"]+\\/g, '<home>\\');
}
