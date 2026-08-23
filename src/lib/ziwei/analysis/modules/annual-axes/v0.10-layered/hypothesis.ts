import type { AnnualAxesV10Result } from "./types";

type HypothesisStatus =
  | "REPRODUCED"
  | "PARTIALLY_REPRODUCED"
  | "NOT_REPRODUCED";

export interface DomainHypothesisReport {
  status: HypothesisStatus;
  reasons: string[];
  controlScore: number | null;
  candidateScore: number | null;
  natalNet: number;
  decadeNet: number;
  annualNet: number;
  resonanceNet: number;
  delta: number | null;
}

function evaluatePressureHypothesis(input: {
  controlScore: number | null;
  candidateScore: number | null;
  natalNet: number;
  decadeNet: number;
  annualNet: number;
  resonanceNet: number;
  domainLabel: string;
}): DomainHypothesisReport {
  const reasons: string[] = [];
  const {
    controlScore,
    candidateScore,
    natalNet,
    decadeNet,
    annualNet,
    resonanceNet,
    domainLabel,
  } = input;

  const foundationAdverse = natalNet < -0.05;
  const decadeAdverse = decadeNet < -0.05;
  const annualAdverse = annualNet < -0.05;
  const resonanceAdverse = resonanceNet < -0.05;
  const delta =
    controlScore != null && candidateScore != null
      ? candidateScore - controlScore
      : null;
  const movedTowardPressure = delta != null && delta < -1;

  if (foundationAdverse) {
    reasons.push(`${domainLabel}: NatalFoundation signedNet < 0 (${natalNet.toFixed(3)})`);
  } else {
    reasons.push(
      `${domainLabel}: NatalFoundation not clearly adverse (${natalNet.toFixed(3)})`,
    );
  }
  if (decadeAdverse) {
    reasons.push(`${domainLabel}: MajorFortune signedNet < 0 (${decadeNet.toFixed(3)})`);
  } else {
    reasons.push(
      `${domainLabel}: MajorFortune not clearly adverse (${decadeNet.toFixed(3)})`,
    );
  }
  if (annualAdverse) {
    reasons.push(`${domainLabel}: AnnualTrigger signedNet < 0 (${annualNet.toFixed(3)})`);
  } else {
    reasons.push(
      `${domainLabel}: AnnualTrigger not clearly adverse (${annualNet.toFixed(3)})`,
    );
  }
  if (resonanceAdverse) {
    reasons.push(`${domainLabel}: Resonance reinforces pressure (${resonanceNet.toFixed(3)})`);
  }
  if (movedTowardPressure) {
    reasons.push(
      `${domainLabel}: candidate below control by ${Math.abs(delta!).toFixed(1)}`,
    );
  } else if (delta != null) {
    reasons.push(
      `${domainLabel}: candidate-vs-control delta ${delta.toFixed(1)} (not clearly more pressure)`,
    );
  }

  const premiseLayers =
    Number(foundationAdverse) + Number(decadeAdverse) + Number(annualAdverse);
  let status: HypothesisStatus;
  if (premiseLayers >= 2 && movedTowardPressure) {
    status = "REPRODUCED";
  } else if (
    (premiseLayers >= 1 && movedTowardPressure) ||
    (premiseLayers >= 2 && delta != null && delta <= 0)
  ) {
    status = "PARTIALLY_REPRODUCED";
  } else {
    status = "NOT_REPRODUCED";
  }

  return {
    status,
    reasons,
    controlScore,
    candidateScore,
    natalNet,
    decadeNet,
    annualNet,
    resonanceNet,
    delta,
  };
}

export function evaluateCaseAa10Hypotheses(result: AnnualAxesV10Result): {
  careerHypothesis: DomainHypothesisReport;
  romanceHypothesis: DomainHypothesisReport;
} {
  const career = result.axes.career;
  const romance = result.axes.romance;
  return {
    careerHypothesis: evaluatePressureHypothesis({
      controlScore: result.controlScores.career,
      candidateScore: career.finalScore,
      natalNet: career.natal.signedNet,
      decadeNet: career.decade.signedNet,
      annualNet: career.annual.signedNet,
      resonanceNet: career.resonance.signedNet,
      domainLabel: "career",
    }),
    romanceHypothesis: evaluatePressureHypothesis({
      controlScore: result.controlScores.romance,
      candidateScore: romance.finalScore,
      natalNet: romance.natal.signedNet,
      decadeNet: romance.decade.signedNet,
      annualNet: romance.annual.signedNet,
      resonanceNet: romance.resonance.signedNet,
      domainLabel: "romance",
    }),
  };
}
