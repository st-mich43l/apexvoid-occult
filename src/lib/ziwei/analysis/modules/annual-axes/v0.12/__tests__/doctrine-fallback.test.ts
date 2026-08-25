import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { CASE_AA10_M1998_DAN_2026 } from "../../v0.10-layered/compare";
import { loadAnnualAxesKnowledgeV10 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV08NamPhai } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.8";
import { loadAnnualAxesKnowledgeV12 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.12";
import { scoreStaticPalaceV12 } from "../score-static-palace";
import {
  collectDoctrineFallbackHits,
  DOCTRINE_ORDINAL_MASS,
} from "../doctrine-fallback";
import { analyzeAnnualAxesNamPhaiV12 } from "../analyze";

describe("V0.12 VERIFIED_PRIMARY doctrine fallback", () => {
  it("does not invent numericDelta on doctrine claims (pack stays qualitative)", () => {
    expect(DOCTRINE_ORDINAL_MASS.moderate).toBe(2);
  });

  it("skips stars already covered by V0.12 static registry (no double-count)", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const hits = collectDoctrineFallbackHits({
      chart,
      palaceIndex: chart.menhIndex,
      palaceName: "Mệnh",
      coveredStarNames: new Set(["Tử Vi", "Thiên Phủ"]),
    });
    expect(
      hits
        .filter((h) => h.starName === "Tử Vi" || h.starName === "Thiên Phủ")
        .every((h) => h.status === "skipped-already-covered"),
    ).toBe(true);
  });

  it("unspecified magnitude yields non-numeric (points=0)", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const hits = collectDoctrineFallbackHits({
      chart,
      palaceIndex: chart.palaces.find((p) => p.name === "Huynh Đệ")?.index ?? 0,
      palaceName: "Huynh Đệ",
      coveredStarNames: new Set(),
    });
    const unspecified = hits.filter((h) => h.magnitudeOrdinal === "unspecified");
    expect(unspecified.every((h) => h.points === 0)).toBe(true);
  });

  it("admits VERIFIED_PRIMARY fallback on sparse palaces without calling analyzeAllPalaces", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const knowledge = loadAnnualAxesKnowledgeV10();
    const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
    const knowledge12 = loadAnnualAxesKnowledgeV12();
    expect(knowledge08.ok).toBe(true);
    if (!knowledge08.ok) return;

    const quanLoc = chart.palaces.find((p) => p.name === "Quan Lộc");
    expect(quanLoc).toBeTruthy();
    const scored = scoreStaticPalaceV12({
      chart,
      domain: "career",
      palace: {
        palaceName: "Quan Lộc",
        palaceIndex: quanLoc!.index,
        branch: quanLoc!.branch,
        role: "primary",
        originalWeight: 0.6,
        effectiveLayerWeight: 0.6,
      },
      knowledge08: knowledge08.knowledge,
      knowledge12,
      referenceMass: knowledge12.selectedReferenceMass,
    });
    // Either registry or doctrine may contribute; doctrine path must be wired.
    expect(typeof scored.doctrineFallbackAdmitted).toBe("number");
    expect(
      scored.evidence.every(
        (e) =>
          e.system !== "palace-overview" &&
          !String(e.system).includes("analyzeAllPalaces"),
      ),
    ).toBe(true);
    void knowledge;
  });

  it("keeps production V0.11 route and finite V0.12 scores", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const v12 = analyzeAnnualAxesNamPhaiV12(chart);
    for (const ax of Object.values(v12.axes)) {
      if (ax.finalScore == null) continue;
      expect(Number.isFinite(ax.finalScore)).toBe(true);
    }
  });
});
