/**
 * Annual Axes V0.12 calibration research CLI.
 *
 *   npm run research:annual-axes-v012:validate
 *   npm run research:annual-axes-v012:case
 *   npm run research:annual-axes-v012:corpus
 *   npm run research:annual-axes-v012:layers
 *   npm run research:annual-axes-v012:sensitivity
 *   npm run research:annual-axes-v012:ablation
 *   npm run research:annual-axes-v012:audit
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS } from "@/lib/ziwei/analysis/contracts/annual-axes";
import {
  V12_CANDIDATE_ID,
  V12_ENGINE_VERSION,
  loadAnnualAxesKnowledgeV12,
} from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.12";
import { analyzeAnnualAxes } from "@/lib/ziwei/analysis/modules/annual-axes";
import { CASE_AA10_M1998_DAN_2026 } from "@/lib/ziwei/analysis/modules/annual-axes/v0.10-layered";
import {
  analyzeAnnualAxesNamPhaiV12,
  buildCase1998Diagnostic,
  runAblationAudit,
  runDomainCorrelationAudit,
  runLayerScaleAudit,
  runStaticCoverageAudit,
  runV12CorpusAudit,
  runYearSensitivityAudit,
} from "@/lib/ziwei/analysis/modules/annual-axes/v0.12";

const ARTIFACT_DIR = join(process.cwd(), ".research-artifacts/annual-axes-v012");
const RESEARCH_DIR = join(process.cwd(), "research/annual-axes/v0.12");

function cmd(): string {
  return process.argv[2] ?? "validate";
}

function writeJson(name: string, value: unknown): void {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(join(ARTIFACT_DIR, name), JSON.stringify(value, null, 2) + "\n");
}

function validate(): void {
  const k = loadAnnualAxesKnowledgeV12();
  if (k.knowledgeVersion !== "0.12.0") {
    throw new Error(`expected knowledge 0.12.0 got ${k.knowledgeVersion}`);
  }
  const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const released = analyzeAnnualAxes(chart, { school: "nam-phai" });
  if (released.versions.engineVersion !== "0.11.0") {
    throw new Error("production must remain V0.11");
  }
  const v12 = analyzeAnnualAxesNamPhaiV12(chart);
  if (v12.versions.engineVersion !== V12_ENGINE_VERSION) {
    throw new Error(`expected engine ${V12_ENGINE_VERSION}`);
  }
  if (v12.candidateId !== V12_CANDIDATE_ID) {
    throw new Error(`unexpected candidate ${v12.candidateId}`);
  }
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    if (
      v12.axes[domain].natal.contributors.some((c) =>
        String(c.sourceModule).includes("palace-overview"),
      )
    ) {
      throw new Error(`PO sourceModule leaked into ${domain}`);
    }
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        productionEngine: released.versions.engineVersion,
        candidateEngine: v12.versions.engineVersion,
        candidateId: v12.candidateId,
        ANNUAL_AXES_PALACE_OVERVIEW_NUMERIC_DEPENDENCY: "ZERO",
      },
      null,
      2,
    ),
  );
}

function caseReport(): void {
  const diagnostic = buildCase1998Diagnostic();
  writeJson("case-1998-2026.json", diagnostic);
  const md = [
    "# CASE 1998-10-01 male Dần · 2026 · Nam Phái",
    "",
    "Diagnostic only — no target scores.",
    "",
    "## Registry rule counts (natal-capable extract)",
    "",
    "```json",
    JSON.stringify(diagnostic.registryRuleCounts, null, 2),
    "```",
    "",
    "## Domains",
    "",
  ];
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const row = diagnostic.domains[domain];
    if (!row) continue;
    md.push(`### ${domain}`);
    md.push("");
    md.push(
      `- control V0.11 final: **${row.controlV011.final}** (natal ${row.controlV011.natal.toFixed(3)})`,
    );
    for (const [profile, vals] of Object.entries(row.candidates)) {
      const v = vals as { final: number | null; natal: number };
      md.push(
        `- ${profile}: final **${v.final}** (natal ${v.natal.toFixed(3)})`,
      );
    }
    md.push("");
  }
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(join(ARTIFACT_DIR, "case-1998-2026.md"), md.join("\n"));
  console.log(`wrote ${join(ARTIFACT_DIR, "case-1998-2026.json")}`);
}

function corpus(): void {
  const report = runV12CorpusAudit({ natalCount: 120, years: [2024, 2025, 2026, 2027, 2028] });
  writeJson("corpus-control-v011.json", {
    chartYearCount: report.chartYearCount,
    domainEvalCount: report.domainEvalCount,
    scores: report.controlV011,
    layerNets: report.layerNets.control,
    sparseSaturationRate: report.sparseSaturation.controlNatalRate,
  });
  writeJson("corpus-v012-candidates.json", {
    candidateId: V12_CANDIDATE_ID,
    selected: {
      profileId: "CONTROL-LAYERED-BALANCED",
      referenceMass: 4,
      palaceClampPolicy: "unused-activation-damping-supersedes",
    },
    chartYearCount: report.chartYearCount,
    domainEvalCount: report.domainEvalCount,
    scores: report.candidateV012,
    layerNets: report.layerNets.candidate,
    sparseSaturationRate: report.sparseSaturation.candidateNatalRate,
  });
  console.log(
    JSON.stringify(
      {
        chartYearCount: report.chartYearCount,
        domainEvalCount: report.domainEvalCount,
        sparseControl: report.sparseSaturation.controlNatalRate,
        sparseCandidate: report.sparseSaturation.candidateNatalRate,
      },
      null,
      2,
    ),
  );
}

function layers(): void {
  writeJson("layer-scale-audit.json", runLayerScaleAudit());
  writeJson("sparse-evidence-audit.json", {
    note: "Sparse saturation is abs(signedNet)>=0.8 with evidenceMass<2",
    layerScale: runLayerScaleAudit(),
  });
  console.log("wrote layer-scale-audit.json / sparse-evidence-audit.json");
}

function sensitivity(): void {
  writeJson("year-sensitivity.json", runYearSensitivityAudit());
  writeJson("domain-correlation.json", runDomainCorrelationAudit());
  console.log("wrote year-sensitivity.json / domain-correlation.json");
}

function ablation(): void {
  writeJson("ablation.json", runAblationAudit());
  console.log("wrote ablation.json");
}

function auditAll(): void {
  validate();
  caseReport();
  corpus();
  layers();
  sensitivity();
  ablation();
  const coverage = runStaticCoverageAudit();
  writeJson("static-coverage-audit.json", coverage);

  const corpusReport = runV12CorpusAudit({
    natalCount: 120,
    years: [2024, 2025, 2026, 2027, 2028],
  });
  const corr = runDomainCorrelationAudit();
  const year = runYearSensitivityAudit();
  const layer = runLayerScaleAudit();

  let decision = "AAV12_SIGNAL_CALIBRATION_READY_FOR_REVIEW";
  if (coverage.ok && coverage.flags.includes("STATIC_DOMAIN_MAJOR_STAR_COVERAGE_LOW")) {
    decision = "AAV12_STATIC_EVIDENCE_COVERAGE_INSUFFICIENT";
  } else if (
    corpusReport.sparseSaturation.candidateNatalRate >
    corpusReport.sparseSaturation.controlNatalRate * 0.5 + 0.05
  ) {
    decision = "AAV12_SIGNAL_CALIBRATION_INCONCLUSIVE";
  }

  const decisionMd = `# Annual Axes V0.12 decision

## Decision

**${decision}**

## Selected candidate

- candidateId: \`${V12_CANDIDATE_ID}\`
- engineVersion: \`${V12_ENGINE_VERSION}\`
- static formula: directionalNet × activation (\`referenceMass=4\`)
- aggregation: per-physical-palace then normalized role weights
- palaceClampPolicy: **unused** (activation damping supersedes; clamp audited as dead V0.11 path)
- layer profile: **CONTROL-LAYERED-BALANCED** 0.30/0.25/0.35/0.10 (not retuned)
- domain mappings: **legacy unchanged**
- romance-expanded: **not promoted**
- production default: **V0.11 unchanged**

## Clamp audit (V0.11)

\`clampPalaceRaw\` is computed then \`void\`ed in \`score-static-palace-context.ts\`.
Classification: **DEAD LEGACY CODE / ineffective path** relative to current domain-engine
mass-ratio \`signedNet\`. V0.12 does not use the clamp in the signed signal.

## Sparse saturation

- control natal rate: ${corpusReport.sparseSaturation.controlNatalRate.toFixed(4)}
- candidate natal rate: ${corpusReport.sparseSaturation.candidateNatalRate.toFixed(4)}

## Layer-scale notes

See \`layer-scale-audit.json\`. Annual trigger remains magnitude-aware (\`raw/8\`).
Major Fortune sparse damping preserved (\`referenceMass=4\` precedent).

## Coverage

\`\`\`json
${JSON.stringify(coverage, null, 2)}
\`\`\`

## Year sensitivity / domain correlation

\`\`\`json
${JSON.stringify({ year: year.summary, corrWarnings: corr.warnings }, null, 2)}
\`\`\`

## Why this candidate

1. Fixes sparse one-sided saturation on natal static layer.
2. Preserves physical-palace dedup and role-weight semantics.
3. Keeps Annual Axes / Palace Overview numeric boundary (ZERO dependency).
4. Does not retune layer mix or domain projection before scale parity.
5. Leaves V0.11 production route untouched.

## Unchanged

- Domain palace projection weights (legacy)
- Resonance weight 0.10
- Annual V0.8.2 trigger mechanics
- Final tanh mapping gain
- Palace Overview module

Artifacts: \`.research-artifacts/annual-axes-v012/\`
`;

  mkdirSync(ARTIFACT_DIR, { recursive: true });
  mkdirSync(RESEARCH_DIR, { recursive: true });
  writeFileSync(join(ARTIFACT_DIR, "decision.md"), decisionMd);
  writeFileSync(join(RESEARCH_DIR, "decision.md"), decisionMd);
  writeJson("decision.json", {
    decision,
    candidateId: V12_CANDIDATE_ID,
    engineVersion: V12_ENGINE_VERSION,
    sparse: corpusReport.sparseSaturation,
    layerSparseRate: layer.sparseSaturationRateControl,
    coverageFlags: coverage.ok ? coverage.flags : [],
    correlationWarnings: corr.warnings,
    yearWarnings: year.warnings,
  });
  console.log(JSON.stringify({ decision }, null, 2));
}

const c = cmd();
if (c === "validate") validate();
else if (c === "case") caseReport();
else if (c === "corpus") corpus();
else if (c === "layers") layers();
else if (c === "sensitivity") sensitivity();
else if (c === "ablation") ablation();
else if (c === "audit") auditAll();
else throw new Error(`unknown command ${c}`);
