/**
 * V0.8 holdout / regression corpus — reads committed fixtures only.
 * Does not write files. Regeneration:
 *   ANNUAL_AXES_V08_GENERATE_FIXTURES=1 npm run generate:annual-axes-v08-fixtures
 */
import { readFileSync, existsSync } from "node:fs";
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

const FIXTURE_PATH = join(
  process.cwd(),
  "research/annual-axes/distribution/v0.8/annual-axes-v0.8-holdout-scores.json",
);

interface HoldoutFixture {
  formulaVersion: string;
  engineVersion: string;
  knowledgeVersion: string;
  contractId: string;
  observations: Array<{
    chartId: string;
    annualYear: number;
    scores: Record<string, number | null>;
    statuses: Record<string, string>;
  }>;
}

describe("Annual Axes V0.8 holdout regression", () => {
  it("committed fixture exists and matches live scoring", () => {
    expect(existsSync(FIXTURE_PATH)).toBe(true);
    const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as HoldoutFixture;
    expect(fixture.formulaVersion).toBe("v0.8-annual-palace-weighted-score");
    expect(fixture.engineVersion).toBe("0.8.0");
    expect(fixture.observations.length).toBeGreaterThan(0);

    const bases = buildAuditBirthInputs(FAST_CORPUS_CONTRACT);
    const live: HoldoutFixture["observations"] = [];
    bases.forEach((base, i) => {
      const chartId = `${FAST_CORPUS_CONTRACT.contractId}:nam-phai:c${i}`;
      for (const yearly of expandAnnualYears(
        base,
        FAST_CORPUS_CONTRACT.baseAnnualYear,
        FAST_CORPUS_CONTRACT.yearsPerChart,
      )) {
        const chart = calculateNamPhai(yearly as BirthInput);
        const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
        const scores: Record<string, number | null> = {};
        const statuses: Record<string, string> = {};
        for (const domain of ANNUAL_AXIS_DOMAINS) {
          const axis = result.axes[domain];
          scores[domain] = axis.status === "unavailable" ? null : axis.score;
          statuses[domain] = axis.status;
        }
        live.push({ chartId, annualYear: chart.annualYear, scores, statuses });
      }
    });

    expect(live).toEqual(fixture.observations);
  });
});
