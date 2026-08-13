import { useEffect, useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import { type MajorFortuneAnalysis, analyzeMajorFortune } from "@/lib/ziwei/analysis/modules/major-fortune/production";
import { analyzeMajorFortuneTimeline } from "@/lib/ziwei/analysis/modules/major-fortune/timeline";
import { MajorFortuneTimelineChart } from "./MajorFortuneTimelineChart";
import { MAJOR_FORTUNE_VERSION } from "@/lib/ziwei/analysis/modules/major-fortune/version";
import "./major-fortune.css";

export interface MajorFortuneSectionProps {
  chart: ChartData;
  school: School;
  /** Optional precomputed single-cycle analysis for tests. */
  analysis?: MajorFortuneAnalysis;
}

function moduleStateLabelVi(analysis: MajorFortuneAnalysis): string {
  if (!analysis) return "";
  if (analysis.adapterStatus === "unavailable" || !analysis.result) return "Không khả dụng";
  if (analysis.result.status === "partial" || analysis.adapterStatus === "partial") {
    return "Thiếu dữ liệu";
  }
  return "Đã đánh giá";
}

/**
 * Production Major Fortune section with lifetime timeline.
 * Layout: header → chart → compact selection summary → pillars.
 */
export function MajorFortuneSection({
  chart,
  school,
  analysis: analysisProp,
}: MajorFortuneSectionProps) {
  const timeline = useMemo(
    () => analyzeMajorFortuneTimeline(chart, { school }),
    [chart, school],
  );

  const defaultCycleIndex =
    timeline.currentCycleIndex ?? timeline.points[0]?.cycleIndex ?? null;

  const [selectedCycleIndex, setSelectedCycleIndex] = useState<number | null>(
    defaultCycleIndex,
  );

  useEffect(() => {
    setSelectedCycleIndex(defaultCycleIndex);
  }, [defaultCycleIndex, chart, school]);

  const selectedPoint =
    timeline.points.find((p: any) => p.cycleIndex === selectedCycleIndex) ??
    timeline.points.find((p: any) => p.isCurrentCycle) ??
    timeline.points[0] ??
    null;

  const presentationResult = useMemo(() => {
    const override = selectedPoint
      ? {
          cycleIndex: selectedPoint.cycleIndex,
          startAge: selectedPoint.startAge,
          endAge: selectedPoint.endAge,
          activePalaceIndex: selectedPoint.activePalaceIndex,
        }
      : undefined;

    // For tests providing analysisProp, we can bypass if we want to, but the
    // prompt specifies we must not silently disable shadow comparison.
    // Actually, `analyzeMajorFortune` will run shadow mode if enabled.
    // If analysisProp is provided, we can return it as the baseline, but we should still
    // run the presentation logic if shadow is enabled.
    // The easiest way is to just call analyzeMajorFortune with the cycle override.

    return analyzeMajorFortune(chart, {
      school,
      cycleOverride: override,
      telemetryMode: selectedPoint?.isCurrentCycle ? "production-score" : "none",
    });
  }, [chart, school, selectedPoint]);

  // If a test explicitly passed analysisProp for the current cycle and we are on it,
  // we can use it for display, but presentationResult already ran shadow in the background.
  const analysis = analysisProp && selectedPoint?.isCurrentCycle
    ? analysisProp
    : presentationResult;

  const scoreText =
    analysis.result?.score == null ? "—" : analysis.result.score.toFixed(1);
  const bandText = analysis.display?.bandLabelVi ?? "—";
  const coverage =
    analysis.display?.scoringCoveragePercent == null
      ? "—"
      : `${analysis.display.scoringCoveragePercent}%`;
  const cycle = analysis.cycle;
  const viewingOther =
    selectedCycleIndex != null &&
    timeline.currentCycleIndex != null &&
    selectedCycleIndex !== timeline.currentCycleIndex;
  const schoolLabel = school === "nam-phai" ? "Nam Phái" : "Trung Châu";
  const cycleLabel = cycle
    ? `${cycle.startAge}–${cycle.endAge} tuổi`
    : selectedPoint
      ? `${selectedPoint.startAge}–${selectedPoint.endAge} tuổi`
      : null;
  const palaceLabel = cycle
    ? `${cycle.activePalaceName} (${cycle.activePalaceBranch})`
    : selectedPoint
      ? `${selectedPoint.activePalaceName} (${selectedPoint.activePalaceBranch})`
      : null;
  const warningLabel = analysis.display?.namPhaiPartialTuHoaNote
    ? "Tứ Hóa chưa khả dụng"
    : analysis.adapterStatus === "partial" || analysis.result?.status === "partial"
      ? "Thiếu dữ liệu"
      : null;
  const threePillarBaseText =
    selectedPoint?.threePillarBaseScore == null
      ? "—"
      : selectedPoint.threePillarBaseScore.toFixed(1);
  const tuHoaDeltaText =
    selectedPoint?.pillars?.["tu-hoa-sat-tinh"]?.level == null
      ? "—"
      : `${selectedPoint.tuHoaDelta > 0 ? "+" : ""}${selectedPoint.tuHoaDelta.toFixed(1)}`;

  return (
    <section
      className="mf-major-fortune"
      data-module="major-fortune"
      data-version={MAJOR_FORTUNE_VERSION.integrationVersion}
      data-integration-version={MAJOR_FORTUNE_VERSION.integrationVersion}
      data-status={analysis.adapterStatus}
      aria-label="Đại Vận"
    >
      <header className="mf-major-fortune__head">
        <div className="mf-major-fortune__head-main">
          <h3 className="mf-major-fortune__title">{analysis.display?.title ?? "Đại Vận"}</h3>
          <span className="mf-major-fortune__school-chip">{schoolLabel}</span>
        </div>
        {cycleLabel ? (
          <div className="mf-major-fortune__viewing" role="status">
            <span>{viewingOther ? `Đang xem ${cycleLabel}` : cycleLabel}</span>
            {viewingOther ? (
              <button
                type="button"
                className="mf-major-fortune__back-current"
                onClick={() => {
                  if (timeline.currentCycleIndex != null) {
                    setSelectedCycleIndex(timeline.currentCycleIndex);
                  }
                }}
              >
                Về chính vận
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {!selectedPoint ||
      (analysis.adapterStatus === "unavailable" && timeline.points.length === 0) ? (
        <p className="mf-major-fortune__unavailable" role="status">
          {timeline.points.length === 0
            ? "Không có chu kỳ Đại Vận hợp lệ để đánh giá."
            : analysis.adapterDiagnostics.missingActiveMajorFortunePalace.length > 0
              ? "Không có cung Đại Vận đang hoạt động — không tạo điểm thay thế."
              : "Không thể đánh giá Đại Vận với dữ liệu hiện tại."}
        </p>
      ) : (
        <>
          <MajorFortuneTimelineChart
            timeline={timeline}
            selectedCycleIndex={selectedCycleIndex}
            onSelectCycle={setSelectedCycleIndex}
          />

          <div className="mf-major-fortune__selection" aria-label="Tóm tắt Đại Vận">
            <div className="mf-major-fortune__score-block">
              <span className="mf-major-fortune__score-value">{scoreText}</span>
              <span className="mf-major-fortune__score-band">{bandText}</span>
            </div>
            {palaceLabel ? <span className="mf-major-fortune__meta-item">{palaceLabel}</span> : null}
            <span className="mf-major-fortune__meta-item">Dữ liệu {coverage}</span>
            {warningLabel ? (
              <span className="mf-major-fortune__warning" role="status">{warningLabel}</span>
            ) : null}
          </div>

          <div className="mf-major-fortune__pillars" role="list">
            {(analysis.display?.pillarSummaries || []).map((s: any) => (
              <article
                key={s.pillarId}
                className="mf-major-fortune__pillar"
                data-pillar={s.pillarId}
                data-state={s.state}
                role="listitem"
              >
                <h4 className="mf-major-fortune__pillar-title">{s.labelVi}</h4>
                <p className="mf-major-fortune__pillar-level">
                  <strong>{s.level == null
                      ? "—"
                      : s.level > 0
                        ? `+${s.level}`
                        : String(s.level)}</strong>{" "}
                  <span className="mf-major-fortune__pillar-level-label">{s.levelLabelVi}</span>
                </p>
              </article>
            ))}
          </div>

          <details className="mf-major-fortune__details">
            <summary>Xem cách tính &amp; bằng chứng</summary>
            <div className="mf-major-fortune__details-body">
              <dl className="mf-major-fortune__metrics">
                <div><dt>Tổng điểm</dt><dd>{scoreText}</dd></div>
                <div><dt>Nền 3 trụ</dt><dd>{threePillarBaseText}</dd></div>
                <div><dt>Tứ Hóa</dt><dd>{tuHoaDeltaText}</dd></div>
                <div><dt>Độ phủ</dt><dd>{coverage}</dd></div>
              </dl>
              {analysis.display?.scoredPillarFractionLabel ? (
                <p className="mf-major-fortune__technical-note">
                  {analysis.display.scoredPillarFractionLabel} · {moduleStateLabelVi(analysis)}
                </p>
              ) : null}
              {analysis.display?.namPhaiPartialTuHoaNote ? (
                <p className="mf-major-fortune__technical-note">
                  {analysis.display.namPhaiPartialTuHoaNote}
                </p>
              ) : null}
              <ul className="mf-major-fortune__evidence-list">
                {(analysis.display?.pillarSummaries || []).flatMap((p: any) => {
                  const labels = [...p.reasonLabels, ...p.evidenceLabels];
                  return labels.map((label: string, index: number) => (
                    <li key={`${p.pillarId}:${index}:${label}`}>
                      <strong>{p.labelVi}:</strong> {label}
                    </li>
                  ));
                })}
                {analysis.display?.pillarSummaries?.every(
                  (p: any) => p.reasonLabels.length === 0 && p.evidenceLabels.length === 0,
                ) ? <li>Không có bằng chứng được chấp nhận.</li> : null}
              </ul>
              <p className="mf-major-fortune__disclaimer">{analysis.display?.disclaimer}</p>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
