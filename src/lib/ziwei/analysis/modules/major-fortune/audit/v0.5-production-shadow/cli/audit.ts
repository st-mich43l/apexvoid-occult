import { writeMajorFortuneV05ShadowPack } from "../write-pack";

function main() {
  console.log("Running V0.5 Shadow Audit...");
  const result = writeMajorFortuneV05ShadowPack();
  console.log(`Decision: ${result.decision.readinessDecision}`);
  if (result.decision.hardGateFailures.length > 0) {
    console.error("Hard gate failures:", result.decision.hardGateFailures);
    process.exit(1);
  }
}

main();
