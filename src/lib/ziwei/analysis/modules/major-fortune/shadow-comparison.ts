import type { MajorFortuneOrdinalPillarId } from "../../knowledge/major-fortune-scoring/v0.3-ordinal";
import type { MajorFortuneOrdinalV03Analysis } from "./v0.3-ordinal-adapter/types";
import type { MajorFortuneCandidateAnalysis } from "./v0.5-candidate/candidate";
import { createHash } from "node:crypto";

export interface MajorFortuneShadowComparison {
  baseline: MajorFortuneOrdinalV03Analysis;
  candidate: MajorFortuneCandidateAnalysis;

  status:
    | "equivalent"
    | "different"
    | "candidate-invalid"
    | "candidate-error";

  comparison: {
    scoreEqual: boolean;
    bandEqual: boolean;
    resultStatusEqual: boolean;
    scoreStateEqual: boolean;

    contextCoverageEqual: boolean;
    scoringCoverageEqual: boolean;

    pillarComparisons: Record<MajorFortuneOrdinalPillarId, {
      budgetEqual: boolean;
      stateEqual: boolean;
      levelEqual: boolean;
      deltaEqual: boolean;
      supportMassEqual: boolean;
      pressureMassEqual: boolean;
      acceptedEvidenceIdsEqual: boolean;
      rejectedEvidenceEqual: boolean;
      physicalFactIdsEqual: boolean;
      reasonCodesEqual: boolean;
    }>;

    diagnosticsEqual: boolean;
    adapterDiagnosticsEqual: boolean;

    differenceCodes: string[];
  };

  comparisonHash: string;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return false;
  }
  return true;
}

export function compareMajorFortuneAnalyses(
  baseline: MajorFortuneOrdinalV03Analysis,
  candidate: MajorFortuneCandidateAnalysis,
): MajorFortuneShadowComparison {
  const differenceCodes: string[] = [];

  const invalid = candidate.candidateStatus === "invalid-knowledge" ||
                  candidate.candidateStatus === "invalid-admission" ||
                  candidate.candidateStatus === "unavailable-context" ||
                  candidate.adapterDiagnostics.notes.includes("failed-to-load-registry") ||
                  candidate.adapterDiagnostics.notes.includes("invalid-knowledge");

  if (invalid) {
    differenceCodes.push("candidate-invalid");
  } else if (!candidate.result && baseline.result) {
    differenceCodes.push("candidate-result-missing");
  }

  const scoreEqual = baseline.result?.score === candidate.result?.score;
  const bandEqual = baseline.result?.band === candidate.result?.band;
  const resultStatusEqual = baseline.result?.status === candidate.result?.status;
  const scoreStateEqual = baseline.result?.scoreState === candidate.result?.scoreState;

  if (!scoreEqual) differenceCodes.push("score-mismatch");
  if (!bandEqual) differenceCodes.push("band-mismatch");
  if (!resultStatusEqual) differenceCodes.push("result-status-mismatch");
  if (!scoreStateEqual) differenceCodes.push("score-state-mismatch");

  const contextCoverageEqual = baseline.result?.coverage.contextCoverageWeight === candidate.result?.coverage.contextCoverageWeight;
  const scoringCoverageEqual = baseline.result?.coverage.scoringCoverageWeight === candidate.result?.coverage.scoringCoverageWeight;

  if (!contextCoverageEqual) differenceCodes.push("context-coverage-mismatch");
  if (!scoringCoverageEqual) differenceCodes.push("scoring-coverage-mismatch");

  const pillars: MajorFortuneOrdinalPillarId[] = ["thien-thoi", "dia-loi", "nhan-hoa", "tu-hoa-sat-tinh"];
  const pillarComparisons = {} as Record<MajorFortuneOrdinalPillarId, any>;

  for (const pillar of pillars) {
    const bp = baseline.result?.pillars[pillar as MajorFortuneOrdinalPillarId];
    const cp = candidate.result?.pillars[pillar as MajorFortuneOrdinalPillarId];

    if (!bp && !cp) {
      pillarComparisons[pillar] = {
        budgetEqual: true, stateEqual: true, levelEqual: true, deltaEqual: true,
        supportMassEqual: true, pressureMassEqual: true, acceptedEvidenceIdsEqual: true,
        rejectedEvidenceEqual: true, physicalFactIdsEqual: true, reasonCodesEqual: true,
      };
      continue;
    }
    
    if (!bp || !cp) {
      differenceCodes.push(`pillar-missing-${pillar}`);
      pillarComparisons[pillar] = {
        budgetEqual: false, stateEqual: false, levelEqual: false, deltaEqual: false,
        supportMassEqual: false, pressureMassEqual: false, acceptedEvidenceIdsEqual: false,
        rejectedEvidenceEqual: false, physicalFactIdsEqual: false, reasonCodesEqual: false,
      };
      continue;
    }

    const budgetEqual = bp.budget === cp.budget;
    const stateEqual = bp.state === cp.state;
    const levelEqual = bp.level === cp.level;
    const deltaEqual = bp.delta === cp.delta;
    const supportMassEqual = bp.supportMass === cp.supportMass;
    const pressureMassEqual = bp.pressureMass === cp.pressureMass;

    const bAcc = bp.acceptedEvidenceIds;
    const cAcc = cp.acceptedEvidenceIds;
    const acceptedEvidenceIdsEqual = arraysEqual(bAcc, cAcc);

    const bRej = bp.rejectedEvidence.map((r: any) => `${r.evidenceId}:${r.reason}:${r.detail ?? ""}`).sort();
    const cRej = cp.rejectedEvidence.map((r: any) => `${r.evidenceId}:${r.reason}:${r.detail ?? ""}`).sort();
    const rejectedEvidenceEqual = arraysEqual(bRej, cRej);

    const physicalFactIdsEqual = arraysEqual(bp.physicalFactIds, cp.physicalFactIds);
    const reasonCodesEqual = arraysEqual(bp.reasonCodes, cp.reasonCodes);

    pillarComparisons[pillar] = {
      budgetEqual, stateEqual, levelEqual, deltaEqual, supportMassEqual, pressureMassEqual,
      acceptedEvidenceIdsEqual, rejectedEvidenceEqual, physicalFactIdsEqual, reasonCodesEqual,
    };

    if (!budgetEqual) differenceCodes.push(`pillar-budget-${pillar}`);
    if (!stateEqual) differenceCodes.push(`pillar-state-${pillar}`);
    if (!levelEqual) differenceCodes.push(`pillar-level-${pillar}`);
    if (!deltaEqual) differenceCodes.push(`pillar-delta-${pillar}`);
    if (!supportMassEqual) differenceCodes.push(`pillar-support-mass-${pillar}`);
    if (!pressureMassEqual) differenceCodes.push(`pillar-pressure-mass-${pillar}`);
    if (!acceptedEvidenceIdsEqual) differenceCodes.push(`pillar-accepted-evidence-${pillar}`);
    if (!rejectedEvidenceEqual) differenceCodes.push(`pillar-rejected-evidence-${pillar}`);
    if (!physicalFactIdsEqual) differenceCodes.push(`pillar-physical-facts-${pillar}`);
    if (!reasonCodesEqual) differenceCodes.push(`pillar-reason-codes-${pillar}`);
  }

  const serializeResultDiagnostics = (d: any) => {
    if (!d) return "";
    return JSON.stringify(d);
  };
  const diagnosticsEqual = serializeResultDiagnostics(baseline.result?.diagnostics) === serializeResultDiagnostics(candidate.result?.diagnostics);
  if (!diagnosticsEqual) differenceCodes.push("diagnostics-mismatch");

  const serializeAdapterDiagnostics = (d: any) => {
    return JSON.stringify(Object.fromEntries(Object.entries(d).map(([k, v]) => {
      if (Array.isArray(v)) return [k, [...v].sort()];
      return [k, v];
    })));
  };
  const adapterDiagnosticsEqual = serializeAdapterDiagnostics(baseline.adapterDiagnostics) === serializeAdapterDiagnostics(candidate.adapterDiagnostics);
  if (!adapterDiagnosticsEqual) differenceCodes.push("adapter-diagnostics-mismatch");

  let status: MajorFortuneShadowComparison["status"] = "equivalent";
  if (invalid || differenceCodes.includes("candidate-invalid")) {
    status = "candidate-invalid";
  } else if (differenceCodes.length > 0) {
    status = "different";
  }

  const hashContent = JSON.stringify({
    status,
    differenceCodes: [...differenceCodes].sort(),
  });
  const comparisonHash = createHash("sha256").update(hashContent).digest("hex");

  return {
    baseline,
    candidate,
    status,
    comparison: {
      scoreEqual,
      bandEqual,
      resultStatusEqual,
      scoreStateEqual,
      contextCoverageEqual,
      scoringCoverageEqual,
      pillarComparisons,
      diagnosticsEqual,
      adapterDiagnosticsEqual,
      differenceCodes,
    },
    comparisonHash,
  };
}
