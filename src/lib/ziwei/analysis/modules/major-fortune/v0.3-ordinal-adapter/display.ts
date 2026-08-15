import type {
  MajorFortuneOrdinalBandId,
  MajorFortuneOrdinalEvidence,
  MajorFortuneOrdinalResult,
} from "../v0.3-ordinal/types";
import type { MajorFortuneOrdinalPillarId } from "../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import type {
  MajorFortuneOrdinalAdapterDiagnostics,
  MajorFortuneOrdinalPillarDisplaySummary,
  MajorFortuneOrdinalV03Display,
} from "./types";

const PILLAR_LABEL_VI: Record<MajorFortuneOrdinalPillarId, string> = {
  "thien-thoi": "Thiên Thời",
  "dia-loi": "Địa Lợi",
  "nhan-hoa": "Nhân Hòa",
  // Internal pillar ID remains 'tu-hoa-sat-tinh' for backward compatibility.
  // Production label updated in V0.3.3: only Tứ Hóa is actively scored; Sát Tinh families are disabled.
  "tu-hoa-sat-tinh": "Tứ Hóa",
};

const LEVEL_LABEL_VI: Record<string, string> = {
  "2": "Rất thuận",
  "1": "Thuận",
  "0": "Cân bằng",
  "-1": "Áp lực",
  "-2": "Áp lực mạnh",
};

export const BAND_LABEL_VI: Record<MajorFortuneOrdinalBandId, string> = {
  "strong-pressure": "Áp lực mạnh",
  pressure: "Áp lực",
  mixed: "Cân bằng",
  support: "Thuận",
  "strong-support": "Rất thuận",
};

const PILLAR_STATE_LABEL_VI: Record<string, string> = {
  classified: "Đã đánh giá",
  "balanced-signal": "Cân bằng",
  "no-signal": "Không có tín hiệu",
  "partial-data": "Thiếu dữ liệu",
  unavailable: "Không khả dụng",
};

const DISCLAIMER =
  "Thiên Thời và Địa Lợi là thể của đại vận. Nhân Hòa và Tứ Hóa là dụng — có thể giảm áp lực nhưng không đảo vận khó thành cân bằng. Điểm mang tính tham khảo.";

export function emptyDiagnostics(): MajorFortuneOrdinalAdapterDiagnostics {
  return {
    missingActiveMajorFortunePalace: [],
    missingMenhElement: [],
    missingBrightness: [],
    unsupportedBrightness: [],
    partialAuxiliarySets: [],
    incompleteTransformations: [],
    blockedNamPhaiTransformations: [],
    forbiddenTemporalFactsDetected: [],
    rejectedGeneratedEvidence: [],
    missingProvenance: [],
    duplicatePhysicalFacts: [],
    duplicateEvidenceClusters: [],
    ownershipViolations: [],
    disabledFamilies: [],
    notes: [],
    outOfFrameTransformationCount: 0,
  };
}

function evidenceLabelVi(evidence: MajorFortuneOrdinalEvidence): string {
  const direction =
    evidence.direction === "support"
      ? evidence.strength === "strong"
        ? "trợ lực mạnh"
        : "trợ lực"
      : evidence.strength === "strong"
        ? "áp lực mạnh"
        : "áp lực";

  if (evidence.signalFamilyId === "element-relation") {
    if (evidence.reasonCode.startsWith("root-palace:")) {
      const root = evidence.reasonCode.replace(/^root-palace:/, "");
      return root === "menh"
        ? `Đại Vận về cung Mệnh — ${direction}`
        : `Đại Vận về cung Thân — ${direction}`;
    }
    const relation = evidence.reasonCode.replace(/^element-relation:/, "");
    const map: Record<string, string> = {
      palace_generates_natal: "Cung Đại Vận sinh Mệnh",
      same_element: "Cung Đại Vận cùng ngũ hành với Mệnh",
      natal_controls_palace: "Mệnh khắc Cung Đại Vận",
      natal_generates_palace: "Mệnh sinh Cung Đại Vận",
      palace_controls_natal: "Cung Đại Vận khắc Mệnh",
    };
    return `${map[relation] ?? relation} — ${direction}`;
  }

  if (evidence.signalFamilyId === "principal-star-dignity") {
    const star = evidence.factIds.find((f) => f.startsWith("star:"))?.slice(5) ?? "Sao";
    const brightness =
      evidence.factIds.find((f) => f.startsWith("brightness:"))?.slice(11) ?? "";
    const role = evidence.factIds.find((f) => f.startsWith("frameRole:"))?.slice(10);
    const roleVi =
      role === "opposite" ? " đối cung" : role === "trine" ? " tam hợp" : "";
    const borrow = evidence.factIds.includes("borrowed-opposite") ? " (mượn đối)" : "";
    return `${star}${brightness ? ` ${brightness}` : ""}${roleVi}${borrow} — ${direction}`;
  }

  if (evidence.signalFamilyId === "support-pressure-auxiliary-sets") {
    if (evidence.reasonCode.startsWith("tuan-triet:")) {
      return `Tuần/Triệt tại cung Đại Vận — ${direction}`;
    }
    const partial = evidence.reasonCode.startsWith("auxiliary-set-partial:");
    const setId = evidence.reasonCode
      .replace(/^auxiliary-set-partial:/, "")
      .replace(/^auxiliary-set:/, "");
    const setNames: Record<string, string> = {
      "khoi-viet": "Thiên Khôi và Thiên Việt",
      "ta-huu": "Tả Phụ và Hữu Bật",
      "loc-ton": "Lộc Tồn",
      "khong-kiep": "Địa Không và Địa Kiếp",
      "kinh-da": "Kình Dương và Đà La",
      "linh-hoa": "Linh Tinh và Hỏa Tinh",
    };
    const completeness = partial ? "thiếu cặp" : "hội";
    return `${setNames[setId] ?? setId} ${completeness} — ${direction}`;
  }

  if (evidence.signalFamilyId === "major-fortune-transformations") {
    const type = evidence.transformationTuple?.transformationType ?? "Tứ Hóa";
    const star = evidence.transformationTuple?.transformedStar ?? "";
    const target = evidence.transformationTuple?.targetPalace ?? "";
    const natal = evidence.reasonCode.includes(":natal:");
    const layer = natal ? "chiếu" : "đại vận";
    return `${type} ${layer}${star ? ` (${star})` : ""}${target ? ` tại ${target}` : ""} — ${direction}`;
  }

  return `${evidence.reasonCode} — ${direction}`;
}

function reasonLabelVi(code: string): string {
  const map: Record<string, string> = {
    "missing-menh-element": "Thiếu ngũ hành Mệnh",
    "vo-chinh-dieu": "Vô Chính Diệu",
    "vo-chinh-dieu-no-direct-principal-evidence": "Vô Chính Diệu — không mượn được chính tinh đối cung",
    "vo-chinh-dieu-borrow-opposite": "Vô Chính Diệu — mượn chính tinh đối cung",
    "missing-brightness": "Thiếu độ sáng sao chính",
    "unsupported-brightness": "Nhãn độ sáng không hỗ trợ",
    "nam-phai-transformations-not-admitted-v03-policy":
      "Tứ Hóa Đại Vận Nam Phái chưa được kích hoạt trong chính sách chấm điểm hiện tại.",
    // Legacy reason code kept for compatibility with persisted reports.
    "nam-phai-transformations-unavailable-calculation-core":
      "Tứ Hóa Đại Vận Nam Phái chưa được kích hoạt trong chính sách chấm điểm hiện tại.",
    "missing-fortune-stem": "Thiếu thiên can đại vận",
    "no-context": "Thiếu ngữ cảnh đại vận",
    "unknown-palace-branch-element": "Không xác định ngũ hành chi cung",
    "no-direct-major-fortune-transformation":
      "Không có Tứ Hóa Đại Vận trực tiếp tại cung này",
  };
  return map[code] ?? code;
}

export function buildDisplay(
  result: MajorFortuneOrdinalResult | null,
  emittedEvidence: MajorFortuneOrdinalEvidence[],
  options?: { school?: string },
): MajorFortuneOrdinalV03Display {
  const accepted = new Set(
    result
      ? Object.values(result.pillars).flatMap((p) => p.acceptedEvidenceIds)
      : [],
  );

  const pillarIds: MajorFortuneOrdinalPillarId[] = [
    "thien-thoi",
    "dia-loi",
    "nhan-hoa",
    "tu-hoa-sat-tinh",
  ];

  const scoredCount = result?.coverage.scoredPillarIds.length ?? 0;
  const scoringPct = result
    ? Math.round(result.coverage.scoringCoverageWeight * 100)
    : null;

  const pillarSummaries: MajorFortuneOrdinalPillarDisplaySummary[] = pillarIds.map(
    (pillarId) => {
      const pillar = result?.pillars[pillarId];
      const level = pillar?.level ?? null;
      const evidenceLabels = emittedEvidence
        .filter((e) => e.pillarId === pillarId && accepted.has(e.evidenceId))
        .map(evidenceLabelVi);
      const reasonLabels = (pillar?.reasonCodes ?? [])
        .filter(
          (c) =>
            !c.startsWith("duplicate") &&
            !c.startsWith("excluded") &&
            !c.startsWith("out-of-frame"),
        )
        .map((c) => reasonLabelVi(c));

      return {
        pillarId,
        labelVi: PILLAR_LABEL_VI[pillarId],
        level,
        levelLabelVi:
          level == null ? "Thiếu dữ liệu" : (LEVEL_LABEL_VI[String(level)] ?? String(level)),
        delta: pillar?.delta ?? 0,
        state: pillar?.state ?? "unavailable",
        stateLabelVi:
          PILLAR_STATE_LABEL_VI[pillar?.state ?? "unavailable"] ??
          (pillar?.state ?? "unavailable"),
        evidenceLabels,
        reasonLabels,
      };
    },
  );

  return {
    title: "Đại Vận",
    subtitle: "V0.5",
    disclaimer: DISCLAIMER,
    experimentalBadge: "V0.5",
    bandLabelVi: result?.band ? BAND_LABEL_VI[result.band] : null,
    scoringCoveragePercent: scoringPct,
    scoredPillarFractionLabel:
      result && result.status === "partial"
        ? `${scoredCount}/4 trụ đã được tính`
        : null,
    namPhaiPartialTuHoaNote:
      options?.school === "nam-phai" &&
      result?.coverage.partialPillarIds.includes("tu-hoa-sat-tinh")
        ? "Tứ Hóa Đại Vận Nam Phái chưa được kích hoạt trong chính sách hiện tại. Điểm hiện dựa trên 3/4 trụ."
        : null,
    pillarSummaries,
  };
}
