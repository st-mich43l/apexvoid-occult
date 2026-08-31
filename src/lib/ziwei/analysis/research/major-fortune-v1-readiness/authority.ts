/**
 * Evidence-family and numeric-surface authority inventories (read-only).
 */
import { V1_PARAMETERS } from "../../modules/major-fortune/engine-v1/scoring/parameters";
import { RC1_STAR_CATALOG } from "../../modules/major-fortune/engine-v1/scoring/star-catalog";
import { loadCurrentProvenanceIds, V1_CATALOG_STAR_NAMES } from "./constants";
import type {
  EvidenceFamilySummary,
  NumericAuthorityClass,
  NumericSurfaceSummary,
} from "./types";

export function inventoryEvidenceFamilies(): EvidenceFamilySummary[] {
  const provenance = loadCurrentProvenanceIds();
  const dialoiSourceOk = provenance.sourceIds.has("SRC-TVDS-01");
  const dialoiClaimOk = provenance.claimIds.has("CLM-DIALOI-01");
  const nhanSourceOk = provenance.sourceIds.has("SRC-TVDS-01");
  const nhanClaimOk = provenance.claimIds.has("CLM-NHANHOA-01");

  return [
    {
      category: "principal-star",
      physicalFactAvailable: true,
      physicalFactConsumed: true,
      sourceIds: ["SRC-TVDS-01"],
      sourceIdsResolveCurrent: dialoiSourceOk,
      claimIds: ["CLM-DIALOI-01"],
      claimIdsResolveCurrent: dialoiClaimOk,
      scoringAuthorityLabel: "DOMAIN_VERIFIED",
      scoringAuthorityActuallySupported: dialoiSourceOk && dialoiClaimOk,
      numericVectorAuthority: "PLACEHOLDER",
      schoolScope: "shared-emitted",
      temporalScope: "dai-van",
      silentDropPossible: false,
      classification:
        dialoiSourceOk && dialoiClaimOk
          ? "PROVENANCE_VALID_CURRENT"
          : "HISTORICAL_PROVENANCE_ONLY",
    },
    {
      category: "auxiliary-support",
      physicalFactAvailable: true,
      physicalFactConsumed: true,
      sourceIds: ["SRC-TVDS-01"],
      sourceIdsResolveCurrent: nhanSourceOk,
      claimIds: ["CLM-NHANHOA-01"],
      claimIdsResolveCurrent: nhanClaimOk,
      scoringAuthorityLabel: "DOMAIN_VERIFIED",
      scoringAuthorityActuallySupported: nhanSourceOk && nhanClaimOk,
      numericVectorAuthority: "PLACEHOLDER",
      schoolScope: "shared-emitted",
      temporalScope: "dai-van",
      silentDropPossible: true,
      classification:
        nhanSourceOk && nhanClaimOk
          ? "PROVENANCE_VALID_CURRENT"
          : "HISTORICAL_PROVENANCE_ONLY",
    },
    {
      category: "malefic-pressure",
      physicalFactAvailable: true,
      physicalFactConsumed: true,
      sourceIds: ["SRC-TVDS-01"],
      sourceIdsResolveCurrent: nhanSourceOk,
      claimIds: ["CLM-NHANHOA-01"],
      claimIdsResolveCurrent: nhanClaimOk,
      scoringAuthorityLabel: "DOMAIN_VERIFIED",
      scoringAuthorityActuallySupported: nhanSourceOk && nhanClaimOk,
      numericVectorAuthority: "PLACEHOLDER",
      schoolScope: "shared-emitted",
      temporalScope: "dai-van",
      silentDropPossible: true,
      classification:
        nhanSourceOk && nhanClaimOk
          ? "PROVENANCE_VALID_CURRENT"
          : "HISTORICAL_PROVENANCE_ONLY",
    },
    {
      category: "major-transformation",
      physicalFactAvailable: true,
      physicalFactConsumed: false,
      sourceIds: [],
      sourceIdsResolveCurrent: true,
      claimIds: [],
      claimIdsResolveCurrent: true,
      scoringAuthorityLabel: "NONE_EMITTED",
      scoringAuthorityActuallySupported: false,
      numericVectorAuthority: "PLACEHOLDER",
      schoolScope: "schema-only",
      temporalScope: "dai-van",
      silentDropPossible: true,
      classification: "IMPLEMENTED_BUT_UNSCORED",
    },
    {
      category: "structural-interaction",
      physicalFactAvailable: false,
      physicalFactConsumed: false,
      sourceIds: [],
      sourceIdsResolveCurrent: true,
      claimIds: [],
      claimIdsResolveCurrent: true,
      scoringAuthorityLabel: "NONE_EMITTED",
      scoringAuthorityActuallySupported: false,
      numericVectorAuthority: "UNRESOLVED",
      schoolScope: "schema-only",
      temporalScope: "dai-van",
      silentDropPossible: false,
      classification: "SCHEMA_ONLY",
    },
  ];
}

export function inventoryNumericSurfaces(): NumericSurfaceSummary[] {
  const surfaces: NumericSurfaceSummary[] = [];

  const push = (
    surfaceId: string,
    value: number | string,
    authority: NumericAuthorityClass,
    notes: string,
  ) => {
    surfaces.push({ surfaceId, value, authority, notes });
  };

  push("geometry.focus", V1_PARAMETERS.GEOMETRY_FOCUS.value, "ENGINEERING_POLICY", "Self-labeled ENGINEERING_CALIBRATED");
  push("geometry.opposite", V1_PARAMETERS.GEOMETRY_OPPOSITE.value, "ENGINEERING_POLICY", "Self-labeled ENGINEERING_CALIBRATED");
  push("geometry.trine", V1_PARAMETERS.GEOMETRY_TRINE.value, "ENGINEERING_POLICY", "Self-labeled ENGINEERING_CALIBRATED");

  for (const name of V1_CATALOG_STAR_NAMES) {
    const v = RC1_STAR_CATALOG[name]!;
    push(
      `star.${name}.support`,
      v.support,
      "PLACEHOLDER",
      "RC1_STAR_CATALOG comment: Minimal placeholder catalog for RC1",
    );
    push(`star.${name}.pressure`, v.pressure, "PLACEHOLDER", "RC1 placeholder vector");
    push(`star.${name}.stability`, v.stability, "PLACEHOLDER", "RC1 placeholder vector");
    push(`star.${name}.activation`, v.activation, "PLACEHOLDER", "RC1 placeholder vector");
  }

  for (const [key, param] of Object.entries(V1_PARAMETERS)) {
    if (!key.startsWith("TU_HOA_")) continue;
    push(
      `tu-hoa.${param.parameterId}`,
      param.value,
      "PLACEHOLDER",
      "Parameter exists; evaluator does not consume (IMPLEMENTED_BUT_UNSCORED)",
    );
  }

  push("diminishingReturns", "1/sqrt(rank)", "ENGINEERING_POLICY", "Hard-coded in evaluate.ts");
  push("norm.support", "1-exp(-raw/4)", "ENGINEERING_POLICY", "Divisor 4.0");
  push("norm.pressure", "1-exp(-raw/4)", "ENGINEERING_POLICY", "Divisor 4.0");
  push("norm.stability", "tanh(raw/4)", "ENGINEERING_POLICY", "Divisor 4.0");
  push("norm.activation", "1-exp(-raw/4)", "ENGINEERING_POLICY", "Divisor 4.0");
  push("activationGate", "0.55+0.45*activationNorm", "ENGINEERING_POLICY", "Hard-coded");
  push("scoreCenterAmplitude", "50+45*tanh(net*gate/1.35)", "ENGINEERING_POLICY", "Hard-coded");
  push("maleficHeuristicThreshold", 0.4, "RESEARCH_HYPOTHESIS", "catalog.pressure > 0.4");
  push("band.xuat-sac", 80, "ENGINEERING_POLICY", "Score→band boundary");
  push("band.tot", 65, "ENGINEERING_POLICY", "Score→band boundary");
  push("band.kha", 55, "ENGINEERING_POLICY", "Score→band boundary");
  push("band.binh-hoa", 45, "ENGINEERING_POLICY", "Score→band boundary");
  push("band.kem", 35, "ENGINEERING_POLICY", "Score→band boundary");
  push("quality.coverageDefault", 100, "PLACEHOLDER", "Mock; VCD deducts 5");
  push("quality.vcdCoverageDeduction", 5, "PLACEHOLDER", "Hardcoded mock deduction");
  push("quality.confidencePercent", 90, "PLACEHOLDER", "Comment: mock derived from scoring authorities");
  push("quality.engineeringContributionPercent", 50, "PLACEHOLDER", "Constant");
  push("quality.experimentalContributionPercent", 0, "PLACEHOLDER", "Constant");
  push("quality.verifiedDomainContributionPercent", 50, "PLACEHOLDER", "Constant");

  return surfaces;
}

export function collectEmittedIdsFromEvidence(
  evidence: Array<{ sourceIds: string[]; claimIds: string[]; scoringAuthority: string }>,
): {
  sourceIds: string[];
  claimIds: string[];
  domainVerifiedLabelCount: number;
  domainVerifiedResolvedCount: number;
  domainVerifiedUnresolvedCount: number;
  unresolvedSourceIds: string[];
  unresolvedClaimIds: string[];
  domainVerifiedLabelTruthfulness: "PASS" | "FAIL";
} {
  const provenance = loadCurrentProvenanceIds();
  const sources = new Set<string>();
  const claims = new Set<string>();
  let domainVerifiedLabelCount = 0;
  let domainVerifiedResolvedCount = 0;
  let domainVerifiedUnresolvedCount = 0;

  for (const e of evidence) {
    for (const s of e.sourceIds) sources.add(s);
    for (const c of e.claimIds) claims.add(c);
    if (e.scoringAuthority === "DOMAIN_VERIFIED") {
      domainVerifiedLabelCount += 1;
      const ok =
        e.sourceIds.every((s) => provenance.sourceIds.has(s)) &&
        e.claimIds.every((c) => provenance.claimIds.has(c));
      if (ok) domainVerifiedResolvedCount += 1;
      else domainVerifiedUnresolvedCount += 1;
    }
  }

  const unresolvedSourceIds = [...sources]
    .filter((s) => !provenance.sourceIds.has(s))
    .sort();
  const unresolvedClaimIds = [...claims]
    .filter((c) => !provenance.claimIds.has(c))
    .sort();

  return {
    sourceIds: [...sources].sort(),
    claimIds: [...claims].sort(),
    domainVerifiedLabelCount,
    domainVerifiedResolvedCount,
    domainVerifiedUnresolvedCount,
    unresolvedSourceIds,
    unresolvedClaimIds,
    domainVerifiedLabelTruthfulness:
      domainVerifiedUnresolvedCount === 0 && unresolvedSourceIds.length === 0
        ? "PASS"
        : "FAIL",
  };
}
