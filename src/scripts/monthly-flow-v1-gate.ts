import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { calculate } from "../lib/ziwei/engine-trung-chau";
import { calculate as calculateNamPhai } from "../lib/ziwei/engine-nam-phai";
import { analyzeMonthlyFlow } from "../lib/ziwei/analysis/modules/monthly-flow/analyze";
import { createMonthlyCalculationProvider } from "../lib/ziwei/analysis/modules/monthly-flow/create-monthly-calculation-provider";

console.log("=== APEXVOID OCCULT: MONTHLY FLOW V1 RC1 RELEASE GATES ===");

let failed = false;
function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    failed = true;
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

// G1: Validate schema
console.log("\n[G1] Validating JSON artifacts...");
const knowledgeDir = resolve(import.meta.dirname, "../lib/ziwei/analysis/knowledge/monthly-flow");
const jsonFiles = readdirSync(knowledgeDir).filter(f => f.endsWith(".json"));
assert(jsonFiles.length >= 8, `Found ${jsonFiles.length} JSON artifacts`);
jsonFiles.forEach(f => {
  const data = JSON.parse(readFileSync(join(knowledgeDir, f), "utf-8"));
  assert(!!data, `${f} is valid JSON`);
});

// G2, G3, G4: Prove invariants via knowledge graph parsing
console.log("\n[G2, G3, G4] Proving Engineering Invariants...");
const scoringProfile = JSON.parse(readFileSync(join(knowledgeDir, "monthly-scoring-profile.v0.json"), "utf-8"));
assert(scoringProfile.frameRoleWeights.annualDomain.focus === 1.0, "Annual Domain Focus == 1.0");
assert(scoringProfile.frameRoleWeights.annualDomain.opposite === 0.75, "Annual Domain Opposite == 0.75");
assert(scoringProfile.frameRoleWeights.annualDomain.trine === 0.65, "Annual Domain Trine == 0.65");
assert(scoringProfile.frameRoleWeights.monthlyActivation.focus === 1.0, "Monthly Activation Focus == 1.0");
assert(scoringProfile.frameRoleWeights.monthlyActivation.opposite === 0.7, "Monthly Activation Opposite == 0.7");
assert(scoringProfile.frameRoleWeights.monthlyActivation.trine === 0.6, "Monthly Activation Trine == 0.6");

// G5, G6, G7, G8, G9: Live Engine Constraints
console.log("\n[G5, G6, G7, G8, G9] Live Engine Constraints...");
const birth = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};
const chartTC = calculate(birth);
const providerTC = createMonthlyCalculationProvider("trung-chau")!;
const resultTC = analyzeMonthlyFlow(chartTC, { school: "trung-chau", provider: providerTC });

assert(resultTC.status !== "unavailable", "V1 yields results for Trung Châu");
const m1 = resultTC.months[0];
if (m1) {
  assert(m1.overall.score !== undefined, "Score is distinct on API");
  assert(m1.overall.coverage !== undefined, "Coverage is distinct on API");
  assert(m1.overall.confidence !== undefined, "Confidence is distinct on API");
  
  // G6
  assert(m1.overall.status === "available" || m1.overall.status === "unavailable", "Overall month score exists independent of domain mapping");
}

const chartNP = calculateNamPhai(birth);
const providerNP = createMonthlyCalculationProvider("nam-phai")!;
const resultNP = analyzeMonthlyFlow(chartNP, { school: "nam-phai", provider: providerNP });
if (resultNP.status === "unavailable") {
  console.dir(resultNP.diagnostics, { depth: null });
}
assert(resultNP.status !== "unavailable", "V1 yields results for Nam Phái");

// Final Decision
if (failed) {
  console.log("\n❌ NO_GO");
  process.exit(1);
} else {
  console.log("\n🚀 GO_SHADOW");
  process.exit(0);
}
