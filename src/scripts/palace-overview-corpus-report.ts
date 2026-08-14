#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadBenchmarkCasesV2 } from "../lib/ziwei/analysis/modules/palace-overview/calibration/reviews-v2";
import { formatCoverageReport } from "../lib/ziwei/analysis/modules/palace-overview/research/corpus-coverage";
import { collectionStatusJson } from "../lib/ziwei/analysis/modules/palace-overview/calibration/readiness";

const cases = loadBenchmarkCasesV2();
const report = formatCoverageReport(cases);
const status = collectionStatusJson();
console.log(report);
console.log("");
console.log(`Reviews: ${status.collection.reviews}`);
console.log(`Decision: ${status.corpus}`);
const outDir = resolve(import.meta.dirname, "../../.research-artifacts/palace-overview-discovery");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "coverage-report.txt"), `${report}\nDecision: ${status.corpus}\n`);
