import { readFileSync } from "node:fs";
import { join } from "node:path";

try {
  const decisionData = JSON.parse(
    readFileSync(join(process.cwd(), "research/major-fortune/v0.4.1-production-integrity/decision.json"), "utf8")
  );
  if (decisionData.decision !== "PROMOTE_MAJOR_FORTUNE_V041_PRODUCTION_INTEGRITY") {
    console.error("Decision is not PROMOTE.");
    process.exit(1);
  }
  console.log("Decision Check Passed: PROMOTE_MAJOR_FORTUNE_V041_PRODUCTION_INTEGRITY");
} catch (err: any) {
  console.error("Decision check failed:", err.message);
  process.exit(1);
}
