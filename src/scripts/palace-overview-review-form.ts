#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculate as calculateNamPhai } from "../lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "../lib/ziwei/engine-trung-chau";
import {
  loadBenchmarkCasesV2,
  loadReviewAssignments,
  loadReviewers,
} from "../lib/ziwei/analysis/modules/palace-overview/calibration/reviews-v2";
import { buildExpertReviewNatalPack } from "../lib/ziwei/analysis/modules/palace-overview/calibration/review-pack";
import { renderReviewFormHtml } from "../lib/ziwei/analysis/modules/palace-overview/research/review-form";
import { assignPairwiseComparisons } from "../lib/ziwei/analysis/modules/palace-overview/research/pairwise-assignment";
import { CURRENT_RUBRIC_VERSION } from "../lib/ziwei/analysis/modules/palace-overview/research/natal-input";
import {
  resolveActiveReviewer,
  selectAssignedForReviewer,
} from "../lib/ziwei/analysis/modules/palace-overview/research/review-assignment";
import type { BirthInput, School } from "../types/chart";

const reviewerId = process.argv[2];
if (!reviewerId) {
  console.error("usage: research:palace-overview:review-form -- <reviewerId>");
  process.exit(2);
}

const reviewers = loadReviewers();
const resolved = resolveActiveReviewer(reviewerId, reviewers);
if (!resolved.ok) {
  console.error(JSON.stringify({ ok: false, code: resolved.code }));
  process.exit(1);
}

const assignments = selectAssignedForReviewer(reviewerId, loadReviewAssignments());
if (assignments.length === 0) {
  console.error(JSON.stringify({ ok: false, code: "NO_ASSIGNMENTS" }));
  process.exit(1);
}

const cases = loadBenchmarkCasesV2();
const outDir = resolve(import.meta.dirname, "../../.research-artifacts/palace-overview-review-forms");
mkdirSync(outDir, { recursive: true });
const CALCULATORS: Record<School, (input: BirthInput) => ReturnType<typeof calculateNamPhai>> = {
  "nam-phai": calculateNamPhai,
  "trung-chau": calculateTrungChau,
};

for (const assignment of assignments) {
  const rec = cases.find((c) => c.caseId === assignment.caseId);
  if (!rec) {
    console.error(JSON.stringify({ ok: false, code: "UNKNOWN_CASE", assignmentId: assignment.assignmentId }));
    process.exit(1);
  }
  if (!rec.eligibleSchools.includes(assignment.school)) {
    console.error(JSON.stringify({ ok: false, code: "SCHOOL_NOT_ELIGIBLE", assignmentId: assignment.assignmentId }));
    process.exit(1);
  }
  const chart = CALCULATORS[assignment.school](rec.input);
  const pack = buildExpertReviewNatalPack({
    caseId: rec.caseId,
    school: assignment.school,
    birth: rec.input,
    chart,
  });
  const html = renderReviewFormHtml({
    pack,
    assignment,
    pairwise: assignPairwiseComparisons({
      caseId: assignment.caseId,
      school: assignment.school,
      reviewerId: assignment.reviewerId,
      rubricVersion: CURRENT_RUBRIC_VERSION,
    }),
  });
  const file = resolve(outDir, `${assignment.assignmentId}.html`);
  writeFileSync(file, html);
  console.log(`wrote ${file}`);
}
