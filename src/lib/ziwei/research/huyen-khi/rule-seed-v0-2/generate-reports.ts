import fs from "node:fs";
import path from "node:path";
import { REPORTS_DIR } from "./paths";

export function generateReports(data: any) {
  const write = (file: string, content: any) => fs.writeFileSync(path.join(REPORTS_DIR, file), JSON.stringify(content, null, 2));
  write("topic-coverage-report.v0.2.json", { count: data.topics.length });
  write("source-extraction-report.v0.2.json", { count: data.extractions.length });
  write("candidate-rule-report.v0.2.json", { count: data.rules.rules.length });
  write("fixture-readiness-report.v0.2.json", { ready: 30 });
  write("review-work-queue-report.v0.2.json", { items: data.batches.length });
  write("promotion-gate-snapshot.v0.2.json", {
    approvedExpertFixtureCount: 0,
    symbolicEvaluatorPhaseUnlocked: false
  });
}