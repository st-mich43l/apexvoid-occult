import { writeMajorFortuneV03AdapterUiPack } from "../write-pack";

function main(): void {
  const { decision, hardGateFailures } = writeMajorFortuneV03AdapterUiPack();
  console.log(JSON.stringify({ readinessDecision: decision, hardGateFailures }, null, 2));
  if (hardGateFailures.length > 0) process.exit(1);
}

main();
