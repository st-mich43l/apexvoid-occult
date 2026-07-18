import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace, MutagenRecord } from "@/types/chart";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../../knowledge/major-fortune-scoring";
import { resolveMajorFortuneContext } from "../resolve-context";
import { emptyMajorFortuneDiagnostics } from "../types";

const FORWARD_NAMES = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
];

function buildActivePalace(overrides: Partial<ChartPalace> = {}): ChartPalace {
  return {
    index: 3,
    branch: "b3",
    name: "NATAL-3",
    stem: "Tân",
    majorFortune: { order: 3, start: 35, end: 44, active: true },
    ...overrides,
  };
}

function buildChart(overrides: Partial<ChartData> = {}): ChartData {
  const activePalace = buildActivePalace();
  const otherPalaces: ChartPalace[] = FORWARD_NAMES.map((_, i) =>
    i === activePalace.index ? activePalace : { index: i, branch: `b${i}`, name: `NATAL-${i}` },
  );
  return {
    palaces: otherPalaces,
    majorFortunePalace: activePalace,
    ...overrides,
  } as unknown as ChartData;
}

describe("resolveMajorFortuneContext", () => {
  const loaded = loadMajorFortuneScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("major fortune scoring knowledge failed to load");
  const knowledge = loaded.knowledge;
  const trungChauCapabilities = {
    supportsOverallFrame: true,
    supportsTwelveDomainOverlay: true,
    supportsMajorFortuneTransformations: true,
  };
  const namPhaiCapabilities = {
    supportsOverallFrame: true,
    supportsTwelveDomainOverlay: false,
    supportsMajorFortuneTransformations: false,
  };

  it("returns null and logs noActiveMajorFortune when there is no active decade", () => {
    const chart = buildChart({ majorFortunePalace: null });
    const diagnostics = emptyMajorFortuneDiagnostics();

    const result = resolveMajorFortuneContext(chart, "trung-chau", knowledge, trungChauCapabilities, diagnostics);

    expect(result).toBeNull();
    expect(diagnostics.noActiveMajorFortune.length).toBeGreaterThan(0);
  });

  it("returns null and logs invalidResolvedContext when majorFortune fields are incomplete", () => {
    const activePalace = buildActivePalace({ majorFortune: undefined });
    const chart = buildChart({ majorFortunePalace: activePalace });
    const diagnostics = emptyMajorFortuneDiagnostics();

    const result = resolveMajorFortuneContext(chart, "trung-chau", knowledge, trungChauCapabilities, diagnostics);

    expect(result).toBeNull();
    expect(diagnostics.invalidResolvedContext.length).toBeGreaterThan(0);
  });

  it("resolves cycle/active-palace fields from already-computed ChartData", () => {
    const chart = buildChart();
    const diagnostics = emptyMajorFortuneDiagnostics();

    const result = resolveMajorFortuneContext(chart, "trung-chau", knowledge, trungChauCapabilities, diagnostics);

    expect(result).toMatchObject({
      cycleIndex: 3,
      startAge: 35,
      endAge: 44,
      activePalaceIndex: 3,
      fortuneStem: "Tân",
    });
  });

  it("builds majorPalaceLabels only when exactly twelve unique labels resolve", () => {
    const chart = buildChart();
    chart.palaces.forEach((p, i) => {
      p.majorPalaceName = FORWARD_NAMES[(i + 1) % 12];
    });
    const diagnostics = emptyMajorFortuneDiagnostics();

    const result = resolveMajorFortuneContext(chart, "trung-chau", knowledge, trungChauCapabilities, diagnostics);

    expect(result?.majorPalaceLabels?.size).toBe(12);
    expect(diagnostics.incompleteMajorPalaceLabels).toHaveLength(0);
    expect(diagnostics.duplicateMajorPalaceLabels).toHaveLength(0);
  });

  it("logs incompleteMajorPalaceLabels and leaves labels undefined when a label is missing", () => {
    const chart = buildChart();
    chart.palaces.forEach((p, i) => {
      p.majorPalaceName = i === 5 ? undefined : FORWARD_NAMES[(i + 1) % 12];
    });
    const diagnostics = emptyMajorFortuneDiagnostics();

    const result = resolveMajorFortuneContext(chart, "trung-chau", knowledge, trungChauCapabilities, diagnostics);

    expect(result?.majorPalaceLabels).toBeUndefined();
    expect(diagnostics.incompleteMajorPalaceLabels.length).toBeGreaterThan(0);
  });

  it("logs duplicateMajorPalaceLabels and leaves labels undefined when a label repeats", () => {
    const chart = buildChart();
    chart.palaces.forEach((p, i) => {
      p.majorPalaceName = i === 5 ? FORWARD_NAMES[(0 + 1) % 12] : FORWARD_NAMES[(i + 1) % 12];
    });
    const diagnostics = emptyMajorFortuneDiagnostics();

    const result = resolveMajorFortuneContext(chart, "trung-chau", knowledge, trungChauCapabilities, diagnostics);

    expect(result?.majorPalaceLabels).toBeUndefined();
    expect(diagnostics.duplicateMajorPalaceLabels.length).toBeGreaterThan(0);
  });

  it("never resolves domain labels for Nam Phái and flags unsupportedSchoolCapability if data is present anyway", () => {
    const chart = buildChart();
    chart.palaces.forEach((p, i) => {
      p.majorPalaceName = FORWARD_NAMES[(i + 1) % 12];
    });
    const diagnostics = emptyMajorFortuneDiagnostics();

    const result = resolveMajorFortuneContext(chart, "nam-phai", knowledge, namPhaiCapabilities, diagnostics);

    expect(result?.majorPalaceLabels).toBeUndefined();
    expect(diagnostics.unsupportedSchoolCapability.length).toBeGreaterThan(0);
  });

  it("excludes and diagnoses majorMutagens for Nam Phái even if somehow present", () => {
    const activePalace = buildActivePalace();
    const record: MutagenRecord = { mutagen: "Lộc", starName: "Vũ Khúc", palace: activePalace };
    const chart = buildChart({ majorMutagens: [record] });
    const diagnostics = emptyMajorFortuneDiagnostics();

    const result = resolveMajorFortuneContext(chart, "nam-phai", knowledge, namPhaiCapabilities, diagnostics);

    expect(result?.transformations).toBeUndefined();
    expect(diagnostics.forbiddenSchoolTransformations.length).toBeGreaterThan(0);
  });

  it("accepts majorMutagens for Trung Châu when stem is resolved", () => {
    const activePalace = buildActivePalace();
    const record: MutagenRecord = { mutagen: "Lộc", starName: "Vũ Khúc", palace: activePalace };
    const chart = buildChart({ majorMutagens: [record] });
    const diagnostics = emptyMajorFortuneDiagnostics();

    const result = resolveMajorFortuneContext(chart, "trung-chau", knowledge, trungChauCapabilities, diagnostics);

    expect(result?.transformations).toEqual([record]);
    expect(diagnostics.forbiddenSchoolTransformations).toHaveLength(0);
  });

  it("logs presence of forbidden annual facts without consuming them", () => {
    const chart = buildChart({
      annualStars: [{ name: "Lưu X", palace: buildActivePalace() }] as never,
      taiTuePalace: buildActivePalace(),
    });
    const diagnostics = emptyMajorFortuneDiagnostics();

    resolveMajorFortuneContext(chart, "trung-chau", knowledge, trungChauCapabilities, diagnostics);

    expect(diagnostics.forbiddenAnnualFacts).toEqual(expect.arrayContaining(["annualStars", "taiTuePalace"]));
  });
});
