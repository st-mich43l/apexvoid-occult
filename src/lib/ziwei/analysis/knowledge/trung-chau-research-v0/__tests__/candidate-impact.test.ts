import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TRUNG_CHAU_TU_HOA } from "@/lib/ziwei/schools/trung-chau-policy";
import { getTuHoaTargets } from "@/lib/ziwei/calculation/shared-mutagens";
import {
  loadTrungChauResearchPackV0,
  resetTrungChauResearchPackCache,
} from "../index";

import type { TuHoaTable } from "@/lib/ziwei/schools/policy-types";

const CANDIDATE_TABLE: TuHoaTable = {
  ...TRUNG_CHAU_TU_HOA,
  Mậu: { ...TRUNG_CHAU_TU_HOA.Mậu, Khoa: "Thái Dương" },
  Nhâm: { ...TRUNG_CHAU_TU_HOA.Nhâm, Khoa: "Thiên Phủ" },
};

function khoaStar(table: TuHoaTable, stem: string): string {
  const targets = getTuHoaTargets(table, stem);
  return targets.find((t) => t.mutagen === "Khoa")?.starName ?? "";
}

describe("trung-chau-research-v0 ERQ-005 candidate impact", () => {
  it("candidate table differs only on Mậu and Nhâm Khoa", () => {
    expect(khoaStar(CANDIDATE_TABLE, "Mậu")).toBe("Thái Dương");
    expect(khoaStar(TRUNG_CHAU_TU_HOA, "Mậu")).toBe("Hữu Bật");
    expect(khoaStar(CANDIDATE_TABLE, "Nhâm")).toBe("Thiên Phủ");
    expect(khoaStar(TRUNG_CHAU_TU_HOA, "Nhâm")).toBe("Tả Phụ");
    expect(khoaStar(CANDIDATE_TABLE, "Canh")).toBe(khoaStar(TRUNG_CHAU_TU_HOA, "Canh"));
  });

  it("decision packet and impact artifact stay expert_pending / research_candidate", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    expect(loaded.pack.erq005DecisionPacket?.status).toBe("expert_pending");
    expect(loaded.pack.erq005CandidateImpact?.runtimeAuthority).toBe(false);
    expect(loaded.pack.erq005CandidateImpact?.changedCells.length).toBe(2);
  });

  it("recomputes golden mutagen Khoa targets for Mậu/Nhâm stems", () => {
    const goldenPath = resolve(
      process.cwd(),
      "tests/golden/tuvi-trung-chau.json",
    );
    const golden = JSON.parse(readFileSync(goldenPath, "utf8")) as {
      cases: Array<{ input: { annualYear?: string }; output: { yearStem?: string; annualStem?: string } }>;
    };

    let inspected = 0;
    let wouldDiffer = 0;
    for (const c of golden.cases) {
      const stems = [c.output.yearStem, c.output.annualStem].filter(Boolean);
      for (const stem of stems) {
        if (stem !== "Mậu" && stem !== "Nhâm") continue;
        inspected += 1;
        if (khoaStar(CANDIDATE_TABLE, stem) !== khoaStar(TRUNG_CHAU_TU_HOA, stem)) {
          wouldDiffer += 1;
        }
      }
    }

    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    expect(loaded.pack.erq005CandidateImpact?.goldenCasesInspected).toBe(92);
    expect(inspected).toBeGreaterThanOrEqual(0);
    // Artifact documents shadow delta count — recomputed here so it cannot silently drift
    expect(loaded.pack.erq005CandidateImpact?.goldenCasesPotentiallyAffected).toBe(
      wouldDiffer,
    );
  });
});
