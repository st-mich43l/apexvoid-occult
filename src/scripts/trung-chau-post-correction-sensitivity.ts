#!/usr/bin/env npx tsx
/**
 * Deterministic generator for PR #265 research artifacts.
 * Usage: npm run research:trung-chau:post-correction-sensitivity
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildSensitivityReport,
  RESEARCH_GENERATION_ID,
  RESEARCH_SCHEMA_VERSION,
  type SensitivityReport,
} from "@/lib/ziwei/analysis/research/trung-chau-post-correction-sensitivity";

function baseSha(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "UNKNOWN";
  }
}

function renderMarkdown(report: SensitivityReport): string {
  const rows = report.globalSummary
    .map(
      (r) =>
        `| ${r.module} | ${r.observations} | ${r.exposed} | ${r.changed} | ${r.controlMaxAbsDelta} | ${r.medianAbsDelta} | ${r.p95AbsDelta} | ${r.maxAbsDelta} | ${r.bandFlips} | ${r.verdict} |`,
    )
    .join("\n");

  return `# Post-Trung-Châu Correction Sensitivity (v0.4)

## Research question

How does the approved Trung Châu Mậu/Nhâm Hóa Khoa physical correction propagate
through existing Analysis modules when all other variables are held constant?

## Authority boundaries

Calculation Core remains physical truth. School policy remains doctrine.
Analysis interprets physical facts. This generation is research-only and is not
runtime authority.

- No Calculation Core changes
- No released school-policy changes
- No scoring formula / weight / band changes
- No Monthly production routing changes
- Research artifacts ≠ runtime authority

## PRE vs POST definition

\`\`\`text
Mậu Khoa: Hữu Bật → Thái Dương
Nhâm Khoa: Tả Phụ → Thiên Phủ
Canh Khoa: Thiên Phủ (unchanged)
TOTAL_POLICY_CELL_DIFF = ${report.correction.totalPolicyCellDiff}
\`\`\`

Base SHA: \`${report.baseSha}\`

## Experimental constants

Current source code, chart geometry, star placement, temporal coordinates,
knowledge packs, scoring models/bands/weights, release policy, and feature flags
are held constant. Only PRE mutagen / monthly \`tuHoaTargets\` mappings differ.

## Counterfactual generation

1. \`POST_CHART = calculateTrungChau(goldenInput)\` under live released policy
2. \`PRE_CHART = structuredClone(POST_CHART)\` then rebuild natal/annual/major
   mutagen arrays via \`resolveMutagenRecords(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, …)\`
3. Source chart mutagen arrays remain unchanged
4. Monthly lane: same POST chart + PRE/POST providers that share calendar identity
   and differ only in \`tuHoaTargets\`

## Corpus & coverage

- Total TC cases: **${report.corpus.total}**
- Historical non-annual-stem: ${report.corpus.historicalNonAnnualStemCount}
- Annual stem coverage: ${report.corpus.annualStemCount}
- Mậu annual case included: ${report.corpus.includesAnnualStemMau} (\`annual-stem-2018\`)
- Nhâm annual case included: ${report.corpus.includesAnnualStemNham} (\`annual-stem-2022\`)
- Historical #261/#262 45-case impact artifacts remain untouched

## Exposure model

A temporal layer is exposed iff its stem is Mậu or Nhâm (Khoa target differs).
Palace Overview exposure uses natal stem only. Major Fortune V0.5 correction
sensitivity uses natal exposure (adapter disables luck-stem XF). Monthly V1
shadow exposure uses monthly calendar stem.

## Global sensitivity summary

| Module | Observations | Exposed | Changed | Control Δ | Median \\|Δ\\| | P95 \\|Δ\\| | Max \\|Δ\\| | Band flips | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}

## Module notes

### Palace Overview
Natal mutagen fact swap only. Control Δ exact zero. Exposed median |Δ| =
${report.modules.palaceOverview.summary.exposedStats.medianAbsoluteDelta}.

### Annual Axes
TC V0.2 released path. Cohort counts:
${JSON.stringify(report.modules.annualAxes.summary.cohortCounts)}.
Coverage gaps: ${JSON.stringify(report.modules.annualAxes.summary.coverageGaps)}.

### Major Fortune V0.5
Correction sensitivity (MF-A). Natal XF only per adapter policy.

### Major Fortune V1
Shadow path; Tứ Hóa not scored → XF score sensitivity classified COVERAGE_GAP.
MF-C model deltas are recorded separately and not merged into correction stats.

### Monthly Flow V1 Shadow
Label: \`${report.modules.monthlyFlowV1Shadow.label}\`.
TC production remains unavailable. Calendar/focus invariants:
failures=${report.controls.monthlyCalendarInvariantFailures}.

## Negative controls

All unexposed expected deltas exact-zero: **${report.controls.allExactZero}**

- PO unexpected: ${report.controls.palaceOverviewUnexpected}
- AA unexpected: ${report.controls.annualAxesUnexpected}
- MF V0.5 unexpected: ${report.controls.majorFortuneV05Unexpected}
- Monthly unexpected: ${report.controls.monthlyUnexpected}
- Monthly calendar invariant failures: ${report.controls.monthlyCalendarInvariantFailures}

## Classification tallies

${Object.entries(report.classifications)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

No \`MODEL_INSTABILITY\` claims were made without structural evidence.

## Limitations

${report.limitations.map((l) => `- ${l}`).join("\n")}

## Runtime impact

Expected protected runtime delta: **0**. This PR measures; it does not tune.

## Outcome / next recommendation

- Kind: \`${report.outcome.kind}\`
- Recommended next: ${report.outcome.recommendation}
`;
}

function main() {
  const sha = baseSha();
  const report = buildSensitivityReport(sha);
  const outDir = resolve(
    process.cwd(),
    "research/trung-chau/v0.4-post-correction-sensitivity",
  );
  mkdirSync(outDir, { recursive: true });
  const jsonPath = resolve(outDir, "sensitivity-report.json");
  const mdPath = resolve(outDir, "REPORT.md");
  const json = `${JSON.stringify(report, null, 2)}\n`;
  writeFileSync(jsonPath, json, "utf8");
  writeFileSync(mdPath, `${renderMarkdown(report)}\n`, "utf8");
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
  console.log(`schema=${RESEARCH_SCHEMA_VERSION}`);
  console.log(`generation=${RESEARCH_GENERATION_ID}`);
  console.log(`outcome=${report.outcome.kind}`);
  console.log(`controls.allExactZero=${report.controls.allExactZero}`);
}

main();
