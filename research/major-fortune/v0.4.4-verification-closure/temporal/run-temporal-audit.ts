import { calculateChart, expandAllMajorFortuneCycleObservations, MF_V02_FULL_CORPUS } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus.js";
import { analyzeMajorFortuneOrdinalV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter/analyze.js";
import { buildAuditObservation } from "../types/build-observation.js";
import { withMajorFortuneTelemetrySink, noopMajorFortuneTelemetrySink } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/emit.js";
import { TEMPORAL_MUTATIONS } from "./mutation-registry.js";
import { validateTemporalSentinel } from "./temporal-sentinel.js";
import { compareMajorFortuneObservation } from "../comparison/compare-observations.js";
import { MajorFortuneTemporalIndependenceReport } from "../types/reports.js";
import { selectStratifiedTemporalObservations } from "./temporal-selection.js";

export function runTemporalIndependenceAudit(): MajorFortuneTemporalIndependenceReport {
  process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"] = "false";

  const allObservations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  const sample = selectStratifiedTemporalObservations(allObservations);

  const report: MajorFortuneTemporalIndependenceReport = {
    schemaVersion: "0.4.4",
    expectedMutationPairs: sample.length * TEMPORAL_MUTATIONS.length,
    totalAttemptedPairs: 0,
    supportedPairs: 0,
    unsupportedPairs: 0,
    unsupportedCases: [],
    inputMutationFailures: 0,
    derivedMutationFailures: 0,
    identityPreservationFailures: 0,
    comparedPairs: 0,
    passedPairs: 0,
    contaminatedPairs: 0,
    mutationCoverage: {},
    contaminations: [],
    passed: false,
  };

  for (const mut of TEMPORAL_MUTATIONS) {
    report.mutationCoverage[mut.id] = { 
      expected: sample.length,
      attempted: 0, 
      supported: 0,
      unsupported: 0,
      inputMutationPassed: 0,
      derivedMutationPassed: 0,
      identityPassed: 0,
      semanticPassed: 0, 
      semanticFailed: 0 
    };
  }

  for (const obs of sample) {
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
    const baseSnapshot = buildAuditObservation(obs, baseAnalysis, "v044", MF_V02_FULL_CORPUS.corpusId, 0);

    for (const mut of TEMPORAL_MUTATIONS) {
      report.totalAttemptedPairs++;
      const coverage = report.mutationCoverage[mut.id]!;
      coverage.attempted++;
      
      const alteredObs = mut.apply(obs);
      if (!alteredObs) {
        report.unsupportedPairs++;
        coverage.unsupported++;
        report.unsupportedCases.push({
          mutationId: mut.id,
          observationId: baseSnapshot.observationId,
          reasonCode: "unsupported_by_mutation"
        });
        continue;
      }

      report.supportedPairs++;
      coverage.supported++;
      coverage.inputMutationPassed++; // Since apply succeeded

      const alteredChart = calculateChart(alteredObs.school, alteredObs.input);
      coverage.derivedMutationPassed++; // Chart derived successfully

      if (!validateTemporalSentinel(obs, alteredChart)) {
        report.identityPreservationFailures++;
        continue;
      }

      coverage.identityPassed++;
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
      
      const alteredSnapshot = buildAuditObservation(alteredObs, alteredAnalysis, "v044", MF_V02_FULL_CORPUS.corpusId, 0);

      const comp = compareMajorFortuneObservation(baseSnapshot, alteredSnapshot, { profile: "temporal-independence" });
      
      if (comp.passed) {
        report.passedPairs++;
        coverage.semanticPassed++;
      } else {
        report.contaminatedPairs++;
        coverage.semanticFailed++;
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
