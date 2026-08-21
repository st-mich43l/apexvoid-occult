import { BaziConventions, DEFAULT_CONVENTIONS } from "./conventions";
import { ElementStrength } from "./element-strength";
import {
  Element,
  ELEMENTS,
  getGeneratedByElement,
  getGeneratingElement,
  getOvercomeByElement,
  getOvercomingElement,
} from "./elements";

/**
 * Phương pháp lấy Dụng Thần (Tử Bình).
 * Nguồn khung phân loại: *Tử Bình Chân Thuyên* / chú Xu Lạc Ngô —
 * năm pháp Phù Ức · Bệnh Dược · Điều Hậu · Chuyên Vượng · Thông Quan.
 * Engine chỉ implement các nhánh có quy tắc đóng được; Bệnh Dược chưa có.
 */
type YongShenMethod =
  | "phu-uc"
  | "dieu-hau"
  | "thong-quan"
  | "chuyen-vuong";

export interface YongShenResult {
  method: YongShenMethod;
  methodLabel: string;
  dayMasterVerdict: "vượng" | "trung hòa" | "nhược";
  dungThan: Element[];
  hyThan: Element[];
  kyThan: Element[];
  reasoning: string[];
  confidence: "rõ ràng" | "cần cân nhắc";
  /** Các cửa đã xét trong pipeline (để minh bạch UI). */
  pipelineNotes: string[];
}

export function determineYongShen(
  strength: ElementStrength,
  monthBranch: string,
  conventions: BaziConventions = DEFAULT_CONVENTIONS,
): YongShenResult {
  const pipelineNotes: string[] = [];
  const cfg = conventions.yongShenPipeline;

  if (cfg.chuyenVuongEnabled) {
    const chuyen = tryChuyenVuong(strength, cfg);
    if (chuyen) {
      return {
        ...chuyen,
        pipelineNotes: [
          ...pipelineNotes,
          "Cửa Chuyên Vượng: khớp — dừng pipeline (thuận thế, không nghịch cục).",
        ],
      };
    }
    pipelineNotes.push("Cửa Chuyên Vượng: không khớp.");
  }

  if (cfg.thongQuanEnabled) {
    const thong = tryThongQuan(strength, cfg);
    if (thong) {
      return {
        ...thong,
        pipelineNotes: [
          ...pipelineNotes,
          "Cửa Thông Quan: khớp — dừng pipeline (cầu nối hai hành đối địch).",
        ],
      };
    }
    pipelineNotes.push("Cửa Thông Quan: không khớp.");
  }

  const base = determineYongShenPhuUc(strength, monthBranch);
  return {
    ...base,
    pipelineNotes: [
      ...pipelineNotes,
      `Cửa Phù Ức / Điều Hậu: dùng ${base.methodLabel}.`,
    ],
  };
}

const WINTER_BRANCHES = ["Hợi", "Tý", "Sửu"];
const SUMMER_BRANCHES = ["Tỵ", "Ngọ", "Mùi"];

/**
 * Điều Hậu (Hàn Noãn) — tham chiếu khi Phù Ức không kết luận (trung hòa).
 * Đông → Hỏa, Hạ → Thủy. Xuân/Thu: chưa có bảng Can×tháng đáng tin → liệt kê cả hai.
 */
function determineDieuHauFallback(
  monthBranch: string,
): { dungThan: Element[]; reasoning: string[] } {
  if (WINTER_BRANCHES.includes(monthBranch)) {
    return {
      dungThan: ["Hỏa"],
      reasoning: [
        `Điều Hậu: tháng sinh (chi ${monthBranch}) thuộc mùa Đông, khí hậu hàn lạnh — tham chiếu thiên về Hỏa để sưởi ấm cục diện.`,
      ],
    };
  }
  if (SUMMER_BRANCHES.includes(monthBranch)) {
    return {
      dungThan: ["Thủy"],
      reasoning: [
        `Điều Hậu: tháng sinh (chi ${monthBranch}) thuộc mùa Hạ, khí hậu viêm nhiệt — tham chiếu thiên về Thủy để giải nhiệt cục diện.`,
      ],
    };
  }
  return {
    dungThan: ["Thủy", "Hỏa"],
    reasoning: [
      `Điều Hậu: tháng sinh (chi ${monthBranch}) thuộc mùa Xuân/Thu. Quy tắc đầy đủ ở hai mùa này phụ thuộc chi tiết vào Can Nhật Chủ (khô/ẩm), hệ thống chưa có bảng đối chiếu đáng tin nên tạm liệt kê cả Thủy và Hỏa, cần thầy xác nhận quy tắc cụ thể.`,
    ],
  };
}

/**
 * Chuyên Vượng (專旺): một hành (đúng Nhật Chủ) áp đảo, hành khắc NC yếu —
 * thuận thế, không lấy hành khắc nghịch cục làm Dụng.
 * Heuristic đóng: % hành NC ≥ ngưỡng và % hành khắc NC ≤ trần.
 */
function tryChuyenVuong(
  strength: ElementStrength,
  cfg: BaziConventions["yongShenPipeline"],
): YongShenResult | null {
  const dm = strength.dayMasterElement;
  const dmPct = strength.normalized[dm] ?? 0;
  const counter = getOvercomeByElement(dm);
  const counterPct = strength.normalized[counter] ?? 0;

  if (dmPct < cfg.chuyenVuongDominantPct) return null;
  if (counterPct > cfg.chuyenVuongCounterMaxPct) return null;

  const generating = getGeneratedByElement(dm); // Ấn
  const generated = getGeneratingElement(dm); // Thực/Thương
  const overcoming = getOvercomingElement(dm); // Tài

  const reasoning: string[] = [
    `Nhật Chủ là ${dm}; hành ${dm} chiếm ${dmPct}% lực ngũ hành, hành khắc Nhật Chủ (${counter}) chỉ ${counterPct}%.`,
    "Theo pháp Chuyên Vượng: khí thế thiên về một phương — lấy thuận thế (đồng đảng / sinh trợ), không nghịch khắc cục.",
    `Dụng Thần thiên về ${dm} (Tỷ/Kiếp) và ${generating} (Ấn).`,
    `Hỷ Thần thiên về ${generated} (Thực/Thương — tiết khí thuận).`,
    `Kỵ Thần thiên về ${counter} (Quan/Sát — nghịch thế).`,
  ];

  return {
    method: "chuyen-vuong",
    methodLabel: "Pháp Chuyên Vượng",
    dayMasterVerdict: strength.dayMasterStrength.verdict,
    dungThan: [dm, generating],
    hyThan: [generated, overcoming],
    kyThan: [counter],
    reasoning,
    confidence:
      dmPct >= cfg.chuyenVuongDominantPct + 8 ? "rõ ràng" : "cần cân nhắc",
    pipelineNotes: [],
  };
}

/**
 * Thông Quan (通關): hai hành khắc nhau cùng mạnh — lấy hành cầu nối (sinh từ
 * hành khắc → sinh sang hành bị khắc). Ví dụ Mộc khắc Thổ → Hỏa thông quan.
 */
function tryThongQuan(
  strength: ElementStrength,
  cfg: BaziConventions["yongShenPipeline"],
): YongShenResult | null {
  type Pair = {
    attacker: Element;
    victim: Element;
    bridge: Element;
    eachMin: number;
    combined: number;
  };

  const candidates: Pair[] = [];
  for (const attacker of ELEMENTS) {
    const victim = getOvercomingElement(attacker);
    const a = strength.normalized[attacker] ?? 0;
    const v = strength.normalized[victim] ?? 0;
    const eachMin = Math.min(a, v);
    const combined = a + v;
    if (eachMin < cfg.thongQuanMinEachPct) continue;
    if (combined < cfg.thongQuanMinCombinedPct) continue;
    const bridge = getGeneratingElement(attacker);
    if (bridge === attacker || bridge === victim) continue;
    candidates.push({ attacker, victim, bridge, eachMin, combined });
  }

  if (candidates.length === 0) return null;

  candidates.sort(
    (x, y) => y.eachMin - x.eachMin || y.combined - x.combined,
  );
  const best = candidates[0];
  const dm = strength.dayMasterElement;

  const reasoning: string[] = [
    `Nhật Chủ là ${dm}; phát hiện cặp đối địch ${best.attacker} (${strength.normalized[best.attacker]}%) khắc ${best.victim} (${strength.normalized[best.victim]}%).`,
    `Theo pháp Thông Quan: lấy hành cầu nối ${best.bridge} (${best.attacker} sinh ${best.bridge} sinh ${best.victim}) để hóa xung đột.`,
    `Dụng Thần thiên về ${best.bridge}.`,
  ];

  // Hỷ: hành sinh trợ cầu nối. Kỵ: không gán cứng hai phe đối địch làm Kỵ
  // (có thể cần giữ cân) — để trống + nói rõ trong reasoning.
  const bridgeSupport = getGeneratedByElement(best.bridge);
  reasoning.push(
    `Hỷ Thần thiên về ${bridgeSupport} (sinh trợ cầu nối). Hai hành ${best.attacker}/${best.victim} là lực đối địch cần thông, không gắn nhãn Kỵ tuyệt đối.`,
  );

  return {
    method: "thong-quan",
    methodLabel: "Pháp Thông Quan",
    dayMasterVerdict: strength.dayMasterStrength.verdict,
    dungThan: [best.bridge],
    hyThan: [bridgeSupport],
    kyThan: [],
    reasoning,
    confidence:
      best.eachMin >= cfg.thongQuanMinEachPct + 5 ? "rõ ràng" : "cần cân nhắc",
    pipelineNotes: [],
  };
}

function determineYongShenPhuUc(
  strength: ElementStrength,
  monthBranch: string,
): YongShenResult {
  const dm = strength.dayMasterElement;
  const verdict = strength.dayMasterStrength.verdict;
  const reasoning: string[] = [];

  const generating = getGeneratedByElement(dm); // Ấn
  const overcoming = getOvercomingElement(dm); // Tài
  const overcomeBy = getOvercomeByElement(dm); // Quan/Sát
  const generated = getGeneratingElement(dm); // Thực/Thương

  reasoning.push(
    `Nhật Chủ là ${dm}, điểm số sinh trợ (Tỷ Kiếp + Ấn) đạt ${strength.dayMasterStrength.scorePercentage}%.`,
  );

  let dungThan: Element[] = [];
  let hyThan: Element[] = [];
  let kyThan: Element[] = [];
  let confidence: "rõ ràng" | "cần cân nhắc" = "rõ ràng";

  if (verdict === "nhược") {
    reasoning.push("Cục diện Nhật Chủ Nhược, cần sinh trợ (Phù) để cân bằng.");
    dungThan = [generating];
    hyThan = [dm];
    kyThan = [generated, overcoming, overcomeBy];
    reasoning.push(`Dụng Thần (Hành sinh trợ chính): ${generating} (Ấn).`);
    reasoning.push(`Hỷ Thần (Hành tương trợ phụ): ${dm} (Tỷ/Kiếp).`);
    reasoning.push(
      `Kỵ Thần (Hành làm hao tổn hoặc khắc chế): ${generated} (Thực/Thương), ${overcoming} (Tài), ${overcomeBy} (Quan/Sát).`,
    );
  } else if (verdict === "vượng") {
    reasoning.push("Cục diện Nhật Chủ Vượng, cần tiết chế (Ức) để cân bằng.");
    dungThan = [generated, overcoming];
    hyThan = [overcomeBy];
    kyThan = [generating, dm];
    reasoning.push(
      `Dụng Thần (Hành làm hao tổn Nhật Chủ): ${generated} (Thực/Thương), ${overcoming} (Tài).`,
    );
    reasoning.push(`Hỷ Thần (Hành chế ngự Nhật Chủ): ${overcomeBy} (Quan/Sát).`);
    reasoning.push(
      `Kỵ Thần (Hành sinh trợ thêm): ${generating} (Ấn), ${dm} (Tỷ/Kiếp).`,
    );
  } else {
    reasoning.push("Cục diện Nhật Chủ Trung Hòa, chưa lệch hẳn về bên nào.");
    reasoning.push(
      "Dụng Thần theo pháp Phù Ức không thật sự rõ ràng ở trạng thái này. Chuyển sang tham chiếu Điều Hậu.",
    );
    confidence = "cần cân nhắc";

    const dieuHau = determineDieuHauFallback(monthBranch);
    dungThan = dieuHau.dungThan;
    reasoning.push(...dieuHau.reasoning);
  }

  const p = strength.dayMasterStrength.scorePercentage;
  if ((p >= 35 && p < 45) || (p > 55 && p <= 65)) {
    confidence = "cần cân nhắc";
    reasoning.push(
      `Lưu ý: Tỷ lệ ${p}% khá gần ngưỡng trung hòa (40-60%), cần cân nhắc kỹ lưỡng.`,
    );
  }

  const usingDieuHau = verdict === "trung hòa";

  return {
    method: usingDieuHau ? "dieu-hau" : "phu-uc",
    methodLabel: usingDieuHau ? "Pháp Điều Hậu (tham chiếu)" : "Pháp Phù Ức",
    dayMasterVerdict: verdict,
    dungThan,
    hyThan,
    kyThan,
    reasoning,
    confidence,
    pipelineNotes: [],
  };
}
