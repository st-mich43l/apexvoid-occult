import fs from "node:fs";
import path from "node:path";

const BASE_DIR = path.resolve(process.cwd(), "research/monthly-flow/v0.2-nam-phai-foundation");

function writeJson(relPath: string, data: any) {
  const fullPath = path.join(BASE_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n");
}

function writeMd(relPath: string, content: string) {
  const fullPath = path.join(BASE_DIR, relPath);
  fs.writeFileSync(fullPath, content.trim() + "\n");
}

writeJson("sources/claim-registry.json", [
  {
    claimId: "CLAIM-M01-DAU-QUAN",
    sourceId: "SRC-MONTHLY-NP-EXPERT-001",
    description: "Tháng Giêng (Lưu Đẩu Quân) khởi từ Chi năm xem, đếm nghịch tháng sinh, đếm thuận giờ sinh."
  },
  {
    claimId: "CLAIM-M02-CALENDAR",
    sourceId: "SRC-MONTHLY-NP-EXPERT-001",
    description: "Can chi tháng lấy theo Ngũ Hổ Độn, không lấy can cung."
  },
  {
    claimId: "CLAIM-M03-EVENT-DRIVEN",
    sourceId: "SRC-MONTHLY-NP-EXPERT-001",
    description: "Điểm tháng tính theo Event-driven Hierarchical: Baseline Năm -> Palace Delta -> Đẩu Quân Amplification -> Tứ Hóa Event -> Annual Envelope."
  }
]);

writeJson("policy/annual-inheritance-policy.json", {
  policyId: "POLICY-ANNUAL-INHERITANCE",
  status: "pending-expert-review",
  candidates: {
    envelopeRadius: 30,
    baseSource: "actualAnnualScore"
  }
});

writeJson("policy/monthly-transformation-policy.json", {
  policyId: "POLICY-MONTHLY-TRANSFORMATION",
  status: "pending-expert-review",
  weights: { "direct-focus": 1.0, "opposite": 0.8, "trine": 0.65 },
  deltas: { "Lộc": 25, "Quyền": 15, "Khoa": 15, "Kỵ": -25 },
  aggregation: "dominant + 0.5 * sum(secondary)",
  cap: { min: -35, max: 35 }
});

writeJson("policy/palace-quality-policy.json", {
  policyId: "POLICY-PALACE-QUALITY",
  status: "pending-expert-review",
  buckets: {
    majorSupport: 15,
    secondarySupport: 10,
    majorPressure: -15,
    voidMarker: -10
  },
  cap: { min: -25, max: 25 }
});

writeJson("formula/monthly-score-contract.json", {
  contractVersion: "0.2.0-research",
  engineVersion: "unavailable",
  productionStatus: "unavailable",
  architecture: "Event-driven Hierarchical Scorer",
  formula: "clip(annualBaseline + (clip(palaceRawDelta, -25, 25) * dauQuanMultiplier) + clip(transformationRawDelta, -35, 35), annualBaseline - envelopeRadius, annualBaseline + envelopeRadius)"
});

writeMd("expert-review-workbook.md", `
# Lưu Nguyệt Nam Phái V0.2 Expert Review Workbook

## Cần thầy duyệt (Updated for Event-Driven Scorer)

1. **Annual Envelope Radius:** Dùng giá trị \`30\` hay giá trị khác?
2. **Role Weights (Tứ Hóa):** Hệ số tọa thủ \`1.0\` / xung chiếu \`0.80\` / tam hợp \`0.65\` đã chuẩn chưa?
3. **Dominant-event Secondary Factor:** Hệ số cho các hoá thứ cấp dùng \`0.5\` có phù hợp không?
4. **Tie-break Tứ Hóa:** Thứ tự ưu tiên Kỵ > Lộc > Quyền > Khoa khi đồng hạng cường độ?
5. **Transformation Cap:** Giới hạn tổng Tứ Hóa ở \`[-35, 35]\`?
6. **Ji Collision (\`-50\`):** Loại trùng Kỵ (collision kind) chính xác nào được phép đổi thành \`-50\` (same-star-natal, same-palace...)?
7. **Domain Projection Cap:** Mức độ thay đổi (delta) khi chiếu điểm tổng tháng sang từng domain cụ thể bị giới hạn tối đa bao nhiêu?
8. **Distribution Targets:** Có được dùng các targets kỹ thuật (ví dụ median range 20..40, tuyệt đối clamp < 5%) làm soft calibration gate hay không?
9. **Hai chính tinh đồng cung:** Khi tính \`mainStarQualityDelta\`, tổng hợp 2 sao đồng cung thế nào (lấy mạnh nhất, yếu nhất, hay trung bình)?
10. **Cát/hung bucket:** Bucket kích hoạt chỉ cần 1 sao là đủ (vd 1 Khôi đã kích +15), hay cần hội tụ (cả Khôi Việt)?
`);

writeMd("unresolved-questions.md", `
# Unresolved Questions
Please see expert-review-workbook.md for the 10 specific policy questions.
`);

console.log("Updated Research pack generated.");
