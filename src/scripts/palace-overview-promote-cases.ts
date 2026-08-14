#!/usr/bin/env tsx
/**
 * Prints a promotion-ready Benchmark V2 case JSON for listed candidate IDs
 * from a discovery artifact. Does not write canonical files automatically.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DiscoveredCandidate } from "../lib/ziwei/analysis/modules/palace-overview/research/case-discovery";
import { promoteCandidate } from "../lib/ziwei/analysis/modules/palace-overview/research/case-promotion";

const artifact = resolve(
  import.meta.dirname,
  "../../.research-artifacts/palace-overview-discovery/candidates.json",
);
const wanted = new Set(process.argv.slice(2));
if (wanted.size === 0) {
  console.error("usage: research:palace-overview:promote-cases -- <candidateId>...");
  process.exit(2);
}
const payload = JSON.parse(readFileSync(artifact, "utf8")) as { candidates: DiscoveredCandidate[] };
const createdAt = new Date().toISOString();
const promoted = payload.candidates
  .filter((c) => wanted.has(c.candidateId))
  .map((c) => promoteCandidate(c, createdAt));
if (promoted.length !== wanted.size) {
  console.error("some candidate IDs were not in the discovery artifact");
  process.exit(1);
}
console.log(JSON.stringify({ promoted }, null, 2));
