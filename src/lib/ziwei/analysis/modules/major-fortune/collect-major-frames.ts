import type { ChartData, ChartPalace } from "@/types/chart";
import type { MajorFortuneDomain } from "../../contracts/major-fortune";
import type { MajorFortuneDomainDefinitionsCatalog } from "../../knowledge/major-fortune-scoring";
import type { ResolvedMajorFortuneContext } from "./resolve-context";
import type { MajorFortuneDiagnostics, MajorFortuneFrameRole, MajorFortuneScope } from "./types";

export interface MajorFrameNode {
  palaceIndex: number;
  natalPalaceName: string;
  palaceBranch: string;
  /** This node's own resolved Major Fortune ("trùng bài") label, read
   * directly from the physical palace — never backfilled from
   * `natalPalaceName`. */
  majorPalaceName: string | null;
  role: MajorFortuneFrameRole;
}

export interface MajorFortuneFrame {
  scope: MajorFortuneScope;
  domainId: MajorFortuneDomain | null;
  frameWeight: number;
  nodes: MajorFrameNode[];
}

function toFrameNode(palace: ChartPalace, role: MajorFortuneFrameRole): MajorFrameNode {
  return {
    palaceIndex: palace.index,
    natalPalaceName: palace.name,
    palaceBranch: palace.branch,
    majorPalaceName: palace.majorPalaceName ?? null,
    role,
  };
}

function buildFrame(
  chart: ChartData,
  focusIndex: number,
  geometry: MajorFortuneDomainDefinitionsCatalog["overall"]["frameGeometry"],
  scope: MajorFortuneScope,
  domainId: MajorFortuneDomain | null,
  frameWeight: number,
  diagnostics: MajorFortuneDiagnostics,
): MajorFortuneFrame | null {
  const { oppositeOffset, trineOffsets, modulo } = geometry;
  const indices: Array<{ index: number; role: MajorFortuneFrameRole }> = [
    { index: focusIndex, role: "focus" },
    { index: (focusIndex + oppositeOffset) % modulo, role: "opposite" },
    ...trineOffsets.map((offset) => ({ index: (focusIndex + offset) % modulo, role: "trine" as const })),
  ];

  const nodes: MajorFrameNode[] = [];
  for (const { index, role } of indices) {
    const palace = chart.palaces.find((p) => p.index === index);
    if (!palace) {
      diagnostics.missingFrameNodes.push(`${scope}:${domainId ?? "overall"}:${role}:${index}`);
      continue;
    }
    nodes.push(toFrameNode(palace, role));
  }

  if (nodes.length === 0) return null;
  return { scope, domainId, frameWeight, nodes };
}

/**
 * Overall anchor: focus = the already-resolved active Major Fortune palace
 * index. Pure index arithmetic — no label lookup needed since Calculation
 * Core already resolved the physical palace.
 */
export function collectOverallFrame(
  chart: ChartData,
  resolvedContext: ResolvedMajorFortuneContext,
  domainDefinitions: MajorFortuneDomainDefinitionsCatalog,
  diagnostics: MajorFortuneDiagnostics,
): MajorFortuneFrame | null {
  return buildFrame(
    chart,
    resolvedContext.activePalaceIndex,
    domainDefinitions.overall.frameGeometry,
    "overall",
    null,
    1.0,
    diagnostics,
  );
}

/**
 * Domain anchors: one physical palace per domain, matched by the
 * already-resolved `majorPalaceName` map — never natal `palace.name`. Only
 * called when `resolvedContext.majorPalaceLabels` holds a complete,
 * duplicate-free 12-entry map (enforced by resolve-context.ts).
 */
export function collectDomainFrames(
  chart: ChartData,
  resolvedContext: ResolvedMajorFortuneContext,
  domainDefinitions: MajorFortuneDomainDefinitionsCatalog,
  diagnostics: MajorFortuneDiagnostics,
): Map<MajorFortuneDomain, MajorFortuneFrame> {
  const frames = new Map<MajorFortuneDomain, MajorFortuneFrame>();
  const labels = resolvedContext.majorPalaceLabels;
  if (!labels) return frames;

  const indexByDomain = new Map<MajorFortuneDomain, number>();
  for (const [palaceIndex, domainId] of labels) indexByDomain.set(domainId, palaceIndex);

  for (const domainDefinition of domainDefinitions.domains) {
    const anchorIndex = indexByDomain.get(domainDefinition.domainId);
    if (anchorIndex === undefined) continue;

    const frame = buildFrame(
      chart,
      anchorIndex,
      domainDefinitions.overall.frameGeometry,
      "domain",
      domainDefinition.domainId,
      domainDefinition.frameWeight,
      diagnostics,
    );
    if (frame) frames.set(domainDefinition.domainId, frame);
  }

  return frames;
}
