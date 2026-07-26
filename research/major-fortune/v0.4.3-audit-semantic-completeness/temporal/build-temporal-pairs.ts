import { calculateChart, expandAllMajorFortuneCycleObservations, MF_V02_FULL_CORPUS, MajorFortuneV02CycleObservation } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus.js";
import { analyzeMajorFortuneOrdinalV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter/analyze.js";
import { buildAuditObservation } from "../types/build-observation.js";
import { withMajorFortuneTelemetrySink, noopMajorFortuneTelemetrySink } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/emit.js";
import { TEMPORAL_MUTATIONS, TemporalMutationCase } from "./mutation-cases.js";
import { validateTemporalSentinel } from "./temporal-sentinel.js";
import { compareMajorFortuneObservation } from "../comparison/compare-observations.js";
import { TemporalIndependenceReport } from "../types/reports.js";
import { buildObservationId } from "../types/audit-observation.js";

export function runTemporalIndependenceAudit(): TemporalIndependenceReport {
  process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"] = "false";

  const allObservations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  // Stratified deterministic sample: take first 10 Nam Phai, first 10 Trung Chau.
  const sampleNamPhai = allObservations.filter(o => o.school === "nam-phai").slice(0, 10);
  const sampleTrungChau = allObservations.filter(o => o.school === "trung-chau").slice(0, 10);
  const sample = [...sampleNamPhai, ...sampleTrungChau];

  const report: TemporalIndependenceReport = {
    schemaVersion: "0.4.3",
    totalPairs: 0,
    validMutationPairs: 0,
    mutationSentinelFailures: 0,
    identityPreservationFailures: 0,
    comparedPairs: 0,
    passedPairs: 0,
    contaminatedPairs: 0,
    mutationCoverage: {},
    contaminations: [],
    passed: false,
  };

  for (const mut of TEMPORAL_MUTATIONS) {
    report.mutationCoverage[mut.id] = { attempted: 0, sentinelPassed: 0, semanticPassed: 0, semanticFailed: 0 };
  }

  for (const obs of sample) {
    // Generate base
    const baseChart = calculateChart(obs.school, obs.input);
    const baseAnalysis = withMajorFortuneTelemetrySink(noopMajorFortuneTelemetrySink, () => 
      analyzeMajorFortuneOrdinalV03(baseChart, {
        school: obs.school,
        cycleOverride: {
          cycleIndex: obs.cycleIndex,
          startAge: obs.startAge,
          endAge: obs.endAge,
          activePalaceIndex: obs.activePalaceIndex,
        }
      })
    );
    const baseSnapshot = buildAuditObservation(obs, baseAnalysis, "v043-fallback", MF_V02_FULL_CORPUS.corpusId, 0);

    for (const mut of TEMPORAL_MUTATIONS) {
      report.totalPairs++;
      report.mutationCoverage[mut.id]!.attempted++;
      
      const alteredObs = mut.apply(obs);
      if (!alteredObs) {
        report.identityPreservationFailures++;
        continue;
      }

      const alteredChart = calculateChart(alteredObs.school, alteredObs.input);
      if (!validateTemporalSentinel(obs, alteredChart)) {
        report.mutationSentinelFailures++;
        continue;
      }

      report.validMutationPairs++;
      report.mutationCoverage[mut.id]!.sentinelPassed++;
      report.comparedPairs++;

      const alteredAnalysis = withMajorFortuneTelemetrySink(noopMajorFortuneTelemetrySink, () => 
        analyzeMajorFortuneOrdinalV03(alteredChart, {
          school: alteredObs.school,
          cycleOverride: {
            cycleIndex: alteredObs.cycleIndex,
            startAge: alteredObs.startAge,
            endAge: alteredObs.endAge,
            activePalaceIndex: alteredObs.activePalaceIndex,
          }
        })
      );
      // Mode doesn't matter for deep semantic comparison, it'll be ignored by the profile
      const alteredSnapshot = buildAuditObservation(alteredObs, alteredAnalysis, "v043-fallback", MF_V02_FULL_CORPUS.corpusId, 0);

      // We use "temporal-independence" profile
      const comp = compareMajorFortuneObservation(baseSnapshot, alteredSnapshot, { profile: "temporal-independence" });
      
      if (comp.passed) {
        report.passedPairs++;
        report.mutationCoverage[mut.id]!.semanticPassed++;
      } else {
        report.contaminatedPairs++;
        report.mutationCoverage[mut.id]!.semanticFailed++;
        report.contaminations.push({
          pairId: `${baseSnapshot.observationId}::${mut.id}`,
          mutationId: mut.id,
          observationId: baseSnapshot.observationId,
          differences: comp.differences,
        });
      }
    }
  }

  report.passed = report.contaminatedPairs === 0 && report.comparedPairs > 0;
  return report;
}
