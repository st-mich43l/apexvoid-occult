#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingestReviewFile } from "../lib/ziwei/analysis/modules/palace-overview/research/ingest-review";

const file = process.argv[2];
if (!file) {
  console.error("usage: research:palace-overview:ingest-review -- <review.json>");
  process.exit(2);
}
const result = ingestReviewFile(file);
if (!result.ok) {
  console.error(JSON.stringify({ ok: false, errors: result.errors }, null, 2));
  process.exit(1);
}
const outDir = resolve(import.meta.dirname, "../../.research-artifacts/palace-overview-ingest");
mkdirSync(outDir, { recursive: true });
const reviewsOut = resolve(outDir, "merged-reviews.json");
const assignmentsOut = resolve(outDir, "updated-assignments.json");
writeFileSync(reviewsOut, `${JSON.stringify({ reviews: result.merged }, null, 2)}\n`);
writeFileSync(
  assignmentsOut,
  `${JSON.stringify({ assignments: result.updatedAssignments }, null, 2)}\n`,
);
console.log(
  JSON.stringify({
    ok: true,
    reviews: reviewsOut,
    assignments: assignmentsOut,
    reviewCount: result.merged.length,
  }),
);
