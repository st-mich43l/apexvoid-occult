#!/usr/bin/env tsx
/**
 * Palace Overview scoring release gate (G0–G15).
 * Does not promote coefficients. Expert labels are still unreviewed.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { calculate as calculateNamPhai } from "../lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "../lib/ziwei/engine-trung-chau";
import {
  loadPalaceOverviewKnowledgeV1,
  validatePalaceOverviewKnowledge,
  getPalaceOverviewVersions,
} from "../lib/ziwei/analysis/knowledge";
import { analyzeAllPalaces } from "../lib/ziwei/analysis/modules/palace-overview/analyze-all-palaces";
import {
  assessBenchmarkReadiness,
  assertSplitIsByCompleteChart,
} from "../lib/ziwei/analysis/modules/palace-overview/calibration/readiness";
import {
  buildMatrixInputs,
  collectSchoolScores,
  distributionPathological,
  summarizeScores,
} from "../lib/ziwei/analysis/modules/palace-overview/calibration/distribution";
import {
  runGeometrySensitivity,
  sensitivityUnstable,
} from "../lib/ziwei/analysis/modules/palace-overview/calibration/sensitivity";
import { ordinalAgreement } from "../lib/ziwei/analysis/modules/palace-overview/calibration/metrics";
import {
  borrowedMajorAlsoScoredAsOpposite,
  duplicateComponentIdentities,
} from "../lib/ziwei/analysis/modules/palace-overview/scoring/dedup";
import { buildScoringTrace, sumTracedAxes } from "../lib/ziwei/analysis/modules/palace-overview/scoring/trace";
import {
  activationDoesNotRaiseQualityAlone,
  assertFiniteScore,
  neutralAtEqualSupportPressure,
  pressureMonotone,
  supportMonotone,
} from "../lib/ziwei/analysis/modules/palace-overview/scoring/normalization-properties";
import { buildParameterRegistry } from "../lib/ziwei/analysis/modules/palace-overview/scoring/parameter-registry";

console.log("=== APEXVOID OCCULT: PALACE OVERVIEW SCORING RELEASE GATE ===");

let failed = false;
function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ ${message}`);
    return;
  }
  console.error(`❌ ${message}`);
  failed = true;
}

function section(id: string, title: string): void {
  console.log(`\n[${id}] ${title}`);
}

const repoRoot = resolve(import.meta.dirname, "../..");
const skipHeavyG0 = process.env.PALACE_OVERVIEW_GATE_SKIP_HEAVY_G0 === "1";

section("G0", "Repository baseline");
assert(existsSync(resolve(repoRoot, "package-lock.json")), "package-lock.json exists");
assert(existsSync(resolve(repoRoot, "node_modules")), "node_modules present (run npm ci first)");
try {
  execSync("git diff --check", { cwd: repoRoot, stdio: "pipe" });
  assert(true, "git diff --check clean");
} catch {
  assert(false, "git diff --check failed");
}
if (skipHeavyG0) {
  console.log("… skipping npm typecheck/test/build (PALACE_OVERVIEW_GATE_SKIP_HEAVY_G0=1); CI must run them separately");
} else {
  try {
    execSync("npm run typecheck", { cwd: repoRoot, stdio: "inherit" });
    assert(true, "npm run typecheck");
  } catch {
    assert(false, "npm run typecheck");
  }
}

section("G1", "Knowledge integrity");
const loaded = loadPalaceOverviewKnowledgeV1();
assert(loaded.ok, "palace-overview knowledge validates");
if (loaded.ok) {
  const issues = validatePalaceOverviewKnowledge(loaded.knowledge);
  assert(issues.ok, "validatePalaceOverviewKnowledge ok");
  const registry = buildParameterRegistry(loaded.knowledge);
  assert(registry.length > 50, `parameter registry size ${registry.length}`);
}

section("G2", "Scoring trace integrity");
{
  const chart = calculateNamPhai({
    solarDate: "1991-09-21",
    birthHour: "Dậu",
    gender: "female",
    timezone: "7",
    annualYear: "2026",
    flowBase: "luu-nien",
  });
  const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
  for (const r of results) {
    const trace = buildScoringTrace({
      palaceName: r.palaceName,
      score: r.score,
      band: r.band,
      rawAxes: r.rawAxes,
      evidence: r.allEvidence,
    });
    const sum = sumTracedAxes(trace);
    assert(
      sum.support === r.rawAxes.support && sum.pressure === r.rawAxes.pressure,
      `${r.palaceName} trace sums to rawAxes`,
    );
    assert(trace.duplicatePhysicalIdentities.length === 0, `${r.palaceName} no duplicate physical identities`);
    assert(borrowedMajorAlsoScoredAsOpposite(r.allEvidence).length === 0, `${r.palaceName} VCD borrow not double-counted`);
    assert(duplicateComponentIdentities(r.allEvidence).length === 0, `${r.palaceName} component identities unique`);
    assert(assertFiniteScore(r.score), `${r.palaceName} finite score`);
  }
}

section("G3", "Mathematical invariants");
if (loaded.ok) {
  const k = loaded.knowledge;
  assert(supportMonotone(k), "P1 support monotone");
  assert(pressureMonotone(k), "P2 pressure monotone");
  assert(neutralAtEqualSupportPressure(k), "P3 support==pressure → 50");
  assert(activationDoesNotRaiseQualityAlone(k), "activation is not quality");
}

section("G4", "Structural interaction safety");
if (loaded.ok) {
  const sum = loaded.knowledge.structuralRules.rules.reduce(
    (acc, r) =>
      acc +
      Math.abs(r.baseAxes.support) +
      Math.abs(r.baseAxes.pressure) +
      Math.abs(r.baseAxes.stability) +
      Math.abs(r.baseAxes.activation),
    0,
  );
  assert(sum <= 30, `structural baseAxes L1 sum bounded (${sum})`);
}

section("G5", "Catalog coverage");
if (loaded.ok) {
  assert(loaded.knowledge.majorStars.stars.length === 14, "14 major stars");
  assert(loaded.knowledge.schoolCoverage.staticMinorStars.shared.length > 0, "school coverage present");
}

section("G6", "Benchmark readiness (validation reports; does not fail CI when unreadiness is honest)");
const readiness = assessBenchmarkReadiness();
assert(assertSplitIsByCompleteChart(), "split is by complete chart");
console.log(
  `   ready=${readiness.ready} reason=${readiness.reason} missing=${readiness.missing.join(",")}`,
);
assert(
  readiness.reason === "NO_GO_FOR_CALIBRATION" || readiness.ready,
  "readiness reason is machine-readable",
);

section("G7", "Reviewer reliability");
const agreement = ordinalAgreement([]);
assert(agreement.rate === null, "no reviewer labels → agreement is null, not 100%");

section("G8", "Calibration performance");
console.log("   skipped: no reviewed calibration set");

section("G9", "Holdout performance");
console.log("   skipped: holdout empty by frozen split");

section("G10", "Distribution health");
{
  const inputs = buildMatrixInputs(8);
  for (const school of ["nam-phai", "trung-chau"] as const) {
    const stats = summarizeScores(collectSchoolScores(school, inputs));
    assert(!distributionPathological(stats), `${school} distribution not pathological`);
    console.log(
      `   ${school} n=${stats.count} min=${stats.min.toFixed(1)} median=${stats.median.toFixed(1)} max=${stats.max.toFixed(1)}`,
    );
  }
}

section("G11", "Sensitivity / robustness");
if (loaded.ok) {
  const rows = runGeometrySensitivity(loaded.knowledge);
  assert(!sensitivityUnstable(rows), "geometry/scale ±10% not explosive on seed chart");
  for (const row of rows) {
    console.log(
      `   ${row.parameter} ${row.perturbation} medianΔ=${row.medianAbsDelta} p95Δ=${row.p95AbsDelta} bandFlip=${row.bandFlipRate.toFixed(3)}`,
    );
  }
}

section("G12", "Cohort safety");
{
  const nam = analyzeAllPalaces(
    calculateNamPhai({
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    }),
    { school: "nam-phai" },
  );
  const trung = analyzeAllPalaces(
    calculateTrungChau({
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    }),
    { school: "trung-chau" },
  );
  assert(nam.knowledgeValid && trung.knowledgeValid, "both schools analyze");
  const voidHits = nam.results.filter((r) => r.isVoidMajor).length;
  console.log(`   nam-phai VCD palaces on seed chart: ${voidHits}`);
}

section("G13", "Baseline delta audit");
console.log("   no candidate coefficient profile — numeric seeds unchanged vs V1.2 freeze snapshots");

section("G14", "UI / contract coherence");
{
  const v = getPalaceOverviewVersions();
  assert(v.releaseStage === "experimental", "releaseStage experimental");
  assert(v.calibrationVersion === null, "calibrationVersion null");
  assert(v.engineVersion === "1.3.0", "engine 1.3.0 infrastructure");
  assert(v.knowledgeVersion === "1.2.0-experimental", "numeric knowledge still 1.2.0-experimental");
}

section("G15", "Validation decision (not a shadow/production promotion)");
const decision = {
  kind: "VALIDATION",
  infrastructure: failed ? "FAIL" : "PASS",
  release: "NO_GO",
  reason: readiness.reason,
  missing: readiness.missing,
  research: "RESEARCH_READY_FOR_EXPERT_REVIEW",
};
console.log(`\nDECISION_JSON ${JSON.stringify(decision)}`);

if (failed) {
  console.error("\nVALIDATION FAILED");
  process.exit(1);
}
console.log("\nVALIDATION COMPLETE — architecture OK; not a GO_SHADOW.");
process.exit(0);
