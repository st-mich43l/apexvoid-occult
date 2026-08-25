import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import {
  CONTROL_AAV08_2,
  loadAnnualAxesKnowledgeV10,
  type V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import { V08_FORMULA_VERSION } from "../../../knowledge/annual-axes/v0.8";
import {
  V13_CANDIDATE_ID,
  V13_CONTRACT_VERSION,
  V13_ENGINE_VERSION,
  V13_FORMULA_VERSION,
  V13_KNOWLEDGE_VERSION,
  loadAnnualAxesKnowledgeV13,
} from "../../../knowledge/annual-axes/v0.13";
import { analyzeAnnualAxesNamPhaiV08 } from "../nam-phai-v08/analyze";
import { adaptMajorFortuneContext } from "../v0.10-layered/adapt-major-fortune";
import { adaptAnnualTrigger } from "../v0.10-layered/adapt-annual-trigger";
import { composeLayerNets, compositeNetToRaw } from "../v0.10-layered/compose";
import { emptyV10Diagnostics } from "../v0.10-layered/diagnostics";
import {
  normalizeWithV08Mapping,
  resolveV08Band,
} from "../v0.10-layered/normalize";
import { computeResonance } from "../v0.10-layered/resonance";
import type {
  AnnualAxesV10Result,
  V10DomainTrace,
} from "../v0.10-layered/types";
import { adaptNatalFoundationV13 } from "./adapt-natal";

export interface AnalyzeAnnualAxesV13Options {
  projectionVariant?: V10ProjectionVariantId;
  includeControl?: boolean;
  ablation?: {
    disableNatal?: boolean;
    disableDecade?: boolean;
    disableResonance?: boolean;
    disableAnnual?: boolean;
  };
}

/**
 * Research-only Annual Axes V0.13 candidate.
 * Production router remains V0.11. V0.13 changes only the static natal-domain
 * evidence coverage by adding a verified-primary doctrine fallback.
 */
export function analyzeAnnualAxesNamPhaiV13(
  chart: ChartData,
  options: AnalyzeAnnualAxesV13Options = {},
): AnnualAxesV10Result {
  const knowledge = loadAnnualAxesKnowledgeV10();
  const knowledge13 = loadAnnualAxesKnowledgeV13();
  const projectionVariant: V10ProjectionVariantId =
    options.projectionVariant ?? "legacy";
  const weights = knowledge13.profile.layerProfile.weights;
  const diagnostics = emptyV10Diagnostics();
  const control = options.includeControl
    ? analyzeAnnualAxesNamPhaiV08(chart)
    : null;
  const controlScores = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((domain) => [domain, control?.axes[domain].score ?? null]),
  ) as Record<(typeof ANNUAL_AXIS_DOMAINS)[number], number | null>;

  const natalBundle = adaptNatalFoundationV13({
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
  const ablation = options.ablation ?? {};

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const natal = natalBundle.byDomain[domain].signal;
    const decade = decadeByDomain[domain];
    let annual = annualBundle.byDomain[domain];
    const projection = natalBundle.byDomain[domain].projection;

    if (ablation.disableAnnual) {
      annual = {
        ...annual,
        signedNet: 0,
        supportMass: 0,
        pressureMass: 0,
        availability: "unavailable",
        reasonCodes: [...annual.reasonCodes, "ablation-disabled-annual"],
      };
    }

    if (natal.availability === "unavailable") {
      diagnostics.missingNatal.push(`${domain}:missing-natal-foundation`);
    }
    if (decade.availability === "unavailable") {
      diagnostics.missingDecade.push(`${domain}:missing-major-fortune`);
    }
    if (annual.availability === "unavailable") {
      diagnostics.missingAnnual.push(`${domain}:missing-annual-trigger`);
    }

    const resonance = ablation.disableResonance
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
          natal: ablation.disableNatal
            ? { ...natal, signedNet: 0, availability: "unavailable" }
            : natal,
          decade: ablation.disableDecade
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
    } else if (annual.availability === "unavailable" && !ablation.disableAnnual) {
      status = "unavailable";
      reasonCodes.push("annual-trigger-required");
    } else if (!annualBundle.knowledge08) {
      status = "unavailable";
      reasonCodes.push("invalid-v08-knowledge");
    } else {
      const composed = composeLayerNets({
        natal: ablation.disableNatal
          ? { ...natal, signedNet: 0, availability: "unavailable" }
          : natal,
        decade: ablation.disableDecade
          ? { ...decade, signedNet: 0, availability: "unavailable" }
          : decade,
        annual,
        resonance,
        weights,
        ablation: {
          disableNatal: ablation.disableNatal,
          disableDecade: ablation.disableDecade,
          disableResonance: ablation.disableResonance,
        },
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
      }
    }

    axes[domain] = {
      domain,
      natal: ablation.disableNatal
        ? {
            ...natal,
            signedNet: 0,
            reasonCodes: [...natal.reasonCodes, "ablation-disabled-natal"],
          }
        : natal,
      decade: ablation.disableDecade
        ? {
            ...decade,
            signedNet: 0,
            reasonCodes: [...decade.reasonCodes, "ablation-disabled-decade"],
          }
        : decade,
      annual,
      resonance,
      profileId: "layered-balanced" as never,
      profileWeights: effectiveWeights,
      projectionVariant,
      domainProjection: projection,
      compositeNet,
      compositeRaw,
      finalScore,
      band,
      status,
      reasonCodes: [...reasonCodes, ...natal.reasonCodes, ...annual.reasonCodes]
        .filter((value, index, values) => values.indexOf(value) === index)
        .sort((a, b) => a.localeCompare(b)),
    };
  }

  const statuses = ANNUAL_AXIS_DOMAINS.map((domain) => axes[domain].status);
  const moduleStatus = statuses.every((status) => status === "available")
    ? "available"
    : statuses.every((status) => status === "unavailable")
      ? "unavailable"
      : "partial";

  return {
    module: "annual-axes-v0.13-doctrine-coverage",
    status: moduleStatus,
    school: "nam-phai",
    annualYear: chart.annualYear,
    controlId: CONTROL_AAV08_2,
    candidateId: V13_CANDIDATE_ID,
    profileId: "layered-balanced" as never,
    projectionVariant,
    versions: {
      contractVersion: V13_CONTRACT_VERSION,
      engineVersion: V13_ENGINE_VERSION,
      knowledgeVersion: V13_KNOWLEDGE_VERSION,
      formulaVersion: V13_FORMULA_VERSION,
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
