#!/usr/bin/env npx tsx
/**
 * Deterministic generator for PR #267 Major Fortune V1 readiness artifacts.
 * Usage: npm run research:major-fortune-v1:readiness
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildReadinessReport,
  RESEARCH_GENERATION_ID,
  RESEARCH_SCHEMA_VERSION,
  type MajorFortuneV1ReadinessReport,
} from "@/lib/ziwei/analysis/research/major-fortune-v1-readiness";

function baseSha(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "UNKNOWN";
  }
}

export function renderReadinessMarkdown(report: MajorFortuneV1ReadinessReport): string {
  const dimRows = report.readiness.dimensions
    .map((d) => `| ${d.dimension} | ${d.status} | ${d.evidence.replace(/\|/g, "/")} |`)
    .join("\n");

  const lineageRows = report.lineage.historicalAssets
    .map((a) => `| ${a.assetId} | ${a.state} | ${a.notes.replace(/\|/g, "/")} |`)
    .join("\n");

  const covSchool = report.coverage.bySchool
    .map(
      (s) =>
        `| ${s.school} | ${s.observations} | ${s.physicalFacts} | ${s.recognized} | ${s.silentlyDropped} | ${s.principalCoverageRate} | ${s.auxiliaryCoverageRate} | ${s.transformationCoverageRate} |`,
    )
    .join("\n");

  const cmp = (label: string, b: MajorFortuneV1ReadinessReport["modelComparison"]["global"]) =>
    `| ${label} | ${b.comparableObservations} | ${b.deltas.meanSignedDelta} | ${b.deltas.medianAbsoluteDelta} | ${b.deltas.p95AbsoluteDelta} | ${b.deltas.maxAbsoluteDelta} | ${b.bandAgreementRate} |`;

  return `# Major Fortune V1 Release Readiness Requalification

## Executive summary

Decision: **${report.readiness.decision}**

Primary recommended next PR (${report.readiness.recommendedNextPr.outcome}):
\`${report.readiness.recommendedNextPr.title}\`

${report.readiness.recommendedNextPr.rationale}

Base SHA: \`${report.generatedFrom.baseSha}\`
Candidate: \`${report.generatedFrom.candidate}\`
Baseline: \`${report.generatedFrom.baseline}\`

## Base and candidate identity

- Schema: \`${report.schemaVersion}\`
- Generation: \`${report.generationId}\`
- Current MF V1 release gate: **${report.lineage.currentReleaseGate}**
- Historical GO_SHADOW: **${report.lineage.historicalGoShadowStatus}**

## Historical lineage

| Asset | State | Notes |
| --- | --- | --- |
${lineageRows}

## Current architecture boundary

\`\`\`text
analyzeMajorFortune() → V0.5 only
analyzeMajorFortuneTimeline() → V0.5 only
compareMajorFortuneV1Shadow() → explicit V0.5 + V1
\`\`\`

Isolation check: ${JSON.stringify(report.isolation)}

## Current lifecycle assessment

${report.lineage.currentLifecycleAssessment}

## Evidence family inventory

${report.authority.evidenceFamilies
  .map(
    (f) =>
      `- **${f.category}**: consumed=${f.physicalFactConsumed}; authorityLabel=${f.scoringAuthorityLabel}; supported=${f.scoringAuthorityActuallySupported}; class=${f.classification}`,
  )
  .join("\n")}

## Source / claim provenance audit

- Unresolved source IDs: ${report.authority.unresolvedSourceIds.join(", ") || "(none)"}
- Unresolved claim IDs: ${report.authority.unresolvedClaimIds.join(", ") || "(none)"}
- DOMAIN_VERIFIED labels: ${report.authority.domainVerifiedLabelCount}
- Resolved: ${report.authority.domainVerifiedResolvedCount}
- Unresolved: ${report.authority.domainVerifiedUnresolvedCount}
- Truthfulness: **${report.authority.domainVerifiedLabelTruthfulness}**

## Numeric authority inventory

Placeholder surfaces: ${report.authority.numericSurfaces.filter((s) => s.authority === "PLACEHOLDER").length}
Engineering-policy surfaces: ${report.authority.numericSurfaces.filter((s) => s.authority === "ENGINEERING_POLICY").length}
Research-hypothesis surfaces: ${report.authority.numericSurfaces.filter((s) => s.authority === "RESEARCH_HYPOTHESIS").length}

## Physical-fact coverage

| School | Observations | Physical facts | Recognized | Silent drops | Principal cov | Aux cov | Tứ Hóa cov |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${covSchool}

Overall silent-drop rate: ${report.coverage.silentDropRate}

## Unsupported / silently dropped stars

- Unique unsupported stars: ${report.coverage.uniqueUnsupportedStars.length}
- Unsupported occurrences: ${report.coverage.unsupportedStarOccurrences}
- Top: ${report.coverage.topUnsupportedStars.map((t) => `${t.starName}(${t.count})`).join(", ")}

## Major Fortune Tứ Hóa coverage

- Physical majorMutagens: ${report.coverage.majorMutagensPhysicalCount}
- In V1 frame: ${report.coverage.majorMutagensInV1FrameCount}
- Transformation evidence admitted: ${report.coverage.majorTransformationEvidenceCount}
- Transformation scored (trace): ${report.coverage.majorTransformationScoredCount}
- Classification: TRANSFORMATION_COVERAGE_GAP

## VCD behavior

VCD cohort comparison is under modelComparison.byVcd. Coverage deduction remains a hardcoded mock (−5).

## Reported quality vs measured quality

| Metric | Reported model behavior | Independently measurable? | Audit verdict |
| --- | --- | --- | --- |
| coverage | ${report.qualityTruthfulness.reportedCoverageBehavior} | yes | ${report.qualityTruthfulness.reportedCoverageClassification} |
| confidence | hardcoded 90 | no meaningful derivation | ${report.qualityTruthfulness.reportedConfidenceClassification} |
| engineering share | constant 50 | no | ${report.qualityTruthfulness.engineeringShareClassification} |
| verified-domain share | constant 50 | no | ${report.qualityTruthfulness.verifiedDomainShareClassification} |
| experimental share | constant 0 | no | ${report.qualityTruthfulness.experimentalShareClassification} |

Mean reported coverage%: ${report.qualityTruthfulness.meanReportedCoveragePercent}
Mean measured physical coverage%: ${report.qualityTruthfulness.meanMeasuredPhysicalCoveragePercent}

## V0.5 vs V1 corpus

| Cohort | Comparable | Mean Δ | Median \\|Δ\\| | P95 \\|Δ\\| | Max \\|Δ\\| | Band agreement |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${cmp("global", report.modelComparison.global)}
${cmp("nam-phai", report.modelComparison.bySchool["nam-phai"])}
${cmp("trung-chau", report.modelComparison.bySchool["trung-chau"])}
${cmp("vcd", report.modelComparison.byVcd.vcd)}
${cmp("non-vcd", report.modelComparison.byVcd["non-vcd"])}
${cmp("mutagens-present", report.modelComparison.byTransformationExposure["mutagens-present"])}
${cmp("mutagens-absent", report.modelComparison.byTransformationExposure["mutagens-absent"])}

## Distribution comparison

V0.5: ${JSON.stringify(report.modelComparison.global.v05Distribution)}
V1: ${JSON.stringify(report.modelComparison.global.v1Distribution)}

## Band comparison

Changed bands: ${report.modelComparison.global.bandChangedCount}
Transition matrix: ${JSON.stringify(report.modelComparison.global.bandTransitionMatrix)}

## Timeline behavior

Charts=${report.timeline.charts}; flatV05=${report.timeline.flatTimelineRateV05}; flatV1=${report.timeline.flatTimelineRateV1};
medianRangeV05=${report.timeline.medianWithinChartRangeV05}; medianRangeV1=${report.timeline.medianWithinChartRangeV1}

## School breakdown

See coverage and model-comparison tables above. Schools are not normalized together.

## Structural outliers

Model score deltas are classified as EXPECTED_MODEL_DIFFERENCE unless structural defect evidence exists.
No MODEL_INSTABILITY claim is asserted from magnitude alone.

## Classification summary

${Object.entries(report.classifications)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

## Readiness matrix

| Dimension | Status | Evidence / Finding |
| --- | --- | --- |
${dimRows}

## Final decision

**${report.readiness.decision}**

### Blockers

${report.readiness.blockers.map((b) => `- ${b}`).join("\n")}

## Limitations

${report.limitations.map((l) => `- ${l}`).join("\n")}

## Recommended next PR

- Outcome ${report.readiness.recommendedNextPr.outcome}: \`${report.readiness.recommendedNextPr.title}\`
- ${report.readiness.recommendedNextPr.rationale}
`;
}

function main() {
  const sha = baseSha();
  const report = buildReadinessReport(sha);
  const outDir = resolve(
    process.cwd(),
    "research/major-fortune/v1-release-readiness-v0.1",
  );
  mkdirSync(outDir, { recursive: true });
  const jsonPath = resolve(outDir, "readiness-report.json");
  const mdPath = resolve(outDir, "REPORT.md");
  const readmePath = resolve(outDir, "README.md");
  const json = `${JSON.stringify(report, null, 2)}\n`;
  writeFileSync(jsonPath, json, "utf8");
  writeFileSync(mdPath, `${renderReadinessMarkdown(report)}\n`, "utf8");
  writeFileSync(
    readmePath,
    `# Major Fortune V1 — Release readiness requalification (v0.1)

**STATUS:** RESEARCH_ONLY  
**Runtime authority:** false

## Question

Is the current Major Fortune V1 implementation an auditable and properly governed
research candidate under current architecture, evidence authority, coverage, and
quality contracts?

## How to regenerate

\`\`\`bash
npm run research:major-fortune-v1:readiness
\`\`\`

Run twice and confirm \`readiness-report.json\` is byte-identical.

## Artifacts

- \`readiness-report.json\` — deterministic machine-readable report
- \`REPORT.md\` — human-readable summary from the same run

## Harness

\`src/lib/ziwei/analysis/research/major-fortune-v1-readiness/\`

## Non-goals

No V1 score tuning, no Tứ Hóa scoring implementation, no production promotion,
no restoration of the deleted historical release gate as current authority.
`,
    "utf8",
  );
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
  console.log(`Wrote ${readmePath}`);
  console.log(`schema=${RESEARCH_SCHEMA_VERSION}`);
  console.log(`generation=${RESEARCH_GENERATION_ID}`);
  console.log(`decision=${report.readiness.decision}`);
  console.log(`outcome=${report.readiness.recommendedNextPr.outcome}`);
}

main();
