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
 * Production Major Fortune V0.3 section with lifetime timeline.
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
    const override = selectedPoint ? {
      cycleIndex: selectedPoint.cycleIndex,
      startAge: selectedPoint.startAge,
      endAge: selectedPoint.endAge,
      activePalaceIndex: selectedPoint.activePalaceIndex,
    } : undefined;

    // For tests providing analysisProp, we can bypass if we want to, but the
    // prompt specifies we must not silently disable shadow comparison.
    // Actually, `analyzeMajorFortune` will run shadow mode if enabled.
    // If analysisProp is provided, we can return it as the baseline, but we should still
    // run the presentation logic if shadow is enabled.
    // The easiest way is to just call analyzeMajorFortune with the cycle override.

    return analyzeMajorFortune(chart, {
      school,
      cycleOverride: override,
      telemetryMode: selectedPoint?.isCurrentCycle ? "production-score" : "none"
    });
  }, [chart, school, selectedPoint]);

  // If a test explicitly passed analysisProp for the current cycle and we are on it,
  // we can use it for display, but presentationResult already ran shadow in the background.
  const analysis = (analysisProp && selectedPoint?.isCurrentCycle)
    ? analysisProp
    : presentationResult;

  const [evidenceOpen, setEvidenceOpen] = useState(false);

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
        {viewingOther && selectedPoint ? (
          <div className="mf-major-fortune__viewing" role="status">
            <span>
              Đang xem: {selectedPoint.startAge}–{selectedPoint.endAge}
            </span>
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

          <div className="mf-major-fortune__selection" aria-label="Tóm tắt điểm">
            <div className="mf-major-fortune__score-block">
              <span className="mf-major-fortune__score-value mf-v03__score-value">{scoreText}</span>
              <span className="mf-major-fortune__score-band">{bandText}</span>
            </div>
            <div className="mf-major-fortune__meta-row">
              {cycle ? (
                <span className="mf-major-fortune__meta-item">
                  {cycle.startAge}–{cycle.endAge} · {cycle.activePalaceName} (
                  {cycle.activePalaceBranch})
                </span>
              ) : null}
              <span className="mf-major-fortune__meta-item">Độ phủ {coverage}</span>
              <span className="mf-major-fortune__meta-item">{moduleStateLabelVi(analysis)}</span>
              {analysis.display?.scoredPillarFractionLabel ? (
                <span className="mf-major-fortune__meta-item">
                  {analysis.display.scoredPillarFractionLabel}
                </span>
              ) : null}
            </div>
            {analysis.display?.namPhaiPartialTuHoaNote ? (
              <p className="mf-major-fortune__partial-note" role="status">
                {analysis.display.namPhaiPartialTuHoaNote}
              </p>
            ) : null}
          </div>

          <div className="mf-major-fortune__pillars mf-v03__pillars" role="list">
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
                  {s.level == null
                    ? "—"
                    : s.level > 0
                      ? `+${s.level}`
                      : String(s.level)}{" "}
                  <span className="mf-major-fortune__pillar-level-label">{s.levelLabelVi}</span>
                </p>
                <p className="mf-major-fortune__pillar-meta">
                  Δ {s.delta.toFixed(1)} · {s.stateLabelVi}
                </p>
                {s.reasonLabels.length > 0 ? (
                  <p className="mf-major-fortune__pillar-reason">{s.reasonLabels[0]}</p>
                ) : null}
              </article>
            ))}
          </div>

          <details
            className="mf-major-fortune__details"
            open={evidenceOpen}
            onToggle={(e) => setEvidenceOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary>Chi tiết bằng chứng</summary>
            <ul className="mf-major-fortune__evidence-list">
              {(analysis.display?.pillarSummaries || []).flatMap((p: any) =>
                p.evidenceLabels.map((label: string) => (
                  <li key={`${p.pillarId}:${label}`}>
                    <strong>{p.labelVi}:</strong> {label}
                  </li>
                )),
              )}
              {analysis.display?.pillarSummaries?.every((p: any) => p.evidenceLabels.length === 0) ? (
                <li>Không có bằng chứng được chấp nhận.</li>
              ) : null}
            </ul>
          </details>
        </>
      )}

      <p className="mf-major-fortune__disclaimer">{analysis.display?.disclaimer}</p>
    </section>
  );
}
