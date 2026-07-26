/**
 * Major Fortune V0.4.2 Determinism Check.
 *
 * Compares a previous audit run directory with the current run.
 * Every artifact hash must match exactly.
 *
 * Usage:
 *   # Run audit twice, then compare:
 *   npm run audit:major-fortune-v042
 *   cp -R research/major-fortune/v0.4.2-audit-truthfulness/reports /tmp/mf-v042-run-1
 *   npm run audit:major-fortune-v042
 *   npm run determinism:major-fortune-v042
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { sha256File } from "../types/hash";
import type { DeterminismReport } from "../types/reports";

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.2-audit-truthfulness");
const REPORTS_DIR = join(ROOT, "reports");
const RUN1_DIR = process.env["MF_V042_RUN1_DIR"] ?? "/tmp/mf-v042-run-1";

function collectFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full).map((f) => join(entry, f)));
    } else if (entry.endsWith(".json") && !entry.includes("decision") && !entry.includes("determinism")) {
      results.push(entry);
    }
  }
  return results;
}

function run(): void {
  console.log(`[determinism] Comparing run 1 (${RUN1_DIR}) vs current run (${REPORTS_DIR})...`);

  if (!existsSync(RUN1_DIR)) {
    console.error(`[determinism] Run 1 directory not found: ${RUN1_DIR}`);
    console.error("[determinism] Run the audit twice and set MF_V042_RUN1_DIR or use /tmp/mf-v042-run-1");
    process.exit(1);
  }

  const run1Files = collectFiles(RUN1_DIR);
  const run2Files = collectFiles(REPORTS_DIR);

  const allFiles = new Set([...run1Files, ...run2Files]);
  const differences: DeterminismReport["differences"] = [];
  let compared = 0;
  let matched = 0;

  for (const file of allFiles) {
    const path1 = join(RUN1_DIR, file);
    const path2 = join(REPORTS_DIR, file);
    const exists1 = existsSync(path1);
    const exists2 = existsSync(path2);

    if (!exists1 || !exists2) {
      differences.push({
        path: file,
        run1Sha256: exists1 ? sha256File(path1) : "missing",
        run2Sha256: exists2 ? sha256File(path2) : "missing",
      });
      continue;
    }

    compared++;
    const hash1 = sha256File(path1);
    const hash2 = sha256File(path2);

    if (hash1 === hash2) {
      matched++;
    } else {
      differences.push({ path: file, run1Sha256: hash1, run2Sha256: hash2 });
    }
  }

  const report: DeterminismReport = {
    schemaVersion: "0.4.2",
    run1Directory: RUN1_DIR,
    run2Directory: REPORTS_DIR,
    comparedArtifacts: compared,
    matchingArtifacts: matched,
    differences,
    deterministicDifferences: differences.length,
    passed: differences.length === 0,
  };

  writeFileSync(join(REPORTS_DIR, "determinism-report.json"), JSON.stringify(report, null, 2), "utf8");

  if (report.passed) {
    console.log(`[determinism] PASSED: ${compared} artifacts compared, all match.`);
  } else {
    console.error(`[determinism] FAILED: ${differences.length} non-deterministic differences.`);
    for (const d of differences.slice(0, 10)) {
      console.error(`  ${d.path}: ${d.run1Sha256} → ${d.run2Sha256}`);
    }
    process.exit(1);
  }
}

try {
  run();
} catch (err) {
  console.error("[determinism] FAILED:", err);
  process.exit(1);
}
