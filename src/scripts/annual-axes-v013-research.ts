import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS } from "@/lib/ziwei/analysis/contracts/annual-axes";
import { loadAnnualAxesKnowledgeV10 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV08NamPhai } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.8";
import { loadAnnualAxesKnowledgeV12 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.12";
import { loadAnnualAxesKnowledgeV13 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.13";
import { CASE_AA10_M1998_DAN_2026 } from "@/lib/ziwei/analysis/modules/annual-axes/v0.10-layered";
import { analyzeAnnualAxesNamPhaiV12 } from "@/lib/ziwei/analysis/modules/annual-axes/v0.12";
import { buildResearchCorpus } from "@/lib/ziwei/analysis/modules/annual-axes/v0.12/corpus";
import {
  aggregateStaticDomainV13,
  analyzeAnnualAxesNamPhaiV13,
} from "@/lib/ziwei/analysis/modules/annual-axes/v0.13";

const ARTIFACT_DIR = join(process.cwd(), ".research-artifacts/annual-axes-v013");

function command(): string {
  return process.argv[2] ?? "validate";
}

function validate(): void {
  const knowledge = loadAnnualAxesKnowledgeV13();
  if (knowledge.knowledgeVersion !== "0.13.0") {
    throw new Error(`unexpected V0.13 knowledge ${knowledge.knowledgeVersion}`);
  }
  const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const result = analyzeAnnualAxesNamPhaiV13(chart);
  if (result.versions.engineVersion !== "0.13.0") {
    throw new Error(`unexpected V0.13 engine ${result.versions.engineVersion}`);
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        status: "AAV13_LINEAGE_VALIDATED",
        claimCount: knowledge.bridge.claims.length,
        candidateId: result.candidateId,
        productionImpactAllowed: false,
        note: "Coverage readiness requires a fresh V0.12/V0.13 corpus audit after lineage validation.",
      },
      null,
      2,
    ),
  );
}

function caseReport(): void {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const v12 = analyzeAnnualAxesNamPhaiV12(chart);
  const v13 = analyzeAnnualAxesNamPhaiV13(chart);
  const knowledge10 = loadAnnualAxesKnowledgeV10();
  const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
  const knowledge12 = loadAnnualAxesKnowledgeV12();
  const knowledge13 = loadAnnualAxesKnowledgeV13();
  if (!knowledge08.ok) throw new Error("invalid V0.8 knowledge");

  const domains = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((domain) => {
      const aggregate = aggregateStaticDomainV13({
        chart,
        domain,
        knowledge: knowledge10,
        knowledge08: knowledge08.knowledge,
        knowledge12,
        knowledge13,
        projectionVariant: "legacy",
        referenceMass: knowledge13.referenceMass,
      });
      return [
        domain,
        {
          v12: {
            final: v12.axes[domain].finalScore,
            natal: v12.axes[domain].natal.signedNet,
            coverage: v12.axes[domain].natal.coverage,
          },
          v13: {
            final: v13.axes[domain].finalScore,
            natal: v13.axes[domain].natal.signedNet,
            coverage: v13.axes[domain].natal.coverage,
          },
          doctrineAdmittedCount: aggregate.doctrineAdmittedCount,
          doctrineCoveredPalaceCount: aggregate.doctrineCoveredPalaceCount,
          unresolvedPalaceCount: aggregate.unresolvedPalaceCount,
          palaces: aggregate.palaceContexts.map((ctx) => ({
            palaceName: ctx.palaceName,
            roleWeight: ctx.roleWeight,
            v12EvidenceMass: ctx.v12EvidenceMass,
            evidenceMass: ctx.evidenceMass,
            signedNet: ctx.palaceSignedNet,
            doctrine: ctx.doctrineEvidence,
          })),
        },
      ];
    }),
  );

  const report = {
    caseId: "CASE-AA13-M1998-DAN-2026",
    annualYear: chart.annualYear,
    candidateId: v13.candidateId,
    domains,
  };
  const path = join(ARTIFACT_DIR, "case-1998-2026.json");
  writeFileSync(path, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ok: true, artifact: path }, null, 2));
}

function audit(): void {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const corpus = buildResearchCorpus({
    natalCount: 120,
    years: [2024, 2025, 2026, 2027, 2028],
  });

  const stats = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((domain) => [
      domain,
      {
        count: 0,
        v12ScoreSum: 0,
        v13ScoreSum: 0,
        v12ScoreCount: 0,
        v13ScoreCount: 0,
        v12CoverageSum: 0,
        v13CoverageSum: 0,
        v12Unavailable: 0,
        v13Unavailable: 0,
      },
    ]),
  ) as Record<
    (typeof ANNUAL_AXIS_DOMAINS)[number],
    {
      count: number;
      v12ScoreSum: number;
      v13ScoreSum: number;
      v12ScoreCount: number;
      v13ScoreCount: number;
      v12CoverageSum: number;
      v13CoverageSum: number;
      v12Unavailable: number;
      v13Unavailable: number;
    }
  >;

  for (const birth of corpus) {
    const chart = calculateNamPhai(birth);
    const v12 = analyzeAnnualAxesNamPhaiV12(chart);
    const v13 = analyzeAnnualAxesNamPhaiV13(chart);
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const row = stats[domain];
      row.count += 1;
      row.v12CoverageSum += v12.axes[domain].natal.coverage;
      row.v13CoverageSum += v13.axes[domain].natal.coverage;
      if (v12.axes[domain].natal.availability === "unavailable") row.v12Unavailable += 1;
      if (v13.axes[domain].natal.availability === "unavailable") row.v13Unavailable += 1;
      if (v12.axes[domain].finalScore != null) {
        row.v12ScoreSum += v12.axes[domain].finalScore ?? 0;
        row.v12ScoreCount += 1;
      }
      if (v13.axes[domain].finalScore != null) {
        row.v13ScoreSum += v13.axes[domain].finalScore ?? 0;
        row.v13ScoreCount += 1;
      }
    }
  }

  const domains = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((domain) => {
      const row = stats[domain];
      return [
        domain,
        {
          evaluations: row.count,
          meanV12Coverage: row.count ? row.v12CoverageSum / row.count : 0,
          meanV13Coverage: row.count ? row.v13CoverageSum / row.count : 0,
          v12UnavailableRate: row.count ? row.v12Unavailable / row.count : 0,
          v13UnavailableRate: row.count ? row.v13Unavailable / row.count : 0,
          meanV12Score: row.v12ScoreCount ? row.v12ScoreSum / row.v12ScoreCount : null,
          meanV13Score: row.v13ScoreCount ? row.v13ScoreSum / row.v13ScoreCount : null,
        },
      ];
    }),
  );

  const report = {
    candidateId: "CANDIDATE-AAV13-DOCTRINE-AUGMENTED-STATIC",
    controlCandidateId: "CANDIDATE-AAV12-CALIBRATED-DOMAIN-SIGNALS",
    chartYearCount: corpus.length,
    domainEvalCount: corpus.length * ANNUAL_AXIS_DOMAINS.length,
    domains,
    note: "V0.12 is the immutable registry-only control. Coverage uses evidence-aware V0.13 natal availability. No production promotion decision is made automatically.",
  };
  const path = join(ARTIFACT_DIR, "coverage-audit.json");
  writeFileSync(path, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ok: true, artifact: path, domains }, null, 2));
}

const cmd = command();
if (cmd === "validate") validate();
else if (cmd === "case") caseReport();
else if (cmd === "audit") audit();
else {
  console.error(`unknown command: ${cmd}`);
  process.exit(1);
}
