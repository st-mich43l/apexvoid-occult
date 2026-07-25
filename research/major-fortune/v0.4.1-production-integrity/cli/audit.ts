import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildMajorFortuneV02BirthCharts,
  expandAllMajorFortuneCycleObservations,
  MF_V02_FULL_CORPUS,
  calculateChart,
} from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus";
import { analyzeMajorFortuneOrdinalV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter/analyze";
import {
  setMajorFortuneTelemetrySink,
  noopMajorFortuneTelemetrySink,
} from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/emit";
import type { MajorFortuneScoredTelemetryEvent } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/types";
import { isMajorFortuneV04NamPhaiTransformationsEnabled } from "../../../../src/lib/ziwei/analysis/feature-flags";

(import.meta as any).env = process.env;

export function runAudit() {
  const outDir = join(process.cwd(), "research/major-fortune/v0.4.1-production-integrity/reports");
  mkdirSync(outDir, { recursive: true });

  const observations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);

  const events: MajorFortuneScoredTelemetryEvent[] = [];
  setMajorFortuneTelemetrySink({
    emit(event: MajorFortuneScoredTelemetryEvent) {
      events.push(event);
    },
  });

  const modes = [
    { school: "nam-phai", flag: false, label: "Mode A (Fallback)" },
    { school: "nam-phai", flag: true, label: "Mode B (Enabled)" },
    { school: "trung-chau", flag: false, label: "Mode C (Control)" },
  ] as const;

  const results: Record<string, { directCount: number; scoredCount: number }> = {};

  for (const mode of modes) {
    events.length = 0; // clear
    process.env.VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS = String(mode.flag);
    console.log(`Mode ${mode.label} flag status: ${isMajorFortuneV04NamPhaiTransformationsEnabled()}`);

    for (const obs of observations) {
      if (obs.school !== mode.school) continue;
      
      const chart = calculateChart(mode.school, obs.input);

      const result = analyzeMajorFortuneOrdinalV03(chart, {
        school: mode.school,
        cycleOverride: {
          cycleIndex: obs.cycleIndex,
          startAge: obs.startAge,
          endAge: obs.endAge,
          activePalaceIndex: obs.activePalaceIndex,
        },
      });
    }
    // Remove extra braces

    const directCount = events.reduce((sum, e) => sum + e.directTransformationActivationCount, 0);
    const scoredCount = events.reduce((sum, e) => sum + (e.scoreState === "scored" ? 1 : 0), 0);
    results[mode.label] = { directCount, scoredCount };

    writeFileSync(
      join(outDir, `audit-${mode.school}-${mode.flag}.json`),
      JSON.stringify(events, null, 2),
      "utf8",
    );
  }

  // Restore telemetry sink
  setMajorFortuneTelemetrySink(noopMajorFortuneTelemetrySink);
  
  return results;
}

console.log("Running V0.4.1 Production Integrity Audit...");
try {
  const results = runAudit();
  console.log(JSON.stringify(results, null, 2));
  console.log("Audit complete. Reports written to research/major-fortune/v0.4.1-production-integrity/reports/");
} catch (err) {
  console.error("Audit failed:", err);
  process.exit(1);
}
