import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { loadPalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2";
import {
  indexFactsByPalace,
  normalizeNatalFacts,
  type ZiweiSchool,
} from "../../../../facts";
import { analyzeAllPalaces } from "../../analyze-all-palaces";
import corpus from "../../../../knowledge/palace-overview/v1/benchmark/corpus-manifest.v1.json";
import casesRaw from "../../../../knowledge/palace-overview/v1/benchmark/expert-benchmark-cases.v2.json";
import { analyzePalaceCandidate } from "../analyze";
import { analyzePalaceStrong } from "./analyze-strong";
import { loadInteractionCandidateV2Pack } from "./load";
import type { AblationId } from "./types";

interface CaseRow {
  caseId: string;
  input: {
    solarDate: string;
    birthHour: string;
    gender: "male" | "female";
    timezone: string;
    annualYear: string;
    flowBase: string;
  };
}

function rank(scores: number[]): number[] {
  const idx = scores.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s || a.i - b.i);
  const r = Array(scores.length).fill(0);
  idx.forEach((row, k) => {
    r[row.i] = k + 1;
  });
  return r;
}

export function kendallTau(a: number[], b: number[]): number {
  let conc = 0;
  let disc = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      const s1 = Math.sign(a[i]! - a[j]!);
      const s2 = Math.sign(b[i]! - b[j]!);
      if (s1 === 0 || s2 === 0) continue;
      if (s1 === s2) conc += 1;
      else disc += 1;
    }
  }
  const n = conc + disc;
  return n === 0 ? 1 : (conc - disc) / n;
}

function stdev(xs: number[]): number {
  const m = xs.reduce((s, x) => s + x, 0) / xs.length;
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length;
  return Math.sqrt(v);
}

function materiality(
  absDeltas: number[],
  pack: ReturnType<typeof loadInteractionCandidateV2Pack>,
): "MATERIAL_EXPERIMENT_READY" | "STRONG_CANDIDATE_TOO_WEAK" | "STRONG_CANDIDATE_UNSTABLE" {
  const mean = absDeltas.reduce((s, x) => s + x, 0) / absDeltas.length;
  const bigShare =
    absDeltas.filter((x) => x > pack.materiality.unstableLargeMovePoints).length /
    absDeltas.length;
  if (mean < pack.materiality.tooWeakMeanAbsDelta) return "STRONG_CANDIDATE_TOO_WEAK";
  if (mean > pack.materiality.unstableMeanAbsDelta || bigShare > pack.materiality.unstableLargeMoveShare) {
    return "STRONG_CANDIDATE_UNSTABLE";
  }
  return "MATERIAL_EXPERIMENT_READY";
}

const ABLATIONS: AblationId[] = [
  "full",
  "no-geometry",
  "no-rescue",
  "no-void-relief",
  "no-formation-amplification",
  "no-vcd-context",
];

function compareCandidateV2() {
  const loaded = loadPalaceOverviewResearchKnowledgeV2();
  if (!loaded.ok) throw new Error("invalid baseline knowledge");
  const knowledge = loaded.knowledge;
  const pack = loadInteractionCandidateV2Pack();
  const caseById = new Map((casesRaw as { cases: CaseRow[] }).cases.map((c) => [c.caseId, c]));
  const schools: ZiweiSchool[] = ["nam-phai", "trung-chau"];
  const calc = { "nam-phai": calculateNamPhai, "trung-chau": calculateTrungChau };

  const rows: Array<Record<string, unknown>> = [];
  const absMod: number[] = [];
  const absStr: number[] = [];
  const kendalls: { school: string; caseId: string; vsModerate: number; vsStrong: number }[] = [];
  const ablationMeans: Record<string, number[]> = {};
  for (const id of ABLATIONS) ablationMeans[id] = [];
  let rescueHits = 0;
  let voidHits = 0;
  let vcdHits = 0;
  let formationHits = 0;

  for (const caseId of corpus.pilotCaseIds) {
    const spec = caseById.get(caseId);
    if (!spec) continue;
    for (const school of schools) {
      const chart = calc[school](spec.input);
      const baseline = analyzeAllPalaces(chart, { school });
      const { facts, duplicateIds } = normalizeNatalFacts(chart, { school });
      const factsByPalace = indexFactsByPalace(facts);
      const common = {
        chart,
        school,
        factsByPalace,
        knowledge,
        duplicateFactIds: duplicateIds,
      };
      const moderate = chart.palaces.map((p) =>
        analyzePalaceCandidate({ ...common, palaceIndex: p.index }),
      );
      const strong = chart.palaces.map((p) =>
        analyzePalaceStrong({ ...common, palaceIndex: p.index, ablation: "full" }),
      );
      const ablations: Record<string, ReturnType<typeof analyzePalaceStrong>[]> = {};
      for (const id of ABLATIONS) {
        ablations[id] = chart.palaces.map((p) =>
          analyzePalaceStrong({ ...common, palaceIndex: p.index, ablation: id }),
        );
      }
      const bScores = baseline.results.map((r) => r.score);
      const mScores = moderate.map((r) => r.result.score);
      const sScores = strong.map((r) => r.result.score);
      const bRank = rank(bScores);
      const mRank = rank(mScores);
      const sRank = rank(sScores);
      kendalls.push({
        school,
        caseId,
        vsModerate: kendallTau(bRank, mRank),
        vsStrong: kendallTau(bRank, sRank),
      });
      const adj: number[] = [];
      for (let i = 0; i < sScores.length; i++) {
        const j = (i + 1) % sScores.length;
        adj.push(Math.abs(sScores[i]! - sScores[j]!));
      }
      for (let i = 0; i < chart.palaces.length; i++) {
        const b = baseline.results[i]!;
        const m = moderate[i]!;
        const s = strong[i]!;
        absMod.push(Math.abs(m.result.score - b.score));
        absStr.push(Math.abs(s.result.score - b.score));
        if (s.diagnostics.rescue.fired) rescueHits += 1;
        if (s.diagnostics.voidTypes.length) voidHits += 1;
        if (s.diagnostics.vcdAdded) vcdHits += 1;
        if (s.diagnostics.formationRuleCount) formationHits += 1;
        for (const id of ABLATIONS) {
          ablationMeans[id]!.push(ablations[id]![i]!.result.score);
        }
        rows.push({
          caseId,
          school,
          palace: b.palaceName,
          baselineScore: b.score,
          moderateScore: m.result.score,
          strongScore: s.result.score,
          deltaModerate: m.result.score - b.score,
          deltaStrong: s.result.score - b.score,
          baselineRank: bRank[i],
          moderateRank: mRank[i],
          strongRank: sRank[i],
          rankDeltaStrong: bRank[i]! - sRank[i]!,
          baselineSupport: b.rawAxes.support,
          strongSupport: s.result.rawAxes.support,
          baselinePressure: b.rawAxes.pressure,
          strongPressure: s.result.rawAxes.pressure,
          rescue: s.diagnostics.rescue,
          voidTypes: s.diagnostics.voidTypes,
          triggered: s.diagnostics.triggeredHypotheses,
          ablations: Object.fromEntries(
            ABLATIONS.map((id) => [id, ablations[id]![i]!.result.score]),
          ),
        });
      }
      rows.push({
        caseId,
        school,
        palace: "_shape",
        strongMean: sScores.reduce((a, x) => a + x, 0) / sScores.length,
        strongStdev: stdev(sScores),
        strongMin: Math.min(...sScores),
        strongMax: Math.max(...sScores),
        adjacentMean: adj.reduce((a, x) => a + x, 0) / adj.length,
        adjacentMax: Math.max(...adj),
      });
    }
  }

  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)]!;
  };
  const decision = materiality(absStr, pack);
  const ablationContribution = Object.fromEntries(
    ABLATIONS.filter((id) => id !== "full").map((id) => {
      const diffs = absStr.map((_, i) =>
        Math.abs((ablationMeans.full![i] ?? 0) - (ablationMeans[id]![i] ?? 0)),
      );
      return [id, mean(diffs)];
    }),
  );

  return {
    decision,
    palacesEvaluated: absStr.length,
    moderate: {
      meanAbs: mean(absMod),
      medianAbs: median(absMod),
      maxAbs: Math.max(...absMod),
    },
    strong: {
      meanAbs: mean(absStr),
      medianAbs: median(absStr),
      maxAbs: Math.max(...absStr),
    },
    kendallMean: {
      vsModerate: mean(kendalls.map((k) => k.vsModerate)),
      vsStrong: mean(kendalls.map((k) => k.vsStrong)),
    },
    hits: { rescueHits, voidHits, vcdHits, formationHits },
    ablationContribution,
    kendalls,
    rows,
  };
}

export function writeCandidateV2Artifacts(): string {
  const dir = join(process.cwd(), ".research-artifacts/palace-overview-candidate-v2");
  mkdirSync(dir, { recursive: true });
  const data = compareCandidateV2();
  writeFileSync(join(dir, "comparison.json"), `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(
    join(dir, "ablation.json"),
    `${JSON.stringify({ decision: data.decision, ablationContribution: data.ablationContribution }, null, 2)}\n`,
  );
  const md = [
    "# Palace Overview candidate V2",
    "",
    `Decision: **${data.decision}**`,
    "",
    `- palaces: ${data.palacesEvaluated}`,
    `- moderate mean |Δ|: ${data.moderate.meanAbs.toFixed(3)} (max ${data.moderate.maxAbs.toFixed(3)})`,
    `- strong mean |Δ|: ${data.strong.meanAbs.toFixed(3)} (max ${data.strong.maxAbs.toFixed(3)})`,
    `- Kendall τ baseline vs moderate: ${data.kendallMean.vsModerate.toFixed(3)}`,
    `- Kendall τ baseline vs strong: ${data.kendallMean.vsStrong.toFixed(3)}`,
    `- rescue hits: ${data.hits.rescueHits}`,
    `- void-present palaces: ${data.hits.voidHits}`,
    `- VCD context hits: ${data.hits.vcdHits}`,
    "",
    "## Ablation mean |full − ablated|",
    ...Object.entries(data.ablationContribution).map(
      ([k, v]) => `- ${k}: ${(v as number).toFixed(3)}`,
    ),
    "",
    "UNCALIBRATED. Do not treat as improvement.",
    "",
  ].join("\n");
  writeFileSync(join(dir, "comparison.md"), md);
  writeFileSync(join(dir, "ablation.md"), md);
  return dir;
}
