#!/usr/bin/env tsx
import { collectionStatusJson } from "../lib/ziwei/analysis/modules/palace-overview/calibration/readiness";
import { loadBenchmarkCasesV2 } from "../lib/ziwei/analysis/modules/palace-overview/calibration/reviews-v2";
import { formatCoverageReport } from "../lib/ziwei/analysis/modules/palace-overview/research/corpus-coverage";

const status = collectionStatusJson();
console.log(formatCoverageReport(loadBenchmarkCasesV2()));
console.log("");
console.log(JSON.stringify(status, null, 2));
