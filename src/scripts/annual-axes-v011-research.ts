/**
 * Annual Axes V0.11 domain-engine research CLI.
 *
 *   npm run research:annual-axes-v011:validate
 *   npm run research:annual-axes-v011:case
 *   npm run research:annual-axes-v011:audit
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAllPalaces } from "@/lib/ziwei/analysis/modules/palace-overview";
import { normalizePalaceOverviewFrozenFacts } from "@/lib/ziwei/analysis/modules/palace-overview/normalize-palace-overview-frozen-facts";
import { ANNUAL_AXIS_DOMAINS } from "@/lib/ziwei/analysis/contracts/annual-axes";
import { loadAnnualAxesKnowledgeV10 } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV08NamPhai } from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.8";
import {
  analyzeAnnualAxesNamPhaiV10,
  CASE_AA10_M1998_DAN_2026,
  runFastAudit,
} from "@/lib/ziwei/analysis/modules/annual-axes/v0.10-layered";
import { aggregateStaticDomain, staticDomainDiagnostics } from "@/lib/ziwei/analysis/modules/annual-axes/domain-engine";
import { TEMPORAL_FACT_SOURCES } from "@/lib/ziwei/analysis/facts";

const ARTIFACT_DIR = join(process.cwd(), ".research-artifacts/annual-axes-v011");

function cmd(): string {
  return process.argv[2] ?? "validate";
}

function validate(): void {
  const knowledge = loadAnnualAxesKnowledgeV10();
  if (knowledge.knowledgeVersion !== "0.11.0") {
    throw new Error(`expected knowledge 0.11.0 got ${knowledge.knowledgeVersion}`);
  }
  const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const result = analyzeAnnualAxesNamPhaiV10(chart, {
    profileId: "layered-balanced",
    includeControl: true,
  });
  if (result.module !== "annual-axes-v0.11-domain-engine") {
    throw new Error(`unexpected module ${result.module}`);
  }
  if (result.versions.engineVersion !== "0.11.0") {
    throw new Error(`unexpected engine ${result.versions.engineVersion}`);
  }
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    if (
      result.axes[domain].natal.contributors.some(
        (c) => (c.sourceModule as string) === "palace-overview",
      )
    ) {
      throw new Error(`PO sourceModule leaked into ${domain}`);
    }
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        decision: "STATIC_PALACE_AND_ANNUAL_DOMAIN_ENGINES_DECOUPLED",
        candidateId: result.candidateId,
        engineVersion: result.versions.engineVersion,
        domains: Object.fromEntries(
          ANNUAL_AXIS_DOMAINS.map((d) => [
            d,
            {
              final: result.axes[d].finalScore,
              natal: result.axes[d].natal.signedNet,
              decade: result.axes[d].decade.signedNet,
              annual: result.axes[d].annual.signedNet,
            },
          ]),
        ),
      },
      null,
      2,
    ),
  );
}

function writeCaseReports(): void {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const po = analyzeAllPalaces(chart, { school: "nam-phai" });
  const { facts } = normalizePalaceOverviewFrozenFacts(chart, { school: "nam-phai" });
  for (const fact of facts) {
    if (TEMPORAL_FACT_SOURCES.includes(fact.source as never)) {
      throw new Error(`temporal fact in PO normalize: ${fact.id} source=${fact.source}`);
    }
  }

  const ANNUAL_FLOW_NAME =
    /^(Lưu Thái Tuế|Lưu Văn Xương|Lưu Văn Khúc|Lưu Khôi|Lưu Việt|Lưu Lộc Tồn|Lưu Kình|Lưu Đà|Lưu Hóa)/;
  const palaceReport = {
    caseId: "1998-10-01-male-Dan-static",
    annualYear: chart.annualYear,
    palaces: po.results.map((r) => ({
      palaceName: r.palaceName,
      palaceIndex: r.palaceIndex,
      score: r.score,
      band: r.band,
      rawAxes: r.rawAxes,
      annualEvidenceCount: 0,
      majorFortuneEvidenceCount: 0,
      monthlyEvidenceCount: 0,
      annualFlowStarEvidenceCount: r.allEvidence.filter((e) =>
        Boolean(e.starName && ANNUAL_FLOW_NAME.test(e.starName)),
      ).length,
    })),
  };
  if (palaceReport.palaces.some((p) => p.annualFlowStarEvidenceCount > 0)) {
    throw new Error("annual/flow star evidence leaked into Palace Overview");
  }
  writeFileSync(
    join(ARTIFACT_DIR, "palace-overview-static-1998.json"),
    JSON.stringify(palaceReport, null, 2),
  );

  const knowledge = loadAnnualAxesKnowledgeV10();
  const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
  if (!knowledge08.ok) throw new Error("invalid v08 knowledge");
  const aa = analyzeAnnualAxesNamPhaiV10(chart, {
    profileId: "layered-balanced",
    includeControl: true,
  });

  const domains = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((domain) => {
      const staticAgg = aggregateStaticDomain({
        chart,
        domain,
        knowledge,
        knowledge08: knowledge08.knowledge,
        projectionVariant: "legacy",
      });
      const diag = staticDomainDiagnostics(staticAgg);
      const axis = aa.axes[domain];
      return [
        domain,
        {
          mappedPalaces: staticAgg.mappedPalaces,
          staticDomain: {
            contributors: axis.natal.contributors,
            score: axis.natal.signedNet,
            supportMass: axis.natal.supportMass,
            pressureMass: axis.natal.pressureMass,
            evidenceCoverage: diag.admittedEvidenceCount,
            unresolvedPalaceCount: diag.unresolvedPalaceCount,
            temporalContaminationCount: diag.temporalContaminationCount,
          },
          majorFortune: {
            contributors: axis.decade.contributors,
            score: axis.decade.signedNet,
          },
          annualTrigger: {
            contributors: axis.annual.contributors,
            score: axis.annual.signedNet,
          },
          resonance: {
            trace: {
              signedNet: axis.resonance.signedNet,
              reasonCodes: axis.resonance.reasonCodes,
              contributors: axis.resonance.contributors,
            },
          },
          final: axis.finalScore,
        },
      ];
    }),
  );

  const annualReport = {
    caseId: "1998-10-01-male-Dan-2026",
    annualYear: 2026,
    engine: aa.module,
    versions: aa.versions,
    candidateId: aa.candidateId,
    note: "POST_DECOUPLE — natal foundation from Annual Domain Engine, not PO.rawAxes",
    domains,
  };
  const serialized = JSON.stringify(annualReport, null, 2);
  if (serialized.includes("palaceOverviewScore") || serialized.includes("palaceOverviewRawAxes")) {
    throw new Error("forbidden PO numeric fields in annual report");
  }
  writeFileSync(join(ARTIFACT_DIR, "annual-domains-1998-2026.json"), serialized);

  console.log(
    JSON.stringify(
      {
        ok: true,
        artifacts: [
          join(ARTIFACT_DIR, "palace-overview-static-1998.json"),
          join(ARTIFACT_DIR, "annual-domains-1998-2026.json"),
        ],
      },
      null,
      2,
    ),
  );
}

function audit(): void {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const report = runFastAudit({ profileId: "layered-balanced" });
  writeFileSync(join(ARTIFACT_DIR, "audit.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ok: true, audit: join(ARTIFACT_DIR, "audit.json") }, null, 2));
}

const c = cmd();
if (c === "validate") validate();
else if (c === "case") writeCaseReports();
else if (c === "audit") audit();
else {
  console.error(`unknown command: ${c}`);
  process.exit(1);
}
