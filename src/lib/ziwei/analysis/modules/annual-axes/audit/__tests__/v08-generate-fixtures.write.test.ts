/**
 * Explicit fixture writer for V0.8 holdout scores.
 * Gated by ANNUAL_AXES_V08_GENERATE_FIXTURES=1 — normal CI must not write.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { analyzeAnnualAxes } from "../../analyze";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";
import {
  FAST_CORPUS_CONTRACT,
  buildAuditBirthInputs,
  expandAnnualYears,
} from "../build-audit-corpus";

const ENABLED = process.env.ANNUAL_AXES_V08_GENERATE_FIXTURES === "1";
const OUT_DIR = join(process.cwd(), "research/annual-axes/distribution/v0.8");

describe.runIf(ENABLED)("generate Annual Axes V0.8 holdout fixtures", () => {
  it("writes committed holdout score fixture", () => {
    mkdirSync(OUT_DIR, { recursive: true });
    const bases = buildAuditBirthInputs(FAST_CORPUS_CONTRACT);
    const observations = bases.flatMap((base, i) => {
      const chartId = `${FAST_CORPUS_CONTRACT.contractId}:nam-phai:c${i}`;
      return expandAnnualYears(
        base,
        FAST_CORPUS_CONTRACT.baseAnnualYear,
        FAST_CORPUS_CONTRACT.yearsPerChart,
      ).map((yearly) => {
        const chart = calculateNamPhai(yearly as BirthInput);
        const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
        const scores: Record<string, number | null> = {};
        const statuses: Record<string, string> = {};
        for (const domain of ANNUAL_AXIS_DOMAINS) {
          const axis = result.axes[domain];
          scores[domain] = axis.status === "unavailable" ? null : axis.score;
          statuses[domain] = axis.status;
        }
        return { chartId, annualYear: chart.annualYear, scores, statuses };
      });
    });

    const payload = {
      formulaVersion: "v0.8-annual-palace-weighted-score",
      engineVersion: "0.8.0",
      knowledgeVersion: "0.8.0",
      contractId: FAST_CORPUS_CONTRACT.contractId,
      generatedAt: new Date().toISOString(),
      note: "Engineering regression fixture — not a classical authority.",
      observations,
    };

    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.8-holdout-scores.json"),
      `${JSON.stringify(payload, null, 2)}\n`,
    );
    expect(observations.length).toBe(
      FAST_CORPUS_CONTRACT.chartCount * FAST_CORPUS_CONTRACT.yearsPerChart,
    );
  });
});
