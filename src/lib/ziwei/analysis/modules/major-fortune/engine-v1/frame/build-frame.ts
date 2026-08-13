import type { ChartData, ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import type { MajorFortuneV1Context, MajorFortuneV1Frame, MajorFortuneV1Node } from "../types";

function extractStars(palace: ChartPalace, type: "principal" | "auxiliary" | "malefic") {
  // Assuming chart builder distinguishes them. In standard apexvoid chart:
  // palace.stars are principal
  // palace.minorStars are auxiliary/malefic.
  if (type === "principal") return palace.stars || [];
  // For auxiliary vs malefic, we'd ideally use a catalog. For this frame builder,
  // we'll place all minorStars in auxiliary, and scoring will filter based on evidence families.
  if (type === "auxiliary") return palace.minorStars || [];
  return [];
}

export function buildMajorFortuneV1Frame(
  chart: ChartData,
  context: MajorFortuneV1Context
): MajorFortuneV1Frame {
  const focusIndex = context.activePalace.index;
  const oppositeIndex = (focusIndex + 6) % 12;
  const trine1Index = (focusIndex + 4) % 12;
  const trine2Index = (focusIndex + 8) % 12;

  const focusPalace = chart.palaces.find(p => p.index === focusIndex)!;
  const oppositePalace = chart.palaces.find(p => p.index === oppositeIndex)!;
  const trine1Palace = chart.palaces.find(p => p.index === trine1Index)!;
  const trine2Palace = chart.palaces.find(p => p.index === trine2Index)!;

  const buildNode = (palace: ChartPalace, role: "focus" | "opposite" | "trine-1" | "trine-2"): MajorFortuneV1Node => {
    let principalStars = extractStars(palace, "principal");
    const isVCD = principalStars.length === 0;

    if (isVCD && role === "focus") {
      // VCD semantic borrowing from opposite without 80% multiplier.
      // Physical stars remain distinct but are semantically available.
      // For this frame, we indicate it's VCD but we don't duplicate the stars in the principal array
      // so we don't double count. Opposite palace will provide the stars.
    }

    return {
      palaceIndex: palace.index,
      branch: palace.branch,
      stem: palace.stem,
      natalPalaceName: palace.name,
      role,
      isVCD,
      principalStars,
      auxiliaryStars: extractStars(palace, "auxiliary"),
    };
  };

  const focusNode = buildNode(focusPalace, "focus");
  const oppositeNode = buildNode(oppositePalace, "opposite");
  const trine1Node = buildNode(trine1Palace, "trine-1");
  const trine2Node = buildNode(trine2Palace, "trine-2");

  // majorMutagens resolved from chart.majorMutagens which is correctly handled by Core.
  const majorMutagens: MutagenRecord[] = chart.majorMutagens || [];

  return {
    context,
    focusNode,
    oppositeNode,
    trine1Node,
    trine2Node,
    majorMutagens,
  };
}
