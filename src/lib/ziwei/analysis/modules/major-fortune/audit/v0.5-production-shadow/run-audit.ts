import { MF_V02_FULL_CORPUS, calculateChart, expandAllMajorFortuneCycleObservations } from "../v0.2/corpus";
import { analyzeMajorFortuneProduction, analyzeMajorFortuneCandidateV05 } from "../../shadow";

export function runMajorFortuneV05ShadowAudit() {
  const observations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  let totalObservations = 0;
  let shadowMismatches = 0;

  for (const obs of observations) {
    totalObservations++;
    const chart = calculateChart(obs.school, obs.input);
    const cycleOverride = {
      cycleIndex: obs.cycleIndex,
      startAge: obs.startAge,
      endAge: obs.endAge,
      activePalaceIndex: obs.activePalaceIndex,
    };
    const options = { school: obs.school, cycleOverride };
    
    const baseline = analyzeMajorFortuneProduction(chart, options);
    const candidate = analyzeMajorFortuneCandidateV05(chart, options);
    
    // Baseline and Candidate must produce mathematically identical scores for V0.5 Stage 1 shadow.
    if (
      baseline.result?.score !== candidate.result?.score ||
      baseline.display.bandLabelVi !== candidate.display.bandLabelVi
    ) {
      shadowMismatches++;
    }
  }

  return {
    corpusId: MF_V02_FULL_CORPUS.corpusId,
    totalObservations,
    shadowMismatches,
    equivalent: shadowMismatches === 0,
  };
}
