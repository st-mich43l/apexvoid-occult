import { addAxes, emptyAxes, type PalaceEvidence, type PalaceEvidenceAxes } from "../types";

interface EvidenceContributionTrace {
  evidenceId: string;
  physicalIdentity: string;
  category: PalaceEvidence["category"];
  contributionKind: NonNullable<PalaceEvidence["contributionKind"]>;
  palaceName: string;
  geometryRole: PalaceEvidence["palaceRole"];
  factIds: string[];
  familyId?: string;
  ruleId?: string;
  transformation?: string;
  transformationCellId?: string;
  borrowedFromOpposite?: boolean;
  diminishingRank?: number;
  diminishingFactor?: number;
  axes: PalaceEvidenceAxes;
  sourceIds: string[];
  knowledgeStatus: PalaceEvidence["knowledgeStatus"];
}

export interface ScoringTrace {
  palaceName: string;
  score: number;
  band: string;
  qualityRaw: number;
  formula: "logistic(support - pressure)";
  rawAxes: PalaceEvidenceAxes;
  contributions: EvidenceContributionTrace[];
  duplicatePhysicalIdentities: string[];
}

export function physicalIdentityKey(ev: PalaceEvidence): string {
  if (ev.category === "structural-rule") {
    return `interaction:${ev.ruleId ?? ev.id}`;
  }
  if (ev.borrowedFromOpposite) {
    return `borrow-major:${[...ev.factIds].sort().join(",")}`;
  }
  if (ev.category === "void-environment") {
    return ev.id;
  }
  return `${ev.category}:${[...ev.factIds].sort().join(",")}:${ev.palaceRole}:${ev.starName ?? ""}`;
}

function defaultContributionKind(
  ev: PalaceEvidence,
): NonNullable<PalaceEvidence["contributionKind"]> {
  if (ev.contributionKind) return ev.contributionKind;
  if (ev.category === "structural-rule") return "interaction-delta";
  if (ev.category === "void-environment") return "context";
  return "component";
}

export function buildScoringTrace(input: {
  palaceName: string;
  score: number;
  band: string;
  rawAxes: PalaceEvidenceAxes;
  evidence: PalaceEvidence[];
}): ScoringTrace {
  const contributions: EvidenceContributionTrace[] = input.evidence.map((ev) => ({
    evidenceId: ev.id,
    physicalIdentity: physicalIdentityKey(ev),
    category: ev.category,
    contributionKind: defaultContributionKind(ev),
    palaceName: ev.palaceName,
    geometryRole: ev.palaceRole,
    factIds: ev.factIds,
    familyId: ev.familyId,
    ruleId: ev.ruleId,
    transformation: ev.transformation,
    transformationCellId: ev.transformationCellId,
    borrowedFromOpposite: ev.borrowedFromOpposite,
    diminishingRank: ev.diminishingRank,
    diminishingFactor: ev.diminishingFactor,
    axes: ev.axes,
    sourceIds: ev.sourceIds,
    knowledgeStatus: ev.knowledgeStatus,
  }));

  const seen = new Map<string, number>();
  for (const c of contributions) {
    if (c.category === "void-environment") continue;
    if (c.contributionKind === "interaction-delta") continue;
    seen.set(c.physicalIdentity, (seen.get(c.physicalIdentity) ?? 0) + 1);
  }
  const duplicatePhysicalIdentities = [...seen.entries()]
    .filter(([, n]) => n > 1)
    .map(([k]) => k);

  return {
    palaceName: input.palaceName,
    score: input.score,
    band: input.band,
    qualityRaw: input.rawAxes.support - input.rawAxes.pressure,
    formula: "logistic(support - pressure)",
    rawAxes: input.rawAxes,
    contributions,
    duplicatePhysicalIdentities,
  };
}

export function sumTracedAxes(trace: ScoringTrace): PalaceEvidenceAxes {
  return trace.contributions.reduce(
    (acc, item) => addAxes(acc, item.axes),
    emptyAxes(),
  );
}
