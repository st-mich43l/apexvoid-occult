import { execSync } from "node:child_process";
import { cpSync, rmSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { compareDeterminismRuns } from "./compare-runs.js";

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.4-verification-closure");
const REPORTS_DIR = join(ROOT, "reports");
const RAW_DIR = join(REPORTS_DIR, "raw");

const RUN_A_DIR = join(ROOT, "determinism", "runA");
const RUN_B_DIR = join(ROOT, "determinism", "runB");

function runDeterminismAudit() {
  console.log("[determinism] Starting determinism audit...");
  
  if (existsSync(RUN_A_DIR)) rmSync(RUN_A_DIR, { recursive: true, force: true });
  if (existsSync(RUN_B_DIR)) rmSync(RUN_B_DIR, { recursive: true, force: true });
  mkdirSync(RUN_A_DIR, { recursive: true });
  mkdirSync(RUN_B_DIR, { recursive: true });

  // Clean RAW_DIR before Run A
  if (existsSync(RAW_DIR)) rmSync(RAW_DIR, { recursive: true, force: true });
  
  // Run A
  console.log("[determinism] Executing Run A...");
  execSync("npx -y tsx research/major-fortune/v0.4.4-verification-closure/cli/audit.ts", { stdio: "inherit" });
  cpSync(RAW_DIR, RUN_A_DIR, { recursive: true });

  // Clear RAW_DIR
  rmSync(RAW_DIR, { recursive: true, force: true });

  // Run B
  console.log("[determinism] Executing Run B...");
  execSync("npx -y tsx research/major-fortune/v0.4.4-verification-closure/cli/audit.ts", { stdio: "inherit" });
  cpSync(RAW_DIR, RUN_B_DIR, { recursive: true });

  // Compare
  console.log("[determinism] Comparing artifacts...");
  const report = compareDeterminismRuns(RUN_A_DIR, RUN_B_DIR);
  
  // Clean up
  rmSync(RUN_A_DIR, { recursive: true, force: true });
  rmSync(RUN_B_DIR, { recursive: true, force: true });

  // Output report
  writeFileSync(join(REPORTS_DIR, "determinism-report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(`[determinism] Determinism audit passed: ${report.passed}`);
  if (!report.passed) {
    console.error("[determinism] FAILED: Runs are not deterministic.");
    process.exit(1);
  }
}

runDeterminismAudit();
