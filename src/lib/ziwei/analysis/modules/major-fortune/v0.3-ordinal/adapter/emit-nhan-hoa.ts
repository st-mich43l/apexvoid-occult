import type { MajorFortuneAdapterDiagnostics, MajorFortuneAdapterResolvedContext, AdapterEvidenceDraft } from "./types";
import type { MajorFortuneOrdinalPillarContext } from "../types";
import adapterPolicy from "./policy/adapter-policy.v0.3.json";
import { natalPrincipalsInPalace } from "./resolve-context";

const SRC = ["SRC-MF-V03-ADAPTER-AUX"];
const CLM = ["CLM-MF-V03-ADAPTER-AUX"];

interface AuxSet {
  setId: string;
  mode: string;
  members: string[];
}

function setComplete(present: ReadonlySet<string>, set: AuxSet): boolean {
  if (set.mode === "singleton") return set.members.some((m) => present.has(m));
  return set.members.every((m) => present.has(m));
}

function setPartial(present: ReadonlySet<string>, set: AuxSet): boolean {
  if (set.mode === "singleton") return false;
  const hits = set.members.filter((m) => present.has(m)).length;
  return hits > 0 && hits < set.members.length;
}

function voidTypesOnFocus(ctx: MajorFortuneAdapterResolvedContext): string[] {
  const branch = ctx.activePalaceBranch;
  const types: string[] = [];
  for (const marker of ctx.voidMarkers) {
    if ((marker.type === "Tuần" || marker.type === "Triệt") && marker.branches.includes(branch)) {
      types.push(marker.type);
    }
  }
  return [...new Set(types)];
}

export function emitNhanHoa(
  ctx: MajorFortuneAdapterResolvedContext,
  diagnostics: MajorFortuneAdapterDiagnostics,
): { evidence: AdapterEvidenceDraft[]; context: MajorFortuneOrdinalPillarContext } {
  const present = ctx.presentTp4cNatalStarNames;
  const focusNames = ctx.presentNatalStarNames;
  const evidence: AdapterEvidenceDraft[] = [];
  const cycleKey = `c${ctx.cycle.cycleIndex}-p${ctx.cycle.activePalaceIndex}`;

  const groups: Array<{ direction: "support" | "pressure"; sets: AuxSet[] }> = [
    { direction: "support", sets: adapterPolicy.auxiliarySets.support as AuxSet[] },
    { direction: "pressure", sets: adapterPolicy.auxiliarySets.pressure as AuxSet[] },
  ];

  for (const group of groups) {
    for (const set of group.sets) {
      const partial = setPartial(present, set);
      if (partial) {
        diagnostics.partialPairSets.push(`${set.setId}:${set.members.join("+")}`);
      }
      if (!setComplete(present, set) && !partial) continue;

      const membersPresent = set.members.filter((m) => present.has(m));
            const onFocus =
              set.mode === "singleton"
                ? membersPresent.some((m) => focusNames.has(m))
                : set.members.every((m) => focusNames.has(m));
      evidence.push({
        evidenceId: `mf-v03-aux-${cycleKey}-${set.setId}${partial ? "-partial" : ""}`,
        physicalFactId: `auxiliary-set:${ctx.cycle.activePalaceIndex}:${set.setId}:${membersPresent.join("+")}`,
        physicalFactKind: "auxiliary-set-member",
        evidenceClusterId: `cluster-aux:${cycleKey}:${set.setId}`,
        pillarId: "nhan-hoa",
        signalFamilyId: "support-pressure-auxiliary-sets",
        direction: group.direction,
        strength: partial ? "normal" : onFocus ? "strong" : "normal",
        temporalScope: "major-fortune",
        factIds: membersPresent.map((m) => `star:${m}`),
        sourceIds: SRC,
        claimIds: CLM,
        policyStatus: "research-admitted",
        schoolScope: ["nam-phai", "trung-chau"],
        reasonCode: partial ? `auxiliary-set-partial:${set.setId}` : `auxiliary-set:${set.setId}`,
      });
    }
  }

  const voids = voidTypesOnFocus(ctx);
  if (voids.length > 0) {
    const principals = natalPrincipalsInPalace(ctx.natalStarsInActivePalace);
    const bright = principals.map((s) => s.brightness);
    const vcd = principals.length === 0;
    const ham = principals.length > 0 && bright.every((b) => b === "Hãm");
    const mieuVuong = bright.some((b) => b === "Miếu" || b === "Vượng");
    const direction: "support" | "pressure" =
      vcd || ham || !mieuVuong ? "support" : "pressure";
    evidence.push({
      evidenceId: `mf-v03-aux-${cycleKey}-tuan-triet`,
      physicalFactId: `auxiliary-set:${ctx.cycle.activePalaceIndex}:tuan-triet:${voids.join("+")}`,
      physicalFactKind: "auxiliary-set-member",
      evidenceClusterId: `cluster-aux:${cycleKey}:tuan-triet`,
      pillarId: "nhan-hoa",
      signalFamilyId: "support-pressure-auxiliary-sets",
      direction,
      strength: "normal",
      temporalScope: "major-fortune",
      factIds: voids.map((v) => `void:${v}`),
      sourceIds: SRC,
      claimIds: CLM,
      policyStatus: "research-admitted",
      schoolScope: ["nam-phai", "trung-chau"],
      reasonCode: `tuan-triet:${voids.join("+")}:${direction}`,
    });
  }

  return {
    evidence,
    context: { availability: "available" },
  };
}
