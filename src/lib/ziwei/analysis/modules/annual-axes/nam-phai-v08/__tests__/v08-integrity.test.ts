import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput, ChartData, ChartStar } from "@/types/chart";
import { analyzeAnnualAxesNamPhaiV08 } from "../analyze";
import { matchPalaceStars } from "../match-stars";
import { isLuuThaiTueInPalace, scoreV08Domain } from "../score-domain";
import { normalizeStarIdentity } from "../star-identity";
import {
  loadAnnualAxesKnowledgeV08NamPhai,
  resetAnnualAxesKnowledgeV08NamPhaiCache,
  type AnnualAxesKnowledgeV08NamPhai,
  validateAnnualAxesKnowledgeV08NamPhai,
} from "../../../../knowledge/annual-axes/v0.8";
import { resolveAnnualPalace } from "../resolve-annual-palace";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const loaded = loadAnnualAxesKnowledgeV08NamPhai();
if (!loaded.ok) throw new Error(loaded.issues.map((i) => i.message).join("; "));
const knowledge: AnnualAxesKnowledgeV08NamPhai = loaded.knowledge;

function withStars(chart: ChartData, palaceIndex: number, stars: ChartStar[]): ChartData {
  return {
    ...chart,
    palaces: chart.palaces.map((p) =>
      p.index === palaceIndex ? { ...p, stars: [...(p.stars ?? []), ...stars] } : p,
    ),
  };
}

function wealthPalaceIndex(chart: ChartData): number {
  const r = resolveAnnualPalace(chart, "Tài Bạch");
  if (!r.ok) throw new Error(r.reason);
  return r.palace.palaceIndex;
}

describe("V0.8 temporal identity", () => {
  it("Natal Hóa Kỵ does not match Lưu Hóa Kỵ", () => {
    const chart = calculateNamPhai(REGRESSION);
    const idx = wealthPalaceIndex(chart);
    const natal = withStars(chart, idx, [{ name: "Hóa Kỵ", source: "natal-mutagen" }]);
    const matched = matchPalaceStars({
      chart: natal,
      palaceIndex: idx,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(matched.matchedFacts.some((f) => f.ruleId.includes("hoa-ky"))).toBe(false);
  });

  it("Natal Kình Dương does not match Lưu Kình Dương", () => {
    const chart = calculateNamPhai(REGRESSION);
    const idx = wealthPalaceIndex(chart);
    const natal = withStars(chart, idx, [{ name: "Kình Dương", source: "natal" }]);
    const matched = matchPalaceStars({
      chart: natal,
      palaceIndex: idx,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(matched.matchedFacts.some((f) => f.ruleId.includes("kinh-duong"))).toBe(false);
  });

  it("Natal Lộc Tồn does not match Lưu Lộc Tồn", () => {
    const chart = calculateNamPhai(REGRESSION);
    const idx = wealthPalaceIndex(chart);
    const natal: ChartData = {
      ...chart,
      palaces: chart.palaces.map((p) =>
        p.index === idx ? { ...p, stars: [{ name: "Lộc Tồn", source: "natal" }] } : p,
      ),
    };
    const matched = matchPalaceStars({
      chart: natal,
      palaceIndex: idx,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(matched.matchedFacts.some((f) => f.ruleId.includes("loc-ton"))).toBe(false);
    expect(matched.positivePoints).toBe(0);
  });

  it("Lưu Hóa Kỵ from annual source matches correctly", () => {
    const chart = calculateNamPhai(REGRESSION);
    const idx = wealthPalaceIndex(chart);
    const annual = withStars(chart, idx, [{ name: "Lưu Hóa Kỵ", source: "annual-mutagen" }]);
    const matched = matchPalaceStars({
      chart: annual,
      palaceIndex: idx,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(matched.negativePoints).toBe(3);
    expect(matched.matchedFacts[0]?.exactMatchedStarName).toBe("Lưu Hóa Kỵ");
    expect(matched.matchedFacts[0]?.temporalLayer).toBe("annual");
  });

  it("Lưu Kình Dương from annual source matches correctly", () => {
    const chart = calculateNamPhai(REGRESSION);
    const idx = wealthPalaceIndex(chart);
    const annual = withStars(chart, idx, [{ name: "Lưu Kình Dương", source: "annual" }]);
    const matched = matchPalaceStars({
      chart: annual,
      palaceIndex: idx,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(matched.negativePoints).toBe(2);
  });

  it("preserves Lưu prefix in exact identity", () => {
    const identity = normalizeStarIdentity({ name: "Lưu Hóa Kỵ", source: "annual-mutagen" });
    expect(identity.exactCanonicalName).toBe("Lưu Hóa Kỵ");
    expect(identity.baseCanonicalName).toBe("Hóa Kỵ");
    expect(identity.temporalLayer).toBe("annual");
  });
});

describe("V0.8 alias integrity", () => {
  it("Lưu Thiên Khôi does not match Lưu Thiên Việt", () => {
    const chart = calculateNamPhai(REGRESSION);
    const r = resolveAnnualPalace(chart, "Điền Trạch");
    if (!r.ok) throw new Error(r.reason);
    const withKhoi = withStars(chart, r.palace.palaceIndex, [
      { name: "Lưu Thiên Khôi", source: "annual" },
    ]);
    const matched = matchPalaceStars({
      chart: withKhoi,
      palaceIndex: r.palace.palaceIndex,
      annualPalaceName: "Điền Trạch",
      domain: "family",
      knowledge,
    });
    expect(matched.matchedFacts.some((f) => f.ruleId.includes("viet"))).toBe(false);
    expect(matched.matchedFacts.some((f) => f.ruleId.includes("khoi"))).toBe(true);
  });

  it("Lưu Kình Dương does not match Lưu Đà La", () => {
    const chart = calculateNamPhai(REGRESSION);
    const idx = wealthPalaceIndex(chart);
    const withKinh = withStars(chart, idx, [{ name: "Lưu Kình Dương", source: "annual" }]);
    const matched = matchPalaceStars({
      chart: withKinh,
      palaceIndex: idx,
      annualPalaceName: "Tài Bạch",
      domain: "wealth",
      knowledge,
    });
    expect(matched.matchedFacts.some((f) => f.ruleId.includes("da-la"))).toBe(false);
  });

  it("Long Trì does not match Phượng Các", () => {
    const chart = calculateNamPhai(REGRESSION);
    const r = resolveAnnualPalace(chart, "Điền Trạch");
    if (!r.ok) throw new Error(r.reason);
    const withLong = withStars(chart, r.palace.palaceIndex, [
      { name: "Long Trì", source: "natal" },
    ]);
    const matched = matchPalaceStars({
      chart: withLong,
      palaceIndex: r.palace.palaceIndex,
      annualPalaceName: "Điền Trạch",
      domain: "family",
      knowledge,
    });
    expect(matched.matchedFacts.some((f) => f.ruleId.includes("phuong"))).toBe(false);
    expect(matched.matchedFacts.some((f) => f.ruleId.includes("long-tri"))).toBe(true);
  });

  it("Tam Thai does not match Bát Tọa", () => {
    const chart = calculateNamPhai(REGRESSION);
    const r = resolveAnnualPalace(chart, "Điền Trạch");
    if (!r.ok) throw new Error(r.reason);
    const withThai = withStars(chart, r.palace.palaceIndex, [
      { name: "Tam Thai", source: "natal" },
    ]);
    const matched = matchPalaceStars({
      chart: withThai,
      palaceIndex: r.palace.palaceIndex,
      annualPalaceName: "Điền Trạch",
      domain: "family",
      knowledge,
    });
    expect(matched.matchedFacts.some((f) => f.ruleId.includes("bat-toa"))).toBe(false);
  });

  it("spelling alias Lưu Khôi resolves to Lưu Thiên Khôi", () => {
    const chart = calculateNamPhai(REGRESSION);
    const r = resolveAnnualPalace(chart, "Điền Trạch");
    if (!r.ok) throw new Error(r.reason);
    const withAlias: ChartData = {
      ...chart,
      palaces: chart.palaces.map((p) =>
        p.index === r.palace.palaceIndex
          ? { ...p, stars: [{ name: "Lưu Khôi", source: "annual" }] }
          : p,
      ),
    };
    const matched = matchPalaceStars({
      chart: withAlias,
      palaceIndex: r.palace.palaceIndex,
      annualPalaceName: "Điền Trạch",
      domain: "family",
      knowledge,
    });
    expect(matched.matchedFacts).toHaveLength(1);
    expect(matched.matchedFacts[0]?.exactMatchedStarName).toBe("Lưu Thiên Khôi");
  });
});

describe("V0.8 Lưu Thái Tuế prominence", () => {
  it("bare natal Thái Tuế does not activate annual prominence", () => {
    const chart = calculateNamPhai(REGRESSION);
    const idx = wealthPalaceIndex(chart);
    const withNatal = {
      ...withStars(chart, idx, [{ name: "Thái Tuế", source: "natal" }]),
      taiTuePalace: null,
    };
    expect(isLuuThaiTueInPalace(withNatal, idx)).toBe(false);
    const scored = scoreV08Domain({ chart: withNatal, domain: "wealth", knowledge });
    expect(scored.isThaiTueHighlighted).toBe(false);
  });

  it("valid Lưu Thái Tuế activates prominence exactly once and preserves direction", () => {
    const chart = calculateNamPhai(REGRESSION);
    const idx = wealthPalaceIndex(chart);
    const positive = withStars(chart, idx, [
      { name: "Lưu Hóa Lộc", source: "annual-mutagen" },
      { name: "Lưu Thái Tuế", source: "annual" },
    ]);
    const withoutTai = withStars(chart, idx, [
      { name: "Lưu Hóa Lộc", source: "annual-mutagen" },
    ]);
    const withTai = scoreV08Domain({ chart: positive, domain: "wealth", knowledge });
    const base = scoreV08Domain({ chart: withoutTai, domain: "wealth", knowledge });
    expect(withTai.isThaiTueHighlighted).toBe(true);
    expect(withTai.trace.thaiTueMultiplier).toBe(1.25);
    expect(base.trace.axisRawBeforeThaiTue).toBeGreaterThan(0);
    expect(withTai.trace.prominenceAdjustedRaw).toBeCloseTo(
      base.trace.axisRawBeforeThaiTue * 1.25,
      5,
    );
  });

  it("Lưu Thái Tuế does not create direction from zero", () => {
    const chart = calculateNamPhai(REGRESSION);
    const idx = wealthPalaceIndex(chart);
    // Clear wealth palace stars then add only Lưu Thái Tuế.
    const cleared: ChartData = {
      ...chart,
      palaces: chart.palaces.map((p) =>
        p.index === idx
          ? { ...p, stars: [{ name: "Lưu Thái Tuế", source: "annual" }] }
          : { ...p, stars: [] },
      ),
      taiTuePalace: null,
    };
    const scored = scoreV08Domain({ chart: cleared, domain: "wealth", knowledge });
    expect(scored.isThaiTueHighlighted).toBe(true);
    expect(scored.trace.axisRawBeforeThaiTue).toBe(0);
    expect(scored.trace.prominenceAdjustedRaw).toBe(0);
  });
});

describe("V0.8 missing-data policy", () => {
  it("missing primary palace -> unavailable without fabricated 50", () => {
    const chart = calculateNamPhai(REGRESSION);
    const broken: ChartData = {
      ...chart,
      annualHeadPalace: null,
      palaces: chart.palaces.map((p) => ({ ...p, annualPalaceName: undefined })),
    };
    const scored = scoreV08Domain({ chart: broken, domain: "wealth", knowledge });
    expect(scored.availability).toBe("unavailable");
    expect(scored.score).toBeNull();
    expect(scored.trace.absoluteScore).toBeNull();
    const result = analyzeAnnualAxesNamPhaiV08(broken);
    expect(result.axes.wealth.status).toBe("unavailable");
    expect(result.axes.wealth.score).toBeNull();
  });

  it("missing one cooperating palace -> partial-data with coverage", () => {
    const chart = calculateNamPhai(REGRESSION);
    const broken: ChartData = {
      ...chart,
      smallLimitPalace: null,
      palaces: chart.palaces.map((p) => ({ ...p, isSmallLimitPalace: false })),
    };
    const scored = scoreV08Domain({ chart: broken, domain: "health", knowledge });
    expect(scored.availability).toBe("partial-data");
    expect(scored.score).not.toBeNull();
    expect(scored.coverage.resolvedWeight).toBeCloseTo(0.8, 5);
    expect(scored.coverage.totalWeight).toBeCloseTo(1.0, 5);
    expect(scored.coverage.missingPalaces).toContain("Tiểu Hạn");
  });

  it("unique physical palace is scored once when Tiểu Hạn coincides with Lưu Mệnh", () => {
    const chart = calculateNamPhai(REGRESSION);
    const menh = resolveAnnualPalace(chart, "Mệnh");
    if (!menh.ok) throw new Error(menh.reason);
    const coinciding: ChartData = {
      ...chart,
      smallLimitPalace: chart.palaces.find((p) => p.index === menh.palace.palaceIndex) ?? null,
      palaces: chart.palaces.map((p) => ({
        ...p,
        isSmallLimitPalace: p.index === menh.palace.palaceIndex,
        stars:
          p.index === menh.palace.palaceIndex
            ? [{ name: "Lưu Hóa Khoa", source: "annual-mutagen" }]
            : p.stars,
      })),
    };
    const scored = scoreV08Domain({ chart: coinciding, domain: "health", knowledge });
    const khoaFacts = scored.matchedFacts.filter((f) => f.exactMatchedStarName === "Lưu Hóa Khoa");
    // One physical match, weight combined (0.2 + 0.2 = 0.4) on that palace contribution.
    expect(khoaFacts.length).toBe(1);
    expect(khoaFacts[0]?.palaceWeight).toBeCloseTo(0.4, 5);
  });
});

describe("V0.8 architecture contracts", () => {
  it("does not require V0.4 knowledge and reports annual-palace-name", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxesNamPhaiV08(chart);
    expect(result.versions.knowledgeVersion).toBe("0.8.0");
    expect(result.capabilities.domainAnchorCoordinate).toBe("annual-palace-name");
    for (const domain of Object.values(result.axes)) {
      if (domain.status === "unavailable") continue;
      expect(domain.evidence).toEqual([]);
      expect(domain.topSupportDrivers).toEqual([]);
      expect(domain.engine).toBe("v0.8");
      for (const e of domain.v08Evidence ?? []) {
        const mult = domain.scoreTrace?.isThaiTueHighlighted
          ? (domain.scoreTrace.thaiTueMultiplier ?? 1)
          : 1;
        expect(e.weightedContribution).toBeCloseTo(e.pointValue * e.palaceWeight * mult, 5);
      }
    }
  });

  it("weighted evidence ordering agrees with scoring impact", () => {
    const chart = calculateNamPhai(REGRESSION);
    const idx = wealthPalaceIndex(chart);
    const enriched = withStars(chart, idx, [
      { name: "Lưu Hóa Lộc", source: "annual-mutagen" },
      { name: "Địa Không", source: "natal" },
    ]);
    const result = analyzeAnnualAxesNamPhaiV08(enriched);
    const wealth = result.axes.wealth;
    expect(wealth.status === "available" || wealth.status === "partial-data").toBe(true);
    if (wealth.status === "unavailable") return;
    const support = wealth.topSupportDriversV08 ?? [];
    const pressure = wealth.topPressureDriversV08 ?? [];
    if (support.length >= 2) {
      expect(Math.abs(support[0]!.weightedContribution)).toBeGreaterThanOrEqual(
        Math.abs(support[1]!.weightedContribution),
      );
    }
    if (pressure.length >= 2) {
      expect(Math.abs(pressure[0]!.weightedContribution)).toBeGreaterThanOrEqual(
        Math.abs(pressure[1]!.weightedContribution),
      );
    }
  });
});

describe("V0.8 validator mutations", () => {
  it("rejects duplicate rule ids, invalid palace, weight, polarity, and alias collisions", () => {
    resetAnnualAxesKnowledgeV08NamPhaiCache();
    const base = structuredClone(knowledge);
    const sourceIds = new Set(base.sourceRegistry.sources.map((s) => s.sourceId));

    const dup = structuredClone(base);
    dup.starRegistry.axes.wealth.positive.push({
      ...dup.starRegistry.axes.wealth.positive[0]!,
    });
    expect(validateAnnualAxesKnowledgeV08NamPhai(dup, sourceIds).ok).toBe(false);

    const badPalace = structuredClone(base);
    badPalace.domainMapping.domains.wealth.primary.palace = "Không Tồn Tại";
    expect(validateAnnualAxesKnowledgeV08NamPhai(badPalace, sourceIds).ok).toBe(false);

    const badWeight = structuredClone(base);
    badWeight.domainMapping.domains.wealth.primary.weight = -0.6;
    expect(validateAnnualAxesKnowledgeV08NamPhai(badWeight, sourceIds).ok).toBe(false);

    const badPolarity = structuredClone(base);
    badPolarity.starRegistry.axes.wealth.positive[0]!.pointClass = "annualTransformNegative";
    expect(validateAnnualAxesKnowledgeV08NamPhai(badPolarity, sourceIds).ok).toBe(false);

    const natalOnlyLuu = structuredClone(base);
    natalOnlyLuu.starRegistry.axes.wealth.negative[0]!.allowedTemporalLayers = ["natal"];
    expect(validateAnnualAxesKnowledgeV08NamPhai(natalOnlyLuu, sourceIds).ok).toBe(false);

    const aliasCollision = structuredClone(base);
    aliasCollision.starAliases.aliases.push(
      { alias: "Lưu Khôi", canonical: "Lưu Thiên Việt" },
    );
    expect(validateAnnualAxesKnowledgeV08NamPhai(aliasCollision, sourceIds).ok).toBe(false);

    const familyAsAlias = structuredClone(base);
    familyAsAlias.starAliases.aliases.push({
      alias: "Long Trì",
      canonical: "Phượng Các",
    });
    expect(validateAnnualAxesKnowledgeV08NamPhai(familyAsAlias, sourceIds).ok).toBe(false);

    const ok = validateAnnualAxesKnowledgeV08NamPhai(base, sourceIds);
    expect(ok.ok).toBe(true);
  });
});
