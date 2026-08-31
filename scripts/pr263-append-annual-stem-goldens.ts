/**
 * PR #263 — append-only golden migration for new annual-stem cases.
 * Never rewrites existing case IDs. STOP if an old case would drift.
 *
 * Run: npx tsx --tsconfig tsconfig.app.json scripts/pr263-append-annual-stem-goldens.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOLDEN_CASES } from "./golden-cases";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GOLDEN_DIR = path.join(ROOT, "tests/golden");

const SCHOOLS = ["nam-phai", "trung-chau"] as const;
type School = (typeof SCHOOLS)[number];

const ENGINE_PATHS: Record<School, string> = {
  "nam-phai": path.join(ROOT, "src/lib/ziwei/engine-nam-phai.ts"),
  "trung-chau": path.join(ROOT, "src/lib/ziwei/engine-trung-chau.ts"),
};

function decycle(root: unknown): unknown {
  const seen = new Map<object, string>();
  function walk(value: unknown, pathStr: string): unknown {
    if (value === null || typeof value !== "object") return value;
    const obj = value as object;
    const existing = seen.get(obj);
    if (existing) return { $ref: existing };
    seen.set(obj, pathStr);
    if (Array.isArray(obj)) {
      return obj.map((item, i) => walk(item, `${pathStr}[${i}]`));
    }
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      out[key] = walk((obj as Record<string, unknown>)[key], `${pathStr}.${key}`);
    }
    return out;
  }
  return walk(root, "$");
}

function firstDiff(a: unknown, b: unknown, pathStr = "$"): string | null {
  if (Object.is(a, b)) return null;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return `${pathStr} (${JSON.stringify(a)} != ${JSON.stringify(b)})`;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return `${pathStr} (array mismatch)`;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return `${pathStr}.length (${a.length} != ${b.length})`;
    }
    for (let i = 0; i < a.length; i++) {
      const d = firstDiff(a[i], b[i], `${pathStr}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  const ak = Object.keys(a as object);
  const bk = Object.keys(b as object);
  const keys = new Set([...ak, ...bk]);
  for (const k of keys) {
    const d = firstDiff(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k],
      `${pathStr}.${k}`,
    );
    if (d) return d;
  }
  return null;
}

async function main() {
  const newCaseIds = new Set(
    GOLDEN_CASES.filter((c) => c.id.startsWith("annual-stem-")).map((c) => c.id),
  );
  if (newCaseIds.size !== 10) {
    throw new Error(`expected 10 annual-stem-* cases, got ${newCaseIds.size}`);
  }

  for (const school of SCHOOLS) {
    const engineMod = await import(ENGINE_PATHS[school]);
    const calculate = engineMod.calculate as (input: unknown) => unknown;
    const filePath = path.join(GOLDEN_DIR, `tuvi-${school}.json`);
    const existing = JSON.parse(readFileSync(filePath, "utf-8")) as {
      cases: Array<{ id: string; label: string; input: unknown; output: unknown }>;
    };
    const byId = new Map(existing.cases.map((c) => [c.id, c]));

    let unexpected = 0;
    for (const c of GOLDEN_CASES) {
      if (newCaseIds.has(c.id)) continue;
      const expected = byId.get(c.id);
      if (!expected) {
        console.error(`UNEXPECTED missing old case ${school}/${c.id}`);
        unexpected++;
        continue;
      }
      const actual = decycle(calculate(c.input));
      const diff = firstDiff(actual, expected.output);
      if (diff) {
        console.error(`UNEXPECTED_EXISTING_CASE_DELTA ${school}/${c.id}: ${diff}`);
        unexpected++;
      }
    }
    if (unexpected > 0) {
      throw new Error(`STOP: ${unexpected} unexpected existing-case deltas for ${school}`);
    }

    const appended = [...existing.cases];
    for (const c of GOLDEN_CASES) {
      if (!newCaseIds.has(c.id)) continue;
      if (byId.has(c.id)) {
        throw new Error(`STOP: new case id already present: ${c.id}`);
      }
      appended.push({
        id: c.id,
        label: c.label,
        input: c.input,
        output: decycle(calculate(c.input)),
      });
    }

    writeFileSync(filePath, JSON.stringify({ cases: appended }, null, 2) + "\n", "utf-8");
    const stems = new Set(
      appended.map((c) => (c.output as { annualStem?: string }).annualStem).filter(Boolean),
    );
    console.log(
      `[${school}] old=${existing.cases.length} new=+${newCaseIds.size} total=${appended.length} annualStems=${stems.size}/10`,
    );
  }
  console.log("EXPECTED_NEW_CORPUS=10 per school");
  console.log("UNEXPECTED_EXISTING_CASE_DELTA=0");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
