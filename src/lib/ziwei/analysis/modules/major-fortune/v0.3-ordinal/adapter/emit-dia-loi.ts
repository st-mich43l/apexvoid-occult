import type { ChartStar } from "@/types/chart";
import type { MajorFortuneAdapterDiagnostics, MajorFortuneAdapterResolvedContext, AdapterEvidenceDraft } from "./types";
import type { MajorFortuneOrdinalPillarContext } from "../types";
import adapterPolicy from "./policy/adapter-policy.v0.3.json";
import { natalPrincipalsInPalace } from "./resolve-context";
import { natalStarsOf } from "./natal-star";
import { oppositePalaceIndex, trinePalaceIndices, type MajorFortuneFrameRole } from "./frame-tp4c";
import { correctedBrightness } from "../../../../knowledge/corrected-brightness";

const SRC = ["SRC-MF-V03-ADAPTER-DIGNITY"];
const CLM = ["CLM-MF-V03-ADAPTER-DIGNITY"];

type DignityMap = Record<
  string,
  { direction: "support" | "pressure"; strength: "normal" | "strong" } | null
>;

function natalStars(palace: { stars?: ChartStar[] } | undefined): ChartStar[] {
  return natalStarsOf(palace?.stars);
}

function mappedStrength(
  brightness: string,
  role: MajorFortuneFrameRole,
): { direction: "support" | "pressure"; strength: "normal" | "strong" } | null | undefined {
  const mapped = (adapterPolicy.dignityMapping as DignityMap)[brightness];
  if (mapped === undefined || mapped === null) return mapped;
  if (role === "focus") {
    if (brightness === "Miếu" || brightness === "Vượng") {
      return { direction: mapped.direction, strength: "strong" };
    }
    return mapped;
  }
  return { direction: mapped.direction, strength: "normal" };
}

export function emitDiaLoi(
  ctx: MajorFortuneAdapterResolvedContext,
  diagnostics: MajorFortuneAdapterDiagnostics,
): { evidence: AdapterEvidenceDraft[]; context: MajorFortuneOrdinalPillarContext } {
  const focusIndex = ctx.cycle.activePalaceIndex;
  const oppIndex = oppositePalaceIndex(focusIndex);
  const [trineA, trineB] = trinePalaceIndices(focusIndex);
  const byIndex = (i: number) => ctx.palaces.find((p) => p.index === i);

  const focusPrincipals = natalPrincipalsInPalace(ctx.natalStarsInActivePalace);
  const evidence: AdapterEvidenceDraft[] = [];
  let missingBrightness = false;
  let unsupported = false;
  const cycleKey = `c${ctx.cycle.cycleIndex}-p${focusIndex}`;

  const pushStar = (
    star: ChartStar,
    palaceIndex: number,
    role: MajorFortuneFrameRole,
    borrowed: boolean,
  ) => {
    const host = byIndex(palaceIndex);
    const brightness = correctedBrightness(
      star.name,
      host?.branch ?? "",
      star.brightness,
    );
    if (!brightness) {
      if (role === "focus" || borrowed) missingBrightness = true;
      return;
    }
    const mapped = mappedStrength(brightness, borrowed ? "opposite" : role);
    if (mapped === undefined) {
      unsupported = true;
      diagnostics.unsupportedBrightness.push(`${star.name}:${brightness}`);
      return;
    }
    if (mapped === null) return;

    evidence.push({
      evidenceId: `mf-v03-dig-${cycleKey}-${role}-${palaceIndex}-${star.name}-${brightness}`,
      physicalFactId: `principal-dignity:${palaceIndex}:${star.name}:${brightness}`,
      physicalFactKind: "principal-star-dignity",
      evidenceClusterId: `cluster-dignity:${cycleKey}:${palaceIndex}:${star.name}`,
      pillarId: "dia-loi",
      signalFamilyId: "principal-star-dignity",
      direction: mapped.direction,
      strength: mapped.strength,
      temporalScope: "major-fortune",
      factIds: [
        `star:${star.name}`,
        `brightness:${brightness}`,
        `palaceIndex:${palaceIndex}`,
        `frameRole:${role}`,
        ...(borrowed ? ["borrowed-opposite"] : []),
      ],
      sourceIds: SRC,
      claimIds: CLM,
      policyStatus: "research-admitted",
      schoolScope: ["nam-phai", "trung-chau"],
      reasonCode: borrowed
        ? `dignity-borrow:${brightness}`
        : `dignity:${brightness}`,
    });
  };

  if (focusPrincipals.length === 0) {
    const oppPalace = byIndex(oppIndex);
    const borrowed = natalPrincipalsInPalace(natalStars(oppPalace));
    if (borrowed.length === 0) {
      return {
        evidence: [],
        context: {
          availability: "available",
          reasonCodes: ["vo-chinh-dieu-no-direct-principal-evidence"],
        },
      };
    }
    for (const star of borrowed) {
      pushStar(star, oppIndex, "opposite", true);
    }
  } else {
    for (const star of focusPrincipals) {
      pushStar(star, focusIndex, "focus", false);
    }
    for (const star of natalPrincipalsInPalace(natalStars(byIndex(oppIndex)))) {
      pushStar(star, oppIndex, "opposite", false);
    }
  }

  for (const trineIndex of [trineA, trineB]) {
    for (const star of natalPrincipalsInPalace(natalStars(byIndex(trineIndex)))) {
      pushStar(star, trineIndex, "trine", false);
    }
  }

  if (missingBrightness || unsupported) {
    return {
      evidence,
      context: {
        availability: "partial-data",
        reasonCodes: [
          ...(missingBrightness ? ["missing-brightness"] : []),
          ...(unsupported ? ["unsupported-brightness"] : []),
        ],
      },
    };
  }

  return {
    evidence,
    context: {
      availability: "available",
      reasonCodes:
        focusPrincipals.length === 0 ? ["vo-chinh-dieu-borrow-opposite"] : undefined,
    },
  };
}
