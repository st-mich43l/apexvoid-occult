import type { MutagenRecord } from "@/types/chart";
import type { MajorFortuneAdapterDiagnostics, MajorFortuneAdapterResolvedContext, AdapterEvidenceDraft } from "./types";
import type { MajorFortuneOrdinalPillarContext } from "../types";
import { isMajorFortuneV04NamPhaiTransformationsEnabled } from "../../../../feature-flags";
import adapterPolicy from "./policy/adapter-policy.v0.3.json";
import { frameRoleForIndex, type MajorFortuneFrameRole } from "./frame-tp4c";

const SRC = ["SRC-MF-V03-ADAPTER-XF"];
const CLM = ["CLM-MF-V03-ADAPTER-XF"];

const XF = adapterPolicy.namPhaiTransformations as {
  scoreLuckStemMutagens: boolean;
  scoreNatalMutagens: boolean;
  natalKyOnTp4c: boolean;
  natalCatHoaFocusOnly: boolean;
};

function isKy(canonicalType: string): boolean {
  return canonicalType === "Hóa Kỵ";
}

function admitsTransformation(
  canonicalType: string,
  role: MajorFortuneFrameRole | null,
  layer: "decade" | "natal",
): boolean {
  if (!role) return false;
  if (layer === "decade" && !XF.scoreLuckStemMutagens) {
    return false;
  }
  if (isKy(canonicalType)) {
    return layer !== "natal" || XF.natalKyOnTp4c;
  }
  if (layer === "natal" && XF.natalCatHoaFocusOnly) {
    return role === "focus";
  }
  return role === "focus";
}

function emitLayer(
  ctx: MajorFortuneAdapterResolvedContext,
  diagnostics: MajorFortuneAdapterDiagnostics,
  records: readonly MutagenRecord[],
  layer: "decade" | "natal",
  stem: string,
): AdapterEvidenceDraft[] {
  const polarity = adapterPolicy.transformationPolarity as Record<
    string,
    { direction: "support" | "pressure"; strength: "normal" | "strong" }
  >;
  const aliases = adapterPolicy.calculationCoreMutagenAliases as Record<string, string>;
  const activeIndex = ctx.cycle.activePalaceIndex;
  const cycleKey = `c${ctx.cycle.cycleIndex}-p${activeIndex}`;
  const evidence: AdapterEvidenceDraft[] = [];

  for (const xf of records) {
    const canonicalType = aliases[xf.mutagen] ?? null;
    if (!canonicalType) {
      diagnostics.notes.push(`unknown-transformation-type:${xf.mutagen}`);
      continue;
    }
    const mapped = polarity[canonicalType];
    if (!mapped) {
      diagnostics.notes.push(`unmapped-transformation-polarity:${canonicalType}`);
      continue;
    }

    const targetPalace = xf.palace?.name ?? null;
    const targetIndex = xf.palace?.index;
    if (!targetPalace || targetIndex === undefined || !xf.starName || !xf.mutagen) {
      diagnostics.incompleteTransformationTuples.push(
        `${layer}:${xf.mutagen}:${xf.starName ?? "?"}:missing-target`,
      );
      continue;
    }

    const role: MajorFortuneFrameRole | null = frameRoleForIndex(targetIndex, activeIndex);
    if (!admitsTransformation(canonicalType, role, layer)) {
      diagnostics.outOfFrameTransformationCount += 1;
      diagnostics.notes.push(
        `out-of-frame-transformation:${layer}:${canonicalType}:${xf.starName}:target=${targetIndex}:active=${activeIndex}`,
      );
      continue;
    }

    const strength =
      role === "focus" || isKy(canonicalType) ? mapped.strength : "normal";

    evidence.push({
      evidenceId: `mf-v03-xf-${layer}-${cycleKey}-${canonicalType}-${xf.starName}-${targetIndex}`,
      physicalFactId: `mf-xf:${layer}:${stem}:${canonicalType}:${xf.starName}:${targetIndex}`,
      physicalFactKind: "major-fortune-transformation",
      evidenceClusterId: `cluster-xf:${layer}:${cycleKey}:${canonicalType}:${xf.starName}`,
      pillarId: "tu-hoa-sat-tinh",
      signalFamilyId: "major-fortune-transformations",
      direction: mapped.direction,
      strength,
      temporalScope: "major-fortune",
      factIds: [
        `layer:${layer}`,
        `sourceStem:${stem}`,
        `transformationType:${canonicalType}`,
        `transformedStar:${xf.starName}`,
        `targetPalace:${targetPalace}`,
        `targetPalaceIndex:${targetIndex}`,
        `frameRole:${role}`,
        `coreMutagenLabel:${xf.mutagen}`,
      ],
      sourceIds: SRC,
      claimIds: CLM,
      policyStatus: "research-admitted",
      schoolScope: ctx.school === "nam-phai" ? ["nam-phai"] : ["trung-chau"],
      reasonCode: `transformation:${layer}:${canonicalType}`,
      transformationTuple: {
        fortuneStem: stem,
        transformationType: canonicalType,
        transformedStar: xf.starName,
        targetPalace,
        targetPalaceIndex: targetIndex,
      },
    });
  }

  return evidence;
}

export function emitTuHoaSatTinh(
  ctx: MajorFortuneAdapterResolvedContext,
  diagnostics: MajorFortuneAdapterDiagnostics,
): { evidence: AdapterEvidenceDraft[]; context: MajorFortuneOrdinalPillarContext } {
  if (ctx.school === "nam-phai" && !isMajorFortuneV04NamPhaiTransformationsEnabled()) {
    diagnostics.namPhaiTransformationBlocked.push(
      "Nam Phái transformations not admitted by V0.3 scoring policy — capability now exists but policy gate not lifted yet",
    );
    return {
      evidence: [],
      context: {
        availability: "partial-data",
        reasonCodes: ["nam-phai-transformations-not-admitted-v03-policy"],
      },
    };
  }

  const natalStem = ctx.yearStem ?? ctx.menhPalace?.stem ?? "natal";
  const natalEvidence = XF.scoreNatalMutagens
    ? emitLayer(
        ctx,
        diagnostics,
        ctx.natalTransformations,
        "natal",
        natalStem,
      )
    : [];

  const useLuckStem = XF.scoreLuckStemMutagens;

  if (useLuckStem && !ctx.fortuneStem) {
    return {
      evidence: natalEvidence,
      context: {
        availability: natalEvidence.length > 0 ? "available" : "partial-data",
        reasonCodes: ["missing-fortune-stem"],
      },
    };
  }

  const decadeEvidence =
    useLuckStem && ctx.fortuneStem
      ? emitLayer(
          ctx,
          diagnostics,
          ctx.transformations,
          "decade",
          ctx.fortuneStem,
        )
      : [];
  const evidence = [...natalEvidence, ...decadeEvidence];

  return {
    evidence,
    context: {
      availability: "available",
      reasonCodes:
        evidence.length === 0 ? ["no-direct-major-fortune-transformation"] : undefined,
    },
  };
}
