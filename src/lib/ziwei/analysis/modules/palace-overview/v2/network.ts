import { oppositePalaceIndex, trineBranches } from "../../../frame/geometry";
import type { PalaceOverviewFormulaV2, PalaceV2NetworkWeights } from "./types";

export interface PalaceNetworkNode {
  palaceIndex: number;
  palaceBranch: string;
  isVcd: boolean;
  sAfterTt: number;
}

function networkWeights(
  isVcd: boolean,
  formula: PalaceOverviewFormulaV2,
): PalaceV2NetworkWeights {
  if (isVcd) {
    return {
      self: formula.network.vcdSelf,
      opposite: formula.network.vcdOpposite,
      trine1: formula.network.vcdTrine,
      trine2: formula.network.vcdTrine,
    };
  }
  return {
    self: formula.network.self,
    opposite: formula.network.opposite,
    trine1: formula.network.trine,
    trine2: formula.network.trine,
  };
}

function resolveNeighbors(
  focus: PalaceNetworkNode,
  nodes: PalaceNetworkNode[],
): {
  opposite: PalaceNetworkNode | null;
  trine1: PalaceNetworkNode | null;
  trine2: PalaceNetworkNode | null;
} {
  const byIndex = new Map(nodes.map((n) => [n.palaceIndex, n]));
  const opposite = byIndex.get(oppositePalaceIndex(focus.palaceIndex)) ?? null;
  const trineBranchList = trineBranches(focus.palaceBranch);
  const trines = nodes.filter((n) => trineBranchList.includes(n.palaceBranch));
  return {
    opposite,
    trine1: trines[0] ?? null,
    trine2: trines[1] ?? null,
  };
}

export function combineTp4c(
  focus: PalaceNetworkNode,
  nodes: PalaceNetworkNode[],
  formula: PalaceOverviewFormulaV2,
): {
  sCung: number;
  weights: PalaceV2NetworkWeights;
  neighborIndexes: {
    opposite: number | null;
    trine1: number | null;
    trine2: number | null;
  };
} {
  const weights = networkWeights(focus.isVcd, formula);
  const neighbors = resolveNeighbors(focus, nodes);
  const sCung =
    focus.sAfterTt * weights.self +
    (neighbors.opposite?.sAfterTt ?? 0) * weights.opposite +
    (neighbors.trine1?.sAfterTt ?? 0) * weights.trine1 +
    (neighbors.trine2?.sAfterTt ?? 0) * weights.trine2;
  return {
    sCung,
    weights,
    neighborIndexes: {
      opposite: neighbors.opposite?.palaceIndex ?? null,
      trine1: neighbors.trine1?.palaceIndex ?? null,
      trine2: neighbors.trine2?.palaceIndex ?? null,
    },
  };
}
