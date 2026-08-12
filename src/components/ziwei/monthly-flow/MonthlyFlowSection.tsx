import { useEffect, useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import { type MonthlyFlowAnalysis, analyzeMonthlyFlow } from "@/lib/ziwei/analysis/modules/monthly-flow/production";
import { MONTHLY_FLOW_VERSION } from "@/lib/ziwei/analysis/modules/monthly-flow/version";
import { resolveActualCurrentMonthKey, resolveDefaultSelectedMonthKey } from "@/lib/ziwei/analysis/modules/monthly-flow/production";
import { analyzeAnnualAxes } from "@/lib/ziwei/analysis/modules/annual-axes";
import { MonthlyFlowTimelineChart } from "./MonthlyFlowTimelineChart";
import { formatMonthViewLabel } from "./labels";
import "./monthly-flow.css";

export interface MonthlyFlowSectionProps {
  chart: ChartData;
  school: School;
  analysis?: MonthlyFlowAnalysis;
  now?: Date;
}

function monthStateLabel(status: "resolved" | "partial" | "unavailable"): string {
  if (status === "unavailable") return "Không khả dụng";
  if (status === "partial") return "Thiếu dữ liệu";
  return "Đã đánh giá";
}

const REASON_CODE_LABELS: Record<string, string> = {
  "annual-baseline-unavailable": "Thiếu nền vận khí năm",
  "annual-baseline-invalid": "Nền vận khí năm không hợp lệ",
  "canonical-context-unavailable": "Bối cảnh lưu niên không hợp lệ",
  "focus-palace-unavailable": "Không tìm thấy cung tháng",
  "palace-main-star-policy-partial": "Chính tinh chưa hoàn thiện",
  "palace-element-policy-partial": "Ngũ hành cung thiếu dữ liệu",
  "palace-element-policy-unavailable": "Không thể nạp âm ngũ hành",
  "dau-quan-anchor-unavailable": "Không có điểm tựa Đẩu Quân",
  "monthly-transformations-partial": "Tứ Hoá nguyệt lệnh thiếu dữ liệu",
  "monthly-transformation-target-unresolved": "Mục tiêu Tứ Hoá chưa rõ",
  "monthly-transformation-target-ambiguous": "Mục tiêu Tứ Hoá nhập nhằng",
  "ji-collision-policy-pending": "Cảnh báo trùng phùng Hóa Kỵ",
  "annual-head-unavailable": "Thiếu Lưu Thái Tuế",
  "invalid-provenance": "Dấu vết không hợp lệ"
};

export function MonthlyFlowSection({
  chart,
  school,
  analysis: analysisProp,
  now = new Date(),
}: MonthlyFlowSectionProps) {
  const analysis = useMemo(
    () => {
      if (analysisProp) return analysisProp;
      const annualAxesResult = (chart as any).annualAxesResult ?? analyzeAnnualAxes(chart, { school });
      return analyzeMonthlyFlow(chart, { school, annualAxesResult });
    },
    [analysisProp, chart, school],
  );

  const actualCurrentMonthKey = useMemo(
    () =>
      resolveActualCurrentMonthKey({
        annualYear: analysis.annualYear,
        school,
        monthSummaries: analysis.monthSummaries as any,
        now,
      }),
    [analysis.annualYear, analysis.monthSummaries, now, school],
  );

  const defaultMonthKey = useMemo(
    () =>
      resolveDefaultSelectedMonthKey({
        annualYear: analysis.annualYear,
        school,
        monthSummaries: analysis.monthSummaries as any,
        now,
      }),
    [analysis.annualYear, analysis.monthSummaries, now, school],
  );

  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(defaultMonthKey);

  useEffect(() => {
    setSelectedMonthKey(defaultMonthKey);
  }, [defaultMonthKey, chart, school]);

  const selectedMonth =
    analysis.monthSummaries.find((m) => m.monthKey === selectedMonthKey) ??
    analysis.monthSummaries.find((m) => m.monthKey === actualCurrentMonthKey) ??
    analysis.monthSummaries[0] ??
    null;

  const viewingOther =
    selectedMonthKey != null &&
    actualCurrentMonthKey != null &&
    selectedMonthKey !== actualCurrentMonthKey;

  return (
    <section
      className="mf-monthly-flow"
      data-module="monthly-flow"
      data-version={MONTHLY_FLOW_VERSION.integrationVersion}
      data-status={analysis.status}
      aria-label="Lưu Nguyệt"
    >
      <header className="mf-monthly-flow__head">
        <div className="mf-flow__head-main">
          <h3 className="mf-flow__title">Lưu Nguyệt</h3>
          <span className="mf-flow__badge">{MONTHLY_FLOW_VERSION.integrationVersion}</span>
          <span className="mf-flow__year">Năm {analysis.annualYear}</span>
        </div>
        {viewingOther && selectedMonth && actualCurrentMonthKey ? (
          <div className="mf-flow__viewing" role="status">
            <span>
              Đang xem: {formatMonthViewLabel(selectedMonth.lunarMonth, selectedMonth.isLeapMonth)}
            </span>
            <button
              type="button"
              className="mf-flow__back-current"
              onClick={() => {
                setSelectedMonthKey(actualCurrentMonthKey);
              }}
            >
              Về tháng hiện tại
            </button>
          </div>
        ) : null}
      </header>

      {analysis.monthSummaries.length === 0 ? (
        <p className="mf-flow__unavailable" role="status">
          Không có tháng Lưu Nguyệt hợp lệ để đánh giá.
        </p>
      ) : (
        <>
          <MonthlyFlowTimelineChart
            summaries={analysis.monthSummaries}
            selectedMonthKey={selectedMonthKey}
            currentMonthKey={actualCurrentMonthKey}
            onSelectMonthKey={setSelectedMonthKey}
          />

          {selectedMonth ? (
            <div className="mf-flow__selection" aria-label="Tóm tắt tháng">
              <div className="mf-flow__score-block">
                <span className="mf-flow__score-label">Điểm vận khí tháng (Event-Driven)</span>
                <span className="mf-flow__score-value">{selectedMonth.score != null ? selectedMonth.score.toFixed(1) : "—"}</span>
              </div>
              <div className="mf-flow__meta-row">
                <span className="mf-flow__meta-item">
                  {formatMonthViewLabel(selectedMonth.lunarMonth, selectedMonth.isLeapMonth)}
                </span>
                <span className="mf-flow__meta-item">
                  {monthStateLabel(selectedMonth.status)}
                </span>
              </div>

              {selectedMonth.breakdown && (
                <div className="mf-flow__breakdown" style={{ marginTop: "1rem", fontSize: "0.9em", color: "var(--color-text-secondary)" }}>
                  <h4 style={{ color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>Cấu thành điểm số:</h4>
                  <ul>
                    <li>Nền vận khí năm: {selectedMonth.breakdown.annualBaseline} điểm</li>
                    <li>Sức mạnh cung tháng (Cơ bản): {selectedMonth.breakdown.palace.raw} điểm</li>
                    <li>Khứu giác ngũ hành: Tích hợp trong Sức mạnh cung tháng</li>
                    <li>Kích hoạt Đẩu Quân: {selectedMonth.breakdown.palace.dauQuanMultiplier > 1 ? `Kích hoạt (Hệ số ${selectedMonth.breakdown.palace.dauQuanMultiplier})` : "Không"}</li>
                    <li>Tứ Hoá Nguyệt Lệnh: {selectedMonth.breakdown.transformations.finalDelta > 0 ? "+" : ""}{selectedMonth.breakdown.transformations.finalDelta} điểm</li>
                  </ul>
                  {selectedMonth.collisionCandidates && selectedMonth.collisionCandidates.length > 0 && (
                    <div style={{ marginTop: "0.5rem", color: "var(--color-alert-text)" }}>
                      <strong>Cảnh báo:</strong> Trùng phùng Hóa Kỵ (Cần chuyên gia đánh giá)
                    </div>
                  )}
                </div>
              )}
              {selectedMonth.reasonCodes && selectedMonth.reasonCodes.length > 0 && (
                <div className="mf-flow__reasons" style={{ marginTop: "1rem", fontSize: "0.85em", color: "var(--color-text-muted)" }}>
                  <h5 style={{ margin: "0 0 0.5rem 0" }}>Ghi chú / Hạn chế:</h5>
                  <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                    {selectedMonth.reasonCodes.map(code => (
                      <li key={code}>{REASON_CODE_LABELS[code] || code}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
