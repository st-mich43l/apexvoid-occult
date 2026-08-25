import type { PalaceEvidence, PalaceEvidenceAxes, PalaceOverviewResult } from "../../types";
import { addAxes, emptyAxes } from "../../types";
import type {
  AxisBucket,
  PalaceStructuralDecomposition,
} from "./types";

function netOf(axes: PalaceEvidenceAxes): number {
  return axes.support - axes.pressure;
}

function bucketFromEvidence(
  evidence: PalaceEvidence[],
  contributionPath: string,
): AxisBucket {
  const axes = evidence.reduce((acc, e) => addAxes(acc, e.axes), emptyAxes());
  const contributors = evidence
    .map((e) => ({
      id: e.id,
      label: e.label,
      category: e.category,
      palaceRole: e.palaceRole,
      physicalFactIds: [...e.factIds].sort((a, b) => a.localeCompare(b)),
      support: e.axes.support,
      pressure: e.axes.pressure,
      net: netOf(e.axes),
      contributionPath,
      contributionKind: e.contributionKind ?? "component",
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  return {
    support: axes.support,
    pressure: axes.pressure,
    stability: axes.stability,
    activation: axes.activation,
    net: netOf(axes),
    evidenceCount: evidence.length,
    contributors: contributors.slice(0, 12),
  };
}

/**
 * Classify production allEvidence into local vs remote structural buckets.
 *
 * Local = focus-palace physical components + focus-attributed formations/void.
 * Context = opposite + trine evidence only (already geometry-weighted).
 *
 * Structural rules remain interaction-deltas on focus; audited separately
 * for possible double-description with base star components.
 */
export function decomposePalaceEvidence(
  result: PalaceOverviewResult,
): PalaceStructuralDecomposition {
  const all = result.allEvidence;
  const opposite = all.filter((e) => e.palaceRole === "opposite");
  const trine = all.filter((e) => e.palaceRole === "trine");
  const formations = all.filter((e) => e.category === "structural-rule");
  const voidEnv = all.filter((e) => e.category === "void-environment");
  const transformations = all.filter((e) => e.category === "transformation");
  const minor = all.filter((e) => e.category === "minor-star-family");
  const changSheng = all.filter((e) => e.category === "chang-sheng");

  const localUnique = all.filter(
    (e) =>
      e.palaceRole === "focus" &&
      (e.category === "major-star" ||
        e.category === "transformation" ||
        e.category === "minor-star-family" ||
        e.category === "chang-sheng" ||
        e.category === "structural-rule" ||
        e.category === "void-environment"),
  );

  const local = bucketFromEvidence(localUnique, "local/focus");
  const oppositeBucket = bucketFromEvidence(opposite, "context/opposite");
  const trineBucket = bucketFromEvidence(trine, "context/trine");
  const trineBranches = [...new Set(trine.map((e) => e.palaceBranch))].sort(
    (a, b) => a.localeCompare(b),
  );
  const trineByBranch = trineBranches.map((branch) => ({
    branch,
    bucket: bucketFromEvidence(
      trine.filter((e) => e.palaceBranch === branch),
      `context/trine/${branch}`,
    ),
  }));
  const context = bucketFromEvidence([...opposite, ...trine], "context/remote");
  const combinedAdditive = bucketFromEvidence(all, "control-additive");

  const absLocal = Math.abs(local.net);
  const absContext = Math.abs(context.net);
  const denom = absLocal + absContext;
  const localNetShare = denom > 1e-9 ? absLocal / denom : null;
  const remoteShare = denom > 1e-9 ? absContext / denom : null;

  const flags: string[] = [];
  if (remoteShare != null && remoteShare > 0.55 && result.score >= 80) {
    flags.push("TP4C_CONTEXT_DOMINANCE");
  }
  if (remoteShare != null && remoteShare > 0.45 && result.score >= 85) {
    flags.push("REMOTE_NEAR_CEILING");
  }

  const factPaths = new Map<string, Set<string>>();
  for (const e of all) {
    const path = `${e.category}:${e.palaceRole}:${e.contributionKind ?? "component"}`;
    for (const fid of e.factIds) {
      const set = factPaths.get(fid) ?? new Set<string>();
      set.add(path);
      factPaths.set(fid, set);
    }
  }
  for (const [fid, paths] of factPaths) {
    if (paths.size < 2) continue;
    const hasStar = [...paths].some(
      (p) => p.includes("major-star") || p.includes("minor-star"),
    );
    const hasFormation = [...paths].some((p) => p.includes("structural-rule"));
    if (hasStar && hasFormation) {
      flags.push(`POSSIBLE_FORMATION_DOUBLE:${fid}`);
    }
  }

  return {
    palaceIndex: result.palaceIndex,
    palaceName: result.palaceName,
    palaceBranch: result.palaceBranch,
    controlScore: result.score,
    local,
    opposite: oppositeBucket,
    oppositeBranch: opposite[0]?.palaceBranch ?? null,
    trine: trineBucket,
    trineByBranch,
    formations: bucketFromEvidence(formations, "formation/interaction-delta"),
    transformations: bucketFromEvidence(transformations, "all/transformation"),
    minor: bucketFromEvidence(minor, "all/minor"),
    changSheng: bucketFromEvidence(changSheng, "all/chang-sheng"),
    voidEnv: bucketFromEvidence(voidEnv, "local/void"),
    context,
    combinedAdditive,
    localNetShare,
    remoteShare,
    flags: [...new Set(flags)].sort((a, b) => a.localeCompare(b)),
  };
}
