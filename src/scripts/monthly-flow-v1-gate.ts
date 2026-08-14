import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { calculate } from "../lib/ziwei/engine-trung-chau";
import { calculate as calculateNamPhai } from "../lib/ziwei/engine-nam-phai";
import { analyzeMonthlyFlow } from "../lib/ziwei/analysis/modules/monthly-flow/analyze";
import { createMonthlyCalculationProvider } from "../lib/ziwei/analysis/modules/monthly-flow/create-monthly-calculation-provider";
import { MONTHLY_FLOW_V1_VERSION } from "../lib/ziwei/analysis/modules/monthly-flow/version";

console.log("=== APEXVOID OCCULT: MONTHLY FLOW V1 RC1 RELEASE GATE ===");

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

const moduleDir = resolve(import.meta.dirname, "../lib/ziwei/analysis/modules/monthly-flow");
const knowledgeDir = resolve(import.meta.dirname, "../lib/ziwei/analysis/knowledge/monthly-flow");
const productionSource = readFileSync(join(moduleDir, "production.ts"), "utf8");
const analyzeSource = readFileSync(join(moduleDir, "analyze.ts"), "utf8");
const aggregateSource = readFileSync(join(moduleDir, "aggregate.ts"), "utf8");

section("G0", "Stable production isolation");
assert(!productionSource.includes("./analyze"), "production does not execute the V1 candidate");
assert(!productionSource.includes("createMonthlyCalculationProvider"), "production does not double-run a shadow provider");
assert(!productionSource.includes("console.warn"), "production contains no shadow warning side effect");

section("G1", "Knowledge artifacts parse");
const jsonFiles = readdirSync(knowledgeDir).filter((file) => file.endsWith(".json"));
assert(jsonFiles.length >= 8, `found ${jsonFiles.length} Monthly Flow JSON artifacts`);
for (const file of jsonFiles) {
  const value = JSON.parse(readFileSync(join(knowledgeDir, file), "utf8"));
  assert(value !== null && typeof value === "object", `${file} parses as an object`);
}

section("G2", "Candidate version honesty");
assert(MONTHLY_FLOW_V1_VERSION.contractVersion === "1.0.0-rc.1", "contract version is 1.0.0-rc.1");
assert(MONTHLY_FLOW_V1_VERSION.engineVersion === "1.0.0-rc.1", "engine version is 1.0.0-rc.1");
assert(!analyzeSource.includes('const ENGINE_VERSION = "0.1.2"'), "V1 analyzer has no stale 0.1.2 engine literal");

section("G3", "No RC1 placeholder overall scorer");
assert(!analyzeSource.includes("dummy domain"), "no dummy-domain implementation remains");
assert(!analyzeSource.includes("placeholder"), "no placeholder implementation remains");
assert(!analyzeSource.includes('domain: "career" //'), "overall scorer has no fabricated career domain");
assert(!analyzeSource.includes('domain: "social" //'), "overall scorer has no fabricated social frame");
assert(!analyzeSource.includes("coveragePercent: 100"), "coverage is not hardcoded to 100% in analyzer");
assert(!analyzeSource.includes("confidencePercent: 100"), "confidence is not hardcoded to 100% in analyzer");

section("G4", "Confidence is outside numeric weighting");
assert(!aggregateSource.includes("confidenceWeights"), "aggregator does not multiply score by confidence");

section("G5", "Configured geometry remains explicit");
const scoringProfile = JSON.parse(
  readFileSync(join(knowledgeDir, "monthly-scoring-profile.v0.json"), "utf8"),
) as {
  frameRoleWeights: {
    annualDomain: { focus: number; opposite: number; trine: number };
    monthlyActivation: { focus: number; opposite: number; trine: number };
  };
};
assert(scoringProfile.frameRoleWeights.annualDomain.focus === 1, "annual focus weight is configured");
assert(scoringProfile.frameRoleWeights.annualDomain.opposite === 0.75, "annual opposite weight is configured");
assert(scoringProfile.frameRoleWeights.annualDomain.trine === 0.65, "annual trine weight is configured");
assert(scoringProfile.frameRoleWeights.monthlyActivation.focus === 1, "monthly focus weight is configured");
assert(scoringProfile.frameRoleWeights.monthlyActivation.opposite === 0.7, "monthly opposite weight is configured");
assert(scoringProfile.frameRoleWeights.monthlyActivation.trine === 0.6, "monthly trine weight is configured");

const birth = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};
const chartTC = calculate(birth);
const chartNP = calculateNamPhai(birth);
const providerTC = createMonthlyCalculationProvider("trung-chau");
const providerNP = createMonthlyCalculationProvider("nam-phai");
assert(providerTC !== null, "Trung Châu provider exists");
assert(providerNP !== null, "Nam Phái provider exists");
if (!providerTC || !providerNP) {
  console.error("\n❌ NO_GO");
  process.exit(1);
}

const resultTC = analyzeMonthlyFlow(chartTC, { school: "trung-chau", provider: providerTC });
const resultNP = analyzeMonthlyFlow(chartNP, { school: "nam-phai", provider: providerNP });

section("G6", "Both schools produce month-wide V1 results");
assert(resultTC.months.length === 12, `Trung Châu resolves ${resultTC.months.length} regular months`);
assert(resultNP.months.length === 12, `Nam Phái resolves ${resultNP.months.length} regular months`);
assert(resultTC.months.every((month) => month.overall.status === "available"), "Trung Châu overall scores are available");
assert(resultNP.months.every((month) => month.overall.status === "available"), "Nam Phái overall scores are available");

section("G7", "Overall scope is explicit and isolated");
for (const result of [resultTC, resultNP]) {
  for (const month of result.months) {
    if (month.overall.status !== "available") continue;
    assert(month.overall.evidence.every((item) => item.domain === "overall"), `${result.school} ${month.identity.monthKey} overall evidence uses overall scope`);
  }
}

section("G8", "Score, coverage and confidence are finite and bounded");
for (const result of [resultTC, resultNP]) {
  for (const month of result.months) {
    if (month.overall.status !== "available") continue;
    assert(Number.isFinite(month.overall.score) && month.overall.score >= 0 && month.overall.score <= 100, `${result.school} ${month.identity.monthKey} score is in [0,100]`);
    assert(Number.isFinite(month.overall.coverage.coveragePercent) && month.overall.coverage.coveragePercent >= 0 && month.overall.coverage.coveragePercent <= 100, `${result.school} ${month.identity.monthKey} coverage is in [0,100]`);
    assert(Number.isFinite(month.overall.confidence.confidencePercent) && month.overall.confidence.confidencePercent >= 0 && month.overall.confidence.confidencePercent <= 100, `${result.school} ${month.identity.monthKey} confidence is in [0,100]`);
  }
}

section("G9", "Domain overlay failure does not erase overall month score");
const npDomainUnavailable = resultNP.months.some((month) =>
  Object.values(month.domains).some((domain) => domain.status === "unavailable"),
);
assert(npDomainUnavailable, "Nam Phái fixture exercises unavailable domain overlays");
assert(resultNP.status === "partial", "Nam Phái year is partial rather than unavailable when overall scores exist");

section("G10", "Cross-school providers fail closed");
const mismatch = analyzeMonthlyFlow(chartTC, {
  school: "trung-chau",
  provider: providerNP,
});
assert(mismatch.status === "unavailable", "cross-school analysis is unavailable");
assert(mismatch.diagnostics.providerSchoolMismatch.length > 0, "cross-school mismatch is diagnosed");

section("G11", "Candidate is deterministic");
const repeatedTC = analyzeMonthlyFlow(chartTC, { school: "trung-chau", provider: providerTC });
assert(JSON.stringify(resultTC) === JSON.stringify(repeatedTC), "identical input produces byte-stable result JSON");

section("G12", "V1 analyzer is independent of legacy runtime scorers");
assert(!analyzeSource.includes("v0.2/"), "V1 analyzer does not import V0.2 runtime");
assert(!analyzeSource.includes("v0.3-production"), "V1 analyzer does not import V0.3 production runtime");
assert(!analyzeSource.includes("buildV02Result"), "V1 analyzer does not call buildV02Result");

console.log("\nRepository typecheck/test/build/dead-code remain separate CI requirements.");
if (failed) {
  console.error("\n❌ NO_GO");
  process.exit(1);
}

console.log("\n🚀 GO_SHADOW");
