import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

try {
  const decisionData = JSON.parse(
    readFileSync(join(process.cwd(), "research/major-fortune/v0.4.1-production-integrity/decision.json"), "utf8")
  );
  const reportPath = join(process.cwd(), "research/major-fortune/v0.4.1-production-integrity/REPORT.md");
  
  let md = `# Major Fortune V0.4.1 Production Integrity Report\n\n`;
  md += `**Decision**: ${decisionData.decision}\n\n`;
  md += `## Metrics\n\n`;
  md += `- Fallback Scored Count: ${decisionData.metrics.fallbackScoredCount}\n`;
  md += `- Enabled Scored Count: ${decisionData.metrics.enabledScoredCount}\n`;
  md += `- Enabled Total Direct Activations: ${decisionData.metrics.enabledTotalDirectActivations}\n\n`;
  md += `## Hard Gate Failures\n\n`;
  if (decisionData.hardGateFailures.length === 0) {
    md += `None.\n`;
  } else {
    for (const failure of decisionData.hardGateFailures) {
      md += `- ${failure}\n`;
    }
  }

  writeFileSync(reportPath, md, "utf8");
  console.log("Report generated at REPORT.md");
} catch (err: any) {
  console.error("Report generation failed:", err.message);
  process.exit(1);
}
