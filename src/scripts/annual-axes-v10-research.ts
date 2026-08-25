/**
 * Annual Axes V0.10 research CLI.
 *
 *   npm run research:annual-axes-v10:validate
 *   npm run research:annual-axes-v10:compare
 *   npm run research:annual-axes-v10:audit
 *   npm run research:annual-axes-v10:romance-case
 *   npm run research:annual-axes-v10:romance-audit
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAnnualAxesNamPhaiV08 } from "@/lib/ziwei/analysis/modules/annual-axes/nam-phai-v08/analyze";
import {
  CASE_AA10_M1998_DAN_2026,
  analyzeAnnualAxesNamPhaiV10,
  compareProfilesForChart,
  renderComparisonMarkdown,
  runFastAudit,
  listProfiles,
  getProfileWeights,
  evaluateCaseAa10Hypotheses,
  buildRomanceCase1998Diagnostic,
  renderRomanceCaseMarkdown,
  runRomanceSemanticCorpusAudit,
  renderRomanceCorpusMarkdown,
} from "@/lib/ziwei/analysis/modules/annual-axes/v0.10-layered";
import { ANNUAL_AXIS_DOMAINS } from "@/lib/ziwei/analysis/contracts/annual-axes";
import { V10_PROFILE_IDS } from "@/lib/ziwei/analysis/modules/annual-axes/v0.10-layered/profiles";

const ARTIFACT_DIR = join(process.cwd(), ".research-artifacts/annual-axes-v10");
const ROMANCE_ARTIFACT_DIR = join(ARTIFACT_DIR, "romance-semantic");

function cmd(): string {
  return process.argv[2] ?? "validate";
}

function validate(): void {
  for (const id of V10_PROFILE_IDS) {
    const w = getProfileWeights(id);
    const sum =
      w.natalFoundation + w.majorFortune + w.annualTrigger + w.resonance;
    if (Math.abs(sum - 1) > 1e-9) {
      throw new Error(`profile ${id} weights sum to ${sum}`);
    }
  }
  const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const control = analyzeAnnualAxesNamPhaiV08(chart);
  const candidate = analyzeAnnualAxesNamPhaiV10(chart, {
    profileId: "layered-balanced",
    includeControl: true,
  });
  if (control.versions.engineVersion !== "0.8.2") {
    throw new Error(`control engine ${control.versions.engineVersion}`);
  }
  if (candidate.versions.controlEngineVersion !== "0.8.2") {
    throw new Error("candidate must cite control 0.8.2");
  }
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    if (candidate.controlScores[domain] !== control.axes[domain].score) {
      throw new Error(`control score mismatch on ${domain}`);
    }
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        profiles: listProfiles().map((p) => p.id),
        controlEngine: control.versions.engineVersion,
        candidate: candidate.candidateId,
        hypothesis: evaluateCaseAa10Hypotheses(candidate),
        caseCareer: {
          control: candidate.controlScores.career,
          balanced: candidate.axes.career.finalScore,
          natal: candidate.axes.career.natal.signedNet,
          decade: candidate.axes.career.decade.signedNet,
          annual: candidate.axes.career.annual.signedNet,
          resonance: candidate.axes.career.resonance.signedNet,
        },
        caseRomance: {
          control: candidate.controlScores.romance,
          balanced: candidate.axes.romance.finalScore,
          natal: candidate.axes.romance.natal.signedNet,
          decade: candidate.axes.romance.decade.signedNet,
          annual: candidate.axes.romance.annual.signedNet,
          resonance: candidate.axes.romance.resonance.signedNet,
        },
      },
      null,
      2,
    ),
  );
}

function compare(): void {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const comparison = compareProfilesForChart(CASE_AA10_M1998_DAN_2026, [
    "legacy",
    "romance-expanded",
  ]);
  const md = renderComparisonMarkdown(comparison);
  writeFileSync(join(ARTIFACT_DIR, "comparison.json"), JSON.stringify(comparison, null, 2));
  writeFileSync(join(ARTIFACT_DIR, "comparison.md"), md);
  console.log(md);
  console.log(`Wrote ${ARTIFACT_DIR}/comparison.{json,md}`);
}

function audit(): void {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const reports = V10_PROFILE_IDS.map((profileId) =>
    runFastAudit({ profileId, corpusSize: 24 }),
  );
  writeFileSync(join(ARTIFACT_DIR, "audit.json"), JSON.stringify(reports, null, 2));
  for (const r of reports) {
    console.log(
      `${r.profileId}: mean|Δ|=${r.materiality.meanAbsDelta.toFixed(2)} max|Δ|=${r.materiality.maxAbsDelta.toFixed(2)} flag=${r.materiality.flag} warnings=${r.warnings.join(",") || "none"}`,
    );
  }
  console.log(`Wrote ${ARTIFACT_DIR}/audit.json`);
}

function romanceCase(): void {
  mkdirSync(ROMANCE_ARTIFACT_DIR, { recursive: true });
  const report = buildRomanceCase1998Diagnostic();
  const md = renderRomanceCaseMarkdown(report);
  writeFileSync(
    join(ROMANCE_ARTIFACT_DIR, "case-1998-2026.json"),
    JSON.stringify(report, null, 2),
  );
  writeFileSync(join(ROMANCE_ARTIFACT_DIR, "case-1998-2026.md"), md);
  console.log(md);
  console.log(`Wrote ${ROMANCE_ARTIFACT_DIR}/case-1998-2026.{json,md}`);
}

function romanceAudit(): void {
  mkdirSync(ROMANCE_ARTIFACT_DIR, { recursive: true });
  const report = runRomanceSemanticCorpusAudit({ corpusSize: 24 });
  const md = renderRomanceCorpusMarkdown(report);
  writeFileSync(join(ROMANCE_ARTIFACT_DIR, "corpus.json"), JSON.stringify(report, null, 2));
  writeFileSync(join(ROMANCE_ARTIFACT_DIR, "audit.md"), md);
  console.log(md);
  console.log(`Wrote ${ROMANCE_ARTIFACT_DIR}/corpus.json and audit.md`);
}

const c = cmd();
if (c === "validate") validate();
else if (c === "compare") compare();
else if (c === "audit") audit();
else if (c === "romance-case") romanceCase();
else if (c === "romance-audit") romanceAudit();
else {
  console.error(`Unknown command: ${c}`);
  process.exit(1);
}
