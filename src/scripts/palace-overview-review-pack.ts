#!/usr/bin/env tsx
/**
 * Blind expert review pack. DEV/RESEARCH only.
 * Derived from normalizeNatalFacts — never raw palace.stars arrays.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculate as calculateNamPhai } from "../lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "../lib/ziwei/engine-trung-chau";
import { loadBenchmarkCasesV2 } from "../lib/ziwei/analysis/modules/palace-overview/calibration/reviews-v2";
import {
  assertReviewPackContainsStaticNatalFactsOnly,
  buildExpertReviewNatalPack,
} from "../lib/ziwei/analysis/modules/palace-overview/calibration/review-pack";
import type { BirthInput, School } from "../types/chart";

const outDir = resolve(import.meta.dirname, "../../.research-artifacts/palace-overview-review-packs");
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
    const leaks = assertReviewPackContainsStaticNatalFactsOnly(pack);
    if (leaks.length) {
      throw new Error(leaks.join("\n"));
    }
    const file = resolve(outDir, `${c.caseId}__${school}.json`);
    writeFileSync(file, `${JSON.stringify(pack, null, 2)}\n`);
    console.log(`wrote ${file}`);
  }
}
