import { loadMajorFortuneKnowledgeV02 } from "../../../../../knowledge/major-fortune-scoring/v0.2";
import { MF_V02_FAST_CORPUS } from "../corpus";
import { runMajorFortuneV02Audit } from "../run-audit";

function main(): void {
  const loaded = loadMajorFortuneKnowledgeV02();
  if (!loaded.ok) {
    console.error(loaded.issues);
    process.exit(1);
  }
  const matched = new Set<string>();
  for (const rule of loaded.knowledge.rules.rules) {
    matched.add(rule.ruleId);
  }
  const audit = runMajorFortuneV02Audit(MF_V02_FAST_CORPUS);
  const report = {
    totalRules: matched.size,
    matchedStructuralInFastAudit: audit.ruleCoverage.matchedStructuralRuleIds.length,
    executableContributions: audit.ruleCoverage.executableContributionRuleIds,
    matchedStructuralRuleIds: audit.ruleCoverage.matchedStructuralRuleIds,
  };
  console.log(JSON.stringify(report, null, 2));
}

main();
