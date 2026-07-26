/**
 * Deterministic SHA256 hashing for audit artifacts.
 * Uses canonical JSON (stable key order, stable array order).
 * Volatile fields (generatedAt timestamps) must be excluded before hashing.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Compute SHA256 of a file's raw bytes.
 */
export function sha256File(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Compute SHA256 of a JSON-serialisable object using canonical JSON.
 * Keys are sorted recursively; arrays are stable.
 * Excludes "generatedAt" and "_volatile" top-level keys if present.
 */
export function sha256Object(value: unknown, excludeKeys: string[] = []): string {
  const canonical = canonicalJson(value, new Set(excludeKeys));
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Compute SHA256 of a UTF-8 string.
 */
export function sha256String(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalJson(value: unknown, excludeKeys: Set<string>): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = value.map((v) => canonicalJson(v, excludeKeys));
    return `[${items.join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => !excludeKeys.has(k))
    .sort();
  const pairs = keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k], excludeKeys)}`);
  return `{${pairs.join(",")}}`;
}
