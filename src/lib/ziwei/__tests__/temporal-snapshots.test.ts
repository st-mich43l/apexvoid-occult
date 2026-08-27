import { describe, expect, it } from "vitest";
import { calculateForAnnualYear, serializeChart } from "@/lib/ziwei/chart";
import { buildTemporalSnapshotsFromCore } from "@/lib/ziwei/temporal-snapshots";
import type { BirthInput } from "@/types/chart";

const A: BirthInput = {
  solarDate: "21/09/1991",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("temporal snapshots (PR #250)", () => {
  it("builds a single foreign-year snapshot without altering anchor facts", () => {
    const anchor = serializeChart(
      calculateForAnnualYear("nam-phai", A, 2026),
      "nam-phai",
      "female",
    )!;
    expect(anchor.annualYear).toBe(2026);

    const bundle = buildTemporalSnapshotsFromCore(
      "nam-phai",
      "female",
      A,
      2026,
      [2027],
    );
    expect(bundle.anchorAnnualYear).toBe(2026);
    expect(bundle.snapshots).toHaveLength(1);
    expect(bundle.snapshots[0]!.annualYear).toBe(2027);
    expect(bundle.snapshots[0]!.yearStem).toBe(anchor.yearStem);
    expect(bundle.snapshots[0]!.birthHourBranch).toBe(anchor.birthHourBranch);
    // Anchor DTO untouched
    expect(anchor.annualYear).toBe(2026);
  });

  it("builds multiple snapshots with shared natal identity", () => {
    const bundle = buildTemporalSnapshotsFromCore(
      "nam-phai",
      "female",
      A,
      2026,
      [2029, 2027, 2028, 2027],
    );
    expect(bundle.snapshots.map((s) => s.annualYear)).toEqual([2027, 2028, 2029]);
    const natal = bundle.snapshots.map((s) => ({
      school: s.school,
      gender: s.gender,
      yearStem: s.yearStem,
      menhBranch: s.menhBranch,
      natal: s.natalMutagens,
    }));
    expect(natal[0]).toEqual(natal[1]);
    expect(natal[1]).toEqual(natal[2]);
    const annuals = new Set(bundle.snapshots.map((s) => `${s.annualStem}-${s.annualBranch}`));
    expect(annuals.size).toBe(3);
  });

  it("uses captured birth input (race-safe) even if later form would differ", () => {
    const captured = { ...A, annualYear: "2026" };
    const laterFormWouldBe = { ...A, annualYear: "2030", birthHour: "Tý" };
    const bundle = buildTemporalSnapshotsFromCore(
      "nam-phai",
      "female",
      captured,
      2026,
      [2027],
    );
    // Must not use laterFormWouldBe
    expect(laterFormWouldBe.birthHour).toBe("Tý");
    expect(bundle.snapshots[0]!.birthHourBranch).toBe(
      serializeChart(calculateForAnnualYear("nam-phai", captured, 2027), "nam-phai", "female")!
        .birthHourBranch,
    );
  });
});
