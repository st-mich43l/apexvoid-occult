import type { ChartData, ChartPalace, MutagenRecord } from "@/types/chart";
import type { MajorFortuneV1Context, MajorFortuneV1Frame, MajorFortuneV1Node } from "../types";
import { RC1_STAR_CATALOG } from "../scoring/star-catalog";

function extractStars(palace: ChartPalace, type: "principal" | "auxiliary") {
  const allStars = palace.stars || [];
  
  if (type === "principal") {
    // Only return stars defined as principal (or roughly, those with both support/activation and not malefic/aux-only)
    // For V1 RC, let's assume any star without high pressure and known as a major star is principal.
    // Actually, in the catalog, 14 principal stars exist.
    const principalNames = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"];
    return allStars.filter(s => principalNames.includes(s.name));
  }
  
  if (type === "auxiliary") {
    const principalNames = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"];
    return allStars.filter(s => !principalNames.includes(s.name) && RC1_STAR_CATALOG[s.name]);
  }
  
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

  const buildNode = (palace: ChartPalace, role: "focus" | "opposite" | "trine"): MajorFortuneV1Node => {
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
  const trine1Node = buildNode(trine1Palace, "trine");
  const trine2Node = buildNode(trine2Palace, "trine");

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
