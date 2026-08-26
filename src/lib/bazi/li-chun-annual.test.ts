import { expect, test } from "vitest";
import { findExactTermJd } from "../calendar/solar-terms";
import { getAnnualPillar, getAnnualPillarAtInstant } from "./luck-pillars";
import { generateBaziChart } from "./bazi-engine";
import { getAnnualYears, utcGregorianYear } from "./annual-years";

test("getAnnualPillar is Li-Chun-cycle label API (1984 = Giáp Tý)", () => {
  expect(getAnnualPillar(1984)).toEqual({ stem: "Giáp", branch: "Tý" });
  expect(getAnnualPillar(2026)).toEqual({ stem: "Bính", branch: "Ngọ" });
});

test("getAnnualPillarAtInstant flips at Lập Xuân", () => {
  const year = 2026;
  const liChunJd = findExactTermJd(year, 315);
  const liChunMs = (liChunJd - 2440587.5) * 86400000;
  const before = new Date(liChunMs - 1000);
  const at = new Date(liChunMs);
  const after = new Date(liChunMs + 1000);

  const beforePillar = getAnnualPillarAtInstant(before);
  const atPillar = getAnnualPillarAtInstant(at);
  const afterPillar = getAnnualPillarAtInstant(after);

  expect(beforePillar).toEqual(getAnnualPillar(year - 1));
  expect(atPillar).toEqual(getAnnualPillar(year));
  expect(afterPillar).toEqual(getAnnualPillar(year));
});

test("annual years + luck index invariant under process timezone label", () => {
  const chart = generateBaziChart(new Date("1990-06-15T05:00:00Z"), 105.8, 420, "M");
  const years = getAnnualYears(chart);
  expect(years[0]?.year).toBe(chart.metadata.civil?.solarYear);
  for (const lp of chart.luck.pillars) {
    expect(utcGregorianYear(lp.startDate)).toBe(lp.startDate.getUTCFullYear());
  }
});
