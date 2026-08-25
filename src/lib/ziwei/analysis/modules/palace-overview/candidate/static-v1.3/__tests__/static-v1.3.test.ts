import { describe, expect, it } from "vitest";
import type { PalaceEvidence } from "../../../types";
import {
  analyzeStaticV13Birth,
  CASE_1998_DAN,
  scoreStaticV13Candidates,
} from "../index";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAllPalaces } from "../../../analyze-all-palaces";

function ev(partial: Partial<PalaceEvidence> & Pick<PalaceEvidence, "id" | "palaceRole" | "axes">): PalaceEvidence {
  return {
    category: "major-star",
    factIds: [partial.id],
    palaceName: "Test",
    palaceBranch: partial.palaceBranch ?? "Dần",
    label: partial.id,
    explanationKey: partial.id,
    sourceIds: [],
    knowledgeStatus: "experimental",
    contributionKind: "component",
    ...partial,
  };
}

describe("palace-overview static V1.3", () => {
  it("keeps annualYear invariance on 1998 diagnostic (TEMPORAL_CONTAMINATION=ZERO)", () => {
    const years = [2025, 2026, 2027, 2030];
    const fingerprints = years.map((y) => {
      const chart = calculateNamPhai({
        ...CASE_1998_DAN,
        annualYear: String(y),
      });
      const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
      return results
        .map((r) => {
          const c = scoreStaticV13Candidates(r.allEvidence);
          return `${r.palaceName}:${r.score}:${c["context-normalized"].score}:${c["context-diminishing"].score}:${c["local-context"].score}`;
        })
        .join("|");
    });
    expect(new Set(fingerprints).size).toBe(1);
  });

  it("attributes 1998 Dần–Ngọ–Tuất inflation with local vs remote nets", () => {
    const analysis = analyzeStaticV13Birth();
    const tatAch = analysis.palaces.find(
      (p) => p.decomposition.palaceName === "Tật Ách",
    )!;
    const d = tatAch.decomposition;
    expect(d.palaceBranch).toBe("Dần");
    expect(d.controlScore).toBeGreaterThan(80);
    expect(d.trineByBranch.length).toBeGreaterThanOrEqual(1);
    expect(d.context.net).not.toBe(0);
    expect(d.localNetShare).not.toBeNull();
    expect(d.remoteShare).not.toBeNull();
    // Control near-ceiling with non-trivial remote share is the incident shape.
    expect((d.remoteShare ?? 0) + (d.localNetShare ?? 0)).toBeCloseTo(1, 5);
  });

  it("does not use recursive palace scores (context from evidence only)", () => {
    // Weak focus + huge remote support must improve but stay below ceiling
    // under every candidate (CASE 1).
    const weakFocusStrongRemote: PalaceEvidence[] = [
      ev({
        id: "focus-weak",
        palaceRole: "focus",
        palaceBranch: "Dần",
        axes: { support: 1, pressure: 1.2, stability: 0, activation: 0 },
      }),
      ev({
        id: "trine-a",
        palaceRole: "trine",
        palaceBranch: "Ngọ",
        axes: { support: 8, pressure: 0, stability: 0, activation: 0 },
      }),
      ev({
        id: "trine-b",
        palaceRole: "trine",
        palaceBranch: "Tuất",
        axes: { support: 8, pressure: 0, stability: 0, activation: 0 },
      }),
      ev({
        id: "opp",
        palaceRole: "opposite",
        palaceBranch: "Thân",
        axes: { support: 6, pressure: 0, stability: 0, activation: 0 },
      }),
    ];
    const controlNet =
      weakFocusStrongRemote.reduce((s, e) => s + e.axes.support - e.axes.pressure, 0);
    const controlScore = Math.round((100 / (1 + Math.exp(-controlNet / 8))) * 10) / 10;
    const cands = scoreStaticV13Candidates(weakFocusStrongRemote);
    expect(controlScore).toBeGreaterThan(90);
    for (const id of [
      "context-normalized",
      "context-diminishing",
      "local-context",
    ] as const) {
      expect(cands[id].score).toBeLessThan(85);
      expect(cands[id].score).toBeGreaterThan(40);
    }
  });

  it("keeps strong focus strong with neutral context (CASE 2)", () => {
    const strongLocal: PalaceEvidence[] = [
      ev({
        id: "focus-strong",
        palaceRole: "focus",
        palaceBranch: "Dần",
        axes: { support: 12, pressure: 0.5, stability: 0, activation: 0 },
      }),
      ev({
        id: "trine-neutral",
        palaceRole: "trine",
        palaceBranch: "Ngọ",
        axes: { support: 0.4, pressure: 0.4, stability: 0, activation: 0 },
      }),
    ];
    const cands = scoreStaticV13Candidates(strongLocal);
    for (const id of [
      "context-normalized",
      "context-diminishing",
      "local-context",
    ] as const) {
      expect(cands[id].score).toBeGreaterThan(75);
    }
  });

  it("allows strong focus + supportive context to remain very strong (CASE 3)", () => {
    const both: PalaceEvidence[] = [
      ev({
        id: "focus-strong",
        palaceRole: "focus",
        palaceBranch: "Dần",
        axes: { support: 11, pressure: 0.3, stability: 0, activation: 0 },
      }),
      ev({
        id: "trine-a",
        palaceRole: "trine",
        palaceBranch: "Ngọ",
        axes: { support: 3, pressure: 0.2, stability: 0, activation: 0 },
      }),
      ev({
        id: "trine-b",
        palaceRole: "trine",
        palaceBranch: "Tuất",
        axes: { support: 2.5, pressure: 0.2, stability: 0, activation: 0 },
      }),
    ];
    const cands = scoreStaticV13Candidates(both);
    expect(cands["local-context"].score).toBeGreaterThan(80);
  });

  it("allows weak focus + adverse context to stay weak (CASE 4)", () => {
    const adverse: PalaceEvidence[] = [
      ev({
        id: "focus-weak",
        palaceRole: "focus",
        palaceBranch: "Dần",
        axes: { support: 0.5, pressure: 2, stability: 0, activation: 0 },
      }),
      ev({
        id: "trine-bad",
        palaceRole: "trine",
        palaceBranch: "Ngọ",
        axes: { support: 0.2, pressure: 4, stability: 0, activation: 0 },
      }),
    ];
    const cands = scoreStaticV13Candidates(adverse);
    for (const id of [
      "context-normalized",
      "context-diminishing",
      "local-context",
    ] as const) {
      expect(cands[id].score).toBeLessThan(45);
    }
  });

  it("bounds mutual trine amplification on synthetic triangle (CASE 5)", () => {
    const makePalace = (focusBranch: string, remotes: string[]): PalaceEvidence[] => [
      ev({
        id: `maj-${focusBranch}`,
        palaceRole: "focus",
        palaceBranch: focusBranch,
        axes: { support: 7, pressure: 0.2, stability: 0, activation: 0 },
      }),
      ...remotes.map((b, i) =>
        ev({
          id: `remote-${focusBranch}-${b}`,
          palaceRole: "trine",
          palaceBranch: b,
          axes: { support: 6 - i * 0.5, pressure: 0.1, stability: 0, activation: 0 },
        }),
      ),
    ];
    const a = scoreStaticV13Candidates(makePalace("Dần", ["Ngọ", "Tuất"]));
    const b = scoreStaticV13Candidates(makePalace("Ngọ", ["Dần", "Tuất"]));
    const c = scoreStaticV13Candidates(makePalace("Tuất", ["Dần", "Ngọ"]));
    const controlLike = (evs: PalaceEvidence[]) => {
      const net = evs.reduce((s, e) => s + e.axes.support - e.axes.pressure, 0);
      return Math.round((100 / (1 + Math.exp(-net / 8))) * 10) / 10;
    };
    const controlScores = [
      controlLike(makePalace("Dần", ["Ngọ", "Tuất"])),
      controlLike(makePalace("Ngọ", ["Dần", "Tuất"])),
      controlLike(makePalace("Tuất", ["Dần", "Ngọ"])),
    ];
    expect(controlScores.every((s) => s >= 90)).toBe(true);
    const candidateScores = [
      a["local-context"].score,
      b["local-context"].score,
      c["local-context"].score,
    ];
    expect(candidateScores.filter((s) => s >= 95).length).toBe(0);
    expect(Math.max(...candidateScores) - Math.min(...candidateScores)).toBeLessThan(
      8,
    );
  });

  it("damps overlapping structural-rule credit (PHYSICAL_FACT_DOUBLE_CREDIT controlled)", () => {
    const evidence: PalaceEvidence[] = [
      ev({
        id: "natal:star:0:Tử Vi",
        category: "major-star",
        palaceRole: "focus",
        factIds: ["natal:star:0:Tử Vi"],
        axes: { support: 7, pressure: 0, stability: 0, activation: 0 },
      }),
      ev({
        id: "natal:star:0:Thiên Phủ",
        category: "major-star",
        palaceRole: "focus",
        factIds: ["natal:star:0:Thiên Phủ"],
        axes: { support: 8, pressure: 0, stability: 0, activation: 0 },
      }),
      ev({
        id: "rule:tu-phu-vu-tuong",
        category: "structural-rule",
        palaceRole: "focus",
        factIds: ["natal:star:0:Tử Vi", "natal:star:0:Thiên Phủ"],
        contributionKind: "interaction-delta",
        axes: { support: 3, pressure: 0, stability: 0, activation: 0 },
      }),
    ];
    const controlNet = 7 + 8 + 3;
    const cands = scoreStaticV13Candidates(evidence);
    // Formation scaled to 0.35 → localNet ≈ 15 + 1.05 = 16.05 vs control 18
    expect(cands["local-context"].localNet).toBeLessThan(controlNet - 1);
    expect(cands["local-context"].localNet).toBeCloseTo(16.05, 1);
  });
});
