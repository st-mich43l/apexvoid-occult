import type { ChartPalace as Palace } from "@/types/chart";
import { getNayinByStemBranch } from "@/lib/bazi/nayin";
import { isEligibleNatalPhysicalStar } from "../collect-star-evidence";
import type { 
  EvaluatedPalace, 
  PalaceElementResolution, 
  PalaceComponentResult, 
  MonthlyFlowV02ReasonCode,
  MonthlyFlowResolutionStatus
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolvePalaceElement(stem?: string, branch?: string): PalaceElementResolution {
  if (!stem || !branch) {
    return {
      status: "unavailable",
      element: null,
      method: "nayin-palace-stem-branch",
      sourceId: null
    };
  }
  
  const nayin = getNayinByStemBranch(stem, branch);
  if (!nayin || nayin === "Unknown") {
    return {
      status: "unavailable",
      element: null,
      method: "nayin-palace-stem-branch",
      sourceId: null
    };
  }

  const parts = nayin.split(" ");
  let rawElement = parts[parts.length - 1] ?? null;
  if (rawElement === "Thuỷ") rawElement = "Thủy";
  if (rawElement === "Hoả") rawElement = "Hỏa";

  const validElements = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
  if (rawElement && validElements.includes(rawElement)) {
    return {
      status: "resolved",
      element: rawElement as any,
      method: "nayin-palace-stem-branch",
      sourceId: nayin
    };
  }

  return {
    status: "unavailable",
    element: null,
    method: "nayin-palace-stem-branch",
    sourceId: nayin
  };
}

export function evaluatePalace(
  palace: Palace,
  chartElement: string | null | undefined
): EvaluatedPalace {
  const stars = palace.stars ?? [];
  let palaceStatus: MonthlyFlowResolutionStatus = "resolved";
  const palaceReasonCodes: MonthlyFlowV02ReasonCode[] = [];

  // 1. Main Star Quality
  // Only allow physical natal stars on layer major (Chính Tinh)
  const mainStars = stars.filter(s => isEligibleNatalPhysicalStar(s) && (s.layer === "major" || s.layer === "Chính Tinh"));
  
  const mainStarQuality: PalaceComponentResult = {
    status: "resolved",
    delta: 0,
    evidence: [],
    reasonCodes: []
  };

  if (mainStars.length === 0) {
    // VCD
    mainStarQuality.status = "partial";
    mainStarQuality.delta = 0; // the research delta was -5, but pending policy must be 0
    mainStarQuality.reasonCodes.push("palace-main-star-policy-partial");
    mainStarQuality.evidence.push("Vô Chính Diệu - tam-khong-policy-unresolved - pending");
    palaceStatus = "partial";
    palaceReasonCodes.push("palace-main-star-policy-partial");
  } else {
    let sumDelta = 0;
    for (const star of mainStars) {
      if (["Miếu", "Vượng", "Đắc"].includes(star.brightness ?? "")) {
        sumDelta += 10;
        mainStarQuality.evidence.push(`${star.name} (${star.brightness}) +10`);
      } else if (star.brightness === "Hãm") {
        sumDelta -= 10;
        mainStarQuality.evidence.push(`${star.name} (Hãm) -10`);
      }
    }
    mainStarQuality.delta = clamp(sumDelta, -10, 10);
  }

  const hasMajorSupport = stars.some(s =>
    isEligibleNatalPhysicalStar(s) &&
    ["Thiên Khôi", "Thiên Việt", "Tả Phụ", "Hữu Bật", "Lộc Tồn", "Đào Hoa", "Hồng Loan"].includes(s.name)
  );
  const majorSupportStar = stars.find(s =>
    isEligibleNatalPhysicalStar(s) &&
    ["Thiên Khôi", "Thiên Việt", "Tả Phụ", "Hữu Bật", "Lộc Tồn", "Đào Hoa", "Hồng Loan"].includes(s.name)
  );
  const majorSupport: PalaceComponentResult = {
    status: "resolved",
    delta: hasMajorSupport ? 15 : 0,
    evidence: majorSupportStar ? [`${majorSupportStar.name}-RULE-MFS-MO-PALACE-MAJOR-SUPPORT`] : [],
    reasonCodes: []
  };

  const hasSecondarySupport = stars.some(s =>
    isEligibleNatalPhysicalStar(s) &&
    ["Ân Quang", "Thiên Quý", "Giải Thần", "Hóa Khoa"].includes(s.name) // Lưu Hóa Khoa is not physical
  );
  const secondarySupportStar = stars.find(s =>
    isEligibleNatalPhysicalStar(s) &&
    ["Ân Quang", "Thiên Quý", "Giải Thần", "Hóa Khoa"].includes(s.name)
  );
  const secondarySupport: PalaceComponentResult = {
    status: "resolved",
    delta: hasSecondarySupport ? 10 : 0,
    evidence: secondarySupportStar ? [`${secondarySupportStar.name}-RULE-MFS-MO-PALACE-SECONDARY-SUPPORT`] : [],
    reasonCodes: []
  };

  const hasMajorPressure = stars.some(s =>
    isEligibleNatalPhysicalStar(s) &&
    ["Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Thiên Hình", "Bạch Hổ", "Tang Môn", "Điếu Khách"].includes(s.name)
  );
  const majorPressureStar = stars.find(s =>
    isEligibleNatalPhysicalStar(s) &&
    ["Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Thiên Hình", "Bạch Hổ", "Tang Môn", "Điếu Khách"].includes(s.name)
  );
  const majorPressure: PalaceComponentResult = {
    status: "resolved",
    delta: hasMajorPressure ? -15 : 0,
    evidence: majorPressureStar ? [`${majorPressureStar.name}-RULE-MFS-MO-PALACE-MAJOR-PRESSURE`] : [],
    reasonCodes: []
  };

  // 3. Void Markers (Tuần/Triệt)
  // Void markers are physical stars? Wait, `isEligibleNatalPhysicalStar` explicitly rejects void markers!
  // So we just check if it's a void marker natively.
  const voidStar = stars.find((s: any) => ["Tuần", "Triệt", "Tuần Không", "Triệt Lộ"].includes(s.name));
  const voidMarker: PalaceComponentResult = {
    status: "resolved",
    delta: voidStar ? -10 : 0,
    evidence: voidStar ? [`${voidStar.name}-RULE-MFS-MO-PALACE-VOID-MARKER`] : [],
    reasonCodes: []
  };

  // 4. Element Relation
  const elementRelation: PalaceComponentResult = {
    status: "resolved",
    delta: 0,
    evidence: [],
    reasonCodes: []
  };

  const sinhKhac: Record<string, Record<string, number>> = {
    "Kim": { "Thủy": 5, "Kim": 5, "Mộc": -5, "Hỏa": -5, "Thổ": 0 },
    "Mộc": { "Hỏa": 5, "Mộc": 5, "Thổ": -5, "Kim": -5, "Thủy": 0 },
    "Thủy": { "Mộc": 5, "Thủy": 5, "Hỏa": -5, "Thổ": -5, "Kim": 0 },
    "Hỏa": { "Thổ": 5, "Hỏa": 5, "Kim": -5, "Thủy": -5, "Mộc": 0 },
    "Thổ": { "Kim": 5, "Thổ": 5, "Thủy": -5, "Mộc": -5, "Hỏa": 0 },
  };

  const resolution = resolvePalaceElement(palace.stem, palace.branch);
  
  if (resolution.status === "unavailable") {
    elementRelation.status = "unavailable";
    elementRelation.delta = null;
    elementRelation.reasonCodes.push("palace-element-policy-unavailable");
    elementRelation.evidence.push("Element relation data unavailable");
    palaceStatus = "partial";
    palaceReasonCodes.push("palace-element-policy-unavailable");
  } else if (!chartElement) {
    elementRelation.status = "unavailable";
    elementRelation.delta = null;
    elementRelation.reasonCodes.push("palace-element-policy-unavailable");
    elementRelation.evidence.push("Chart Element unavailable");
    palaceStatus = "partial";
    palaceReasonCodes.push("palace-element-policy-unavailable");
  } else {
    // Both available, but policy might be pending review. 
    // Wait, the spec says "If the doctrine for Nạp Âm as Hành Cung is not authorized: retain as pending, mark month partial".
    // For V0.2.2 we mark it partial.
    elementRelation.status = "partial";
    elementRelation.reasonCodes.push("palace-element-policy-partial");
    elementRelation.delta = 0; // MUST be 0 if partial
    palaceStatus = "partial";
    palaceReasonCodes.push("palace-element-policy-partial");

    const map = sinhKhac[resolution.element!];
    if (map && map[chartElement] !== undefined) {
      elementRelation.evidence.push(`${resolution.element} vs ${chartElement} = pending`);
    } else {
      elementRelation.evidence.push("Element mapping undefined");
    }
  }

  const rawDelta =
    (mainStarQuality.delta ?? 0) +
    (majorSupport.delta ?? 0) +
    (secondarySupport.delta ?? 0) +
    (majorPressure.delta ?? 0) +
    (voidMarker.delta ?? 0) +
    (elementRelation.delta ?? 0);

  return {
    components: {
      mainStarQuality,
      majorSupport,
      secondarySupport,
      majorPressure,
      voidMarker,
      elementRelation
    },
    rawDelta,
    status: palaceStatus,
    reasonCodes: palaceReasonCodes
  };
}
