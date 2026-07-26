/**
 * Major Fortune V0.4.2 Baseline Generator.
 *
 * Generates frozen canonical baseline snapshots for:
 *   - Nam Phái V0.3.3 fallback (feature flag OFF)
 *   - Trung Châu V0.4.1 approved control
 *
 * REQUIRES: --accept-baseline-update flag.
 * Normal audit commands must NOT call this script.
 * Baselines must not be regenerated silently.
 *
 * Usage:
 *   npx tsx research/major-fortune/v0.4.2-audit-truthfulness/cli/baseline.ts --accept-baseline-update
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  buildMajorFortuneV02BirthCharts,
  expandAllMajorFortuneCycleObservations,
  MF_V02_FULL_CORPUS,
  calculateChart,
} from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus";
import { analyzeMajorFortuneOrdinalV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter/analyze";
import { noopMajorFortuneTelemetrySink, withMajorFortuneTelemetrySink } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/emit";
import { buildAuditObservation } from "../types/build-observation";
import { sha256Object, sha256File } from "../types/hash";
import type { BaselineManifest } from "../types/reports";
import type { MajorFortuneAuditObservation } from "../types/audit-observation";

(import.meta as Record<string, unknown>).env = process.env;

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.2-audit-truthfulness");
const BASELINES_DIR = join(ROOT, "baselines");

function requireAcceptFlag(): void {
  const args = process.argv.slice(2);
  if (!args.includes("--accept-baseline-update")) {
    console.error(
      "[baseline] ERROR: --accept-baseline-update flag is required to regenerate baselines.",
    );
    console.error("[baseline] Baselines are frozen artifacts and must not be regenerated silently.");
    console.error("[baseline] Pass --accept-baseline-update explicitly to proceed.");
    process.exit(1);
  }
}

function generateBaseline(
  school: "nam-phai" | "trung-chau",
  flagEnabled: boolean,
  mode: MajorFortuneAuditObservation["mode"],
): MajorFortuneAuditObservation[] {
  const observations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  const filtered = observations.filter((o) => o.school === school);

  const snapshots: MajorFortuneAuditObservation[] = [];
  const seenIds = new Set<string>();
  let cycleOrder = 0;

  for (const obs of filtered) {
    const chart = calculateChart(school, obs.input);

    process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"] = String(flagEnabled);
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

    const snapshot = buildAuditObservation(obs, analysis, mode, MF_V02_FULL_CORPUS.corpusId, cycleOrder++);

    if (seenIds.has(snapshot.observationId)) {
      console.error(`[baseline] DUPLICATE observationId: ${snapshot.observationId}`);
      process.exit(1);
    }
    seenIds.add(snapshot.observationId);
    snapshots.push(snapshot);
  }

  // Restore env.
  delete process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"];

  return snapshots;
}

function run(): void {
  requireAcceptFlag();
  mkdirSync(BASELINES_DIR, { recursive: true });

  console.log("[baseline] Generating Nam Phái V0.3.3 fallback baseline (flag=false)...");
  const namPhaiFallback = generateBaseline("nam-phai", false, "v033-fallback-baseline");
  const namPhaiPath = join(BASELINES_DIR, "v0.3.3-nam-phai-fallback.json");
  writeFileSync(namPhaiPath, JSON.stringify(namPhaiFallback, null, 2), "utf8");
  console.log(`[baseline] Nam Phái fallback: ${namPhaiFallback.length} observations → ${namPhaiPath}`);

  console.log("[baseline] Generating Trung Châu V0.4.1 control baseline (flag=false)...");
  const trungChauControl = generateBaseline("trung-chau", false, "trung-chau-baseline");
  const trungChauPath = join(BASELINES_DIR, "v0.4.1-trung-chau-control.json");
  writeFileSync(trungChauPath, JSON.stringify(trungChauControl, null, 2), "utf8");
  console.log(`[baseline] Trung Châu control: ${trungChauControl.length} observations → ${trungChauPath}`);

  // Generate baseline manifest with SHA256 hashes.
  const namPhaiSha = sha256File(namPhaiPath);
  const trungChauSha = sha256File(trungChauPath);

  const manifest: BaselineManifest = {
    schemaVersion: "0.4.2",
    corpusId: MF_V02_FULL_CORPUS.corpusId,
    sourceBaseSha: process.env["HEAD_SHA"] ?? "unknown",
    generatedByScript: "research/major-fortune/v0.4.2-audit-truthfulness/cli/baseline.ts",
    observationCount: namPhaiFallback.length + trungChauControl.length,
    schoolCounts: {
      "nam-phai": namPhaiFallback.length,
      "trung-chau": trungChauControl.length,
    },
    baselineFiles: [
      {
        path: "baselines/v0.3.3-nam-phai-fallback.json",
        sha256: namPhaiSha,
        observationCount: namPhaiFallback.length,
      },
      {
        path: "baselines/v0.4.1-trung-chau-control.json",
        sha256: trungChauSha,
        observationCount: trungChauControl.length,
      },
    ],
    formulaHash: sha256Object({ formula: "v0.3-ordinal-four-pillar", divisor: 4, baseScore: 50 }),
    contractHash: "see-baseline-methodology",
    knowledgeHash: "see-baseline-methodology",
    adapterPolicyHash: "see-baseline-methodology",
  };

  const manifestPath = join(BASELINES_DIR, "baseline-manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`[baseline] Manifest written → ${manifestPath}`);
  console.log(`[baseline] Nam Phái SHA256: ${namPhaiSha}`);
  console.log(`[baseline] Trung Châu SHA256: ${trungChauSha}`);
  console.log("[baseline] Done. Baselines are now frozen.");
}

try {
  run();
} catch (err) {
  console.error("[baseline] FAILED:", err);
  process.exit(1);
}
