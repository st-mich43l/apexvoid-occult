import { calculateChart, expandAllMajorFortuneCycleObservations, MF_V02_FULL_CORPUS } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus.js";
import { analyzeMajorFortuneOrdinalV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter/analyze.js";
import { withMajorFortuneTelemetrySink } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/emit.js";
import { MajorFortuneScoredTelemetryEvent, MajorFortuneTelemetrySink, MAJOR_FORTUNE_INTEGRATION_VERSION } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/telemetry/types.js";
import { validateTelemetryPrivacy } from "./privacy-allowlist.js";
import { TelemetrySemanticsReport, TelemetryCaseResult } from "../types/reports.js";
import { calculateExpectedTelemetryCounts } from "./count-proof.js";
import { validateSinkLifecycle } from "./sink-lifecycle-proof.js";

export function runTelemetryAudit(): TelemetrySemanticsReport {
  const observations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  // Stratified sample for telemetry audit: 20 Nam Phai, 20 Trung Chau
  const sample = [
    ...observations.filter(o => o.school === "nam-phai").slice(0, 20),
    ...observations.filter(o => o.school === "trung-chau").slice(0, 20)
  ];

  const report: TelemetrySemanticsReport = {
    schemaVersion: "0.4.4",
    cases: [],
    testedEventCount: 0,
    allowlistViolationCount: 0,
    privacyViolationCount: 0,
    deterministicEventCount: 0,
    nonDeterministicEventCount: 0,
    countSemanticMismatchCount: 0,
    duplicateEmissionCount: 0,
    sinkRestorationFailureCount: 0,
    failures: [],
    passed: false,
  };

  process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"] = "true";

  let outerGlobalEventCount = 0;
  const globalSink: MajorFortuneTelemetrySink = {
    emit: () => { outerGlobalEventCount++; }
  };

  for (const obs of sample) {
    const chart = calculateChart(obs.school, obs.input);
    let events: MajorFortuneScoredTelemetryEvent[] = [];

    const scopedSink: MajorFortuneTelemetrySink = {
      emit: (e) => events.push(e)
    };

    // Global sink should not receive anything inside the scoped sink
    withMajorFortuneTelemetrySink(globalSink, () => {
      withMajorFortuneTelemetrySink(scopedSink, () => {
        analyzeMajorFortuneOrdinalV03(chart, {
          school: obs.school,
          cycleOverride: {
            cycleIndex: obs.cycleIndex,
            startAge: obs.startAge,
            endAge: obs.endAge,
            activePalaceIndex: obs.activePalaceIndex,
          }
        });
      });
    });

    if (events.length === 0) {
      report.failures.push({ caseId: obs.birthChartId, reasonCode: "missing_emission", detail: "No telemetry event emitted" });
      continue;
    }
    if (events.length > 1) {
      report.duplicateEmissionCount += (events.length - 1);
      report.failures.push({ caseId: obs.birthChartId, reasonCode: "duplicate_emission", detail: `Emitted ${events.length} events` });
    }

    report.testedEventCount++;
    const e = events[0]!;

    const privacyViolations = validateTelemetryPrivacy(e);
    if (privacyViolations.length > 0) {
      report.privacyViolationCount += privacyViolations.length;
      report.allowlistViolationCount += privacyViolations.length;
    }

    const expectedCounts = calculateExpectedTelemetryCounts(obs, chart);

    // Run again to prove determinism
    let events2: MajorFortuneScoredTelemetryEvent[] = [];
    withMajorFortuneTelemetrySink({ emit: (ev) => events2.push(ev) }, () => {
      analyzeMajorFortuneOrdinalV03(chart, {
        school: obs.school,
        cycleOverride: {
          cycleIndex: obs.cycleIndex,
          startAge: obs.startAge,
          endAge: obs.endAge,
          activePalaceIndex: obs.activePalaceIndex,
        }
      });
    });

    const deterministic = JSON.stringify(events[0]) === JSON.stringify(events2[0]);
    if (deterministic) {
      report.deterministicEventCount++;
    } else {
      report.nonDeterministicEventCount++;
    }

    const caseResult: TelemetryCaseResult = {
      caseId: obs.birthChartId,
      expectedContractVersion: MAJOR_FORTUNE_INTEGRATION_VERSION,
      actualContractVersion: e.integrationVersion,
      contractVersionMatches: e.integrationVersion === MAJOR_FORTUNE_INTEGRATION_VERSION,
      expectedAcceptedTransformationCount: expectedCounts.expectedAcceptedTransformationCount,
      actualAcceptedTransformationCount: e.acceptedTransformationEvidenceCount,
      expectedDirectActivationCount: expectedCounts.expectedDirectActivationCount,
      actualDirectActivationCount: e.directTransformationActivationCount,
      expectedOutOfFrameCount: expectedCounts.expectedOutOfFrameCount,
      actualOutOfFrameCount: e.outOfFrameTransformationCount,
      privacyViolations,
      allowlistViolations: privacyViolations,
      deterministic,
      emissionCount: events.length,
      passed: false
    };

    caseResult.passed = 
      caseResult.contractVersionMatches &&
      caseResult.actualAcceptedTransformationCount === caseResult.expectedAcceptedTransformationCount &&
      caseResult.actualDirectActivationCount === caseResult.expectedDirectActivationCount &&
      caseResult.actualOutOfFrameCount === caseResult.expectedOutOfFrameCount &&
      caseResult.privacyViolations.length === 0 &&
      caseResult.deterministic &&
      caseResult.emissionCount === 1;

    report.cases.push(caseResult);

    if (!caseResult.passed) {
      if (!caseResult.contractVersionMatches) report.failures.push({ caseId: obs.birthChartId, reasonCode: "wrong_version", detail: `Expected ${MAJOR_FORTUNE_INTEGRATION_VERSION}, got ${e.integrationVersion}` });
      if (caseResult.actualAcceptedTransformationCount !== caseResult.expectedAcceptedTransformationCount) {
        report.countSemanticMismatchCount++;
        report.failures.push({ caseId: obs.birthChartId, reasonCode: "semantic_mismatch", detail: "acceptedCount mismatch" });
      }
      if (caseResult.actualDirectActivationCount !== caseResult.expectedDirectActivationCount) {
        report.countSemanticMismatchCount++;
        report.failures.push({ caseId: obs.birthChartId, reasonCode: "semantic_mismatch", detail: "directCount mismatch" });
      }
      if (caseResult.actualOutOfFrameCount !== caseResult.expectedOutOfFrameCount) {
        report.countSemanticMismatchCount++;
        report.failures.push({ caseId: obs.birthChartId, reasonCode: "semantic_mismatch", detail: "outOfFrameCount mismatch" });
      }
      if (!caseResult.deterministic) report.failures.push({ caseId: obs.birthChartId, reasonCode: "non_deterministic", detail: "Second run produced different event" });
    }
  }

  // Sink Lifecycle Proof
  if (!validateSinkLifecycle()) {
    report.sinkRestorationFailureCount++;
    report.failures.push({ caseId: "global", reasonCode: "sink_leak", detail: "validateSinkLifecycle failed" });
  }

  if (outerGlobalEventCount > 0) {
    report.sinkRestorationFailureCount++;
    report.failures.push({ caseId: "global", reasonCode: "sink_leak", detail: "Events leaked to outer sink" });
  }

  delete process.env["VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"];

  report.passed = report.failures.length === 0 && sample.length > 0 && report.cases.every(c => c.passed);
  return report;
}
