import { expect, test } from "vitest";
import { DEFAULT_CONVENTIONS } from "./conventions";
import { generateBaziChart } from "./bazi-engine";
import { calculateElementStrength, ElementStrength } from "./element-strength";
import { Element } from "./elements";
import { determineYongShen } from "./yong-shen";

test("YongShen PhuUc logic", () => {
  const chart = generateBaziChart(new Date("1990-01-01T12:00:00Z"), 105.8, 420, "M");
  const strength = calculateElementStrength(chart);
  const result = determineYongShen(strength, chart.month.branch);

  expect(["vượng", "nhược", "trung hòa"]).toContain(result.dayMasterVerdict);
  expect(result.reasoning.length).toBeGreaterThan(0);
  expect(result.dungThan.length).toBeGreaterThan(0);
  expect(result.pipelineNotes.length).toBeGreaterThan(0);

  if (result.method === "phu-uc" || result.method === "dieu-hau") {
    if (result.dayMasterVerdict !== "trung hòa") {
      expect(result.method).toBe("phu-uc");
      expect(result.hyThan.length).toBeGreaterThan(0);
    } else {
      expect(result.method).toBe("dieu-hau");
    }
  }
});

function mockStrength(
  verdict: "vượng" | "trung hòa" | "nhược",
  scorePercentage: number,
  normalized?: Partial<Record<Element, number>>,
  dayMasterElement: Element = "Mộc",
): ElementStrength {
  const base: Record<Element, number> = {
    Mộc: 0, Hỏa: 0, Thổ: 0, Kim: 0, Thủy: 0,
  };
  return {
    method: "mock",
    scores: { ...base },
    normalized: { ...base, ...normalized },
    dayMasterElement,
    dayMasterStrength: { score: 0, verdict, threshold: 50, scorePercentage },
    breakdown: [],
  };
}

test("Trung hòa: Dụng Thần không rỗng, tham chiếu Điều Hậu", () => {
  const strength = mockStrength("trung hòa", 50, {
    Mộc: 20, Hỏa: 20, Thổ: 20, Kim: 20, Thủy: 20,
  });
  const result = determineYongShen(strength, "Tý");

  expect(result.dungThan.length).toBeGreaterThan(0);
  expect(result.confidence).toBe("cần cân nhắc");
  expect(result.method).toBe("dieu-hau");
});

test("Trung hòa, sinh mùa Đông (Hợi/Tý/Sửu) → tham chiếu Hỏa", () => {
  const strength = mockStrength("trung hòa", 50, {
    Mộc: 20, Hỏa: 20, Thổ: 20, Kim: 20, Thủy: 20,
  });
  for (const branch of ["Hợi", "Tý", "Sửu"]) {
    const result = determineYongShen(strength, branch);
    expect(result.dungThan).toEqual(["Hỏa"]);
  }
});

test("Trung hòa, sinh mùa Hạ (Tị/Ngọ/Mùi) → tham chiếu Thủy", () => {
  const strength = mockStrength("trung hòa", 50, {
    Mộc: 20, Hỏa: 20, Thổ: 20, Kim: 20, Thủy: 20,
  });
  for (const branch of ["Tị", "Tỵ", "Ngọ", "Mùi"]) {
    const result = determineYongShen(strength, branch);
    expect(result.dungThan).toEqual(["Thủy"]);
  }
});

test("Nhật Chủ vượng/nhược rõ ràng vẫn dùng Phù Ức như cũ (không hồi quy)", () => {
  const weak = determineYongShen(
    mockStrength("nhược", 30, { Mộc: 15, Hỏa: 25, Thổ: 25, Kim: 20, Thủy: 15 }),
    "Tý",
  );
  expect(weak.method).toBe("phu-uc");
  expect(weak.methodLabel).toBe("Pháp Phù Ức");
  expect(weak.dungThan.length).toBeGreaterThan(0);

  const strong = determineYongShen(
    mockStrength("vượng", 70, { Mộc: 35, Hỏa: 20, Thổ: 20, Kim: 15, Thủy: 10 }),
    "Ngọ",
  );
  expect(strong.method).toBe("phu-uc");
  expect(strong.methodLabel).toBe("Pháp Phù Ức");
  expect(strong.dungThan.length).toBeGreaterThan(0);
});

test("Chuyên Vượng: hành Nhật Chủ áp đảo, hành khắc yếu → thuận thế", () => {
  const strength = mockStrength(
    "vượng",
    72,
    { Mộc: 55, Hỏa: 15, Thổ: 15, Kim: 8, Thủy: 7 },
    "Mộc",
  );
  const result = determineYongShen(strength, "Dần");

  expect(result.method).toBe("chuyen-vuong");
  expect(result.methodLabel).toBe("Pháp Chuyên Vượng");
  expect(result.dungThan).toEqual(["Mộc", "Thủy"]);
  expect(result.kyThan).toContain("Kim");
  expect(result.pipelineNotes.some((n) => n.includes("Chuyên Vượng: khớp"))).toBe(true);
});

test("Thông Quan: Mộc–Thổ đối địch mạnh → cầu nối Hỏa", () => {
  const strength = mockStrength(
    "trung hòa",
    48,
    { Mộc: 28, Hỏa: 12, Thổ: 30, Kim: 15, Thủy: 15 },
    "Hỏa",
  );
  const result = determineYongShen(strength, "Thìn");

  expect(result.method).toBe("thong-quan");
  expect(result.dungThan).toEqual(["Hỏa"]);
  expect(result.hyThan).toEqual(["Mộc"]);
  expect(result.kyThan).toEqual([]);
});

test("Tắt cửa Chuyên Vượng / Thông Quan qua conventions → về Phù Ức", () => {
  const strength = mockStrength(
    "vượng",
    72,
    { Mộc: 55, Hỏa: 15, Thổ: 15, Kim: 8, Thủy: 7 },
    "Mộc",
  );
  const cfg = {
    ...DEFAULT_CONVENTIONS,
    yongShenPipeline: {
      ...DEFAULT_CONVENTIONS.yongShenPipeline,
      chuyenVuongEnabled: false,
      thongQuanEnabled: false,
    },
  };
  const result = determineYongShen(strength, "Dần", cfg);
  expect(result.method).toBe("phu-uc");
});
