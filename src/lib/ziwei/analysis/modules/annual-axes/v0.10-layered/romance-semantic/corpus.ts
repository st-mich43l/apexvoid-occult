import type { BirthInput } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeRomanceSemanticV01 } from "./analyze";
import { decideResearchOutcome } from "./classify";
import { loadRomanceDoctrineClaims } from "./collect";
import type { RomanceCorpusAuditReport } from "./types";
import { ROMANCE_SEMANTIC_MODEL_ID } from "./types";

const HOURS = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

function buildCorpus(count: number): BirthInput[] {
  const inputs: BirthInput[] = [];
  const years = [2024, 2025, 2026, 2027];
  for (let i = 0; i < count; i++) {
    const year = 1955 + (i % 50);
    const month = (i % 12) + 1;
    const day = 1 + (i % 27);
    inputs.push({
      solarDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      birthHour: HOURS[i % 12]!,
      gender: i % 2 === 0 ? "female" : "male",
      timezone: "7",
      annualYear: String(years[i % years.length]),
      flowBase: "luu-nien",
    });
  }
  return inputs;
}

export function runRomanceSemanticCorpusAudit(input?: {
  corpusSize?: number;
}): RomanceCorpusAuditReport {
  const corpusSize = input?.corpusSize ?? 24;
  const corpus = buildCorpus(corpusSize);

  let observedPhuTheMajorStars = 0;
  let starsWithDoctrineClaims = 0;
  let starsWithAdmittedVerifiedClaims = 0;
  let expertSynthesisOnlyClaims = 0;
  let unresolvedConditionalCount = 0;
  let conflictCount = 0;
  let zeroEvidenceChartCount = 0;
  const sourceTierDistribution: Record<string, number> = {};
  const palaceCoverageDistribution: Record<string, number> = {};

  const perChart: RomanceCorpusAuditReport["perChart"] = [];
  const warningSet = new Set<string>();

  for (const birth of corpus) {
    const chart = calculateNamPhai(birth);
    const report = analyzeRomanceSemanticV01({ chart });
    const phu = report.palaceBaselines.find((p) => p.palace === "Phu Thê");
    observedPhuTheMajorStars += phu?.majorStars.length ?? 0;
    starsWithDoctrineClaims += report.coverage.starsWithAnyDoctrineClaim;
    starsWithAdmittedVerifiedClaims += report.coverage.verifiedAdmittedClaimCount;
    expertSynthesisOnlyClaims += report.coverage.expertSynthesisOnlyClaimCount;
    unresolvedConditionalCount += report.coverage.unresolvedConditionalClaimCount;
    conflictCount += report.coverage.conflictCount;
    if (
      report.coverage.verifiedAdmittedClaimCount === 0 &&
      report.coverage.starsWithAnyDoctrineClaim === 0
    ) {
      zeroEvidenceChartCount += 1;
    }
    for (const [k, v] of Object.entries(report.coverage.sourceTierDistribution)) {
      sourceTierDistribution[k] = (sourceTierDistribution[k] ?? 0) + v;
    }
    for (const [palace, cov] of Object.entries(report.coverage.palaceCoverage)) {
      palaceCoverageDistribution[palace] =
        (palaceCoverageDistribution[palace] ?? 0) + cov.admitted;
    }
    for (const w of report.warnings) warningSet.add(w);

    perChart.push({
      solarDate: birth.solarDate,
      birthHour: birth.birthHour,
      status: report.status,
      admitted: report.admittedClaims.length,
      unresolved: report.unresolvedClaims.length,
      conflicts: report.conflicts.length,
      decision: report.researchDecision,
    });
  }

  // Decision uses catalog density (not corpus sums) so a large sample cannot
  // inflate sparse Phu Thê doctrine into "sufficient for numeric design".
  const doctrine = loadRomanceDoctrineClaims();
  const catalogPhuTheVerifiedClaims = doctrine.filter(
    (c) =>
      c.palace === "Phu Thê" &&
      (c.adjudication === "VERIFIED_PRIMARY" ||
        c.adjudication === "VERIFIED_SCHOOL"),
  ).length;
  const catalogTuTucVerifiedClaims = doctrine.filter(
    (c) =>
      c.palace === "Tử Tức" &&
      (c.adjudication === "VERIFIED_PRIMARY" ||
        c.adjudication === "VERIFIED_SCHOOL"),
  ).length;
  const meanObserved = observedPhuTheMajorStars / Math.max(1, corpus.length);
  const meanDoctrine = starsWithDoctrineClaims / Math.max(1, corpus.length);
  const meanAdmitted =
    starsWithAdmittedVerifiedClaims / Math.max(1, corpus.length);

  const researchDecision = decideResearchOutcome({
    verifiedAdmitted: meanAdmitted,
    expertOnly: expertSynthesisOnlyClaims / Math.max(1, corpus.length),
    unresolved: unresolvedConditionalCount / Math.max(1, corpus.length),
    conflicts: conflictCount / Math.max(1, corpus.length),
    observedStars: meanObserved,
    starsWithDoctrine: meanDoctrine,
    starsWithAdmitted: meanAdmitted,
    catalogPhuTheVerifiedClaims,
    catalogTuTucVerifiedClaims,
  });

  return {
    model: ROMANCE_SEMANTIC_MODEL_ID,
    school: "nam-phai",
    chartCount: corpus.length,
    numericAuthority: "none",
    scoreImpactAllowed: false,
    aggregate: {
      observedPhuTheMajorStars,
      starsWithDoctrineClaims,
      starsWithAdmittedVerifiedClaims,
      expertSynthesisOnlyClaims,
      unresolvedConditionalCount,
      conflictCount,
      zeroEvidenceChartCount,
      sourceTierDistribution,
      palaceCoverageDistribution,
    },
    warnings: [...warningSet].sort((a, b) => a.localeCompare(b)),
    researchDecision,
    perChart,
  };
}

export function renderRomanceCorpusMarkdown(
  report: RomanceCorpusAuditReport,
): string {
  const a = report.aggregate;
  return [
    `# Romance Semantic V0.1 — corpus audit`,
    ``,
    `- charts: ${report.chartCount}`,
    `- numericAuthority: \`${report.numericAuthority}\``,
    `- scoreImpactAllowed: \`${report.scoreImpactAllowed}\``,
    `- researchDecision: \`${report.researchDecision}\``,
    `- warnings: ${report.warnings.join(", ") || "none"}`,
    ``,
    `## Aggregate`,
    ``,
    `| metric | value |`,
    `| --- | --- |`,
    `| observed Phu Thê majors | ${a.observedPhuTheMajorStars} |`,
    `| stars with doctrine claims | ${a.starsWithDoctrineClaims} |`,
    `| admitted verified claims | ${a.starsWithAdmittedVerifiedClaims} |`,
    `| expert-synthesis-only | ${a.expertSynthesisOnlyClaims} |`,
    `| unresolved conditional | ${a.unresolvedConditionalCount} |`,
    `| conflicts | ${a.conflictCount} |`,
    `| zero-evidence charts | ${a.zeroEvidenceChartCount} |`,
    ``,
  ].join("\n");
}
