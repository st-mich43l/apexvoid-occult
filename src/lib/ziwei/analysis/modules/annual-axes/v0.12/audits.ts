import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import {
  ANNUAL_AXIS_DOMAINS,
  type AnnualAxisDomain,
} from "../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV10 } from "../../../knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import {
  loadAnnualAxesKnowledgeV12,
  type V12ProfileId,
  type V12ReferenceMass,
} from "../../../knowledge/annual-axes/v0.12";
import { CASE_AA10_M1998_DAN_2026 } from "../v0.10-layered/compare";
import { analyzeAnnualAxesNamPhaiV10 } from "../v0.10-layered/analyze";
import { aggregateStaticDomain } from "../domain-engine/aggregate-domain";
import { adaptNatalFoundationV12 } from "./adapt-natal";
import { analyzeAnnualAxesNamPhaiV12 } from "./analyze";
import { isSparseLayerSaturation } from "./static-signal";
import { buildResearchCorpus } from "./corpus";

export function buildCase1998Diagnostic(input?: {
  referenceMass?: V12ReferenceMass;
  profiles?: V12ProfileId[];
}) {
  const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const knowledge = loadAnnualAxesKnowledgeV10();
  const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
  const knowledge12 = loadAnnualAxesKnowledgeV12();
  const referenceMass =
    input?.referenceMass ?? knowledge12.selectedReferenceMass;
  const profiles =
    input?.profiles ??
    ([
      "CONTROL-LAYERED-BALANCED",
      "YEAR-FOCUSED",
      "MODERATE-YEAR",
    ] as V12ProfileId[]);

  const control = analyzeAnnualAxesNamPhaiV10(chart, {
    profileId: "layered-balanced",
    includeControl: true,
  });
  const natalV12 = adaptNatalFoundationV12({
    chart,
    knowledge,
    domains: ANNUAL_AXIS_DOMAINS,
    projectionVariant: "legacy",
    referenceMass,
  });

  const domains = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((domain) => {
      const agg = natalV12.byDomain[domain].aggregate;
      const c = control.axes[domain];
      const candidates = Object.fromEntries(
        profiles.map((profileId) => {
          const r = analyzeAnnualAxesNamPhaiV12(chart, {
            profileId,
            referenceMass,
          });
          return [
            profileId,
            {
              final: r.axes[domain].finalScore,
              natal: r.axes[domain].natal.signedNet,
              decade: r.axes[domain].decade.signedNet,
              annual: r.axes[domain].annual.signedNet,
              resonance: r.axes[domain].resonance.signedNet,
              compositeNet: r.axes[domain].compositeNet,
            },
          ];
        }),
      );
      return [
        domain,
        {
          mappedPalaces: agg?.mappedPalaces ?? [],
          static: {
            palaces: (agg?.palaceContexts ?? []).map((p) => ({
              palaceName: p.palaceName,
              role: p.role,
              roleWeight: p.roleWeight,
              positive: p.positivePoints,
              negative: p.negativePoints,
              evidenceMass: p.evidenceMass,
              directionalNet: p.directionalNet,
              activation: p.activation,
              dampedPalaceNet: p.palaceSignedNet,
              clampedPalaceRawUnused: p.clampedPalaceRaw,
            })),
            domainSignedNet: agg?.signedNet ?? null,
            referenceMass: agg?.referenceMass ?? referenceMass,
          },
          decade: {
            signedNet: c.decade.signedNet,
            activation: c.decade.activation,
            evidenceCount: c.decade.contributors.length,
          },
          annual: {
            signedNet: c.annual.signedNet,
            supportMass: c.annual.supportMass,
            pressureMass: c.annual.pressureMass,
          },
          resonance: {
            signedNet: c.resonance.signedNet,
            reasonCodes: c.resonance.reasonCodes,
          },
          controlV011: {
            final: c.finalScore,
            natal: c.natal.signedNet,
            decade: c.decade.signedNet,
            annual: c.annual.signedNet,
            resonance: c.resonance.signedNet,
            compositeNet: c.compositeNet,
          },
          candidates,
        },
      ];
    }),
  );

  return {
    caseId: "CASE-AA12-M1998-DAN-2026",
    birth: CASE_AA10_M1998_DAN_2026,
    knowledge08Ok: knowledge08.ok,
    registryRuleCounts: Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.map((d) => [
        d,
        {
          positive: knowledge12.staticRegistry.axes[d].positive.length,
          negative: knowledge12.staticRegistry.axes[d].negative.length,
        },
      ]),
    ),
    domains,
  };
}

export function runLayerScaleAudit() {
  const corpus = buildResearchCorpus({ natalCount: 40, years: [2026] });
  const rows: Array<Record<string, unknown>> = [];
  let sparseFlags = 0;
  let obs = 0;

  for (const birth of corpus) {
    const chart = calculateNamPhai(birth);
    const v11 = analyzeAnnualAxesNamPhaiV10(chart);
    const v12 = analyzeAnnualAxesNamPhaiV12(chart);
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      obs += 1;
      const a = v11.axes[domain];
      const b = v12.axes[domain];
      const mass = a.natal.supportMass + a.natal.pressureMass;
      const sparse = isSparseLayerSaturation({
        signedNet: a.natal.signedNet,
        evidenceMass: mass,
      });
      if (sparse) sparseFlags += 1;
      rows.push({
        domain,
        control: {
          evidenceMass: mass,
          supportMass: a.natal.supportMass,
          pressureMass: a.natal.pressureMass,
          directionalNet:
            mass > 0
              ? (a.natal.supportMass - a.natal.pressureMass) / mass
              : 0,
          activation: a.natal.activation,
          signedNet: a.natal.signedNet,
          SPARSE_LAYER_SATURATION: sparse,
        },
        candidate: {
          supportMass: b.natal.supportMass,
          pressureMass: b.natal.pressureMass,
          activation: b.natal.activation,
          signedNet: b.natal.signedNet,
        },
        decade: a.decade.signedNet,
        annual: a.annual.signedNet,
        resonance: a.resonance.signedNet,
      });
    }
  }

  return {
    observationCount: obs,
    sparseSaturationRateControl: obs === 0 ? 0 : sparseFlags / obs,
    sample: rows.slice(0, 48),
    note: "Full row dump truncated; rates computed on full corpus slice.",
  };
}

export function runYearSensitivityAudit() {
  const seeds = buildResearchCorpus({ natalCount: 24, years: [2026] });
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const deltas: Record<AnnualAxisDomain, number[]> = {
    health: [],
    family: [],
    wealth: [],
    career: [],
    social: [],
    romance: [],
  };
  const warnings: string[] = [];

  for (const seed of seeds) {
    const scoresByYear = years.map((y) => {
      const chart = calculateNamPhai({ ...seed, annualYear: String(y) });
      const r = analyzeAnnualAxesNamPhaiV12(chart);
      return {
        year: y,
        natal: Object.fromEntries(
          ANNUAL_AXIS_DOMAINS.map((d) => [d, r.axes[d].natal.signedNet]),
        ),
        final: Object.fromEntries(
          ANNUAL_AXIS_DOMAINS.map((d) => [d, r.axes[d].finalScore]),
        ),
      };
    });
    // Natal invariance
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const n0 = scoresByYear[0]!.natal[domain];
      for (const row of scoresByYear) {
        if (row.natal[domain] !== n0) {
          warnings.push(`NATAL_NOT_INVARIANT:${domain}`);
        }
      }
    }
    for (let i = 1; i < scoresByYear.length; i++) {
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        const a = scoresByYear[i - 1]!.final[domain];
        const b = scoresByYear[i]!.final[domain];
        if (a == null || b == null) continue;
        deltas[domain].push(Math.abs(b - a));
      }
    }
  }

  const summary = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((d) => {
      const arr = [...deltas[d]].sort((a, b) => a - b);
      const mean =
        arr.length === 0 ? 0 : arr.reduce((x, y) => x + y, 0) / arr.length;
      const p50 = arr[Math.floor(arr.length * 0.5)] ?? 0;
      const p90 = arr[Math.floor(arr.length * 0.9)] ?? 0;
      const max = arr[arr.length - 1] ?? 0;
      if (mean < 0.5) warnings.push(`YEAR_INERTIA:${d}`);
      if (p90 > 25) warnings.push(`YEAR_OVERREACTION:${d}`);
      return [d, { meanAbsYoY: mean, p50, p90, max }];
    }),
  );

  return { years, summary, warnings: [...new Set(warnings)].sort() };
}

export function runAblationAudit() {
  const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const base = analyzeAnnualAxesNamPhaiV12(chart);
  const modes = {
    noNatal: { disableNatal: true },
    noDecade: { disableDecade: true },
    noAnnual: { disableAnnual: true },
    noResonance: { disableResonance: true },
  } as const;

  const out = Object.fromEntries(
    Object.entries(modes).map(([name, ablation]) => {
      const r = analyzeAnnualAxesNamPhaiV12(chart, { ablation });
      const deltas = Object.fromEntries(
        ANNUAL_AXIS_DOMAINS.map((d) => {
          const a = base.axes[d].finalScore;
          const b = r.axes[d].finalScore;
          const delta =
            a == null || b == null ? null : Math.abs(a - b);
          return [d, delta];
        }),
      );
      return [name, deltas];
    }),
  );

  return { caseId: "CASE-AA12-M1998-DAN-2026", ablations: out };
}

export function runDomainCorrelationAudit() {
  const corpus = buildResearchCorpus({ natalCount: 60, years: [2026] });
  const series: Record<AnnualAxisDomain, number[]> = {
    health: [],
    family: [],
    wealth: [],
    career: [],
    social: [],
    romance: [],
  };
  const withinStd: number[] = [];

  for (const birth of corpus) {
    const chart = calculateNamPhai(birth);
    const r = analyzeAnnualAxesNamPhaiV12(chart);
    const scores: number[] = [];
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const s = r.axes[domain].finalScore;
      if (s == null) continue;
      series[domain].push(s);
      scores.push(s);
    }
    if (scores.length === 6) {
      const mean = scores.reduce((a, b) => a + b, 0) / 6;
      const v =
        scores.reduce((a, b) => a + (b - mean) ** 2, 0) / 5;
      withinStd.push(Math.sqrt(v));
    }
  }

  function corr(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    if (n < 3) return NaN;
    const ax = a.slice(0, n);
    const bx = b.slice(0, n);
    const ma = ax.reduce((x, y) => x + y, 0) / n;
    const mb = bx.reduce((x, y) => x + y, 0) / n;
    let num = 0;
    let da = 0;
    let db = 0;
    for (let i = 0; i < n; i++) {
      const xa = ax[i]! - ma;
      const xb = bx[i]! - mb;
      num += xa * xb;
      da += xa * xa;
      db += xb * xb;
    }
    const den = Math.sqrt(da * db);
    return den === 0 ? 0 : num / den;
  }

  const pairs: Record<string, number> = {};
  for (let i = 0; i < ANNUAL_AXIS_DOMAINS.length; i++) {
    for (let j = i + 1; j < ANNUAL_AXIS_DOMAINS.length; j++) {
      const a = ANNUAL_AXIS_DOMAINS[i]!;
      const b = ANNUAL_AXIS_DOMAINS[j]!;
      pairs[`${a}-${b}`] = corr(series[a], series[b]);
    }
  }

  const meanWithin =
    withinStd.length === 0
      ? 0
      : withinStd.reduce((a, b) => a + b, 0) / withinStd.length;
  const warnings: string[] = [];
  const highCorr = Object.entries(pairs).filter(([, v]) => v >= 0.85);
  if (highCorr.length >= 8 || meanWithin < 3) {
    warnings.push("DOMAIN_COLLAPSE");
  }

  return { pairs, meanWithinChartStdev: meanWithin, warnings };
}

/** Coverage audit: registry vs observed natal majors (no invented rules). */
export function runStaticCoverageAudit() {
  const knowledge12 = loadAnnualAxesKnowledgeV12();
  const knowledge = loadAnnualAxesKnowledgeV10();
  const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
  if (!knowledge08.ok) {
    return { ok: false as const, reason: "invalid-v08" };
  }
  const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const domains = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((domain) => {
      const agg = aggregateStaticDomain({
        chart,
        domain,
        knowledge,
        knowledge08: knowledge08.knowledge,
        projectionVariant: "legacy",
      });
      const registry = knowledge12.staticRegistry.axes[domain];
      const admitted = agg.evidence.filter((e) => e.adjudication === "admitted");
      const zeroEvidence = agg.palaceContexts.filter((p) =>
        p.evidence.every((e) => e.adjudication !== "admitted"),
      ).length;
      const oneEvidence = agg.palaceContexts.filter(
        (p) =>
          p.evidence.filter((e) => e.adjudication === "admitted").length === 1,
      ).length;
      return [
        domain,
        {
          registryPositive: registry.positive.length,
          registryNegative: registry.negative.length,
          admittedEvidenceCount: admitted.length,
          zeroEvidencePalaces: zeroEvidence,
          oneEvidencePalaces: oneEvidence,
          mappedPalaceCount: agg.mappedPalaces.length,
        },
      ];
    }),
  );
  const weak = ANNUAL_AXIS_DOMAINS.filter((d) => {
    const row = (domains as Record<string, { registryPositive: number; registryNegative: number }>)[d]!;
    return row.registryPositive + row.registryNegative < 4;
  });
  return {
    ok: true as const,
    domains,
    flags: weak.length
      ? ["STATIC_DOMAIN_MAJOR_STAR_COVERAGE_LOW"]
      : ([] as string[]),
  };
}
