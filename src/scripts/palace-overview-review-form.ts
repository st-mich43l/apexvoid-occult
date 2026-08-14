#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculate as calculateNamPhai } from "../lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "../lib/ziwei/engine-trung-chau";
import { loadBenchmarkCasesV2 } from "../lib/ziwei/analysis/modules/palace-overview/calibration/reviews-v2";
import { buildExpertReviewNatalPack } from "../lib/ziwei/analysis/modules/palace-overview/calibration/review-pack";
import { renderReviewFormHtml } from "../lib/ziwei/analysis/modules/palace-overview/research/review-form";
import { assignPairwiseComparisons } from "../lib/ziwei/analysis/modules/palace-overview/research/pairwise-assignment";
import { CURRENT_RUBRIC_VERSION } from "../lib/ziwei/analysis/modules/palace-overview/research/natal-input";
import type { BirthInput, School } from "../types/chart";

const reviewerId = process.argv[2] ?? "UNREGISTERED";
const outDir = resolve(import.meta.dirname, "../../.research-artifacts/palace-overview-review-forms");
mkdirSync(outDir, { recursive: true });
const CALCULATORS: Record<School, (input: BirthInput) => ReturnType<typeof calculateNamPhai>> = {
  "nam-phai": calculateNamPhai,
  "trung-chau": calculateTrungChau,
};

for (const c of loadBenchmarkCasesV2()) {
  for (const school of c.eligibleSchools) {
    const chart = CALCULATORS[school](c.input);
    const pack = buildExpertReviewNatalPack({
      caseId: c.caseId,
      school,
      birth: c.input,
      chart,
    });
    const html = renderReviewFormHtml({
      pack,
      assignment: {
        assignmentId: `draft-${c.caseId}-${school}`,
        reviewerId,
        caseId: c.caseId,
        school,
        purpose: "pilot",
        status: "assigned",
        createdAt: "2026-08-14T00:00:00Z",
      },
      pairwise: assignPairwiseComparisons({
        caseId: c.caseId,
        school,
        reviewerId,
        rubricVersion: CURRENT_RUBRIC_VERSION,
      }),
    });
    const file = resolve(outDir, `${c.caseId}__${school}.html`);
    writeFileSync(file, html);
    console.log(`wrote ${file}`);
  }
}
