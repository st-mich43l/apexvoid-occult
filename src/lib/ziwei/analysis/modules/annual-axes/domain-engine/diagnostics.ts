import type { StaticDomainAggregate } from "./types";

export function staticDomainDiagnostics(agg: StaticDomainAggregate): {
  admittedEvidenceCount: number;
  unresolvedPalaceCount: number;
  temporalContaminationCount: number;
} {
  const admittedEvidenceCount = agg.evidence.filter(
    (e) => e.adjudication === "admitted",
  ).length;
  const unresolvedPalaceCount = agg.palaceContexts.filter((c) => c.unresolved).length;
  const temporalContaminationCount = agg.evidence.filter(
    (e) => e.temporalLayer !== "natal",
  ).length;
  return {
    admittedEvidenceCount,
    unresolvedPalaceCount,
    temporalContaminationCount,
  };
}
