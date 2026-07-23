import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACK = join(process.cwd(), "research/major-fortune/v0.3-adapter-ui");

function main(): void {
  const decision = JSON.parse(
    readFileSync(join(PACK, "reports/decision.json"), "utf8"),
  ) as { readinessDecision: string };
  const md = readFileSync(join(PACK, "V0.3-ADAPTER-UI-DECISION.md"), "utf8");
  const expected = decision.readinessDecision;
  const mdHas = md.includes(`**\`${expected}\`**`) || md.includes(expected);
  const report = {
    readinessDecision: expected,
    markdownMatchesDecisionJson: mdHas,
    ok: mdHas,
  };
  writeFileSync(join(PACK, "reports/decision-check.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!mdHas) process.exit(1);
}

main();
