import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function validateReports() {
  const reportsDir = join(process.cwd(), "research/major-fortune/v0.4.1-production-integrity/reports");
  const files = readdirSync(reportsDir).filter(f => f.endsWith(".json"));

  if (files.length === 0) {
    throw new Error("No reports found to validate.");
  }

  let totalEvents = 0;
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(reportsDir, file), "utf8"));
    if (!Array.isArray(data)) throw new Error(`Invalid report format in ${file}`);
    
    totalEvents += data.length;

    for (const event of data) {
      if (event.event !== "major_fortune_scored") {
        throw new Error(`Invalid event type in ${file}: ${event.event}`);
      }
      if (event.integrationVersion !== "0.4.1") {
        throw new Error(`Invalid integration version in ${file}: ${event.integrationVersion}`);
      }
      if (event.directTransformationActivationCount > event.acceptedTransformationEvidenceCount) {
        throw new Error(`Invariant violation in ${file}: directTransformationActivationCount (${event.directTransformationActivationCount}) > acceptedTransformationEvidenceCount (${event.acceptedTransformationEvidenceCount})`);
      }
      
      // Mode B (Enabled, Nam Phái)
      if (file.includes("nam-phai-true")) {
        if (!event.namPhaiTransformationsEnabled) {
          throw new Error(`Feature flag state mismatch in ${file}`);
        }
      }

      // Mode A (Fallback, Nam Phái)
      if (file.includes("nam-phai-false")) {
        if (event.namPhaiTransformationsEnabled) {
          throw new Error(`Feature flag state mismatch in ${file}`);
        }
        if (event.directTransformationActivationCount > 0) {
          throw new Error(`Direct transformations leaked into fallback mode in ${file}`);
        }
      }
    }
  }
  
  return totalEvents;
}

console.log("Validating V0.4.1 Production Integrity Reports...");
try {
  const total = validateReports();
  console.log(`Successfully validated ${total} telemetry events across all reports.`);
} catch (err: any) {
  console.error("Validation failed:", err.message);
  process.exit(1);
}
