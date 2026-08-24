import type { BirthInput } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import { analyzeAnnualAxesNamPhaiV10 } from "./analyze";
import { evaluateCaseAa10Hypotheses } from "./hypothesis";
import { V10_PROFILE_IDS } from "./profiles";
import type { V10ProjectionVariantId } from "../../../knowledge/annual-axes/v0.10";
import type { AnnualAxesV10Result } from "./types";

/** Research regression case — qualitative hypothesis, not calibration truth. */
export const CASE_AA10_M1998_DAN_2026: BirthInput = {
  solarDate: "1998-10-01",
  birthHour: "Dần",
  gender: "male",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

export interface V10ComparisonRow {
  profileId: string;
  projectionVariant: V10ProjectionVariantId;
  ablation?: string;
  domain: string;
  controlScore: number | null;
  candidateScore: number | null;
  delta: number | null;
  natalNet: number;
  decadeNet: number;
  annualNet: number;
  resonanceNet: number;
  compositeRaw: number;
  band: string | null;
}

export function compareProfilesForChart(
  input: BirthInput,
  variants: V10ProjectionVariantId[] = ["legacy"],
): {
  controlId: string;
  rows: V10ComparisonRow[];
  results: AnnualAxesV10Result[];
  hypothesis?: ReturnType<typeof evaluateCaseAa10Hypotheses>;
} {
  const chart = calculateNamPhai(input);
  const rows: V10ComparisonRow[] = [];
  const results: AnnualAxesV10Result[] = [];

  for (const projectionVariant of variants) {
    for (const profileId of V10_PROFILE_IDS) {
      const result = analyzeAnnualAxesNamPhaiV10(chart, {
        profileId,
        projectionVariant,
        includeControl: true,
      });
      results.push(result);
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        const axis = result.axes[domain];
        const controlScore = result.controlScores[domain];
        rows.push({
          profileId,
          projectionVariant,
          domain,
          controlScore,
          candidateScore: axis.finalScore,
          delta:
            controlScore != null && axis.finalScore != null
              ? axis.finalScore - controlScore
              : null,
          natalNet: axis.natal.signedNet,
          decadeNet: axis.decade.signedNet,
          annualNet: axis.annual.signedNet,
          resonanceNet: axis.resonance.signedNet,
          compositeRaw: axis.compositeRaw,
          band: axis.band,
        });
      }
    }
  }

  // Ablations on balanced + legacy. Control is explicitly research-only.
  const ablations: Array<{ name: string; opts: Parameters<typeof analyzeAnnualAxesNamPhaiV10>[1] }> = [
    {
      name: "no-natal",
      opts: {
        profileId: "layered-balanced",
        ablation: { disableNatal: true },
        includeControl: true,
      },
    },
    {
      name: "no-decade",
      opts: {
        profileId: "layered-balanced",
        ablation: { disableDecade: true },
        includeControl: true,
      },
    },
    {
      name: "no-resonance",
      opts: {
        profileId: "layered-balanced",
        ablation: { disableResonance: true },
        includeControl: true,
      },
    },
  ];
  for (const abl of ablations) {
    const result = analyzeAnnualAxesNamPhaiV10(chart, abl.opts);
    results.push(result);
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = result.axes[domain];
      const controlScore = result.controlScores[domain];
      rows.push({
        profileId: "layered-balanced",
        projectionVariant: "legacy",
        ablation: abl.name,
        domain,
        controlScore,
        candidateScore: axis.finalScore,
        delta:
          controlScore != null && axis.finalScore != null
            ? axis.finalScore - controlScore
            : null,
        natalNet: axis.natal.signedNet,
        decadeNet: axis.decade.signedNet,
        annualNet: axis.annual.signedNet,
        resonanceNet: axis.resonance.signedNet,
        compositeRaw: axis.compositeRaw,
        band: axis.band,
      });
    }
  }

  const balanced = results.find(
    (r) => r.profileId === "layered-balanced" && r.projectionVariant === "legacy",
  );

  return {
    controlId: "CONTROL-AAV08-2",
    rows,
    results,
    hypothesis: balanced ? evaluateCaseAa10Hypotheses(balanced) : undefined,
  };
}

export function renderComparisonMarkdown(comparison: ReturnType<typeof compareProfilesForChart>): string {
  const lines: string[] = [
    "# Annual Axes V0.10 comparison",
    "",
    `Control: ${comparison.controlId}`,
    "",
    "| profile | variant | ablation | domain | control | candidate | Δ | natal | decade | annual | resonance |",
    "|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const row of comparison.rows) {
    lines.push(
      `| ${row.profileId} | ${row.projectionVariant} | ${row.ablation ?? "-"} | ${row.domain} | ${fmt(row.controlScore)} | ${fmt(row.candidateScore)} | ${fmt(row.delta)} | ${row.natalNet.toFixed(3)} | ${row.decadeNet.toFixed(3)} | ${row.annualNet.toFixed(3)} | ${row.resonanceNet.toFixed(3)} |`,
    );
  }
  if (comparison.hypothesis) {
    lines.push("", "## 1998/2026 hypothesis", "");
    lines.push(
      `- career: **${comparison.hypothesis.careerHypothesis.status}**`,
      ...comparison.hypothesis.careerHypothesis.reasons.map((r) => `  - ${r}`),
      `- romance: **${comparison.hypothesis.romanceHypothesis.status}**`,
      ...comparison.hypothesis.romanceHypothesis.reasons.map((r) => `  - ${r}`),
    );
  }
  lines.push("");
  return lines.join("\n");
}

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(1);
}
