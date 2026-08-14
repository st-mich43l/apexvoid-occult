#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import discoveryRaw from "../lib/ziwei/analysis/knowledge/palace-overview/v1/benchmark/discovery-config.v1.json";
import {
  discoverCandidates,
  type DiscoveryConfig,
} from "../lib/ziwei/analysis/modules/palace-overview/research/case-discovery";

const config = discoveryRaw as DiscoveryConfig;
const outDir = resolve(import.meta.dirname, "../../.research-artifacts/palace-overview-discovery");
mkdirSync(outDir, { recursive: true });
const candidates = discoverCandidates(config);
const file = resolve(outDir, "candidates.json");
writeFileSync(
  file,
  `${JSON.stringify({ config, candidateCount: candidates.length, candidates }, null, 2)}\n`,
);
console.log(`wrote ${file} (${candidates.length} unique fingerprints)`);
