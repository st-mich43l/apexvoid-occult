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
      <header className="mf-flow__head">
        <div className="mf-flow__head-main">
          <h3 className="mf-flow__title">Lưu Nguyệt</h3>
          <span
            className="mf-flow__badge"
            title={`Engine Lưu Nguyệt ${MONTHLY_FLOW_VERSION.integrationVersion}`}
          >
            Mới nhất
          </span>
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

              {selectedMonth.breakdown ? (
                <section className="mf-flow__breakdown" aria-label="Cấu thành điểm tháng">
                  <h4 className="mf-flow__breakdown-title">Cấu thành vận khí</h4>
                  <div className="mf-flow__metric-grid">
                    <article className="mf-flow__metric">
                      <span className="mf-flow__metric-label">Nền năm</span>
                      <strong className="mf-flow__metric-value">
                        {selectedMonth.breakdown.annualBaseline}
                      </strong>
                      <span className="mf-flow__metric-unit">điểm</span>
                    </article>
                    <article className="mf-flow__metric">
                      <span className="mf-flow__metric-label">Cung tháng</span>
                      <strong className="mf-flow__metric-value">
                        {selectedMonth.breakdown.palace.raw}
                      </strong>
                      <span className="mf-flow__metric-unit">đã gồm ngũ hành</span>
                    </article>
                    <article className="mf-flow__metric">
                      <span className="mf-flow__metric-label">Đẩu Quân</span>
                      <strong className="mf-flow__metric-value mf-flow__metric-value--text">
                        {selectedMonth.breakdown.palace.dauQuanMultiplier > 1
                          ? `×${selectedMonth.breakdown.palace.dauQuanMultiplier}`
                          : "Không"}
                      </strong>
                      <span className="mf-flow__metric-unit">hệ số kích hoạt</span>
                    </article>
                    <article className="mf-flow__metric">
                      <span className="mf-flow__metric-label">Tứ Hóa</span>
                      <strong className="mf-flow__metric-value">
                        {selectedMonth.breakdown.transformations.finalDelta > 0 ? "+" : ""}
                        {selectedMonth.breakdown.transformations.finalDelta}
                      </strong>
                      <span className="mf-flow__metric-unit">điểm nguyệt lệnh</span>
                    </article>
                  </div>
                  {selectedMonth.collisionCandidates && selectedMonth.collisionCandidates.length > 0 ? (
                    <div className="mf-flow__warning" role="status">
                      <strong>Trùng phùng Hóa Kỵ</strong>
                      <span>Cần chuyên gia đánh giá thêm.</span>
                    </div>
                  ) : null}
                </section>
              ) : null}
              {selectedMonth.reasonCodes && selectedMonth.reasonCodes.length > 0 ? (
                <details className="mf-flow__reasons">
                  <summary>Giới hạn dữ liệu ({selectedMonth.reasonCodes.length})</summary>
                  <ul>
                    {selectedMonth.reasonCodes.map((code) => (
                      <li key={code}>{REASON_CODE_LABELS[code] || code}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
