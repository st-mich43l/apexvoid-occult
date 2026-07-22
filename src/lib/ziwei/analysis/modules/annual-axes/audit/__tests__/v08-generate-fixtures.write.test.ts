/**
 * Explicit fixture writer for V0.8 holdout / UI / product fixtures.
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

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe.runIf(ENABLED)("generate Annual Axes V0.8 fixtures", () => {
  it("writes holdout, UI proof, and product fixtures", () => {
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

    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.8-holdout-scores.json"),
      `${JSON.stringify(
        {
          formulaVersion: "v0.8-annual-palace-weighted-score",
          engineVersion: "0.8.0",
          knowledgeVersion: "0.8.0",
          contractId: FAST_CORPUS_CONTRACT.contractId,
          note: "Engineering regression fixture — not a classical authority.",
          observations,
        },
        null,
        2,
      )}\n`,
    );

    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const scores = Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.map((d) => {
        const axis = result.axes[d];
        return [d, axis.status === "unavailable" ? null : axis.score];
      }),
    );
    const statuses = Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.map((d) => [d, result.axes[d].status]),
    );

    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.8-ui-proof.json"),
      `${JSON.stringify(
        {
          engineVersion: result.versions.engineVersion,
          formulaVersion: "v0.8-annual-palace-weighted-score",
          knowledgeVersion: result.versions.knowledgeVersion,
          scores,
          expectedStatusLabels: statuses,
          noConfidencePercentage: true,
        },
        null,
        2,
      )}\n`,
    );

    writeFileSync(
      join(OUT_DIR, "annual-axes-v0.8-product-fixture.json"),
      `${JSON.stringify(
        {
          birth: REGRESSION,
          formulaVersion: "v0.8-annual-palace-weighted-score",
          productFixture: scores,
          statuses,
        },
        null,
        2,
      )}\n`,
    );

    expect(observations.length).toBe(
      FAST_CORPUS_CONTRACT.chartCount * FAST_CORPUS_CONTRACT.yearsPerChart,
    );
  });
});
