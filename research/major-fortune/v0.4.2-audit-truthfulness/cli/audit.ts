/**
 * Major Fortune V0.4.2 Canonical Audit.
 *
 * Generates canonical MajorFortuneAuditObservation snapshots for all modes:
 *   - v042-fallback       : Nam Phái, flag=OFF
 *   - v042-nam-phai-enabled : Nam Phái, flag=ON
 *   - v042-trung-chau-control : Trung Châu, flag=OFF
 *
 * Also generates timeline observations and temporal independence pairs.
 *
 * Uses withMajorFortuneTelemetrySink for scoped injection (not global mutation).
 * Does NOT silently rewrite baselines.
 * Does NOT produce a promotion decision on its own.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  expandAllMajorFortuneCycleObservations,
  MF_V02_FULL_CORPUS,
  calculateChart,
} from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus";
import { analyzeMajorFortuneOrdinalV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter/analyze";
import { analyzeMajorFortuneTimelineV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-timeline/analyze";
import {
  noopMajorFortuneTelemetrySink,
  withMajorFortuneTelemetrySink,
} from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/emit";
import { buildAuditObservation } from "../types/build-observation";
import type { MajorFortuneAuditObservation, AuditObservationMode } from "../types/audit-observation";
import { buildObservationId } from "../types/audit-observation";

(import.meta as Record<string, unknown>).env = process.env;

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.2-audit-truthfulness");
const RAW_DIR = join(ROOT, "reports", "raw");

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
  let cycleOrder = 0;

  process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"] = String(flagEnabled);

  for (const obs of filtered) {
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

  // Restore env.
  delete process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"];

  console.log(`[audit] ${label}: ${snapshots.length} observations`);
  return snapshots;
}

function runTimelineMode(
  school: "nam-phai" | "trung-chau",
  flagEnabled: boolean,
): MajorFortuneAuditObservation[] {
  const observations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  // One timeline per unique chart (dedup by birthChartId).
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
        school === "nam-phai" ? "v042-fallback" : "v042-trung-chau-control",
        MF_V02_FULL_CORPUS.corpusId,
        point.cycleIndex,
      );
      snapshots.push(snapshot);
    }
  }

  delete process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"];
  return snapshots;
}

function runTemporalPairs(school: "nam-phai" | "trung-chau"): Array<{
  observationId: string;
  baseSnapshot: MajorFortuneAuditObservation;
  alteredSnapshot: MajorFortuneAuditObservation;
  contaminationField: string;
}> {
  const observations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  // Use first 10 observations for temporal independence check (sampling).
  const sample = observations.filter((o) => o.school === school).slice(0, 10);
  const pairs: ReturnType<typeof runTemporalPairs> = [];

  process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"] = "false";

  for (const obs of sample) {
    const chart = calculateChart(school, obs.input);

    // Base observation.
    const baseAnalysis = withMajorFortuneTelemetrySink(noopMajorFortuneTelemetrySink, () =>
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
    const baseSnapshot = buildAuditObservation(obs, baseAnalysis, "v042-fallback", MF_V02_FULL_CORPUS.corpusId, 0);

    // Temporal alteration: change annualYear (should NOT affect Major Fortune score).
    const alteredObs = { ...obs, selectedAnnualYear: obs.selectedAnnualYear + 1 };
    const alteredAnalysis = withMajorFortuneTelemetrySink(noopMajorFortuneTelemetrySink, () =>
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
    const alteredSnapshot = buildAuditObservation(alteredObs, alteredAnalysis, "v042-fallback", MF_V02_FULL_CORPUS.corpusId, 0);

    pairs.push({
      observationId: baseSnapshot.observationId,
      baseSnapshot,
      alteredSnapshot,
      contaminationField: "selectedAnnualYear",
    });
  }

  delete process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"];
  return pairs;
}

function run(): void {
  mkdirSync(RAW_DIR, { recursive: true });

  console.log("[audit] Running Major Fortune V0.4.2 Canonical Audit...");
  console.log(`[audit] Corpus: ${MF_V02_FULL_CORPUS.corpusId}`);

  // Mode A: Nam Phái fallback (flag OFF).
  const fallback = runMode("nam-phai", false, "v042-fallback", "Nam Phái Fallback (flag=OFF)");
  writeFileSync(join(RAW_DIR, "nam-phai-fallback.json"), JSON.stringify(fallback, null, 2), "utf8");

  // Mode B: Nam Phái enabled (flag ON).
  const enabled = runMode("nam-phai", true, "v042-nam-phai-enabled", "Nam Phái Enabled (flag=ON)");
  writeFileSync(join(RAW_DIR, "nam-phai-enabled.json"), JSON.stringify(enabled, null, 2), "utf8");

  // Mode C: Trung Châu control (flag OFF).
  const control = runMode("trung-chau", false, "v042-trung-chau-control", "Trung Châu Control (flag=OFF)");
  writeFileSync(join(RAW_DIR, "trung-chau-control.json"), JSON.stringify(control, null, 2), "utf8");

  // Timeline: Single-cycle vs timeline path equivalence.
  console.log("[audit] Running timeline observations (Nam Phái, flag=OFF)...");
  const timelinePoints = runTimelineMode("nam-phai", false);
  writeFileSync(join(RAW_DIR, "timeline-points.json"), JSON.stringify(timelinePoints, null, 2), "utf8");
  console.log(`[audit] Timeline points: ${timelinePoints.length}`);

  // Temporal independence pairs.
  console.log("[audit] Running temporal independence pairs (Nam Phái)...");
  const temporalPairs = runTemporalPairs("nam-phai");
  writeFileSync(join(RAW_DIR, "temporal-pairs.json"), JSON.stringify(temporalPairs, null, 2), "utf8");
  console.log(`[audit] Temporal pairs: ${temporalPairs.length}`);

  // Summary.
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
