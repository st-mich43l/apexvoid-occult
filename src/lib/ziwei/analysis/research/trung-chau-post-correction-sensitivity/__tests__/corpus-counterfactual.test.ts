import { describe, expect, it } from "vitest";
import { corpusInventory, loadFullTrungChauCorpus, loadTrungChauGoldenCaseRecords } from "../corpus";
import { buildPreCorrectionShadowChart, mutagenKhoaFingerprint } from "../counterfactual";

describe("PR265 corpus + counterfactual immutability", () => {
  it("loads the full current TC corpus including annual-stem coverage", () => {
    const records = loadTrungChauGoldenCaseRecords();
    const inventory = corpusInventory(records);
    expect(inventory.total).toBe(55);
    expect(inventory.annualStemCount).toBe(10);
    expect(inventory.historicalNonAnnualStemCount).toBe(45);
    expect(inventory.includesAnnualStemMau).toBe(true);
    expect(inventory.includesAnnualStemNham).toBe(true);
    expect(inventory.annualStemIds).toEqual([
      "annual-stem-2014",
      "annual-stem-2015",
      "annual-stem-2016",
      "annual-stem-2017",
      "annual-stem-2018",
      "annual-stem-2019",
      "annual-stem-2020",
      "annual-stem-2021",
      "annual-stem-2022",
      "annual-stem-2023",
    ]);
  });

  it("does not mutate source charts when building PRE shadow", () => {
    const corpus = loadFullTrungChauCorpus();
    const sample = corpus.find((c) => c.caseId === "annual-stem-2018");
    expect(sample).toBeTruthy();
    const beforeNatal = structuredClone(
      (sample!.postChart.natalMutagens ?? []).map((r) => ({
        mutagen: r.mutagen,
        starName: r.starName,
        palaceIndex: r.palace?.index ?? null,
      })),
    );
    const beforeAnnual = mutagenKhoaFingerprint(sample!.postChart.annualMutagens);
    const pair = buildPreCorrectionShadowChart(sample!.postChart);
    const afterNatal = (sample!.postChart.natalMutagens ?? []).map((r) => ({
      mutagen: r.mutagen,
      starName: r.starName,
      palaceIndex: r.palace?.index ?? null,
    }));
    expect(afterNatal).toEqual(beforeNatal);
    expect(mutagenKhoaFingerprint(sample!.postChart.annualMutagens)).toBe(beforeAnnual);
    expect(pair.exposure.annualKhoaChanged).toBe(true);
    expect(pair.khoaTargets.annual.pre.starName).toBe("Hữu Bật");
    expect(pair.khoaTargets.annual.post.starName).toBe("Thái Dương");
  });
});
