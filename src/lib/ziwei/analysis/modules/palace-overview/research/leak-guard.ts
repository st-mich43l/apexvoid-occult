import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FORBIDDEN = [
  "analyzeAllPalaces",
  "analyzePalace",
  "computeRadarScore",
  "normalizeAxes",
];

export function researchModuleImportLeaks(dir = dirname(fileURLToPath(import.meta.url))): string[] {
  const files = [
    "case-fingerprint.ts",
    "case-discovery.ts",
    "cohort-classifier.ts",
    "corpus-coverage.ts",
    "case-promotion.ts",
    "pairwise-assignment.ts",
    "review-assignment.ts",
    "school-eligibility.ts",
    "ingest-review.ts",
    "review-form.ts",
  ];
  const errors: string[] = [];
  for (const file of files) {
    const text = readFileSync(join(dir, file), "utf8");
    for (const token of FORBIDDEN) {
      if (text.includes(token)) {
        errors.push(`${file} must not reference ${token}`);
      }
    }
  }
  return errors;
}
