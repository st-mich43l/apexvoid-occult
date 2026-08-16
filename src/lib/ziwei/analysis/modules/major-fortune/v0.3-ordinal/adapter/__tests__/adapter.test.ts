import { describe, expect, it, vi } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput, ChartData, ChartStar } from "@/types/chart";
import {
  adaptChartToMajorFortuneOrdinalInput,
  analyzeMajorFortuneOrdinalV03,
} from "../adapt";
import { validateAdapterEvidence } from "../validate-evidence";
import { evaluateMajorFortuneOrdinal } from "../../evaluate";
import { getAnalysisStatus } from "../../../../../contracts/common";
import { loadMajorFortuneOrdinalKnowledge } from "../../../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import { frameRoleForIndex, tp4cIndices } from "../frame-tp4c";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function withActivePalaceStars(chart: ChartData, stars: ChartStar[]): ChartData {
  const active = chart.majorFortunePalace;
  if (!active) throw new Error("no active major fortune");
  return {
    ...chart,
    palaces: chart.palaces.map((p) =>
      p.index === active.index ? { ...p, stars: [...stars] } : p,
    ),
    majorFortunePalace: {
      ...active,
      stars: [...stars],
    },
  };
}

describe("Major Fortune V0.3 evidence adapter", () => {
  it("fails closed with no active Major Fortune palace", () => {
    const chart = calculateNamPhai(REGRESSION);
    const broken = { ...chart, majorFortunePalace: null };
    const build = adaptChartToMajorFortuneOrdinalInput(broken, { school: "nam-phai" });
    expect(build.cycle).toBeNull();
    expect(build.evaluationInput).toBeNull();
    expect(build.adapterDiagnostics.noActiveMajorFortune.length).toBeGreaterThan(0);
  });

  it("marks Thiên Thời unavailable when Mệnh element is missing", () => {
    const chart = {
      ...calculateNamPhai(REGRESSION),
      menhElement: undefined,
    } as unknown as ChartData;
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(build.evaluationInput).not.toBeNull();
    expect(build.pillarContexts?.["thien-thoi"].availability).toBe("unavailable");
    expect(build.emittedEvidence.some((e) => e.pillarId === "thien-thoi")).toBe(false);
  });

  it("emits element-relation evidence for Thiên Thời", () => {
    const chart = calculateNamPhai(REGRESSION);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    const el = build.emittedEvidence.filter((e) => e.signalFamilyId === "element-relation");
    expect(el.length).toBeGreaterThanOrEqual(1);
    expect(el.length).toBeLessThanOrEqual(2);
    if (chart.menhElement && chart.majorFortunePalace) {
      expect(el.some((e) => e.reasonCode.startsWith("element-relation:"))).toBe(true);
      expect(el[0]?.physicalFactKind).toBe("element-relation");
      expect(el[0]?.temporalScope).toBe("major-fortune");
    }
  });

  it("maps principal dignity labels and skips Bình", () => {
    const base = calculateNamPhai(REGRESSION);
    const chart = withActivePalaceStars(base, [
      { name: "Tử Vi", source: "natal", brightness: "Miếu" },
      { name: "Thiên Phủ", source: "natal", brightness: "Bình" },
      { name: "Thất Sát", source: "natal", brightness: "Hãm" },
    ]);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    const dig = build.emittedEvidence.filter((e) => e.signalFamilyId === "principal-star-dignity");
    expect(dig.some((e) => e.reasonCode === "dignity:Miếu")).toBe(true);
    expect(dig.some((e) => e.reasonCode === "dignity:Hãm")).toBe(true);
    expect(dig.some((e) => e.reasonCode === "dignity:Bình")).toBe(false);
  });

  it("marks Địa Lợi partial-data on missing brightness", () => {
    const base = calculateNamPhai(REGRESSION);
    const chart = withActivePalaceStars(base, [
      { name: "Tử Vi", source: "natal" },
    ]);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(build.pillarContexts?.["dia-loi"].availability).toBe("partial-data");
  });

  it("rejects unsupported brightness into diagnostics and partial-data", () => {
    const base = calculateNamPhai(REGRESSION);
    const chart = withActivePalaceStars(base, [
      { name: "Tử Vi", source: "natal", brightness: "UNKNOWN" as never },
    ]);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(build.adapterDiagnostics.unsupportedBrightness.length).toBeGreaterThan(0);
    expect(build.pillarContexts?.["dia-loi"].availability).toBe("partial-data");
  });

  it("Vô Chính Diệu mượn chính tinh đối cung", () => {
    const base = calculateNamPhai(REGRESSION);
    const chart = withActivePalaceStars(base, [{ name: "Văn Xương", source: "natal" }]);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    const dig = build.emittedEvidence.filter((e) => e.signalFamilyId === "principal-star-dignity");
    if (dig.length === 0) {
      expect(build.pillarContexts?.["dia-loi"].reasonCodes).toContain(
        "vo-chinh-dieu-no-direct-principal-evidence",
      );
    } else {
      expect(dig.every((e) => e.factIds.includes("borrowed-opposite"))).toBe(true);
      expect(build.pillarContexts?.["dia-loi"].reasonCodes).toContain("vo-chinh-dieu-borrow-opposite");
    }
  });

  it("emits complete pair sets and partial pairs", () => {
    const base = calculateNamPhai(REGRESSION);
    const chart = withActivePalaceStars(base, [
      { name: "Thiên Khôi", source: "natal" },
      { name: "Thiên Việt", source: "natal" },
      { name: "Kình Dương", source: "natal" }, // partial Kình–Đà
    ]);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(
      build.emittedEvidence.some((e) => e.reasonCode === "auxiliary-set:khoi-viet"),
    ).toBe(true);
    expect(
      build.emittedEvidence.some((e) => e.reasonCode === "auxiliary-set-partial:kinh-da"),
    ).toBe(true);
  });

  it("does not score Lưu niên stars as Nhân Hòa", () => {
    const base = calculateNamPhai(REGRESSION);
    const chart = withActivePalaceStars(base, [
      { name: "Lưu Thiên Khôi", source: "annual" },
      { name: "Lưu Thiên Việt", source: "annual" },
    ]);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(build.emittedEvidence.some((e) => e.reasonCode.includes("khoi-viet"))).toBe(false);
  });

  it("emits singleton Lộc Tồn", () => {
    const base = calculateNamPhai(REGRESSION);
    const chart = withActivePalaceStars(base, [{ name: "Lộc Tồn", source: "natal" }]);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(build.emittedEvidence.some((e) => e.reasonCode === "auxiliary-set:loc-ton")).toBe(true);
  });

  it("blocks Nam Phái transformations as partial-data", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS", "false");
    const chart = calculateNamPhai(REGRESSION);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(build.pillarContexts?.["tu-hoa-sat-tinh"].availability).toBe("partial-data");
    expect(
      build.emittedEvidence.some((e) => e.signalFamilyId === "major-fortune-transformations"),
    ).toBe(false);
    vi.unstubAllEnvs();
  });

  it("scores natal Hóa Kỵ hội chiếu đại vận, not natal cát hóa on TP4C", () => {
    const chart = calculateNamPhai({
      solarDate: "1998-10-01",
      birthHour: "Dần",
      gender: "male",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    });
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    const xf = build.emittedEvidence.filter(
      (e) => e.signalFamilyId === "major-fortune-transformations",
    );
    expect(xf.some((e) => e.reasonCode === "transformation:natal:Hóa Kỵ")).toBe(true);
    expect(xf.every((e) => e.factIds.includes(`sourceStem:${chart.yearStem}`))).toBe(true);
    expect(xf.some((e) => e.reasonCode.includes("Hóa Quyền"))).toBe(false);
    expect(xf.some((e) => e.reasonCode.includes("Hóa Khoa"))).toBe(false);
    expect(xf.some((e) => e.reasonCode.startsWith("transformation:decade:"))).toBe(false);
  });

  it("does not score Nam Phái luck-stem Tứ Hóa (Khoa, Lộc, Quyền, or Kỵ)", () => {
    const chart = calculateNamPhai({
      solarDate: "1998-10-01",
      birthHour: "Dần",
      gender: "male",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    });
    const canh = chart.palaces.find((p) => p.stem === "Canh" && p.majorFortune);
    expect(canh?.majorFortune?.order).toBeDefined();
    expect(canh?.majorFortune?.start).toBeDefined();
    expect(canh?.majorFortune?.end).toBeDefined();
    const mf = canh!.majorFortune!;
    const build = adaptChartToMajorFortuneOrdinalInput(chart, {
      school: "nam-phai",
      cycleOverride: {
        cycleIndex: mf.order!,
        startAge: mf.start!,
        endAge: mf.end!,
        activePalaceIndex: canh!.index,
      },
    });
    const xf = build.emittedEvidence.filter(
      (e) => e.signalFamilyId === "major-fortune-transformations",
    );
    expect(xf.some((e) => e.reasonCode.startsWith("transformation:decade:"))).toBe(false);
  });

  it("emits Nam Phái transformations when the V0.4 flag is on", () => {
    const chart = calculateNamPhai(REGRESSION);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(build.pillarContexts?.["tu-hoa-sat-tinh"].availability).toBe("available");
    expect(build.adapterDiagnostics.namPhaiTransformationBlocked).toHaveLength(0);
    const xf = build.emittedEvidence.filter(
      (e) => e.signalFamilyId === "major-fortune-transformations",
    );
    for (const e of xf) {
      const idx = e.transformationTuple?.targetPalaceIndex;
      expect(idx).toBeDefined();
      const role = frameRoleForIndex(idx!, chart.majorFortunePalace!.index);
      expect(role).not.toBeNull();
      if (e.transformationTuple?.transformationType !== "Hóa Kỵ") {
        expect(role).toBe("focus");
      }
      expect(e.transformationTuple?.transformationType).toMatch(/^Hóa /);
    }
  });

  it("emits Trung Châu natal tuples; does not score luck-stem Tứ Hóa", () => {
    const chart = calculateTrungChau(REGRESSION);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "trung-chau" });
    const xf = build.emittedEvidence.filter(
      (e) => e.signalFamilyId === "major-fortune-transformations",
    );
    expect(xf.some((e) => e.reasonCode.startsWith("transformation:decade:"))).toBe(false);
    for (const e of xf) {
      expect(e.transformationTuple).toBeTruthy();
      expect(e.transformationTuple?.fortuneStem).toBe(chart.yearStem);
      expect(e.transformationTuple?.targetPalace).toBeTruthy();
      expect(e.transformationTuple?.transformationType).toMatch(/^Hóa /);
      const role = frameRoleForIndex(
        e.transformationTuple!.targetPalaceIndex!,
        chart.majorFortunePalace!.index,
      );
      expect(role).not.toBeNull();
      if (e.transformationTuple?.transformationType !== "Hóa Kỵ") {
        expect(role).toBe("focus");
      }
      expect(e.physicalFactKind).toBe("major-fortune-transformation");
    }
  });

  it("scores natal Hóa Kỵ on TP4C and natal cát hóa on focus only", () => {
    const chart = calculateTrungChau(REGRESSION);
    const active = chart.majorFortunePalace!;
    const opposite = chart.palaces.find((p) => p.index === (active.index + 6) % 12)!;
    const outside = chart.palaces.find((p) => !tp4cIndices(active.index).includes(p.index))!;

    const patched = {
      ...chart,
      natalMutagens: [
        {
          mutagen: "Lộc",
          starName: "Tử Vi",
          palace: { ...active, name: active.name, index: active.index },
        },
        {
          mutagen: "Quyền",
          starName: "Vũ Khúc",
          palace: { ...opposite, name: opposite.name, index: opposite.index },
        },
        {
          mutagen: "Kỵ",
          starName: "Thất Sát",
          palace: { ...opposite, name: opposite.name, index: opposite.index },
        },
        {
          mutagen: "Khoa",
          starName: "Thiên Lương",
          palace: { ...outside, name: outside.name, index: outside.index },
        },
      ],
    };
    const build = adaptChartToMajorFortuneOrdinalInput(patched, { school: "trung-chau" });
    const xf = build.emittedEvidence.filter(
      (e) => e.signalFamilyId === "major-fortune-transformations",
    );
    expect(xf.some((e) => e.reasonCode === "transformation:natal:Hóa Lộc")).toBe(true);
    expect(xf.some((e) => e.reasonCode === "transformation:natal:Hóa Kỵ")).toBe(true);
    expect(xf.some((e) => e.reasonCode.includes("Hóa Quyền"))).toBe(false);
    expect(xf.some((e) => e.reasonCode.includes("Hóa Khoa"))).toBe(false);
    expect(xf.some((e) => e.reasonCode.startsWith("transformation:decade:"))).toBe(false);
    expect(build.adapterDiagnostics.outOfFrameTransformationCount).toBeGreaterThanOrEqual(2);
  });

  it("no natal chiếu on the luck frame yields Tứ Hóa with no transformation evidence", () => {
    const chart = calculateTrungChau(REGRESSION);
    const active = chart.majorFortunePalace!;
    const outside = chart.palaces.find((p) => !tp4cIndices(active.index).includes(p.index))!;
    const patched = {
      ...chart,
      natalMutagens: [
        {
          mutagen: "Lộc",
          starName: "Tử Vi",
          palace: { ...outside, index: outside.index, name: outside.name },
        },
      ],
    };
    const analysis = analyzeMajorFortuneOrdinalV03(patched, { school: "trung-chau" });
    expect(
      analysis.build.emittedEvidence.some(
        (e) => e.signalFamilyId === "major-fortune-transformations",
      ),
    ).toBe(false);
    expect(analysis.build.adapterDiagnostics.outOfFrameTransformationCount).toBeGreaterThan(0);
    expect(analysis.evaluation?.pillars["tu-hoa-sat-tinh"].state).toMatch(/no-signal|balanced|classified/);
  });

  it("rejects incomplete natal transformation tuples", () => {
    const chart = calculateTrungChau(REGRESSION);
    const broken = {
      ...chart,
      natalMutagens: [{ mutagen: "Lộc", starName: "Tử Vi", palace: null }],
    };
    const build = adaptChartToMajorFortuneOrdinalInput(broken, { school: "trung-chau" });
    expect(build.adapterDiagnostics.incompleteTransformationTuples.length).toBeGreaterThan(0);
    expect(
      build.emittedEvidence.some((e) => e.signalFamilyId === "major-fortune-transformations"),
    ).toBe(false);
  });

  it("annual field mutation does not change evidence or score", () => {
    const chart = calculateNamPhai(REGRESSION);
    const a = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    const host = chart.palaces[0]!;
    const mutated: ChartData = {
      ...chart,
      annualStars: [{ name: "Lưu Hóa Lộc", source: "annual", palace: host }],
      annualMutagens: [{ mutagen: "Hóa Lộc", starName: "Tử Vi" }],
      taiTuePalace: host,
      smallLimitPalace: chart.palaces[1]!,
    };
    const b = analyzeMajorFortuneOrdinalV03(mutated, { school: "nam-phai" });
    expect(b.build.emittedEvidence).toEqual(a.build.emittedEvidence);
    expect(b.evaluation?.score).toBe(a.evaluation?.score);
    expect(b.build.adapterDiagnostics.forbiddenAnnualMonthlyFieldsPresent.length).toBeGreaterThan(0);
  });

  it("monthly field mutation does not change evidence or score", () => {
    const chart = calculateNamPhai(REGRESSION);
    const a = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    const host = chart.palaces[0]!;
    const mutated: ChartData = {
      ...chart,
      monthlyPalaces: [{ month: 1, palace: host }],
      palaces: chart.palaces.map((p, i) =>
        i === 0 ? { ...p, flowMonths: [{ month: 1, palace: host }] } : p,
      ),
    };
    const b = analyzeMajorFortuneOrdinalV03(mutated, { school: "nam-phai" });
    expect(b.build.emittedEvidence).toEqual(a.build.emittedEvidence);
    expect(b.evaluation?.score).toBe(a.evaluation?.score);
  });

  it("rejects duplicate physical facts before evaluator via intentional doubles", () => {
    const chart = calculateNamPhai(REGRESSION);
    const build = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    if (!build.evaluationInput || build.emittedEvidence.length === 0) return;
    const first = build.emittedEvidence[0]!;
    const samePillarDup = {
      ...first,
      evidenceId: `${first.evidenceId}-dup`,
      evidenceClusterId: `${first.evidenceClusterId}-dup`,
    };
    const crossPillarDup = {
      ...first,
      evidenceId: `${first.evidenceId}-cross`,
      evidenceClusterId: `${first.evidenceClusterId}-cross`,
      pillarId: first.pillarId === "thien-thoi" ? ("dia-loi" as const) : ("thien-thoi" as const),
      signalFamilyId:
        first.pillarId === "thien-thoi" ? "principal-star-dignity" : "element-relation",
      physicalFactKind:
        first.pillarId === "thien-thoi" ? "principal-star-dignity" : "element-relation",
    };
    const sameResult = evaluateMajorFortuneOrdinal({
      ...build.evaluationInput,
      evidence: [...build.emittedEvidence, samePillarDup],
    });
    const sameRejects = Object.values(sameResult.pillars).flatMap((p) => p.rejectedEvidence);
    expect(sameRejects.some((r) => r.reason === "duplicate-physical-fact")).toBe(true);

    const crossResult = evaluateMajorFortuneOrdinal({
      ...build.evaluationInput,
      evidence: [...build.emittedEvidence, crossPillarDup],
    });
    const crossRejects = Object.values(crossResult.pillars).flatMap((p) => p.rejectedEvidence);
    expect(
      crossRejects.some(
        (r) =>
          r.reason === "cross-pillar-ownership-violation" ||
          r.reason === "duplicate-physical-fact",
      ),
    ).toBe(true);
  });

  it("emits deterministic IDs and non-empty provenance", () => {
    const chart = calculateNamPhai(REGRESSION);
    const a = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    const b = adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(a.emittedEvidence.map((e) => e.evidenceId)).toEqual(
      b.emittedEvidence.map((e) => e.evidenceId),
    );
    expect(validateAdapterEvidence(a.emittedEvidence)).toEqual([]);
  });

  it("does not mutate input chart", () => {
    const chart = calculateNamPhai(REGRESSION);
    const before = structuredClone(chart);
    adaptChartToMajorFortuneOrdinalInput(chart, { school: "nam-phai" });
    expect(chart).toEqual(before);
  });

  it("preserves V0.3 ordinal contract and production routing", () => {
    const loaded = loadMajorFortuneOrdinalKnowledge();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.knowledge.formula.baseScore).toBe(50);
      expect(loaded.knowledge.formula.ordinalDivisor).toBe(4);
      expect(loaded.knowledge.formula.derivation.forbidsPerRuleRawDelta).toBe(true);
    }
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "available",
      module: "major-fortune",
      version: "0.5.5",
    });
  });

  it("keeps other pillars evaluable when Nam Phái Tứ Hóa is partial", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS", "false");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    expect(result.evaluation?.status).toBe("partial");
    expect(result.build.pillarContexts?.["tu-hoa-sat-tinh"].availability).toBe("partial-data");
    expect(result.evaluation?.coverage.partialPillarIds).toContain("tu-hoa-sat-tinh");
    // Partial pillars remain context-evaluable; scoring coverage excludes null levels.
    expect(result.evaluation?.coverage.contextCoverageWeight).toBe(1);
    expect(result.evaluation?.coverage.scoringCoverageWeight).toBe(0.75);
    expect(result.evaluation?.coverage.coverageWeight).toBe(1);
    expect(result.build.pillarContexts?.["thien-thoi"].availability).not.toBe("unavailable");
    vi.unstubAllEnvs();
  });

  it("scores remain within 0–100 with ordinal levels", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    expect(result.evaluation?.score).not.toBeNull();
    expect(result.evaluation!.score!).toBeGreaterThanOrEqual(0);
    expect(result.evaluation!.score!).toBeLessThanOrEqual(100);
    for (const pillar of Object.values(result.evaluation!.pillars)) {
      if (pillar.level != null) expect([-2, -1, 0, 1, 2]).toContain(pillar.level);
    }
  });
});
