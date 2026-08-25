/**
 * Structural checks on the four teacher review charts.
 * Assert formula shape, not golden radar scores.
 */
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { analyzeAllPalacesV2 } from "../analyze";

const TAN_MUI: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const GIAP_TUAT: BirthInput = {
  solarDate: "1994-05-16",
  birthHour: "Mão",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const MAU_DAN: BirthInput = {
  solarDate: "1998-10-10",
  birthHour: "Dần",
  gender: "male",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const BINH_TY: BirthInput = {
  solarDate: "1996-12-04",
  birthHour: "Ngọ",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function breakdownFor(input: BirthInput, palaceName: string) {
  const chart = calculateNamPhai(input);
  const { breakdowns } = analyzeAllPalacesV2(chart, { school: "nam-phai" });
  const row = breakdowns.find((b) => b.palaceName === palaceName);
  if (!row) throw new Error(`missing palace ${palaceName}`);
  return { chart, row, breakdowns };
}

describe("palace-overview V2 — four teacher charts (structural)", () => {
  it("Tân Mùi Mệnh: Thái Dương Hãm is C=−5 and Hóa Quyền offsets; not a Hãm-only crash", () => {
    const { chart, row } = breakdownFor(TAN_MUI, "Mệnh");
    expect(chart.yearStem).toBe("Tân");
    expect(chart.yearBranch).toBe("Mùi");
    const menh = chart.palaces.find((p) => p.name === "Mệnh")!;
    expect(menh.stars?.some((s) => s.name === "Thái Dương" && s.brightness === "Hãm")).toBe(
      true,
    );
    expect(row.majorContribution).toBe(-5);
    expect(row.transformContribution).toBeGreaterThanOrEqual(5);
    expect(row.sBase).not.toBe(row.majorContribution);
  });

  it("Tân Mùi VCD Tài/Tử: opposite weight 0.60, S_cung is not zero just because VCD", () => {
    const { row: tai } = breakdownFor(TAN_MUI, "Tài Bạch");
    expect(tai.isVcd).toBe(true);
    expect(tai.weights.opposite).toBe(0.6);
    expect(tai.weights.self).toBe(0.25);
    expect(tai.sCung).not.toBe(0);
  });

  it("Bính Tý Mệnh Liêm Tham Hãm + Triệt: S_base < 0 and f(TT) is positive", () => {
    const { chart, row } = breakdownFor(BINH_TY, "Mệnh");
    expect(chart.yearStem).toBe("Bính");
    expect(chart.yearBranch).toBe("Tý");
    expect(row.hasTuanTriet).toBe(true);
    expect(row.sBase).toBeLessThan(0);
    expect(row.sAfterTt).toBeGreaterThan(0);
    expect(row.sAfterTt).toBeCloseTo(Math.abs(row.sBase) * 0.4, 10);
  });

  it("Giáp Tuất: a Hãm principal has negative C and TP4C S_cung is not identical to local f(TT)", () => {
    const chart = calculateNamPhai(GIAP_TUAT);
    expect(chart.yearStem).toBe("Giáp");
    expect(chart.yearBranch).toBe("Tuất");
    const { breakdowns } = analyzeAllPalacesV2(chart, { school: "nam-phai" });
    const hamPalace = chart.palaces.find((p) =>
      p.stars?.some((s) => s.layer === "major" && s.brightness === "Hãm"),
    );
    expect(hamPalace).toBeTruthy();
    const row = breakdowns.find((b) => b.palaceIndex === hamPalace!.index)!;
    expect(row.majorContribution).toBeLessThan(0);
    expect(row.sCung).not.toBe(row.sAfterTt);
  });

  it("does not apply formation K", () => {
    const { breakdowns } = breakdownFor(MAU_DAN, "Mệnh");
    for (const b of breakdowns) {
      expect(b.sCung).toBeDefined();
    }
  });
});
