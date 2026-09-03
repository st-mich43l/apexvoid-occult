#!/usr/bin/env npx tsx
/** Deterministic generator for PR #268 Major Fortune V1 authority artifacts. */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildAuthorityReport,
  loadAndValidateAuthorityPack,
} from "@/lib/ziwei/analysis/research/major-fortune-v1-authority";
import { stableSortByKey } from "@/lib/ziwei/analysis/research/major-fortune-v1-readiness/metrics";
import type { AuthorityReport } from "@/lib/ziwei/analysis/research/major-fortune-v1-authority";

function baseSha(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "UNKNOWN";
  }
}

function tableRows(report: AuthorityReport): string {
  return report.evidenceFamilies.map((family) =>
    `| ${family.familyId} | ${family.physicalFactAuthority} | ${family.doctrineAuthority} | ${family.numericAuthority} | ${family.researchAdmission} | ${family.releaseAdmission} | ${family.sourceObligationIds.join(", ") || "—"} |`,
  ).join("\n");
}

function renderReport(report: AuthorityReport): string {
  const { pack } = loadAndValidateAuthorityPack();
  const witnessRows = stableSortByKey(pack.witnesses, (witness) => witness.witnessId)
    .map((witness) => `| ${witness.witnessId} | ${witness.canonicalSourceId} | ${witness.schoolScope} | ${witness.authorityRole} | ${witness.locatorStatus} | ${witness.currentUsability} |`).join("\n");
  const migrationRows = report.historicalIds.records
    .map((record) => `| ${record.historicalId} | ${record.historicalType} | ${record.historicalStatus} | ${record.currentAuthorityStatus} | ${record.replacementId ?? "null"} | ${record.authorityResolution} |`).join("\n");
  const obligationRows = report.sourceObligations.records
    .map((obligation) => `| ${obligation.obligationId} | ${obligation.priority} | ${obligation.schoolScope} | ${obligation.evidenceFamily} | ${obligation.currentStatus} | ${obligation.blockingCapabilities.join("; ")} |`).join("\n");
  const numericRows = [
    ["SOURCED_NUMERIC_AUTHORITY", report.numeric.sourcedCount],
    ["ENGINEERING_POLICY", report.numeric.engineeringCount],
    ["FROZEN_INHERITED_FORMULA", report.numeric.frozenInheritedCount],
    ["RESEARCH_HYPOTHESIS", report.numeric.hypothesisCount],
    ["PLACEHOLDER", report.numeric.placeholderCount],
    ["UNRESOLVED", report.numeric.unresolvedCount],
  ].map(([authority, count]) => `| ${authority} | ${count} |`).join("\n");

  return `# Major Fortune V1 Authority Foundation

## Executive summary

Decision: **${report.decision}**

The current RC1 candidate remains immutable. Every emitted evidence item received exactly one current authority resolution. Historical IDs are quarantined rather than restored, numeric placeholders remain placeholders, and release admission remains blocked or not implemented.

## Base and candidate identity

- Base SHA: \`${report.generatedFrom.baseSha}\`
- Candidate: \`${report.generatedFrom.candidate}\`
- Baseline: \`${report.generatedFrom.baseline}\`
- Lifecycle: \`RESEARCH_ONLY\`
- Runtime/release/scoring authority: \`false / false / false\`

## Input from PR #267

- Observations: 1,320
- Physical facts: 58,016
- Recognized V1 evidence items: 11,880
- Silent physical-fact drops: 46,136 (0.795229)
- Major mutagens: 2,592 physical and 2,592 in the frame
- Transformation scoring: 0
- Prior decision: \`MFV1_REQUIRES_PROVENANCE_REBUILD\`

## Historical provenance lineage

The #194/#195 registries were inspected through Git history only. Their broad bibliographic records and historical \`verified/high/CONFIRMED\` labels are not current authority.

## Current provenance contract

\`raw narrative → source discovery → exact source verification → source registry → claim adjudication → versioned knowledge → research candidate → corpus audit → release decision\`

## Current source witness registry

| Witness | Canonical source | Scope | Role | Locator | Usability |
| --- | --- | --- | --- | --- | --- |
${witnessRows}

Canonical source references are validated against the current Major Fortune, V0.3 adapter, and Trung Châu registries. No witness is elevated beyond its declared usage.

## Historical-ID migration

| Historical ID | Type | Historical state | Current equivalent | Replacement | Resolution |
| --- | --- | --- | --- | --- | --- |
${migrationRows}

Observed historical IDs: ${report.historicalIds.idsObserved}; resolved migration records: ${report.historicalIds.idsResolved}; no-current-equivalent: ${report.historicalIds.idsWithNoCurrentEquivalent}.

## Evidence family authority

| Family | Physical fact authority | Doctrine authority | Numeric authority | Research admission | Release admission | Obligation |
| --- | --- | --- | --- | --- | --- | --- |
${tableRows(report)}

## Numeric authority

The complete RC1 inventory contains ${report.numeric.numericPolicyCount} surfaces.

| Authority | Count |
| --- | ---: |
${numericRows}

The 112 star-vector surfaces, 16 Tứ Hóa surfaces, and six quality surfaces remain placeholders. The malefic threshold remains a research hypothesis. Engineering formulas are not classical doctrine.

## Evidence admission

Emitted evidence resolutions: ${report.authority.totalEvidence}.

- Research admitted: ${report.admission.researchAdmitted}
- Context only: ${report.admission.contextOnly}
- Blocked: ${report.admission.blocked}
- Source obligation open: ${report.admission.sourceObligationOpen}
- Not implemented: ${report.admission.notImplemented}

## Source obligations

| Obligation | Priority | Scope | Evidence family | Status | Blocking capability |
| --- | --- | --- | --- | --- | --- |
${obligationRows}

Open: ${report.sourceObligations.open}; partial: ${report.sourceObligations.partial}; satisfied: ${report.sourceObligations.satisfied}; blocked: ${report.sourceObligations.blocked}.

## School-scope review

Trung Châu witnesses are restricted to Trung Châu claims. No Trung Châu-only witness supports a shared or Nam Phái claim. Current evidence-family claims therefore remain unresolved or not implemented where exact school-scoped authority is absent.

## Major Fortune Tứ Hóa authority posture

Calculation Core mutagen facts are available and carried into the RC1 frame. Current school doctrine remains open, numeric vectors remain placeholders, and scoring consumption remains disabled. No Tứ Hóa implementation was added.

## Quality-surface authority posture

Coverage, confidence, contribution percentages, and VCD deduction remain classified as placeholders/mock or synthetic constants. Runtime output is unchanged.

## Corpus authority replay

The deterministic dual-school corpus replayed all 1,320 observations and resolved all ${report.authority.totalEvidence} emitted evidence items exactly once. Physical facts outside the emitted evidence contract remain reported as coverage findings, not silently promoted evidence.

## Validation results

- Authority-pack manifest is research-only and score-impact-free.
- Canonical source references resolve.
- Claim witnesses resolve.
- Prohibited usage and school isolation rules are enforced.
- Verified doctrine requires an exact claim locator.
- Numeric surface coverage is complete: ${report.numeric.numericPolicyCount} / 150.
- Unclassified authority count: ${report.authority.unclassifiedAuthorityCount}.

## Authority matrix

Physical fact authority is distinct from doctrine authority, numeric authority, and admission status. A Calculation Core fact may therefore be research-admitted while its doctrine remains unresolved and its release admission remains blocked.

## Final decision

**${report.decision}**

The authority foundation is rebuilt because no emitted evidence remains unclassified, historical provenance is not laundered into current authority, and RC1/runtime behavior is unchanged.

## Remaining blockers

- P0 source obligations remain open.
- RC1 star vectors and quality surfaces remain placeholders.
- Major Fortune Tứ Hóa scoring is not implemented.
- Physical-fact coverage gaps remain out of scope.
- Release admission remains blocked.

## Limitations

- No new external source acquisition was performed.
- Current authority is limited to committed repository evidence.
- This report does not certify V1, improve V1 scoring, or create a release gate.

## Recommended next PR

\`research(major-fortune): verify V1 principal-star and auxiliary evidence source obligations\`
`;
}

function main(): void {
  const { issues } = loadAndValidateAuthorityPack();
  if (issues.length > 0) throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
  const report = buildAuthorityReport(baseSha());
  const outDir = resolve(process.cwd(), "research/major-fortune/v1-authority-v0.1");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "authority-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(resolve(outDir, "source-obligations.json"), `${JSON.stringify(report.sourceObligations.records, null, 2)}\n`, "utf8");
  writeFileSync(resolve(outDir, "historical-id-migration.json"), `${JSON.stringify(report.historicalIds.records, null, 2)}\n`, "utf8");
  writeFileSync(resolve(outDir, "REPORT.md"), `${renderReport(report)}\n`, "utf8");
  writeFileSync(resolve(outDir, "README.md"), `# Major Fortune V1 Authority Foundation (v0.1)\n\n**STATUS:** RESEARCH_ONLY\n\nThis artifact describes current provenance, authority, and evidence admission for the immutable Major Fortune V1 RC1 candidate. It does not change runtime, scoring, release routing, physical coverage, quality metrics, or Tứ Hóa scoring.\n\n## Generate\n\n\`\`\`bash\nnpm run research:major-fortune-v1:authority\n\`\`\`\n\nRun twice and compare every generated file byte-for-byte.\n`, "utf8");
  console.log(`Wrote ${resolve(outDir, "authority-report.json")}`);
  console.log(`decision=${report.decision}`);
  console.log(`evidence=${report.authority.totalEvidence}`);
  console.log(`unclassified=${report.authority.unclassifiedAuthorityCount}`);
}

main();
