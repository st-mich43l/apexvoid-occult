import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesDiagnostics,
  AnnualAxisBand,
} from "../types";
import { emptyAnnualAxesDiagnostics } from "../types";
import type {
  AnnualAxesResult,
  AnnualAxisLayerV10,
  AnnualAxisNamPhaiV10Result,
  AnnualAxisTraceV10,
} from "../released-types";
import { analyzeAnnualAxesNamPhaiV10 } from "./analyze";
import type { V10DomainTrace } from "./types";

function resolveBand(band: string | null): AnnualAxisBand | null {
  if (
    band === "guarded" ||
    band === "balanced" ||
    band === "supportive" ||
    band === "strong"
  ) {
    return band;
  }
  return null;
}

function layerView(layer: V10DomainTrace["natal"]): AnnualAxisLayerV10 {
  return {
    signedNet: layer.signedNet,
    supportMass: layer.supportMass,
    pressureMass: layer.pressureMass,
    activation: layer.activation,
    coverage: layer.coverage,
    availability: layer.availability,
  };
}

function traceView(axis: V10DomainTrace): AnnualAxisTraceV10 {
  return {
    profileId: axis.profileId,
    projectionVariant: axis.projectionVariant,
    profileWeights: axis.profileWeights,
    natal: layerView(axis.natal),
    decade: layerView(axis.decade),
    annual: layerView(axis.annual),
    resonance: layerView(axis.resonance),
    compositeNet: axis.compositeNet,
    compositeRaw: axis.compositeRaw,
  };
}

function adaptAxis(axis: V10DomainTrace): AnnualAxisNamPhaiV10Result {
  const band = resolveBand(axis.band);
  const v10Trace = traceView(axis);

  if (axis.status === "unavailable" || axis.finalScore == null || band == null) {
    return {
      domain: axis.domain,
      engine: "v0.10",
      status: "unavailable",
      score: null,
      band: null,
      reasonCodes:
        axis.finalScore != null && band == null
          ? [...axis.reasonCodes, "invalid-v0.10-band"]
          : axis.reasonCodes,
      v10Trace,
    };
  }

  return {
    domain: axis.domain,
    engine: "v0.10",
    status: axis.status === "partial" ? "partial-data" : "available",
    score: axis.finalScore,
    band,
    reasonCodes: axis.reasonCodes,
    v10Trace,
  };
}

function adaptDiagnostics(
  source: ReturnType<typeof analyzeAnnualAxesNamPhaiV10>["diagnostics"],
): AnnualAxesDiagnostics {
  const diagnostics = emptyAnnualAxesDiagnostics();
  diagnostics.missingRequiredAnnualFacts.push(
    ...source.missingNatal,
    ...source.missingDecade,
    ...source.missingAnnual,
  );
  diagnostics.forbiddenSchoolMarkers.push(...source.forbiddenMonthly);
  return diagnostics;
}

/**
 * Runtime adapter for the released Nam Phái V0.10 layered engine.
 *
 * V0.8 is retained only where the V0.10 research/control tooling still needs
 * its annual-trigger baseline. It is no longer a public Nam Phái runtime.
 */
export function analyzeAnnualAxesNamPhaiCurrent(chart: ChartData): AnnualAxesResult {
  const result = analyzeAnnualAxesNamPhaiV10(chart, {
    profileId: "layered-balanced",
    projectionVariant: "legacy",
  });

  const axes = {} as Record<AnnualAxisDomain, AnnualAxisNamPhaiV10Result>;
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    axes[domain] = adaptAxis(result.axes[domain]);
  }

  const supportsDomainScoring = ANNUAL_AXIS_DOMAINS.some(
    (domain) => axes[domain].status !== "unavailable",
  );

  return {
    module: "annual-axes",
    annualYear: result.annualYear,
    school: "nam-phai",
    versions: {
      contractVersion: result.versions.contractVersion,
      engineVersion: result.versions.engineVersion,
      knowledgeVersion: result.versions.knowledgeVersion,
    },
    status:
      result.status === "available"
        ? "available"
        : result.status === "partial"
          ? "partial"
          : "unavailable",
    axes,
    diagnostics: adaptDiagnostics(result.diagnostics),
    capabilities: {
      supportsDomainScoring,
      supportsAnnualFocus: false,
      domainAnchorCoordinate: "natal-palace-name",
      domainAnchorProvenance: "nam-phai-v0.10-layered-domain-projection",
      primaryAnnualFocus: "annual-major-fortune",
    },
    annualFocus: null,
  };
}
