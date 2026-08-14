#!/usr/bin/env tsx
/**
 * Blind expert review pack. DEV/RESEARCH only.
 * Must not include engine scores, bands, numeric evidence, or existing answers.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculate as calculateNamPhai } from "../lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "../lib/ziwei/engine-trung-chau";
import { loadBenchmarkCasesV2 } from "../lib/ziwei/analysis/modules/palace-overview/calibration/reviews-v2";
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
    const pack = {
      caseId: c.caseId,
      school,
      blindedToEngine: true as const,
      natal: {
        solarDate: c.input.solarDate,
        birthHour: c.input.birthHour,
        gender: c.input.gender,
        yearStem: chart.yearStem,
        yearBranch: chart.yearBranch,
        menhBranch: chart.menhBranch,
        menhIndex: chart.menhIndex,
        thanIndex: chart.thanIndex,
        voidMarkers: chart.voidMarkers ?? [],
        natalMutagens: (chart.natalMutagens ?? []).map((m) => ({
          mutagen: m.mutagen,
          starName: m.starName,
          palaceName: m.palace?.name ?? null,
        })),
      },
      palaces: chart.palaces.map((p) => ({
        index: p.index,
        name: p.name,
        branch: p.branch,
        isMenh: Boolean(p.isMenh),
        isThan: Boolean(p.isThan),
        stars: (p.stars ?? []).map((s) => ({
          name: s.name,
          brightness: s.brightness ?? null,
          layer: s.layer ?? null,
        })),
      })),
      forbidden: [
        "engine scores",
        "bands",
        "numeric evidence",
        "current parameters",
        "existing expert answers",
      ],
    };
    const file = resolve(outDir, `${c.caseId}__${school}.json`);
    writeFileSync(file, `${JSON.stringify(pack, null, 2)}\n`);
    console.log(`wrote ${file}`);
  }
}
