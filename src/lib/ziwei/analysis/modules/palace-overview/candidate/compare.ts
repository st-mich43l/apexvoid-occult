import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { analyzeAllPalaces } from "../analyze-all-palaces";
import corpus from "../../../knowledge/palace-overview/v1/benchmark/corpus-manifest.v1.json";
import casesRaw from "../../../knowledge/palace-overview/v1/benchmark/expert-benchmark-cases.v2.json";
import { analyzePalaceCandidate } from "./analyze";
import {
  indexFactsByPalace,
  normalizeNatalFacts,
  type ZiweiSchool,
} from "../../../facts";
import type { GeometryProfileId } from "./types";

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

function rankByScore(scores: Array<{ palaceName: string; score: number }>): Map<string, number> {
  const ordered = [...scores].sort((a, b) => b.score - a.score || a.palaceName.localeCompare(b.palaceName));
  const ranks = new Map<string, number>();
  ordered.forEach((row, i) => ranks.set(row.palaceName, i + 1));
  return ranks;
}

function compareCandidate(options?: { geometryProfile?: GeometryProfileId }) {
  const loaded = loadPalaceOverviewKnowledgeV1();
  if (!loaded.ok) throw new Error("invalid baseline knowledge");
  const knowledge = loaded.knowledge;
  const caseById = new Map((casesRaw as { cases: CaseRow[] }).cases.map((c) => [c.caseId, c]));
  const schools: ZiweiSchool[] = ["nam-phai", "trung-chau"];
  const calc = { "nam-phai": calculateNamPhai, "trung-chau": calculateTrungChau };

  const palaces: Array<Record<string, unknown>> = [];
  let absDelta = 0;
  let maxAbs = 0;
  let n = 0;
  const mechanism = {
    brightnessSaturationHits: 0,
    voidReliefHits: 0,
    vcdContextHits: 0,
    structuralRuleHits: 0,
  };

  for (const caseId of corpus.pilotCaseIds) {
    const spec = caseById.get(caseId);
    if (!spec) continue;
    for (const school of schools) {
      const chart = calc[school](spec.input);
      const baseline = analyzeAllPalaces(chart, { school, knowledge });
      const { facts, duplicateIds } = normalizeNatalFacts(chart, { school });
      const factsByPalace = indexFactsByPalace(facts);
      const candidateRows = chart.palaces.map((p) =>
        analyzePalaceCandidate({
          chart,
          palaceIndex: p.index,
          school,
          factsByPalace,
          knowledge,
          duplicateFactIds: duplicateIds,
          geometryProfile: options?.geometryProfile,
        }),
      );
      const baseScores = baseline.results.map((r) => ({
        palaceName: r.palaceName,
        score: r.score,
      }));
      const candScores = candidateRows.map((c) => ({
        palaceName: c.result.palaceName,
        score: c.result.score,
      }));
      const baseRank = rankByScore(baseScores);
      const candRank = rankByScore(candScores);
      for (const row of candidateRows) {
        const b = baseline.results.find((r) => r.palaceIndex === row.result.palaceIndex);
        if (!b) continue;
        const delta = row.result.score - b.score;
        absDelta += Math.abs(delta);
        maxAbs = Math.max(maxAbs, Math.abs(delta));
        n += 1;
        mechanism.brightnessSaturationHits += row.diagnostics.brightnessHits.length;
        if (row.diagnostics.voidHit.reliefApplied) mechanism.voidReliefHits += 1;
        if (row.diagnostics.vcdContext.added) mechanism.vcdContextHits += 1;
        mechanism.structuralRuleHits += row.diagnostics.formationAudits.length;
        palaces.push({
          caseId,
          school,
          palace: row.result.palaceName,
          baselineScore: b.score,
          candidateScore: row.result.score,
          delta,
          baselineRank: baseRank.get(b.palaceName),
          candidateRank: candRank.get(row.result.palaceName),
          rankDelta:
            (baseRank.get(b.palaceName) ?? 0) - (candRank.get(row.result.palaceName) ?? 0),
          baselineSupport: b.rawAxes.support,
          candidateSupport: row.result.rawAxes.support,
          baselinePressure: b.rawAxes.pressure,
          candidatePressure: row.result.rawAxes.pressure,
          baselineStability: b.rawAxes.stability,
          candidateStability: row.result.rawAxes.stability,
          baselineActivation: b.rawAxes.activation,
          candidateActivation: row.result.rawAxes.activation,
          triggeredHypotheses: row.diagnostics.triggeredHypotheses,
          geometryProfile: row.diagnostics.geometryProfile,
        });
      }
    }
  }

  return {
    chartsEvaluated: corpus.pilotCaseIds.length * schools.length,
    palacesEvaluated: n,
    meanAbsoluteScoreDelta: n ? absDelta / n : 0,
    maxScoreDelta: maxAbs,
    mechanism,
    palaces,
  };
}

export function writeCandidateComparisonArtifact(): string {
  const dir = join(process.cwd(), ".research-artifacts/palace-overview-candidate");
  mkdirSync(dir, { recursive: true });
  const baselineGeom = compareCandidate({ geometryProfile: "baseline-relative" });
  const reviewerGeom = compareCandidate({ geometryProfile: "reviewer-hypothesis" });
  const summary = {
    status: "RESEARCH_CANDIDATE",
    calibrated: false,
    geometrySensitivity: {
      baselineRelative: {
        meanAbsoluteScoreDelta: baselineGeom.meanAbsoluteScoreDelta,
        maxScoreDelta: baselineGeom.maxScoreDelta,
      },
      reviewerHypothesis: {
        meanAbsoluteScoreDelta: reviewerGeom.meanAbsoluteScoreDelta,
        maxScoreDelta: reviewerGeom.maxScoreDelta,
      },
    },
    ...baselineGeom,
    reviewerGeometryPalaces: reviewerGeom.palaces,
  };
  writeFileSync(join(dir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  const md = [
    "# Palace Overview interaction candidate comparison",
    "",
    "Candidate is UNCALIBRATED. Do not treat deltas as improvement.",
    "",
    `- palaces evaluated: ${baselineGeom.palacesEvaluated}`,
    `- mean |score delta|: ${baselineGeom.meanAbsoluteScoreDelta.toFixed(3)}`,
    `- max |score delta|: ${baselineGeom.maxScoreDelta.toFixed(3)}`,
    `- brightness saturation hits: ${baselineGeom.mechanism.brightnessSaturationHits}`,
    `- void relief hits: ${baselineGeom.mechanism.voidReliefHits}`,
    `- VCD context hits: ${baselineGeom.mechanism.vcdContextHits}`,
    `- structural-rule hits: ${baselineGeom.mechanism.structuralRuleHits}`,
    "",
  ].join("\n");
  writeFileSync(join(dir, "summary.md"), md);
  return dir;
}
