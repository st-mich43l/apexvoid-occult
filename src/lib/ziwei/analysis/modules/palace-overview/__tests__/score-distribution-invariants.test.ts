/**
 * Distribution invariants against grade inflation.
 * Distribution invariants for cát-share (0–100). Not a calibration suite.
 * Median is not forced to 50 — equal cát/hung is 50, real TP4C mixes sit above.
 */
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { analyzeAllPalaces } from "../analyze-all-palaces";
import type { PalaceOverviewBand } from "../types";
import type { BirthInput, School } from "@/types/chart";

const HOURS = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

const SCHOOLS: School[] = ["nam-phai", "trung-chau"];
const BANDS: PalaceOverviewBand[] = [
  "low",
  "guarded",
  "balanced",
  "supportive",
  "strong",
];

function buildInvariantCorpus(count: number): BirthInput[] {
  const inputs: BirthInput[] = [];
  for (let i = 0; i < count; i++) {
    const year = 1950 + (i % 80);
    const month = (i % 12) + 1;
    const day = 1 + (i % 28);
    inputs.push({
      solarDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      birthHour: HOURS[i % 12]!,
      gender: i % 2 === 0 ? "female" : "male",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    });
  }
  return inputs;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.round(p * (sorted.length - 1)));
  return sorted[idx]!;
}

describe("palace-overview score distribution invariants", () => {
  it("both schools stay recentered on a deterministic ≥500-chart corpus", { timeout: 60_000 }, () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) throw new Error("knowledge");
    const offset = loaded.knowledge.profile.qualityNormalization.offset;
    const inputs = buildInvariantCorpus(500);
    expect(inputs.length).toBeGreaterThanOrEqual(500);

    for (const school of SCHOOLS) {
      const calc = school === "nam-phai" ? calculateNamPhai : calculateTrungChau;
      const scores: number[] = [];
      const centeredNets: number[] = [];
      const bandCounts: Record<PalaceOverviewBand, number> = {
        low: 0,
        guarded: 0,
        balanced: 0,
        supportive: 0,
        strong: 0,
      };
      for (const input of inputs) {
        const { results } = analyzeAllPalaces(calc(input), { school });
        for (const r of results) {
          scores.push(r.score);
          centeredNets.push(r.rawAxes.support - r.rawAxes.pressure - offset);
          bandCounts[r.band] += 1;
        }
      }

      const n = scores.length;
      const sorted = [...scores].sort((a, b) => a - b);
      const mean = scores.reduce((a, b) => a + b, 0) / n;
      const median = percentile(sorted, 0.5);
      const p05 = percentile(sorted, 0.05);
      const p95 = percentile(sorted, 0.95);
      const exact0 = scores.filter((s) => s === 0).length / n;
      const exact100 = scores.filter((s) => s === 100).length / n;
      const netSorted = [...centeredNets].sort((a, b) => a - b);
      const netMedian = percentile(netSorted, 0.5);

      // eslint-disable-next-line no-console
      console.info(
        JSON.stringify({
          school,
          charts: inputs.length,
          palaces: n,
          min: sorted[0],
          p05,
          p25: percentile(sorted, 0.25),
          median,
          mean,
          p75: percentile(sorted, 0.75),
          p95,
          max: sorted[n - 1],
          bandShare: Object.fromEntries(
            BANDS.map((b) => [b, bandCounts[b] / n]),
          ),
          centeredNetMedian: netMedian,
          exact0,
          exact100,
        }),
      );

      expect(median).toBeGreaterThan(0);
      expect(median).toBeLessThan(100);
      expect(mean).toBeGreaterThan(0);
      expect(mean).toBeLessThan(100);
      expect(p05).toBeGreaterThanOrEqual(0);
      expect(p95).toBeLessThanOrEqual(100);
      expect(sorted[n - 1]!).toBeLessThanOrEqual(100);
      expect(sorted[0]!).toBeGreaterThanOrEqual(0);
      for (const band of BANDS) {
        const share = bandCounts[band] / n;
        expect(share).toBeGreaterThanOrEqual(0.05);
        expect(share).toBeLessThanOrEqual(0.35);
      }
      expect(exact0).toBeGreaterThanOrEqual(0);
      expect(sorted.every((s) => Number.isFinite(s) && s >= 0 && s <= 100)).toBe(
        true,
      );
    }
  });
});
