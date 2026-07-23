import { MF_V02_FAST_CORPUS } from "../corpus";
import { runMajorFortuneV02Audit } from "../run-audit";

function main(): void {
  const metrics = runMajorFortuneV02Audit(MF_V02_FAST_CORPUS);
  console.log(JSON.stringify(metrics, null, 2));
  if (metrics.hardGateFailures.length > 0) {
    console.error("hard gate failures:", metrics.hardGateFailures);
    process.exit(1);
  }
}

main();
