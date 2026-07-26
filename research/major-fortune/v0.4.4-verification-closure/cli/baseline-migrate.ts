/**
 * Major Fortune Baseline Migration (V0.4.4).
 * Repairs observation IDs in the static baselines.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildObservationId } from "../types/audit-observation.js";
import { compareMajorFortuneObservationSets } from "../comparison/compare-observations.js";
import type { MajorFortuneAuditObservation } from "../types/audit-observation.js";
import type { MajorFortuneMigrationReport } from "../types/reports.js";

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.4-verification-closure");
const BASELINES_DIR = join(ROOT, "baselines");
const REPORTS_DIR = join(ROOT, "reports");

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function migrateBaseline(filename: string): { repaired: number; semanticChanges: number } {
  console.log(`[migrate] Migrating ${filename}...`);
  const path = join(BASELINES_DIR, filename);
  const original = loadJson<MajorFortuneAuditObservation[]>(path);
  
  // Clone for migration
  const migrated = JSON.parse(JSON.stringify(original)) as MajorFortuneAuditObservation[];
  
  let repaired = 0;
  let currentChart = "";
  let cycleOrder = 0;

  for (const o of migrated) {
    if (o.chartFixtureId !== currentChart) {
      currentChart = o.chartFixtureId;
      cycleOrder = 0;
    }
    
    const canonicalId = buildObservationId(o.corpusId, o.school, o.chartFixtureId, o.cycleIndex, o.activePalaceIndex);
    
    if (o.observationId !== canonicalId || o.cycleOrder !== cycleOrder) {
      o.observationId = canonicalId;
      o.cycleOrder = cycleOrder;
      repaired++;
    }
    cycleOrder++;
  }

  // Compare semantic changes
  const originalAdjusted = JSON.parse(JSON.stringify(original)) as MajorFortuneAuditObservation[];
  // Align IDs and cycleOrder so we can compare semantics without ID mismatch breaking the diff
  for (let i = 0; i < originalAdjusted.length; i++) {
    originalAdjusted[i]!.observationId = migrated[i]!.observationId;
    originalAdjusted[i]!.cycleOrder = migrated[i]!.cycleOrder;
  }

  const comp = compareMajorFortuneObservationSets(originalAdjusted, migrated, { profile: "fallback-equivalence" });

  console.log(`[migrate] ${filename}: repaired ${repaired} IDs, semantic changes: ${comp.differenceRowCount}`);
  
  if (comp.differenceRowCount === 0) {
    writeFileSync(path, JSON.stringify(migrated, null, 2), "utf8");
    console.log(`[migrate] Successfully overwrote ${filename}.`);
  }

  return { repaired, semanticChanges: comp.differenceRowCount };
}

function run() {
  const baselines = [
    "v0.3.3-nam-phai-fallback.json",
    "v0.4.1-trung-chau-control.json"
  ];

  const report: MajorFortuneMigrationReport = {
    schemaVersion: "0.4.4",
    migratedBaselineCount: baselines.length,
    totalObservationCount: 0,
    repairedObservationIdCount: 0,
    semanticChangeCount: 0,
    migrationMatrix: {},
    passed: true,
  };

  for (const b of baselines) {
    const res = migrateBaseline(b);
    report.migrationMatrix[b] = { repairedIds: res.repaired, semanticChanges: res.semanticChanges };
    report.repairedObservationIdCount += res.repaired;
    report.semanticChangeCount += res.semanticChanges;
  }

  report.passed = report.semanticChangeCount === 0;
  
  writeFileSync(join(REPORTS_DIR, "baseline-migration-equivalence-report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(`[migrate] Passed: ${report.passed}`);
}

run();
