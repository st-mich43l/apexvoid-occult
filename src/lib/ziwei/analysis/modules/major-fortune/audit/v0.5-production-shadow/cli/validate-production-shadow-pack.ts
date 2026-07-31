/**
 * Validate Major Fortune V0.5 production shadow research pack.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAnalysisStatus } from "../../../../../contracts/common";
import { loadAdmittedFamilyRegistry } from "../../../../../knowledge/major-fortune-scoring/v0.5-production/loader";
import { loadMajorFortuneOrdinalKnowledge } from "../../../../../knowledge/major-fortune-scoring/v0.3-ordinal";

const PACK = join(process.cwd(), "research/major-fortune/v0.5-production-shadow");

function main(): void {
  const issues: string[] = [];
  mkdirSync(join(PACK, "reports"), { recursive: true });

  const required = [
    "reports/summary-report.json",
    "reports/coverage-display-policy-report.json",
    "decision.json",
  ];
  for (const rel of required) {
    if (!existsSync(join(PACK, rel))) issues.push(`missing:${rel}`);
  }

  const loaded = loadMajorFortuneOrdinalKnowledge();
  if (!loaded.ok) issues.push("v03-knowledge-invalid");

  const registry = loadAdmittedFamilyRegistry();
  if (!registry.ok) issues.push("v05-registry-invalid");

  const routing = getAnalysisStatus("major-fortune");
  if (routing.status !== "available" || routing.version !== "0.4.3") {
    issues.push("production-routing-unexpected");
  }

  if (existsSync(join(PACK, "decision.json"))) {
    const decision = JSON.parse(
      readFileSync(join(PACK, "decision.json"), "utf8"),
    ) as { readinessDecision?: string; hardGateFailures?: string[] };
    
    if ((decision.hardGateFailures ?? []).length > 0) {
      issues.push("decision-has-hard-gate-failures");
    }
    if (decision.readinessDecision !== "PROMOTE_MAJOR_FORTUNE_V050_TO_PRODUCTION_SHADOW") {
      issues.push("decision-not-promote");
    }
  }

  const report = { ok: issues.length === 0, issues, productionRouting: routing };
  writeFileSync(join(PACK, "reports/pack-validate.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (issues.length > 0) process.exit(1);
}

main();
