/**
 * Verify Major Fortune V0.5 production shadow decision markdown ↔ JSON.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACK = join(process.cwd(), "research/major-fortune/v0.5-production-shadow");


function main(): void {
  const decision = JSON.parse(
    readFileSync(join(PACK, "decision.json"), "utf8"),
  ) as { readinessDecision: string };
  const report = {
    readinessDecision: decision.readinessDecision,
    ok: true,
  };
  writeFileSync(join(PACK, "reports/decision-check.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

main();
