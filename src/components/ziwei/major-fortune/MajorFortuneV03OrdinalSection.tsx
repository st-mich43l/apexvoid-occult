import { useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import {
  analyzeMajorFortuneOrdinalV03,
  type MajorFortuneOrdinalV03Analysis,
} from "@/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter";
import "./major-fortune-v03.css";

export interface MajorFortuneV03OrdinalSectionProps {
  chart: ChartData;
  school: School;
  /** Optional precomputed analysis for tests. */
  analysis?: MajorFortuneOrdinalV03Analysis;
}

function coveragePct(analysis: MajorFortuneOrdinalV03Analysis): string | null {
  const w = analysis.result?.coverage.coverageWeight;
  if (w == null) return null;
  return `${Math.round(w * 100)}%`;
}

function moduleStateLabel(analysis: MajorFortuneOrdinalV03Analysis): string {
  if (analysis.adapterStatus === "unavailable" || !analysis.result) return "Unavailable";
  if (analysis.result.status === "partial" || analysis.adapterStatus === "partial") {
    return "Partial";
  }
  return "Available";
}

/**
 * Experimental Major Fortune V0.3 ordinal UI.
 * Must only be mounted when ziweiMajorFortuneV03Ordinal is enabled.
 * Does not replace the production major-fortune rebuilding placeholder.
 */
export function MajorFortuneV03OrdinalSection({
  chart,
  school,
  analysis: analysisProp,
}: MajorFortuneV03OrdinalSectionProps) {
  const analysis = useMemo(() => {
    if (analysisProp) return analysisProp;
    return analyzeMajorFortuneOrdinalV03(chart, { school });
  }, [chart, school, analysisProp]);

  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const scoreText =
    analysis.result?.score == null ? "—" : analysis.result.score.toFixed(1);
  const bandText = analysis.result?.band ?? "—";
  const coverage = coveragePct(analysis) ?? "—";
  const cycle = analysis.cycle;

  return (
    <section
      className="mf-v03"
      data-module="major-fortune-v0.3-ordinal"
      data-experimental="true"
      data-status={analysis.adapterStatus}
      aria-label="Đại Vận V0.3 Experimental heuristic"
    >
      <header className="mf-v03__head">
        <h3 className="mf-v03__title">{analysis.display.title}</h3>
        <span className="mf-v03__badge">{analysis.display.experimentalBadge}</span>
        <p className="mf-v03__subtitle">{analysis.display.subtitle}</p>
      </header>

      <p className="mf-v03__disclaimer">{analysis.display.disclaimer}</p>

      {!analysis.result || analysis.adapterStatus === "unavailable" ? (
        <p className="mf-v03__unavailable" role="status">
          {analysis.adapterDiagnostics.missingActiveMajorFortunePalace.length > 0
            ? "Không có cung Đại Vận đang hoạt động — không tạo điểm thay thế."
            : "Không thể đánh giá Đại Vận V0.3 với dữ liệu hiện tại."}
        </p>
      ) : (
        <>
          <div className="mf-v03__summary" aria-label="Tóm tắt điểm">
            <div className="mf-v03__stat">
              <span className="mf-v03__stat-label">Điểm</span>
              <span className="mf-v03__stat-value">{scoreText}</span>
            </div>
            <div className="mf-v03__stat">
              <span className="mf-v03__stat-label">Band</span>
              <span className="mf-v03__stat-value">{bandText}</span>
            </div>
            <div className="mf-v03__stat">
              <span className="mf-v03__stat-label">Coverage</span>
              <span className="mf-v03__stat-value">{coverage}</span>
            </div>
            <div className="mf-v03__stat">
              <span className="mf-v03__stat-label">State</span>
              <span className="mf-v03__stat-value">{moduleStateLabel(analysis)}</span>
            </div>
            <div className="mf-v03__stat">
              <span className="mf-v03__stat-label">School</span>
              <span className="mf-v03__stat-value">{school}</span>
            </div>
            {cycle ? (
              <div className="mf-v03__stat mf-v03__stat--wide">
                <span className="mf-v03__stat-label">Đại vận</span>
                <span className="mf-v03__stat-value">
                  {cycle.startAge}–{cycle.endAge} · {cycle.activePalaceName} (
                  {cycle.activePalaceBranch})
                </span>
              </div>
            ) : null}
          </div>

          <div className="mf-v03__pillars" role="list">
            {analysis.display.pillarSummaries.map((pillar) => (
              <article
                key={pillar.pillarId}
                className="mf-v03__pillar"
                data-pillar={pillar.pillarId}
                data-state={pillar.state}
                role="listitem"
              >
                <h4 className="mf-v03__pillar-title">{pillar.labelVi}</h4>
                <p className="mf-v03__pillar-level">
                  {pillar.level == null ? "—" : pillar.level > 0 ? `+${pillar.level}` : String(pillar.level)}{" "}
                  <span className="mf-v03__pillar-level-label">{pillar.levelLabelVi}</span>
                </p>
                <p className="mf-v03__pillar-meta">
                  Δ {pillar.delta.toFixed(1)} · {pillar.state}
                </p>
                {pillar.evidenceLabels.length > 0 ? (
                  <ul className="mf-v03__pillar-evidence">
                    {pillar.evidenceLabels.slice(0, 3).map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                ) : null}
                {pillar.reasonLabels.length > 0 ? (
                  <p className="mf-v03__pillar-reason">{pillar.reasonLabels[0]}</p>
                ) : null}
              </article>
            ))}
          </div>

          <details
            className="mf-v03__details"
            open={evidenceOpen}
            onToggle={(e) => setEvidenceOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary>Chi tiết bằng chứng</summary>
            <ul className="mf-v03__evidence-list">
              {analysis.display.pillarSummaries.flatMap((p) =>
                p.evidenceLabels.map((label) => (
                  <li key={`${p.pillarId}:${label}`}>
                    <strong>{p.labelVi}:</strong> {label}
                  </li>
                )),
              )}
              {analysis.display.pillarSummaries.every((p) => p.evidenceLabels.length === 0) ? (
                <li>Không có bằng chứng được chấp nhận.</li>
              ) : null}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
