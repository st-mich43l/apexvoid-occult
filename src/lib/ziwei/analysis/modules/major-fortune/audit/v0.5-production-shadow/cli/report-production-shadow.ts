/**
 * Re-write Major Fortune V0.5 production shadow research pack reports.
 */
import { writeMajorFortuneV05ShadowPack } from "../write-pack";

function main(): void {
  const { decision } = writeMajorFortuneV05ShadowPack();
  console.log(JSON.stringify({ readinessDecision: decision.readinessDecision }, null, 2));
  if (decision.hardGateFailures.length > 0) process.exit(1);
}

main();
