/**
 * Build a canonical MajorFortuneAuditObservation from an analysis result + corpus metadata.
 *
 * This is the single source of truth for converting a scoring result into
 * an audit snapshot. Used by baseline generation, audit, and comparison.
 */
import type { MajorFortuneOrdinalV03Analysis } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter/types";
import type { MajorFortuneV02CycleObservation } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus";
import {
  MAJOR_FORTUNE_ADAPTER_VERSION,
  MAJOR_FORTUNE_INTEGRATION_VERSION,
} from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/types";
import {
  buildObservationId,
  type MajorFortuneAuditObservation,
  type AuditObservationMode,
} from "../types/audit-observation";

export function buildAuditObservation(
  obs: MajorFortuneV02CycleObservation,
  analysis: MajorFortuneOrdinalV03Analysis,
  mode: AuditObservationMode,
  corpusId: string,
  cycleOrder: number,
): MajorFortuneAuditObservation {
  const result = analysis.result;
  const cycle = analysis.cycle;

  const observationId = buildObservationId(
    corpusId,
    obs.school,
    obs.birthChartId,
    obs.cycleIndex,
    obs.activePalaceIndex,
  );

  // Build pillar snapshots from evaluation result.
  const pillars: MajorFortuneAuditObservation["pillars"] = {};
  if (result) {
    for (const [pillarId, pillarResult] of Object.entries(result.pillars)) {
      pillars[pillarId] = {
        state: pillarResult.state,
        level: pillarResult.level,
        delta: pillarResult.delta,
        supportMass: pillarResult.supportMass,
        pressureMass: pillarResult.pressureMass,
        acceptedEvidenceIds: [...pillarResult.acceptedEvidenceIds],
        rejectedEvidence: pillarResult.rejectedEvidence.map((r) => ({
          evidenceId: r.evidenceId,
          reason: r.reason,
          detail: (r as { detail?: string }).detail,
        })),
        physicalFactIds: [...pillarResult.physicalFactIds],
        reasonCodes: [...pillarResult.reasonCodes],
      };
    }
  }

  // Build accepted evidence list from emittedEvidence cross-referenced with pillar acceptance.
  const acceptedEvidenceIdsByPillar = new Map<string, Set<string>>();
  if (result) {
    for (const [pillarId, pillarResult] of Object.entries(result.pillars)) {
      acceptedEvidenceIdsByPillar.set(pillarId, new Set(pillarResult.acceptedEvidenceIds));
    }
  }

  const acceptedEvidence: MajorFortuneAuditObservation["acceptedEvidence"] = [];
  for (const e of analysis.emittedEvidence ?? []) {
    for (const [pillarId, ids] of acceptedEvidenceIdsByPillar) {
      if (ids.has(e.evidenceId)) {
        const tt = e.transformationTuple;
        acceptedEvidence.push({
          evidenceId: e.evidenceId,
          pillarId,
          signalFamilyId: e.signalFamilyId,
          physicalFactId: e.physicalFactId,
          evidenceClusterId: e.evidenceClusterId,
          direction: e.direction,
          strength: e.strength,
          reasonCode: e.reasonCode,
          ...(tt
            ? {
                transformationTuple: {
                  fortuneStem: tt.fortuneStem,
                  transformationType: tt.transformationType,
                  transformedStar: tt.transformedStar,
                  targetPalaceIndex: tt.targetPalaceIndex ?? -1,
                },
              }
            : {}),
        });
        break;
      }
    }
  }

  // Transformation summary.
  const tuHoaAccepted = new Set(result?.pillars["tu-hoa-sat-tinh"]?.acceptedEvidenceIds ?? []);
  const allTransformationEvidence = (analysis.emittedEvidence ?? []).filter(
    (e) => e.signalFamilyId === "major-fortune-transformations",
  );
  const acceptedTransformationEvidence = allTransformationEvidence.filter((e) =>
    tuHoaAccepted.has(e.evidenceId),
  );
  const directTransformations = acceptedTransformationEvidence.filter(
    (e) => e.transformationTuple?.targetPalaceIndex === obs.activePalaceIndex,
  );

  const transformationSummary: MajorFortuneAuditObservation["transformationSummary"] = {
    resolvedTupleCount: allTransformationEvidence.length,
    completeTupleCount: allTransformationEvidence.filter((e) => e.transformationTuple?.transformedStar).length,
    acceptedTransformationEvidenceCount: acceptedTransformationEvidence.length,
    directTransformationActivationCount: directTransformations.length,
    outOfFrameTransformationCount: analysis.adapterDiagnostics.outOfFrameTransformationCount ?? 0,
    incompleteTransformationCount: analysis.adapterDiagnostics.incompleteTransformations?.length ?? 0,
  };

  return {
    schemaVersion: "0.4.2",
    observationId,
    corpusId,
    mode,

    school: obs.school as "nam-phai" | "trung-chau",

    chartFixtureId: obs.birthChartId,
    cycleIndex: obs.cycleIndex,
    cycleOrder,
    startAge: obs.startAge,
    endAge: obs.endAge,
    activePalaceIndex: obs.activePalaceIndex,
    fortuneStem: cycle?.fortuneStem ?? null,

    integrationVersion: MAJOR_FORTUNE_INTEGRATION_VERSION,
    modelVersion: analysis.model,
    formulaVersion: result?.versions.formulaVersion ?? "v0.3-ordinal-four-pillar",
    contractVersion: result?.versions.contractVersion ?? "unknown",
    knowledgeVersion: result?.versions.knowledgeVersion ?? "unknown",
    adapterVersion: MAJOR_FORTUNE_ADAPTER_VERSION,

    status: result?.status ?? "unavailable",
    scoreState: result?.scoreState ?? "unavailable",
    score: result?.score ?? null,
    band: result?.band ?? null,

    contextCoverage: result?.coverage.contextCoverageWeight ?? 0,
    scoringCoverage: result?.coverage.scoringCoverageWeight ?? 0,
    coverageWeight: result?.coverage.coverageWeight ?? 0,

    evaluablePillarIds: [...(result?.coverage.evaluablePillarIds ?? [])],
    scoredPillarIds: [...(result?.coverage.scoredPillarIds ?? [])],
    partialPillarIds: [...(result?.coverage.partialPillarIds ?? [])],
    missingPillarIds: [...(result?.coverage.missingPillarIds ?? [])],

    pillars,
    acceptedEvidence,
    transformationSummary,

    diagnostics: {
      acceptedEvidenceCount: result?.diagnostics.acceptedEvidenceCount ?? 0,
      rejectedEvidenceCount: result?.diagnostics.rejectedEvidenceCount ?? 0,
      duplicatePhysicalFactRejects: result?.diagnostics.duplicatePhysicalFactRejects ?? 0,
      duplicateClusterRejects: result?.diagnostics.duplicateClusterRejects ?? 0,
      excludedTemporalRejects: result?.diagnostics.excludedTemporalRejects ?? 0,
      schoolGateRejects: result?.diagnostics.schoolGateRejects ?? 0,
      adapterReasonCodes: [
        ...analysis.adapterDiagnostics.notes,
        ...analysis.adapterDiagnostics.disabledFamilies,
      ],
    },

    trace: {
      baseScore: result?.trace.baseScore ?? 50,
      pillarDeltas: { ...(result?.trace.pillarDeltas ?? {}) },
      sumDelta: result?.trace.sumDelta ?? 0,
      rawScoreBeforeClamp: result?.trace.rawScoreBeforeClamp ?? 50,
      yearInCycleIgnored: result?.trace.yearInCycleIgnored ?? true,
      forbidsPerRuleRawDelta: result?.trace.forbidsPerRuleRawDelta ?? true,
    },
  };
}
