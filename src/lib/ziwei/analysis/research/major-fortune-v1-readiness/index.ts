/**
 * PR #267 research entry — Major Fortune V1 release-readiness requalification.
 * Research-only: must not be imported by production routers.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BASELINE_IDENTITY,
  CANDIDATE_IDENTITY,
  RESEARCH_GENERATION_ID,
  RESEARCH_SCHEMA_VERSION,
} from "./constants";
import {
  enumerateObservations,
  loadFullCorpus,
  loadSchoolCorpus,
  observationKey,
} from "./corpus";
import {
  auditObservationCoverage,
  assertFactAccountingInvariant,
} from "./coverage";
import {
  runShadowRow,
  summarizeModelComparison,
  summarizeTimelines,
} from "./compare";
import {
  collectEmittedIdsFromEvidence,
  inventoryEvidenceFamilies,
  inventoryNumericSurfaces,
} from "./authority";
import {
  assessCurrentLifecycle,
  buildHistoricalLineageInventory,
} from "./lineage";
import { rate, round6, stableSortByKey } from "./metrics";
import type {
  CoverageSchoolSummary,
  FindingClassification,
  MajorFortuneV1ReadinessReport,
  ReadinessDecision,
  ReadinessDimension,
  UnsupportedStarHit,
} from "./types";

export { RESEARCH_SCHEMA_VERSION, RESEARCH_GENERATION_ID };
export type { MajorFortuneV1ReadinessReport };

function tallyClassifications(
  items: FindingClassification[],
): Record<FindingClassification, number> {
  const keys: FindingClassification[] = [
    "HISTORICAL_LINEAGE_GAP",
    "CURRENT_PROVENANCE_GAP",
    "NUMERIC_AUTHORITY_GAP",
    "PHYSICAL_FACT_COVERAGE_GAP",
    "TRANSFORMATION_COVERAGE_GAP",
    "QUALITY_REPORTING_GAP",
    "EXPECTED_MODEL_DIFFERENCE",
    "MODEL_INSTABILITY",
    "ARCHITECTURE_VIOLATION",
    "UNEXPECTED_DELTA",
  ];
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
    FindingClassification,
    number
  >;
  for (const k of items) out[k] += 1;
  return out;
}

function checkIsolation(): MajorFortuneV1ReadinessReport["isolation"] {
  const read = (rel: string) =>
    readFileSync(resolve(process.cwd(), rel), "utf8");
  const production = read(
    "src/lib/ziwei/analysis/modules/major-fortune/production.ts",
  );
  const timeline = read(
    "src/lib/ziwei/analysis/modules/major-fortune/timeline.ts",
  );
  const harnessToken = "major-fortune-v1-readiness";
  const roots = [
    "src/lib/ziwei/analysis/modules/major-fortune/production.ts",
    "src/lib/ziwei/analysis/modules/major-fortune/timeline.ts",
    "src/lib/ziwei/analysis/modules/major-fortune/shadow.ts",
    "src/lib/ziwei/analysis/modules/major-fortune/v0.5-candidate/candidate.ts",
  ];
  let runtimeImportsResearchHarness = false;
  for (const rel of roots) {
    if (read(rel).includes(harnessToken)) runtimeImportsResearchHarness = true;
  }
  return {
    productionImportsEngineV1:
      production.includes("engine-v1") || production.includes("analyzeMajorFortuneV1"),
    timelineImportsEngineV1:
      timeline.includes("engine-v1") || timeline.includes("analyzeMajorFortuneV1"),
    runtimeImportsResearchHarness,
  };
}

function decideReadiness(input: {
  domainVerifiedFail: boolean;
  silentDropRate: number | null;
  transformationCoverageRate: number | null;
  qualityMisleading: boolean;
  isolationOk: boolean;
  deterministicCandidate: boolean;
}): {
  decision: ReadinessDecision;
  blockers: string[];
  recommendedNextPr: MajorFortuneV1ReadinessReport["readiness"]["recommendedNextPr"];
} {
  const blockers: string[] = [];
  if (!input.isolationOk) {
    blockers.push("Production isolation violated (#266 contract).");
  }
  if (input.domainVerifiedFail) {
    blockers.push(
      "DOMAIN_VERIFIED labels do not resolve through current provenance registries.",
    );
  }
  if ((input.silentDropRate ?? 0) > 0) {
    blockers.push(
      `Physical-fact silent-drop rate is ${input.silentDropRate} (unsupported stars / unscored mutagens).`,
    );
  }
  if ((input.transformationCoverageRate ?? 0) === 0) {
    blockers.push(
      "majorMutagens are carried in the V1 frame but transformation scoring coverage is zero.",
    );
  }
  if (input.qualityMisleading) {
    blockers.push(
      "Reported coverage/confidence/contribution percentages are mock or synthetic constants.",
    );
  }
  if (!input.deterministicCandidate) {
    blockers.push("Candidate execution was not fully available across the corpus.");
  }

  // Primary blocker selection (evidence-backed priority):
  // Provenance authenticity of DOMAIN_VERIFIED is foundational; then coverage; then quality.
  if (!input.isolationOk) {
    return {
      decision: "MFV1_REQUIRES_PROVENANCE_REBUILD",
      blockers,
      recommendedNextPr: {
        outcome: "A",
        title:
          "research(major-fortune): rebuild V1 source, claim, and evidence-admission authority",
        rationale: "Architecture isolation failure blocks any further qualification.",
      },
    };
  }

  if (input.domainVerifiedFail) {
    return {
      decision: "MFV1_REQUIRES_PROVENANCE_REBUILD",
      blockers,
      recommendedNextPr: {
        outcome: "A",
        title:
          "research(major-fortune): rebuild V1 source, claim, and evidence-admission authority",
        rationale:
          "Emitted DOMAIN_VERIFIED evidence IDs resolve only to deleted historical packs, not current registries.",
      },
    };
  }

  if ((input.silentDropRate ?? 0) > 0 || (input.transformationCoverageRate ?? 1) === 0) {
    return {
      decision: "MFV1_REQUIRES_COVERAGE_WORK",
      blockers,
      recommendedNextPr: {
        outcome: "B",
        title:
          "research(major-fortune): close V1 physical-fact and transformation coverage gaps",
        rationale:
          "Unsupported-star silent drops and/or zero Tứ Hóa scored coverage dominate readiness blockers.",
      },
    };
  }

  if (input.qualityMisleading) {
    return {
      decision: "MFV1_REQUIRES_QUALITY_CONTRACT_REDESIGN",
      blockers,
      recommendedNextPr: {
        outcome: "C",
        title:
          "research(major-fortune): define measurable V1 quality and diagnostics contracts",
        rationale: "Coverage/confidence/contribution reporting is not measured.",
      },
    };
  }

  return {
    decision: "MFV1_READY_AS_RESEARCH_CONTROL",
    blockers,
    recommendedNextPr: {
      outcome: "D",
      title:
        "research(major-fortune): qualify V1 candidate on holdout and adversarial corpus",
      rationale: "Authority, coverage, and quality contracts are currently adequate for RC review prep.",
    },
  };
}

export function buildReadinessReport(baseSha: string): MajorFortuneV1ReadinessReport {
  const lineageAssets = buildHistoricalLineageInventory();
  const lifecycle = assessCurrentLifecycle(lineageAssets);
  const evidenceFamilies = inventoryEvidenceFamilies();
  const numericSurfaces = inventoryNumericSurfaces();

  const nam = loadSchoolCorpus("nam-phai");
  const tc = loadSchoolCorpus("trung-chau");
  const corpus = loadFullCorpus();
  const observations = enumerateObservations(corpus);

  const coverageRows = observations.map((o) =>
    auditObservationCoverage(o.school, o.caseId, o.chart, o.cycle),
  );
  for (const row of coverageRows) {
    if (!assertFactAccountingInvariant(row.buckets)) {
      throw new Error(
        `Fact accounting invariant failed for ${observationKey({ school: row.school, caseId: row.caseId, cycle: row.cycle })}`,
      );
    }
  }

  const shadowRows = observations.map((o, i) => runShadowRow(o, coverageRows[i]!));
  const modelComparison = summarizeModelComparison(shadowRows);
  const timeline = summarizeTimelines(shadowRows);

  const allAdmitted = coverageRows.flatMap((r) => r.v1Result?.evidence.admitted ?? []);
  const idAudit = collectEmittedIdsFromEvidence(allAdmitted);

  const unsupportedAll: UnsupportedStarHit[] = coverageRows.flatMap((r) => r.unsupported);
  const unsupportedCounts = new Map<string, number>();
  for (const u of unsupportedAll) {
    unsupportedCounts.set(u.starName, (unsupportedCounts.get(u.starName) ?? 0) + 1);
  }
  const topUnsupportedStars = [...unsupportedCounts.entries()]
    .map(([starName, count]) => ({ starName, count }))
    .sort((a, b) => b.count - a.count || (a.starName < b.starName ? -1 : 1))
    .slice(0, 20);

  const physicalFacts = coverageRows.reduce((a, r) => a + r.buckets.totalRelevant, 0);
  const recognizedFacts = coverageRows.reduce((a, r) => a + r.buckets.recognized, 0);
  const silentlyDroppedFacts = coverageRows.reduce(
    (a, r) => a + r.buckets.silentlyDropped,
    0,
  );
  const principalPhysical = coverageRows.reduce((a, r) => a + r.principalPhysical, 0);
  const principalRecognized = coverageRows.reduce((a, r) => a + r.principalRecognized, 0);
  const auxiliaryPhysical = coverageRows.reduce((a, r) => a + r.auxiliaryPhysical, 0);
  const auxiliaryRecognized = coverageRows.reduce((a, r) => a + r.auxiliaryRecognized, 0);
  const majorMutagensPhysicalCount = coverageRows.reduce(
    (a, r) => a + r.majorMutagensPhysicalCount,
    0,
  );
  const majorMutagensInV1FrameCount = coverageRows.reduce(
    (a, r) => a + r.majorMutagensInV1FrameCount,
    0,
  );
  const majorTransformationEvidenceCount = coverageRows.reduce(
    (a, r) => a + r.majorTransformationEvidenceCount,
    0,
  );
  const majorTransformationScoredCount = coverageRows.reduce(
    (a, r) => a + r.majorTransformationScoredCount,
    0,
  );

  const bySchool = (school: "nam-phai" | "trung-chau"): CoverageSchoolSummary => {
    const rows = coverageRows.filter((r) => r.school === school);
    const phys = rows.reduce((a, r) => a + r.buckets.totalRelevant, 0);
    const rec = rows.reduce((a, r) => a + r.buckets.recognized, 0);
    const silent = rows.reduce((a, r) => a + r.buckets.silentlyDropped, 0);
    const pp = rows.reduce((a, r) => a + r.principalPhysical, 0);
    const pr = rows.reduce((a, r) => a + r.principalRecognized, 0);
    const ap = rows.reduce((a, r) => a + r.auxiliaryPhysical, 0);
    const ar = rows.reduce((a, r) => a + r.auxiliaryRecognized, 0);
    const mp = rows.reduce((a, r) => a + r.majorMutagensPhysicalCount, 0);
    const ms = rows.reduce((a, r) => a + r.majorTransformationScoredCount, 0);
    return {
      school,
      observations: rows.length,
      physicalFacts: phys,
      recognized: rec,
      silentlyDropped: silent,
      principalCoverageRate: rate(pr, pp),
      auxiliaryCoverageRate: rate(ar, ap),
      transformationCoverageRate: rate(ms, mp),
      silentDropRate: rate(silent, phys),
    };
  };

  const reportedCoverages = coverageRows
    .map((r) => r.reportedCoveragePercent)
    .filter((x): x is number => x != null);
  const measuredCoverages = coverageRows
    .map((r) => r.measuredPhysicalCoveragePercent)
    .filter((x): x is number => x != null);
  const reportedConfidences = coverageRows
    .map((r) => r.reportedConfidencePercent)
    .filter((x): x is number => x != null);

  const mean = (xs: number[]) =>
    xs.length === 0 ? null : round6(xs.reduce((a, b) => a + b, 0) / xs.length);

  const qualityTruthfulness = {
    reportedCoverageBehavior:
      "Defaults to 100; subtracts 5 when focus is VCD (comment: mock metric).",
    measuredPhysicalCoverageComparable: true,
    reportedCoverageClassification: "MOCK" as const,
    reportedConfidenceClassification: "MOCK" as const,
    engineeringShareClassification: "SYNTHETIC_CONSTANT" as const,
    verifiedDomainShareClassification: "SYNTHETIC_CONSTANT" as const,
    experimentalShareClassification: "SYNTHETIC_CONSTANT" as const,
    meanReportedCoveragePercent: mean(reportedCoverages),
    meanMeasuredPhysicalCoveragePercent: mean(measuredCoverages),
    meanReportedConfidencePercent: mean(reportedConfidences),
    derivedConfidence: null,
    derivedConfidenceClassification: "UNSUPPORTED_OR_NOT_DERIVABLE" as const,
  };

  const isolation = checkIsolation();
  const isolationOk =
    !isolation.productionImportsEngineV1 &&
    !isolation.timelineImportsEngineV1 &&
    !isolation.runtimeImportsResearchHarness;

  const transformationCoverageRate = rate(
    majorTransformationScoredCount,
    majorMutagensPhysicalCount,
  );
  const silentDropRate = rate(silentlyDroppedFacts, physicalFacts);

  const decisionPack = decideReadiness({
    domainVerifiedFail: idAudit.domainVerifiedLabelTruthfulness === "FAIL",
    silentDropRate,
    transformationCoverageRate,
    qualityMisleading: true,
    isolationOk,
    deterministicCandidate: modelComparison.global.candidateErrors === 0,
  });

  // Prefer provenance as primary when FAIL; coverage co-dominant but decision tree already orders A first.
  const dimensions: ReadinessDimension[] = [
    {
      dimension: "deterministic execution",
      status: modelComparison.global.candidateErrors === 0 ? "PASS" : "FAIL",
      evidence: `candidateErrors=${modelComparison.global.candidateErrors}`,
    },
    {
      dimension: "production isolation",
      status: isolationOk ? "PASS" : "FAIL",
      evidence: JSON.stringify(isolation),
    },
    {
      dimension: "current lineage clarity",
      status: "GAP",
      evidence: lifecycle,
    },
    {
      dimension: "source provenance",
      status: idAudit.unresolvedSourceIds.length === 0 ? "PASS" : "FAIL",
      evidence: `unresolved=${idAudit.unresolvedSourceIds.join(",")}`,
    },
    {
      dimension: "claim provenance",
      status: idAudit.unresolvedClaimIds.length === 0 ? "PASS" : "FAIL",
      evidence: `unresolved=${idAudit.unresolvedClaimIds.join(",")}`,
    },
    {
      dimension: "numeric authority labeling",
      status: "GAP",
      evidence: `placeholderSurfaces=${numericSurfaces.filter((s) => s.authority === "PLACEHOLDER").length}`,
    },
    {
      dimension: "school policy authority",
      status: "PARTIAL",
      evidence: "School field propagated; no school-specific V1 policy pack on current master.",
    },
    {
      dimension: "principal-star coverage",
      status: (rate(principalRecognized, principalPhysical) ?? 0) >= 0.999 ? "PASS" : "GAP",
      evidence: `recognized=${principalRecognized}/${principalPhysical}`,
    },
    {
      dimension: "auxiliary-star coverage",
      status: "GAP",
      evidence: `recognized=${auxiliaryRecognized}/${auxiliaryPhysical}`,
    },
    {
      dimension: "Tứ Hóa coverage",
      status: majorTransformationScoredCount === 0 ? "FAIL" : "PASS",
      evidence: `scored=${majorTransformationScoredCount} physical=${majorMutagensPhysicalCount} frame=${majorMutagensInV1FrameCount}`,
    },
    {
      dimension: "unknown fact diagnostics",
      status: unsupportedAll.length === 0 ? "PASS" : "FAIL",
      evidence: `unsupportedOccurrences=${unsupportedAll.length}`,
    },
    {
      dimension: "coverage truthfulness",
      status: "FAIL",
      evidence: `meanReported=${qualityTruthfulness.meanReportedCoveragePercent} meanMeasured=${qualityTruthfulness.meanMeasuredPhysicalCoveragePercent}`,
    },
    {
      dimension: "confidence truthfulness",
      status: "FAIL",
      evidence: "confidencePercent hardcoded mock=90",
    },
    {
      dimension: "model distribution characterization",
      status: "PASS",
      evidence: `comparable=${modelComparison.global.comparableObservations}`,
    },
    {
      dimension: "timeline characterization",
      status: "PASS",
      evidence: `charts=${timeline.charts}`,
    },
    {
      dimension: "holdout/adversarial current authority",
      status: "FAIL",
      evidence: "Historical datasets deleted; no current holdout/adversarial authority.",
    },
    {
      dimension: "current release gate",
      status: "FAIL",
      evidence: "CURRENT_MAJOR_FORTUNE_V1_RELEASE_GATE = ABSENT",
    },
    {
      dimension: "current decision artifact",
      status: "FAIL",
      evidence: "Historical GO_SHADOW invalidated; this report records a research requalification decision only.",
    },
  ];

  const classifications = tallyClassifications([
    "HISTORICAL_LINEAGE_GAP",
    "HISTORICAL_LINEAGE_GAP",
    "CURRENT_PROVENANCE_GAP",
    "CURRENT_PROVENANCE_GAP",
    "NUMERIC_AUTHORITY_GAP",
    "PHYSICAL_FACT_COVERAGE_GAP",
    "TRANSFORMATION_COVERAGE_GAP",
    "QUALITY_REPORTING_GAP",
    "QUALITY_REPORTING_GAP",
    "QUALITY_REPORTING_GAP",
    "EXPECTED_MODEL_DIFFERENCE",
  ]);

  // Bump EXPECTED_MODEL_DIFFERENCE if any score deltas exist
  if (modelComparison.global.deltas.meanAbsoluteDelta > 0) {
    classifications.EXPECTED_MODEL_DIFFERENCE += 1;
  }

  return {
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    generationId: RESEARCH_GENERATION_ID,
    generatedFrom: {
      baseSha,
      candidate: CANDIDATE_IDENTITY,
      baseline: BASELINE_IDENTITY,
    },
    lineage: {
      historicalAssets: lineageAssets,
      currentLifecycleAssessment: lifecycle,
      currentReleaseGate: "ABSENT",
      historicalGoShadowStatus: "INVALIDATED_AS_CURRENT_AUTHORITY",
    },
    authority: {
      evidenceFamilies,
      numericSurfaces: stableSortByKey(numericSurfaces, (s) => s.surfaceId),
      unresolvedSourceIds: idAudit.unresolvedSourceIds,
      unresolvedClaimIds: idAudit.unresolvedClaimIds,
      domainVerifiedLabelCount: idAudit.domainVerifiedLabelCount,
      domainVerifiedResolvedCount: idAudit.domainVerifiedResolvedCount,
      domainVerifiedUnresolvedCount: idAudit.domainVerifiedUnresolvedCount,
      domainVerifiedLabelTruthfulness: idAudit.domainVerifiedLabelTruthfulness,
    },
    coverage: {
      observations: coverageRows.length,
      physicalFacts,
      recognizedFacts,
      silentlyDroppedFacts,
      principalCoverageRate: rate(principalRecognized, principalPhysical),
      auxiliaryCoverageRate: rate(auxiliaryRecognized, auxiliaryPhysical),
      transformationCoverageRate,
      silentDropRate,
      bySchool: [bySchool("nam-phai"), bySchool("trung-chau")],
      uniqueUnsupportedStars: [...unsupportedCounts.keys()].sort(),
      unsupportedStarOccurrences: unsupportedAll.length,
      unsupportedOccurrenceRate: rate(unsupportedAll.length, physicalFacts),
      topUnsupportedStars,
      majorMutagensPhysicalCount,
      majorMutagensInV1FrameCount,
      majorTransformationEvidenceCount,
      majorTransformationScoredCount,
    },
    qualityTruthfulness,
    modelComparison,
    timeline,
    readiness: {
      dimensions,
      decision: decisionPack.decision,
      blockers: decisionPack.blockers,
      recommendedNextPr: decisionPack.recommendedNextPr,
    },
    classifications,
    corpus: {
      birthCaseCountNam: nam.length,
      birthCaseCountTc: tc.length,
      schoolCount: 2,
      validCycleObservationCount: observations.length,
      unavailableObservationCount:
        modelComparison.global.unavailableBaseline +
        modelComparison.global.unavailableCandidate,
      candidateErrorCount: modelComparison.global.candidateErrors,
    },
    isolation,
    limitations: [
      "Research artifacts are not runtime authority.",
      "Historical #194/#195 packs were inspected via Git history only; not restored.",
      "V0.5 is the released control, not a ground-truth score oracle.",
      "No arbitrary instability threshold was applied to V0.5↔V1 deltas.",
      "Confidence cannot be reconstructed from current provenance → derivedConfidence=null.",
      "Timeline sample lists first 12 charts only; aggregate rates cover the full corpus.",
      "High/low physical-coverage cohorts use continuous rates; no invented threshold authority.",
      "V0.5 and V1 use incompatible band vocabularies (e.g. support/pressure/mixed vs tốt/khá/bình-hòa), so bandAgreementRate≈0 is an ontology mismatch, not by itself MODEL_INSTABILITY.",
      "Palace.stars may include void markers (Tuần/Triệt) counted as physical star facts in this audit.",
    ],
  };
}
