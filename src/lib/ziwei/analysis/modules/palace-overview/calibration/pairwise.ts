import type { ExpertPairwiseReview } from "./benchmark-v2-types";

export interface PairwiseAgreement {
  compared: number;
  agree: number;
  rate: number | null;
}

export function pairwiseAgreement(
  left: ExpertPairwiseReview[],
  right: ExpertPairwiseReview[],
): PairwiseAgreement {
  const key = (p: ExpertPairwiseReview) =>
    `${p.caseId}:${p.school}:${p.axis}:${p.leftPalace}:${p.rightPalace}`;
  const b = new Map(right.map((p) => [key(p), p]));
  let compared = 0;
  let agree = 0;
  for (const a of left) {
    const other = b.get(key(a));
    if (!other) continue;
    if (a.result === "UNABLE_TO_JUDGE" || other.result === "UNABLE_TO_JUDGE") continue;
    compared += 1;
    if (a.result === other.result) agree += 1;
  }
  return { compared, agree, rate: compared === 0 ? null : agree / compared };
}

export function pairwiseConsensus(reviews: ExpertPairwiseReview[]): {
  units: number;
  unanimous: number;
  tied: number;
} {
  const groups = new Map<string, ExpertPairwiseReview[]>();
  for (const p of reviews) {
    if (p.result === "UNABLE_TO_JUDGE") continue;
    const k = `${p.caseId}:${p.school}:${p.axis}:${p.leftPalace}:${p.rightPalace}`;
    const list = groups.get(k) ?? [];
    list.push(p);
    groups.set(k, list);
  }
  let unanimous = 0;
  let tied = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const results = new Set(group.map((g) => g.result));
    if (results.size === 1) unanimous += 1;
    else tied += 1;
  }
  return { units: groups.size, unanimous, tied };
}

export function comparisonGraphConnectivity(reviews: ExpertPairwiseReview[]): {
  nodes: number;
  edges: number;
  components: number;
} {
  const nodes = new Set<string>();
  const adj = new Map<string, Set<string>>();
  for (const p of reviews) {
    if (p.result === "UNABLE_TO_JUDGE") continue;
    const a = `${p.caseId}:${p.leftPalace}`;
    const b = `${p.caseId}:${p.rightPalace}`;
    nodes.add(a);
    nodes.add(b);
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }
  const seen = new Set<string>();
  let components = 0;
  for (const n of nodes) {
    if (seen.has(n)) continue;
    components += 1;
    const stack = [n];
    while (stack.length) {
      const cur = stack.pop()!;
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const nxt of adj.get(cur) ?? []) stack.push(nxt);
    }
  }
  let edges = 0;
  for (const [, ns] of adj) edges += ns.size;
  return { nodes: nodes.size, edges: edges / 2, components };
}

const RANK: Record<string, number> = { low: 0, medium: 1, high: 2 };

export function withinChartRankAgreement(
  ratingsA: Array<{ palaceName: string; value: string }>,
  ratingsB: Array<{ palaceName: string; value: string }>,
): { pairs: number; concordant: number; rate: number | null } {
  const b = new Map(ratingsB.map((r) => [r.palaceName, r.value]));
  const shared: Array<{ palace: string; a: number; b: number }> = [];
  for (const r of ratingsA) {
    const ov = b.get(r.palaceName);
    if (ov == null || RANK[r.value] == null || RANK[ov] == null) continue;
    shared.push({ palace: r.palaceName, a: RANK[r.value]!, b: RANK[ov]! });
  }
  let pairs = 0;
  let concordant = 0;
  for (let i = 0; i < shared.length; i++) {
    for (let j = i + 1; j < shared.length; j++) {
      const da = shared[i]!.a - shared[j]!.a;
      const db = shared[i]!.b - shared[j]!.b;
      if (da === 0 || db === 0) continue;
      pairs += 1;
      if (da * db > 0) concordant += 1;
    }
  }
  return { pairs, concordant, rate: pairs === 0 ? null : concordant / pairs };
}
