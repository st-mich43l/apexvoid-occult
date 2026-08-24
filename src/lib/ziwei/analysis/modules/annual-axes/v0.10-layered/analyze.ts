import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import {
  CONTROL_AAV08_2,
  V10_CONTRACT_VERSION,
  V10_ENGINE_VERSION,
  V10_FORMULA_VERSION,
  loadAnnualAxesKnowledgeV10,
  type V10ProfileId,
  type V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import { V08_FORMULA_VERSION } from "../../../knowledge/annual-axes/v0.8";
import { analyzeAnnualAxesNamPhaiV08 } from "../nam-phai-v08/analyze";
import { adaptNatalFoundation } from "./adapt-natal-foundation";
import { adaptMajorFortuneContext } from "./adapt-major-fortune";
import { adaptAnnualTrigger } from "./adapt-annual-trigger";
import { computeResonance } from "./resonance";
import { composeLayerNets, compositeNetToRaw } from "./compose";
import { normalizeWithV08Mapping, resolveV08Band } from "./normalize";
import { emptyV10Diagnostics } from "./diagnostics";
import { assertProfileWeightsSumToOne, getProfileWeights } from "./profiles";
import type {
  AnalyzeAnnualAxesV10Options,
  AnnualAxesV10Result,
  V10DomainTrace,
} from "./types";

/**
 * Nam Phái Annual Axes V0.10 layered fortune engine.
 *
 * The released router consumes layered-balanced + legacy projection. Frozen
 * V0.8 control execution is opt-in and exists only for research comparison.
 */
export function analyzeAnnualAxesNamPhaiV10(
  chart: ChartData,
  options: AnalyzeAnnualAxesV10Options = {},
): AnnualAxesV10Result {
  const knowledge = loadAnnualAxesKnowledgeV10();
  const profileId: V10ProfileId = options.profileId ?? "layered-balanced";
  const projectionVariant: V10ProjectionVariantId =
    options.projectionVariant ?? "legacy";
  const weights = getProfileWeights(profileId);
  assertProfileWeightsSumToOne(weights);

  const diagnostics = emptyV10Diagnostics();
  const control = options.includeControl ? analyzeAnnualAxesNamPhaiV08(chart) : null;
  const controlScores = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((d) => [d, control?.axes[d].score ?? null]),
  ) as Record<(typeof ANNUAL_AXIS_DOMAINS)[number], number | null>;

  const natalBundle = adaptNatalFoundation({
    chart,
    knowledge,
    domains: ANNUAL_AXIS_DOMAINS,
    projectionVariant,
  });
  const decadeByDomain = adaptMajorFortuneContext({
    chart,
    knowledge,
    domains: ANNUAL_AXIS_DOMAINS,
    projectionVariant,
  });
  const annualBundle = adaptAnnualTrigger({
    chart,
    domains: ANNUAL_AXIS_DOMAINS,
  });

  const axes = {} as AnnualAxesV10Result["axes"];

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const natal = natalBundle.byDomain[domain].signal;
    const decade = decadeByDomain[domain];
    const annual = annualBundle.byDomain[domain];
    const projection = natalBundle.byDomain[domain].projection;

    if (natal.availability === "unavailable") {
      diagnostics.missingNatal.push(`${domain}:missing-natal-foundation`);
    }
    if (decade.availability === "unavailable") {
      diagnostics.missingDecade.push(`${domain}:missing-major-fortune`);
    }
    if (annual.availability === "unavailable") {
      diagnostics.missingAnnual.push(`${domain}:missing-annual-trigger`);
    }

    const resonance = options.ablation?.disableResonance
      ? {
          ...annual,
          layer: "resonance" as const,
          signedNet: 0,
          supportMass: 0,
          pressureMass: 0,
          availability: "unavailable" as const,
          contributors: [],
          reasonCodes: ["ablation-disabled-resonance"],
        }
      : computeResonance({
          domain,
          natal: options.ablation?.disableNatal
            ? { ...natal, signedNet: 0, availability: "unavailable" }
            : natal,
          decade: options.ablation?.disableDecade
            ? { ...decade, signedNet: 0, availability: "unavailable" }
            : decade,
          annual,
          config: knowledge.resonance,
        });

    const reasonCodes: string[] = [];
    let status: V10DomainTrace["status"] = "available";
    let finalScore: number | null = null;
    let band: string | null = null;
    let compositeNet = 0;
    let compositeRaw = 0;
    let effectiveWeights = weights;

    if (natal.availability === "unavailable") {
      status = "unavailable";
      reasonCodes.push("natal-foundation-required");
    } else if (annual.availability === "unavailable") {
      status = "unavailable";
      reasonCodes.push("annual-trigger-required");
    } else if (!annualBundle.knowledge08) {
      status = "unavailable";
      reasonCodes.push("invalid-v08-knowledge");
    } else {
      const composed = composeLayerNets({
        natal: options.ablation?.disableNatal
          ? { ...natal, signedNet: 0, availability: "unavailable" }
          : natal,
        decade: options.ablation?.disableDecade
          ? { ...decade, signedNet: 0, availability: "unavailable" }
          : decade,
        annual,
        resonance,
        weights,
        ablation: options.ablation,
      });
      compositeNet = composed.compositeNet;
      effectiveWeights = composed.effectiveWeights;
      compositeRaw = compositeNetToRaw(compositeNet, annualBundle.knowledge08);
      finalScore = normalizeWithV08Mapping(compositeRaw, annualBundle.knowledge08);
      band = resolveV08Band(finalScore, annualBundle.knowledge08);

      if (
        natal.availability === "partial" ||
        decade.availability === "partial" ||
        annual.availability === "partial" ||
        decade.availability === "unavailable"
      ) {
        status = "partial";
        if (decade.availability === "unavailable") {
          reasonCodes.push("missing-major-fortune");
        }
      }
    }

    axes[domain] = {
      domain,
      natal: options.ablation?.disableNatal
        ? { ...natal, signedNet: 0, reasonCodes: [...natal.reasonCodes, "ablation-disabled-natal"] }
        : natal,
      decade: options.ablation?.disableDecade
        ? {
            ...decade,
            signedNet: 0,
            reasonCodes: [...decade.reasonCodes, "ablation-disabled-decade"],
          }
        : decade,
      annual,
      resonance,
      profileId,
      profileWeights: effectiveWeights,
      projectionVariant,
      domainProjection: projection,
      compositeNet,
      compositeRaw,
      finalScore,
      band,
      status,
      reasonCodes: [...reasonCodes, ...natal.reasonCodes, ...annual.reasonCodes]
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .sort((a, b) => a.localeCompare(b)),
    };
  }

  const statuses = ANNUAL_AXIS_DOMAINS.map((d) => axes[d].status);
  const moduleStatus = statuses.every((s) => s === "available")
    ? "available"
    : statuses.every((s) => s === "unavailable")
      ? "unavailable"
      : "partial";

  return {
    module: "annual-axes-v0.10-layered",
    status: moduleStatus,
    school: "nam-phai",
    annualYear: chart.annualYear,
    controlId: CONTROL_AAV08_2,
    candidateId: knowledge.candidateId,
    profileId,
    projectionVariant,
    versions: {
      contractVersion: V10_CONTRACT_VERSION,
      engineVersion: V10_ENGINE_VERSION,
      knowledgeVersion: knowledge.knowledgeVersion,
      formulaVersion: V10_FORMULA_VERSION,
      controlEngineVersion: control?.versions.engineVersion ?? "not-run",
      controlKnowledgeVersion: control?.versions.knowledgeVersion ?? "not-run",
      controlFormulaVersion: control ? V08_FORMULA_VERSION : "not-run",
    },
    axes,
    controlScores,
    diagnostics,
    releaseStage: "experimental",
    calibrated: false,
  };
}
