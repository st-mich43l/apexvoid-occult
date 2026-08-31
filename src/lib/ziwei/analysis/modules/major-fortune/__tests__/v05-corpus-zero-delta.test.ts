/**
 * Prove canonical analyzeMajorFortune remains V0.5-identical after production
 * orchestration cleanup. Expected values come from the released V0.5 candidate
 * API — not from the production wrapper under test.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { BirthInput, ChartData } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { analyzeMajorFortuneCandidateV05 } from "../v0.5-candidate/candidate";
import { analyzeMajorFortune } from "../production";
import { analyzeMajorFortuneTimeline } from "../timeline";

interface GoldenCase {
  id: string;
  input: BirthInput;
}

function loadGolden(school: "nam-phai" | "trung-chau"): GoldenCase[] {
  const raw = JSON.parse(
    readFileSync(resolve(process.cwd(), `tests/golden/tuvi-${school}.json`), "utf8"),
  ) as { cases: GoldenCase[] };
  return raw.cases;
}

function listValidCycles(chart: ChartData) {
  const cycles = [];
  for (const palace of chart.palaces) {
    const mf = palace.majorFortune;
    if (
      !mf ||
      mf.order === undefined ||
      mf.start === undefined ||
      mf.end === undefined
    ) {
      continue;
    }
    cycles.push({
      cycleIndex: mf.order,
      startAge: mf.start,
      endAge: mf.end,
      activePalaceIndex: palace.index,
    });
  }
  return cycles;
}

function assertProductionEqualsV05(
  chart: ChartData,
  school: "nam-phai" | "trung-chau",
  cycleOverride?: {
    cycleIndex: number;
    startAge: number;
    endAge: number;
    activePalaceIndex: number;
  },
) {
  const expected = analyzeMajorFortuneCandidateV05(chart, { school, cycleOverride });
  const actual = analyzeMajorFortune(chart, { school, cycleOverride });
  expect(actual).toEqual(expected);
}

describe("Major Fortune V0.5 corpus zero-delta after production cleanup", () => {
  it("Nam Phái: every golden case + every valid cycle matches V0.5 candidate", () => {
    for (const c of loadGolden("nam-phai")) {
      const chart = calculateNamPhai(c.input);
      assertProductionEqualsV05(chart, "nam-phai");
      for (const cycle of listValidCycles(chart)) {
        assertProductionEqualsV05(chart, "nam-phai", cycle);
      }
    }
  }, 120_000);

  it("Trung Châu: every golden case + every valid cycle matches V0.5 candidate", () => {
    for (const c of loadGolden("trung-chau")) {
      const chart = calculateTrungChau(c.input);
      assertProductionEqualsV05(chart, "trung-chau");
      for (const cycle of listValidCycles(chart)) {
        assertProductionEqualsV05(chart, "trung-chau", cycle);
      }
    }
  }, 120_000);

  it("timeline points embed V0.5-identical analysis payloads", () => {
    const chart = calculateNamPhai(loadGolden("nam-phai")[0]!.input);
    const timeline = analyzeMajorFortuneTimeline(chart, { school: "nam-phai" });
    expect(timeline.points.length).toBeGreaterThan(0);
    for (const point of timeline.points) {
      const expected = analyzeMajorFortuneCandidateV05(chart, {
        school: "nam-phai",
        cycleOverride: {
          cycleIndex: point.cycleIndex,
          startAge: point.startAge,
          endAge: point.endAge,
          activePalaceIndex: point.activePalaceIndex,
        },
      });
      expect(point.analysis).toEqual(expected);
    }
  });
});
