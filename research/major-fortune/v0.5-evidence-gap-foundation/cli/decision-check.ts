import fs from 'fs';
import path from 'path';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

export function checkDecision() {
  const p = path.join(base, 'decision.json');
  if (!fs.existsSync(p)) {
    console.error("Decision file not found.");
    process.exit(1);
  }
  const dec = JSON.parse(fs.readFileSync(p, 'utf-8'));
  if (dec.decision !== "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN") {
    console.error("Unexpected decision:", dec.decision);
    process.exit(1);
  }
  console.log("Decision check passed.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkDecision();
}
