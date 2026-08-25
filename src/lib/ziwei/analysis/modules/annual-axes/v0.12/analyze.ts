import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import {
  CONTROL_AAV08_2,
  loadAnnualAxesKnowledgeV10,
  type V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import { V08_FORMULA_VERSION } from "../../../knowledge/annual-axes/v0.8";
import {
  CONTROL_LAYERED_BALANCED,
  V12_CANDIDATE_ID,
  V12_CONTRACT_VERSION,
  V12_ENGINE_VERSION,
  V12_FORMULA_VERSION,
  V12_KNOWLEDGE_VERSION,
  getV12ProfileWeights,
  loadAnnualAxesKnowledgeV12,
  type V12ProfileId,
  type V12ReferenceMass,
} from "../../../knowledge/annual-axes/v0.12";
import { analyzeAnnualAxesNamPhaiV08 } from "../nam-phai-v08/analyze";
import { adaptMajorFortuneContext } from "../v0.10-layered/adapt-major-fortune";
import { adaptAnnualTrigger } from "../v0.10-layered/adapt-annual-trigger";
import { computeResonance } from "../v0.10-layered/resonance";
import { composeLayerNets, compositeNetToRaw } from "../v0.10-layered/compose";
import {
  normalizeWithV08Mapping,
  resolveV08Band,
} from "../v0.10-layered/normalize";
import { emptyV10Diagnostics } from "../v0.10-layered/diagnostics";
import type {
  AnnualAxesV10Result,
  V10DomainTrace,
} from "../v0.10-layered/types";
import { adaptNatalFoundationV12 } from "./adapt-natal";

export interface AnalyzeAnnualAxesV12Options {
  profileId?: V12ProfileId;
  projectionVariant?: V10ProjectionVariantId;
  referenceMass?: V12ReferenceMass;
  includeControl?: boolean;
  ablation?: {
    disableNatal?: boolean;
    disableDecade?: boolean;
    disableResonance?: boolean;
    disableAnnual?: boolean;
  };
}

/**
 * Research-only Annual Axes V0.12 candidate.
 * Production router remains V0.11 (`analyzeAnnualAxesNamPhaiCurrent`).
 */
export function analyzeAnnualAxesNamPhaiV12(
  chart: ChartData,
  options: AnalyzeAnnualAxesV12Options = {},
): AnnualAxesV10Result {
  const knowledge = loadAnnualAxesKnowledgeV10();
  const knowledge12 = loadAnnualAxesKnowledgeV12();
  const profileId: V12ProfileId =
    options.profileId ?? CONTROL_LAYERED_BALANCED;
  const projectionVariant: V10ProjectionVariantId =
    options.projectionVariant ?? "legacy";
  const referenceMass =
    options.referenceMass ?? knowledge12.selectedReferenceMass;
  const weights = getV12ProfileWeights(profileId);

  const diagnostics = emptyV10Diagnostics();
  const control = options.includeControl
    ? analyzeAnnualAxesNamPhaiV08(chart)
    : null;
  const controlScores = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((d) => [d, control?.axes[d].score ?? null]),
  ) as Record<(typeof ANNUAL_AXIS_DOMAINS)[number], number | null>;

  const natalBundle = adaptNatalFoundationV12({
    chart,
    knowledge,
    domains: ANNUAL_AXIS_DOMAINS,
    projectionVariant,
    referenceMass,
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
      finalScore = normalizeWithV08Mapping(
        compositeRaw,
        annualBundle.knowledge08,
      );
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
      profileId: profileId as never,
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
    module: "annual-axes-v0.11-domain-engine",
    status: moduleStatus,
    school: "nam-phai",
    annualYear: chart.annualYear,
    controlId: CONTROL_AAV08_2,
    candidateId: V12_CANDIDATE_ID,

    profileId: profileId as never,
    projectionVariant,
    versions: {
      contractVersion: V12_CONTRACT_VERSION,
      engineVersion: V12_ENGINE_VERSION,
      knowledgeVersion: V12_KNOWLEDGE_VERSION,
      formulaVersion: V12_FORMULA_VERSION,
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
