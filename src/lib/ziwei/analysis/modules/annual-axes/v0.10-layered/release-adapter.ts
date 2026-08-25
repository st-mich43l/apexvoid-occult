import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesDiagnostics,
  AnnualAxisBand,
  AnnualFocusSummary,
} from "../types";
import { emptyAnnualAxesDiagnostics } from "../types";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { resolveAnnualFocus } from "../resolvers/resolve-annual-focus";
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
      engine: "v0.11",
      status: "unavailable",
      score: null,
      band: null,
      reasonCodes:
        axis.finalScore != null && band == null
          ? [...axis.reasonCodes, "invalid-v0.11-band"]
          : axis.reasonCodes,
      v10Trace,
    };
  }

  return {
    domain: axis.domain,
    engine: "v0.11",
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

function resolveAnnualFocusSummary(chart: ChartData): AnnualFocusSummary | null {
  const focusResolution = resolveAnnualFocus(chart, "nam-phai");
  if (!focusResolution.focus) return null;
  const headFrame = buildAnnualFocusFrame(chart, focusResolution.focus);
  return {
    mode: focusResolution.focus.mode,
    palaceIndex: focusResolution.focus.palaceIndex,
    palaceName: focusResolution.focus.palaceName,
    palaceBranch: focusResolution.focus.palaceBranch,
    annualPalaceName: focusResolution.focus.annualPalaceName,
    frameBranches: headFrame?.frameBranches ?? [],
  };
}

/**
 * Runtime adapter for the released Nam Phái V0.11 domain engine.
 *
 * Locked release profile: layered-balanced + legacy AnnualDomainProjection.
 * V0.8 remains a frozen annual-trigger / research-control kernel only.
 * Static natal foundation is independent of Palace Overview.
 */
export function analyzeAnnualAxesNamPhaiCurrent(chart: ChartData): AnnualAxesResult {
  const result = analyzeAnnualAxesNamPhaiV10(chart, {
    profileId: "layered-balanced",
    projectionVariant: "legacy",
    includeControl: false,
  });

  const axes = {} as Record<AnnualAxisDomain, AnnualAxisNamPhaiV10Result>;
  for (const domain of ANNUAL_AXIS_DOMAINS) {
    axes[domain] = adaptAxis(result.axes[domain]);
  }

  const supportsDomainScoring = ANNUAL_AXIS_DOMAINS.some(
    (domain) => axes[domain].status !== "unavailable",
  );
  const annualFocus = resolveAnnualFocusSummary(chart);

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
      supportsAnnualFocus: annualFocus !== null,
      domainAnchorCoordinate: "natal-palace-name",
      domainAnchorProvenance: "nam-phai-v0.11-annual-domain-projection",
      primaryAnnualFocus: "annual-major-fortune",
    },
    annualFocus,
    releaseStage: "experimental",
    calibrated: false,
  };
}
