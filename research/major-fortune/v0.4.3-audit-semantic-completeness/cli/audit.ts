/**
 * Major Fortune V0.4.3 Canonical Audit.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  expandAllMajorFortuneCycleObservations,
  MF_V02_FULL_CORPUS,
  calculateChart,
} from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus.js";
import { analyzeMajorFortuneOrdinalV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter/analyze.js";
import { analyzeMajorFortuneTimelineV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-timeline/analyze.js";
import {
  noopMajorFortuneTelemetrySink,
  withMajorFortuneTelemetrySink,
} from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/emit.js";
import { buildAuditObservation } from "../types/build-observation.js";
import type { MajorFortuneAuditObservation, AuditObservationMode } from "../types/audit-observation.js";
import { runTemporalIndependenceAudit } from "../temporal/build-temporal-pairs.js";
import { runTelemetryAudit } from "../telemetry/audit-telemetry.js";

(import.meta as Record<string, unknown>).env = process.env;

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.3-audit-semantic-completeness");
const RAW_DIR = join(ROOT, "reports", "raw");
const REPORTS_DIR = join(ROOT, "reports");

function runMode(
  school: "nam-phai" | "trung-chau",
  flagEnabled: boolean,
  mode: AuditObservationMode,
  label: string,
): MajorFortuneAuditObservation[] {
  const observations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  const filtered = observations.filter((o) => o.school === school);

  const snapshots: MajorFortuneAuditObservation[] = [];
  const seenIds = new Set<string>();

  process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"] = String(flagEnabled);

  let currentChartId = "";
  let cycleOrder = 0;

  for (const obs of filtered) {
    if (obs.birthChartId !== currentChartId) {
      currentChartId = obs.birthChartId;
      cycleOrder = 0;
    }
    const chart = calculateChart(school, obs.input);

    const analysis = withMajorFortuneTelemetrySink(noopMajorFortuneTelemetrySink, () =>
      analyzeMajorFortuneOrdinalV03(chart, {
        school,
        cycleOverride: {
          cycleIndex: obs.cycleIndex,
          startAge: obs.startAge,
          endAge: obs.endAge,
          activePalaceIndex: obs.activePalaceIndex,
        },
      }),
    );

    const snapshot = buildAuditObservation(
      obs,
      analysis,
      mode,
      MF_V02_FULL_CORPUS.corpusId,
      cycleOrder++,
    );

    if (seenIds.has(snapshot.observationId)) {
      console.error(`[audit] DUPLICATE observationId detected: ${snapshot.observationId}`);
      process.exit(1);
    }
    seenIds.add(snapshot.observationId);
    snapshots.push(snapshot);
  }

  delete process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"];

  console.log(`[audit] ${label}: ${snapshots.length} observations`);
  return snapshots;
}

function runTimelineMode(
  school: "nam-phai" | "trung-chau",
  flagEnabled: boolean,
): MajorFortuneAuditObservation[] {
  const observations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  const chartsMap = new Map<string, (typeof observations)[0]>();
  for (const obs of observations) {
    if (obs.school === school && !chartsMap.has(obs.birthChartId)) {
      chartsMap.set(obs.birthChartId, obs);
    }
  }

  const snapshots: MajorFortuneAuditObservation[] = [];

  process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"] = String(flagEnabled);

  for (const obs of chartsMap.values()) {
    const chart = calculateChart(school, obs.input);

    const timelineResult = withMajorFortuneTelemetrySink(noopMajorFortuneTelemetrySink, () =>
      analyzeMajorFortuneTimelineV03(chart, { school }),
    );

    for (const point of timelineResult.points) {
      if (!point.analysis) continue;
      const cycleObs = {
        birthChartId: obs.birthChartId,
        split: obs.split,
        school,
        cycleIndex: point.cycleIndex,
        startAge: point.startAge,
        endAge: point.endAge,
        activePalaceIndex: point.activePalaceIndex,
        selectedAnnualYear: obs.selectedAnnualYear,
        input: obs.input,
      };
      const snapshot = buildAuditObservation(
        cycleObs,
        point.analysis,
        school === "nam-phai" ? "v043-fallback" : "v043-trung-chau-control",
        MF_V02_FULL_CORPUS.corpusId,
        point.cycleIndex,
      );
      snapshots.push(snapshot);
    }
  }

  delete process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"];
  return snapshots;
}

function run(): void {
  mkdirSync(RAW_DIR, { recursive: true });
  mkdirSync(REPORTS_DIR, { recursive: true });

  console.log("[audit] Running Major Fortune V0.4.3 Canonical Audit...");
  console.log(`[audit] Corpus: ${MF_V02_FULL_CORPUS.corpusId}`);

  const fallback = runMode("nam-phai", false, "v043-fallback", "Nam Phái Fallback (flag=OFF)");
  writeFileSync(join(RAW_DIR, "nam-phai-fallback.json"), JSON.stringify(fallback, null, 2), "utf8");

  const enabled = runMode("nam-phai", true, "v043-nam-phai-enabled", "Nam Phái Enabled (flag=ON)");
  writeFileSync(join(RAW_DIR, "nam-phai-enabled.json"), JSON.stringify(enabled, null, 2), "utf8");

  const control = runMode("trung-chau", false, "v043-trung-chau-control", "Trung Châu Control (flag=OFF)");
  writeFileSync(join(RAW_DIR, "trung-chau-control.json"), JSON.stringify(control, null, 2), "utf8");

  console.log("[audit] Running timeline observations (Nam Phái, flag=OFF)...");
  const timelinePoints = runTimelineMode("nam-phai", false);
  writeFileSync(join(RAW_DIR, "timeline-points.json"), JSON.stringify(timelinePoints, null, 2), "utf8");
  console.log(`[audit] Timeline points: ${timelinePoints.length}`);

  console.log("[audit] Running temporal independence pairs (Nam Phái & Trung Châu)...");
  const temporalReport = runTemporalIndependenceAudit();
  writeFileSync(join(REPORTS_DIR, "temporal-independence-report.json"), JSON.stringify(temporalReport, null, 2), "utf8");
  console.log(`[audit] Temporal pairs tested: ${temporalReport.totalPairs}, Passed: ${temporalReport.passed}`);

  console.log("[audit] Running telemetry semantics audit...");
  const telemetryReport = runTelemetryAudit();
  writeFileSync(join(REPORTS_DIR, "telemetry-semantics-report.json"), JSON.stringify(telemetryReport, null, 2), "utf8");
  console.log(`[audit] Telemetry semantics: tested=${telemetryReport.testedEventCount}, Passed=${telemetryReport.passed}`);

  const directCount = enabled.reduce((s, o) => s + o.transformationSummary.directTransformationActivationCount, 0);
  const scoredCount = enabled.filter((o) => o.scoreState === "scored").length;

  console.log("[audit] Summary:");
  console.log(`  Fallback observations:   ${fallback.length} (scored: ${fallback.filter(o => o.scoreState === "scored").length})`);
  console.log(`  Enabled observations:    ${enabled.length} (scored: ${scoredCount})`);
  console.log(`  Control observations:    ${control.length}`);
  console.log(`  Direct activations (enabled): ${directCount}`);
  console.log(`  Activation rate: ${((directCount / enabled.length) * 100).toFixed(1)}%`);
  console.log("[audit] Raw snapshots written to reports/raw/");
}

try {
  run();
} catch (err) {
  console.error("[audit] FAILED:", err);
  process.exit(1);
}
