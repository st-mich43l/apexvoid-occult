import type { ChartData } from "@/types/chart";
import { analyzeAnnualAxesNamPhaiV10 } from "../analyze";
import { CASE_AA10_M1998_DAN_2026 } from "../compare";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeRomanceSemanticV01 } from "./analyze";
import type { RomanceCaseDiagnosticReport } from "./types";

export function buildRomanceCase1998Diagnostic(
  chart?: ChartData,
): RomanceCaseDiagnosticReport {
  const resolved =
    chart ??
    calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const v10 = analyzeAnnualAxesNamPhaiV10(resolved, {
    profileId: "layered-balanced",
    includeControl: true,
  });
  const semantic = analyzeRomanceSemanticV01({ chart: resolved });

  return {
    caseId: "CASE-AA10-M1998-DAN-2026",
    annualYear: v10.annualYear,
    v10Romance: {
      finalScore: v10.axes.romance.finalScore,
      natal: v10.axes.romance.natal.signedNet,
      decade: v10.axes.romance.decade.signedNet,
      annual: v10.axes.romance.annual.signedNet,
      resonance: v10.axes.romance.resonance.signedNet,
      controlScore: v10.controlScores.romance,
    },
    romanceSemanticV01: semantic,
    note:
      "Diagnostic / explainability only. Semantic findings must not be treated as a target for V0.10 romance score direction.",
  };
}

export function renderRomanceCaseMarkdown(
  report: RomanceCaseDiagnosticReport,
): string {
  const lines: string[] = [];
  lines.push(`# Romance Semantic V0.1 — ${report.caseId}`);
  lines.push("");
  lines.push(`Annual year: ${report.annualYear}`);
  lines.push("");
  lines.push("## Current V0.10 romance (frozen numeric path)");
  lines.push("");
  lines.push("| layer | value |");
  lines.push("| --- | --- |");
  lines.push(`| control | ${report.v10Romance.controlScore} |`);
  lines.push(`| finalScore | ${report.v10Romance.finalScore} |`);
  lines.push(`| natal | ${report.v10Romance.natal} |`);
  lines.push(`| decade | ${report.v10Romance.decade} |`);
  lines.push(`| annual | ${report.v10Romance.annual} |`);
  lines.push(`| resonance | ${report.v10Romance.resonance} |`);
  lines.push("");
  lines.push("## Romance Semantic V0.1 (NON_NUMERIC)");
  lines.push("");
  lines.push(`- model: \`${report.romanceSemanticV01.model}\``);
  lines.push(`- numericAuthority: \`${report.romanceSemanticV01.numericAuthority}\``);
  lines.push(`- scoreImpactAllowed: \`${report.romanceSemanticV01.scoreImpactAllowed}\``);
  lines.push(`- status: \`${report.romanceSemanticV01.status}\``);
  lines.push(`- researchDecision: \`${report.romanceSemanticV01.researchDecision}\``);
  lines.push(`- warnings: ${report.romanceSemanticV01.warnings.join(", ") || "none"}`);
  lines.push("");
  lines.push("### Palace baselines");
  lines.push("");
  for (const p of report.romanceSemanticV01.palaceBaselines) {
    lines.push(`#### ${p.palace}`);
    lines.push(
      `- majors: ${p.majorStars.map((m) => `${m.name}${m.brightness ? `(${m.brightness})` : ""}`).join(", ") || "—"}`,
    );
    lines.push(
      `- rawAxes: support=${p.rawAxes.support.toFixed(3)} pressure=${p.rawAxes.pressure.toFixed(3)} stability=${p.rawAxes.stability.toFixed(3)} activation=${p.rawAxes.activation.toFixed(3)}`,
    );
    lines.push(`- structureNet: ${p.structureNet}`);
    lines.push(`- doctrineClaimCount (palace catalog): ${p.doctrineClaimCount}`);
    lines.push(`- admitted: ${p.admittedClaimIds.join(", ") || "—"}`);
    lines.push(`- unresolved: ${p.unresolvedClaimIds.join(", ") || "—"}`);
    lines.push(`- conflicts: ${p.conflictIds.join(", ") || "—"}`);
    lines.push(`- annotations (non-scoring): ${p.annotationCount}`);
    lines.push(`- palaceDomainCandidates (numericDelta=null): ${p.palaceDomainCandidateCount}`);
    lines.push("");
  }
  lines.push("### Signals");
  lines.push(`- support: ${report.romanceSemanticV01.supportSignals.join(", ") || "—"}`);
  lines.push(`- pressure: ${report.romanceSemanticV01.pressureSignals.join(", ") || "—"}`);
  lines.push(`- mixed: ${report.romanceSemanticV01.mixedSignals.join(", ") || "—"}`);
  lines.push(`- unresolved: ${report.romanceSemanticV01.unresolvedSignals.join(", ") || "—"}`);
  lines.push("");
  lines.push(`> ${report.note}`);
  lines.push("");
  return lines.join("\n");
}
