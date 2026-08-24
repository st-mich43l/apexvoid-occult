import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesDiagnostics,
  AnnualAxesResult,
  AnnualAxisBand,
} from "../types";
import { emptyAnnualAxesDiagnostics } from "../types";
import { analyzeAnnualAxesNamPhaiV10 } from "./analyze";
import type { V10DomainTrace } from "./types";

export interface ReleasedV10LayerView {
  signedNet: number;
  supportMass: number;
  pressureMass: number;
  activation: number;
  coverage: number;
  availability: "available" | "partial" | "unavailable";
}

export interface ReleasedV10AxisView {
  domain: AnnualAxisDomain;
  engine: "v0.10";
  status: "available" | "partial-data" | "unavailable";
  score: number | null;
  band: AnnualAxisBand | null;
  reasonCodes: string[];
  v10Trace: {
    profileId: string;
    projectionVariant: string;
    profileWeights: {
      natalFoundation: number;
      majorFortune: number;
      annualTrigger: number;
      resonance: number;
    };
    natal: ReleasedV10LayerView;
    decade: ReleasedV10LayerView;
    annual: ReleasedV10LayerView;
    resonance: ReleasedV10LayerView;
    compositeNet: number;
    compositeRaw: number;
  };
}

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

function layerView(layer: V10DomainTrace["natal"]): ReleasedV10LayerView {
  return {
    signedNet: layer.signedNet,
    supportMass: layer.supportMass,
    pressureMass: layer.pressureMass,
    activation: layer.activation,
    coverage: layer.coverage,
    availability: layer.availability,
  };
}

function adaptAxis(axis: V10DomainTrace): ReleasedV10AxisView {
  const band = resolveBand(axis.band);
  const hasScore = axis.finalScore != null && band != null;
  const status: ReleasedV10AxisView["status"] =
    !hasScore || axis.status === "unavailable"
      ? "unavailable"
      : axis.status === "partial"
        ? "partial-data"
        : "available";

  return {
    domain: axis.domain,
    engine: "v0.10",
    status,
    score: status === "unavailable" ? null : axis.finalScore,
    band: status === "unavailable" ? null : band,
    reasonCodes:
      status === "unavailable" && axis.finalScore != null && band == null
        ? [...axis.reasonCodes, "invalid-v0.10-band"]
        : axis.reasonCodes,
    v10Trace: {
      profileId: axis.profileId,
      projectionVariant: axis.projectionVariant,
      profileWeights: axis.profileWeights,
      natal: layerView(axis.natal),
      decade: layerView(axis.decade),
      annual: layerView(axis.annual),
      resonance: layerView(axis.resonance),
      compositeNet: axis.compositeNet,
      compositeRaw: axis.compositeRaw,
    },
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
 * The historical V0.8 scorer remains an internal research/control dependency
 * of the V0.10 candidate implementation for now, but it is no longer the
 * public Nam Phái runtime selected by analyzeAnnualAxes().
 */
export function analyzeAnnualAxesNamPhaiCurrent(chart: ChartData): AnnualAxesResult {
  const result = analyzeAnnualAxesNamPhaiV10(chart, {
    profileId: "layered-balanced",
    projectionVariant: "legacy",
  });

  const axes = {} as Record<AnnualAxisDomain, ReleasedV10AxisView>;
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
    // Public AnnualAxisResult still carries the historical engine union.
    // The runtime shape is intentionally score-compatible while the V0.10
    // trace is exposed for the UI. A follow-up contract cleanup can remove
    // V0.8-only public trace types after all consumers migrate.
    axes: axes as unknown as AnnualAxesResult["axes"],
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
