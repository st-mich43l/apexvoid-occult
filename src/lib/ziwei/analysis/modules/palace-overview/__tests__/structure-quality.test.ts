import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAllPalaces } from "../analyze-all-palaces";
import { computePalaceScore } from "../normalize-result";
import { computeStructureQuality } from "../structure-quality";
import type { PalaceEvidence } from "../types";

const empty = { support: 0, pressure: 0, stability: 0, activation: 0 };

function ev(partial: Partial<PalaceEvidence> & Pick<PalaceEvidence, "palaceRole" | "starName">): PalaceEvidence {
  return {
    id: `ev:${partial.starName}`,
    category: partial.category ?? "major-star",
    factIds: [],
    palaceName: "Mệnh",
    palaceBranch: "Tý",
    axes: empty,
    label: partial.starName ?? "test",
    explanationKey: "test",
    sourceIds: [],
    knowledgeStatus: "experimental",
    ...partial,
  };
}

describe("structure quality from Nam Phái KB", () => {
  it("one Miếu tọa is strong but not rim; a lone Tả Phụ 用 cannot match it", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const mieu = computePalaceScore(
      [ev({ palaceRole: "focus", starName: "Tử Vi", starBrightness: "Miếu" })],
      k,
    );
    const ham = computePalaceScore(
      [ev({ palaceRole: "focus", starName: "Tử Vi", starBrightness: "Hãm" })],
      k,
    );
    expect(mieu).toBeGreaterThan(ham);
    expect(mieu).toBeGreaterThan(70);
    expect(mieu).toBeLessThan(100);
    expect(ham).toBeLessThan(50);
    expect(ham).toBeGreaterThan(25);
    const ta = computePalaceScore(
      [
        ev({
          palaceRole: "focus",
          starName: "Tả Phụ",
          category: "minor-star-family",
          axes: { support: 1.4, pressure: 0, stability: 0.4, activation: 0.2 },
        }),
      ],
      k,
    );
    expect(ta).toBeGreaterThan(50);
    expect(ta).toBeLessThan(mieu);
  });

  it("bản cung outweighs two tam hợp Miếu plus one xung Hãm", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const dac = ev({ palaceRole: "focus", starName: "Thiên Lương", starBrightness: "Đắc" });
    const neighbors = computeStructureQuality(
      [
        dac,
        ev({ palaceRole: "trine", starName: "Thái Âm", starBrightness: "Miếu" }),
        ev({ palaceRole: "trine", starName: "Thái Dương", starBrightness: "Miếu" }),
        ev({ palaceRole: "opposite", starName: "Thiên Cơ", starBrightness: "Hãm" }),
      ],
      k,
    );
    const self = computeStructureQuality([dac], k);
    expect(Math.abs(neighbors - self)).toBeLessThan(Math.abs(self));
  });

  it("Thái Tuế tam hợp chính nghĩa is better than Tuế Phá tam hợp", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const chinh = computeStructureQuality(
      ["Thái Tuế", "Quan Phù", "Bạch Hổ"].map((starName) =>
        ev({ palaceRole: "focus", starName, category: "minor-star-family" }),
      ),
      k,
    );
    const batMan = computeStructureQuality(
      ["Tuế Phá", "Điếu Khách", "Tang Môn"].map((starName) =>
        ev({ palaceRole: "focus", starName, category: "minor-star-family" }),
      ),
      k,
    );
    expect(chinh).toBeGreaterThan(batMan);
  });

  it("Lộc Tồn on focus is cut when Hao sits in the same TP4C", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const loc = computeStructureQuality(
      [ev({ palaceRole: "focus", starName: "Lộc Tồn", category: "minor-star-family" })],
      k,
    );
    const locHao = computeStructureQuality(
      [
        ev({ palaceRole: "focus", starName: "Lộc Tồn", category: "minor-star-family" }),
        ev({ palaceRole: "trine", starName: "Đại Hao", category: "minor-star-family" }),
      ],
      k,
    );
    expect(locHao).toBeLessThan(loc);
  });

  it("Tả Hữu in the frame adds support", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const none = computeStructureQuality([], k);
    const pair = computeStructureQuality(
      [
        ev({ palaceRole: "focus", starName: "Tả Phụ", category: "minor-star-family" }),
        ev({ palaceRole: "trine", starName: "Hữu Bật", category: "minor-star-family" }),
      ],
      k,
    );
    expect(pair).toBeGreaterThan(none);
  });

  it("Tham Hỏa đắc supports; Tham Hỏa Hãm pressures", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const tham = computeStructureQuality(
      [ev({ palaceRole: "focus", starName: "Tham Lang", starBrightness: "Bình" })],
      k,
    );
    const dac = computeStructureQuality(
      [
        ev({ palaceRole: "focus", starName: "Tham Lang", starBrightness: "Bình" }),
        ev({
          palaceRole: "trine",
          starName: "Hỏa Tinh",
          category: "minor-star-family",
          starBrightness: "Miếu",
        }),
      ],
      k,
    );
    const ham = computeStructureQuality(
      [
        ev({ palaceRole: "focus", starName: "Tham Lang", starBrightness: "Bình" }),
        ev({
          palaceRole: "trine",
          starName: "Hỏa Tinh",
          category: "minor-star-family",
          starBrightness: "Hãm",
        }),
      ],
      k,
    );
    expect(dac).toBeGreaterThan(tham);
    expect(ham).toBeLessThan(tham);
  });

  it("Kình on tứ mộ is not ordinary Kình Đà pressure", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const ham = computeStructureQuality(
      [
        ev({ palaceRole: "focus", starName: "Kình Dương", category: "minor-star-family", palaceBranch: "Tý" }),
        ev({ palaceRole: "trine", starName: "Đà La", category: "minor-star-family", palaceBranch: "Hợi" }),
      ],
      k,
    );
    const tuMo = computeStructureQuality(
      [
        ev({ palaceRole: "focus", starName: "Kình Dương", category: "minor-star-family", palaceBranch: "Sửu" }),
        ev({ palaceRole: "trine", starName: "Đà La", category: "minor-star-family", palaceBranch: "Mùi" }),
      ],
      k,
    );
    expect(tuMo).toBeGreaterThan(ham);
  });

  it("Kình Đà pair scores without double-counting Tử Phủ Vũ Tướng", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const tuPhu = computeStructureQuality(
      [
        ev({ palaceRole: "focus", starName: "Tử Vi", starBrightness: "Miếu" }),
        ev({ palaceRole: "focus", starName: "Thiên Phủ", starBrightness: "Miếu" }),
        ev({
          palaceRole: "focus",
          starName: "rule-tu-phu-vu-tuong",
          category: "structural-rule",
          axes: { support: 3, pressure: 0, stability: 2, activation: 1 },
        }),
      ],
      k,
    );
    const tuPhuAgain = computeStructureQuality(
      [
        ev({ palaceRole: "focus", starName: "Tử Vi", starBrightness: "Miếu" }),
        ev({ palaceRole: "focus", starName: "Thiên Phủ", starBrightness: "Miếu" }),
        ev({ palaceRole: "trine", starName: "Vũ Khúc", starBrightness: "Miếu" }),
        ev({ palaceRole: "trine", starName: "Thiên Tướng", starBrightness: "Miếu" }),
        ev({
          palaceRole: "focus",
          starName: "rule-tu-phu-vu-tuong",
          category: "structural-rule",
          axes: { support: 3, pressure: 0, stability: 2, activation: 1 },
        }),
      ],
      k,
    );
    const viaRule = k.starSystems.combinations.find(
      (c) => c.id === "cach-tu-phu-vu-tuong",
    );
    expect(viaRule?.scoring).toBe("via-structural-rule");
    expect(tuPhuAgain - tuPhu).toBeLessThan(4);
  });

  it("natal Hóa Kỵ on tứ mộ is not scored as ordinary Kỵ pressure", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const hamKy = (branch: string) =>
      computeStructureQuality(
        [
          ev({
            palaceRole: "focus",
            starName: "Thiên Cơ",
            starBrightness: "Hãm",
            transformation: "Kỵ",
            palaceBranch: branch,
          }),
        ],
        k,
      );
    expect(hamKy("Sửu")).toBeGreaterThan(hamKy("Tý"));
    expect(k.starSystems.combinations.find((c) => c.id === "cach-ky-tu-mo")?.scoring).toBe(
      "via-tu-hoa-seat",
    );
  });

  it("Tam Minh Đào Hồng Hỷ supports; Đào Hoa sát does not cancel it", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const satOnly = computeStructureQuality(
      [
        ev({ palaceRole: "trine", starName: "Đào Hoa", category: "minor-star-family" }),
        ev({ palaceRole: "trine", starName: "Hỏa Tinh", category: "minor-star-family" }),
      ],
      k,
    );
    const tamMinh = computeStructureQuality(
      [
        ev({ palaceRole: "focus", starName: "Thiên Hỷ", category: "minor-star-family" }),
        ev({ palaceRole: "trine", starName: "Đào Hoa", category: "minor-star-family" }),
        ev({ palaceRole: "opposite", starName: "Hồng Loan", category: "minor-star-family" }),
        ev({ palaceRole: "trine", starName: "Hỏa Tinh", category: "minor-star-family" }),
      ],
      k,
    );
    expect(satOnly).toBeLessThan(0);
    expect(tamMinh).toBeGreaterThan(satOnly);
    expect(tamMinh).toBeGreaterThan(0);
  });

  it("Thanh Long opposite Hóa Kỵ is support, not extra Kỵ dump", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const longOnly = computeStructureQuality(
      [ev({ palaceRole: "focus", starName: "Thanh Long", category: "minor-star-family" })],
      k,
    );
    const longKy = computeStructureQuality(
      [
        ev({ palaceRole: "focus", starName: "Thanh Long", category: "minor-star-family" }),
        ev({
          palaceRole: "opposite",
          starName: "Thiên Cơ",
          starBrightness: "Hãm",
          transformation: "Kỵ",
          palaceBranch: "Sửu",
        }),
      ],
      k,
    );
    expect(longKy).toBeGreaterThan(longOnly);
  });

  it("minor family axes enter the net; Lộc Tồn family support is skipped", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const empty = computeStructureQuality(
      [ev({ palaceRole: "focus", starName: "Tả Phụ", category: "minor-star-family" })],
      k,
    );
    const ta = computeStructureQuality(
      [
        ev({
          palaceRole: "focus",
          starName: "Tả Phụ",
          category: "minor-star-family",
          axes: { support: 1.4, pressure: 0, stability: 0.4, activation: 0.2 },
        }),
      ],
      k,
    );
    expect(ta).toBeGreaterThan(empty);
    const locAxes = {
      support: 5,
      pressure: 0,
      stability: 0,
      activation: 0,
    };
    const locNamed = computeStructureQuality(
      [ev({ palaceRole: "focus", starName: "Lộc Tồn", category: "minor-star-family" })],
      k,
    );
    const locFat = computeStructureQuality(
      [
        ev({
          palaceRole: "focus",
          starName: "Lộc Tồn",
          category: "minor-star-family",
          axes: locAxes,
        }),
      ],
      k,
    );
    expect(locFat).toBe(locNamed);
  });

  it("sample 1998-10-01 Dần: Mệnh-Tài-Quan not smashed by Di Kỵ; Huynh can be strong 体", () => {
    const { results } = analyzeAllPalaces(
      calculateNamPhai({
        solarDate: "1998-10-01",
        birthHour: "Dần",
        gender: "male",
        timezone: "7",
        annualYear: "2026",
        flowBase: "luu-nien",
      }),
      { school: "nam-phai" },
    );
    const score = (name: string) =>
      results.find((r) => r.palaceName === name)?.score ?? 0;
    const huynh = score("Huynh Đệ");
    const menh = score("Mệnh");
    const tai = score("Tài Bạch");
    const quan = score("Quan Lộc");
    expect(menh).toBeGreaterThan(40);
    expect(menh).toBeLessThan(90);
    expect(tai).toBeGreaterThan(20);
    expect(quan).toBeGreaterThanOrEqual(20);
    expect(score("Thiên Di")).toBeGreaterThan(20);
    expect(huynh).toBeLessThan(100);
    expect(score("Điền Trạch")).toBeLessThan(93);
    expect(score("Tật Ách")).toBeLessThan(93);
    expect(score("Huynh Đệ")).toBeLessThan(93);
    expect(score("Tật Ách")).toBeGreaterThan(score("Nô Bộc"));
  });
});
