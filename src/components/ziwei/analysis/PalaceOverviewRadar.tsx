import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import {
  analyzeAllPalaces,
  type PalaceEvidence,
  type PalaceOverviewBand,
  type PalaceOverviewResult,
} from "@/lib/ziwei/analysis/modules/palace-overview";
import { analyzePalaceCandidate } from "@/lib/ziwei/analysis/modules/palace-overview/candidate/analyze";
import { analyzePalaceStrong } from "@/lib/ziwei/analysis/modules/palace-overview/candidate/v2/analyze-strong";
import { readPalaceCandidateView } from "@/lib/ziwei/analysis/modules/palace-overview/candidate/v2/research-view";
import { loadPalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2";
import { indexFactsByPalace, normalizeNatalFacts } from "@/lib/ziwei/analysis/facts";
import {
  formatAxisContribution,
  formatContribution,
  renderExplanationKey,
} from "./explanation-renderer";
import "./palace-overview-radar.css";

const CX = 180;
const CY = 180;
/** Chart radius — keep polygon large (~78% of half-viewBox); labels spill
 * outside via overflow:visible rather than shrinking the ring. */
const R = 140;
/** Clearance from the outer ring to the label anchor point. */
const LABEL_GAP = 12;

/** Short, unambiguous radar labels for the 12 palace names. */
const PALACE_SHORT_LABEL: Record<string, string> = {
  "Mệnh": "Mệnh",
  "Phụ Mẫu": "P.Mẫu",
  "Phúc Đức": "Phúc",
  "Điền Trạch": "Đ.Tr",
  "Quan Lộc": "Q.Lộc",
  "Nô Bộc": "Nô",
  "Thiên Di": "T.Di",
  "Tật Ách": "T.Ách",
  "Tài Bạch": "T.Bạch",
  "Tử Tức": "T.Tức",
  "Phu Thê": "P.Thê",
  "Huynh Đệ": "H.Đệ",
};

const BAND_LABEL: Record<PalaceOverviewBand, string> = {
  low: "Cẩn trọng",
  guarded: "Cẩn trọng",
  balanced: "Cân bằng",
  supportive: "Thuận lợi",
  strong: "Mạnh",
};

/** V1.2 — small non-score Mệnh/Thân suffix for the radar point label. */
function menhThanSuffix(result: PalaceOverviewResult): string {
  if (result.isMenh && result.isThan) return " (M·T)";
  if (result.isMenh) return " (M)";
  if (result.isThan) return " (T)";
  return "";
}

function palaceShortLabel(name: string): string {
  return PALACE_SHORT_LABEL[name] ?? name.slice(0, 4);
}

function polar(index: number, total: number, radius: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

function sectorPath(index: number, total: number, radius: number): string {
  const step = (Math.PI * 2) / total;
  const a0 = step * (index - 0.5) - Math.PI / 2;
  const a1 = step * (index + 0.5) - Math.PI / 2;
  const x0 = CX + radius * Math.cos(a0);
  const y0 = CY + radius * Math.sin(a0);
  const x1 = CX + radius * Math.cos(a1);
  const y1 = CY + radius * Math.sin(a1);
  return `M ${CX} ${CY} L ${x0} ${y0} A ${radius} ${radius} 0 0 1 ${x1} ${y1} Z`;
}

/** Place labels just outside the ring. Anchor text outward (start/end)
 * on the sides so long labels grow away from the polygon instead of
 * forcing the chart to shrink. */
function labelPlacement(index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const radial = R + LABEL_GAP + (sin > 0.55 ? 8 : 0);
  let textAnchor: "start" | "middle" | "end" = "middle";
  let dx = 0;
  let dy = 0;
  if (cos > 0.35) {
    textAnchor = "start";
    dx = 4;
  } else if (cos < -0.35) {
    textAnchor = "end";
    dx = -4;
  }
  if (sin > 0.55) dy = 10;
  else if (sin < -0.55) dy = -4;
  return {
    x: CX + radial * cos,
    y: CY + radial * sin,
    textAnchor,
    dx,
    dy,
  };
}

function polygonPoints(scores: number[]): string {
  return scores
    .map((score, i) => {
      const p = polar(i, scores.length, (Math.max(0, Math.min(100, score)) / 100) * R);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
}

export interface PalaceOverviewRadarProps {
  chart: ChartData;
  school: School;
}

export function PalaceOverviewRadar({ chart, school }: PalaceOverviewRadarProps) {
  const candidateView = readPalaceCandidateView();
  const analysis = useMemo(() => {
    if (candidateView === "baseline") {
      return analyzeAllPalaces(chart, { school });
    }
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
    if (!loaded.ok) {
      return analyzeAllPalaces(chart, { school });
    }
    const { facts, duplicateIds } = normalizeNatalFacts(chart, { school });
    const factsByPalace = indexFactsByPalace(facts);
    const results =
      candidateView === "moderate"
        ? chart.palaces.map(
            (p) =>
              analyzePalaceCandidate({
                chart,
                palaceIndex: p.index,
                school,
                factsByPalace,
                knowledge: loaded.knowledge,
                duplicateFactIds: duplicateIds,
              }).result,
          )
        : chart.palaces.map(
            (p) =>
              analyzePalaceStrong({
                chart,
                palaceIndex: p.index,
                school,
                factsByPalace,
                knowledge: loaded.knowledge,
                duplicateFactIds: duplicateIds,
              }).result,
          );
    return {
      ...analyzeAllPalaces(chart, { school }),
      results,
    };
  }, [chart, school, candidateView]);
  const results = analysis.results;
  // V1.2.1: store only the selection key, never the analysis object itself —
  // a stale PalaceOverviewResult would otherwise keep showing the previous
  // chart/school's scores until the user manually reselected (see PR #81
  // review thread). Deriving from `results` each render means a chart/school
  // change can never leave stale data on screen.
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);
  const [hoveredPalaceIndex, setHoveredPalaceIndex] = useState<number | null>(null);
  const pointRefs = useRef(new Map<number, SVGGElement>());

  useEffect(() => {
    setSelectedPalaceIndex(null);
    setHoveredPalaceIndex(null);
  }, [chart, school]);

  const selected =
    selectedPalaceIndex == null
      ? null
      : (results.find((r) => r.palaceIndex === selectedPalaceIndex) ?? null);
  const hovered =
    hoveredPalaceIndex == null
      ? null
      : (results.find((r) => r.palaceIndex === hoveredPalaceIndex) ?? null);

  const ordered = useMemo(() => {
    if (!analysis.knowledgeValid || results.length === 0) return [];
    const byBranch = chart.palaces.map(
      (p) => results.find((r) => r.palaceIndex === p.index)!,
    );
    // Mệnh always sits at the top of the radar (index 0 → 12 o'clock),
    // regardless of which branch it lands on for this chart — rotate the
    // ring rather than reorder scores.
    const menhIndex = byBranch.findIndex((r) => r.palaceName === "Mệnh");
    if (menhIndex <= 0) return byBranch;
    return [...byBranch.slice(menhIndex), ...byBranch.slice(0, menhIndex)];
  }, [analysis.knowledgeValid, chart.palaces, results]);

  if (!analysis.knowledgeValid || ordered.length === 0) {
    return (
      <div className="palace-overview-radar" role="status">
        <p>Không tải được dữ liệu tri thức Tử Vi cho module này.</p>
      </div>
    );
  }

  const active = selected ?? hovered;
  const scores = ordered.map((r) => r.score);

  function togglePalace(palaceIndex: number) {
    setSelectedPalaceIndex((cur) => (cur === palaceIndex ? null : palaceIndex));
  }

  return (
    <div className="palace-overview-radar" data-module="palace-overview">
      <div className="palace-overview-radar__head">
        <h3 className="palace-overview-radar__title">Cấu trúc 12 cung</h3>
      </div>

      <div className="palace-overview-radar__body">
        <div className="palace-overview-radar__svg-wrap">
          <svg
            className="palace-overview-radar__svg"
            viewBox="0 0 360 360"
            role="img"
            aria-label="Radar cấu trúc 12 cung"
          >
            {[0.25, 0.5, 0.75, 1].map((scale) => (
              <polygon
                key={scale}
                points={Array.from({ length: 12 }, (_, i) => {
                  const p = polar(i, 12, R * scale);
                  return `${p.x},${p.y}`;
                }).join(" ")}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.18}
              />
            ))}
            {ordered.map((_, i) => {
              const p = polar(i, 12, R);
              return (
                <line
                  key={`axis-${i}`}
                  x1={CX}
                  y1={CY}
                  x2={p.x}
                  y2={p.y}
                  stroke="currentColor"
                  strokeOpacity={0.14}
                />
              );
            })}
            <polygon
              points={polygonPoints(scores)}
              fill="color-mix(in srgb, currentColor 18%, transparent)"
              stroke="currentColor"
              strokeWidth={1.4}
              pointerEvents="none"
            />
            {ordered.map((result, i) => {
              const p = polar(i, 12, (result.score / 100) * R);
              const label = labelPlacement(i, 12);
              const isActive = active?.palaceIndex === result.palaceIndex;
              return (
                <g
                  key={result.palaceIndex}
                  ref={(el) => {
                    if (el) pointRefs.current.set(result.palaceIndex, el);
                    else pointRefs.current.delete(result.palaceIndex);
                  }}
                  className={`palace-overview-radar__axis palace-overview-radar__point${isActive ? " is-active" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedPalaceIndex === result.palaceIndex}
                  aria-label={`${result.palaceName} · ${result.palaceBranch}${menhThanSuffix(result)} — điểm ${result.score}, ${BAND_LABEL[result.band]}`}
                  onMouseEnter={() => setHoveredPalaceIndex(result.palaceIndex)}
                  onMouseLeave={() => setHoveredPalaceIndex(null)}
                  onFocus={() => setHoveredPalaceIndex(result.palaceIndex)}
                  onBlur={() => setHoveredPalaceIndex(null)}
                  onClick={() => togglePalace(result.palaceIndex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      togglePalace(result.palaceIndex);
                    }
                  }}
                >
                  <path
                    className="palace-overview-radar__hit"
                    d={sectorPath(i, 12, R + LABEL_GAP + 24)}
                    fill={isActive ? "color-mix(in srgb, currentColor 12%, transparent)" : "transparent"}
                    pointerEvents="all"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 4.5 : 3.2}
                    fill="currentColor"
                  />
                  <text
                    className={`palace-overview-radar__label${isActive ? " is-active" : ""}`}
                    x={label.x}
                    y={label.y}
                    dx={label.dx}
                    dy={label.dy}
                    textAnchor={label.textAnchor}
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {palaceShortLabel(result.palaceName)}
                    {menhThanSuffix(result)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <p className="palace-overview-radar__hint" role="status">
          {active ? (
            <>
              <strong>{active.palaceName}</strong>
              <span>
                {BAND_LABEL[active.band]} · {active.score}
              </span>
            </>
          ) : (
            "Chạm một cung để xem chi tiết."
          )}
        </p>
      </div>

      {selected ? (
        <PalaceOverviewDetail
          result={selected}
          semanticStatus={analysis.semanticStatus}
          onClose={() => {
            const palaceIndex = selectedPalaceIndex;
            setSelectedPalaceIndex(null);
            if (palaceIndex != null) pointRefs.current.get(palaceIndex)?.focus();
          }}
        />
      ) : null}
    </div>
  );
}

function classifyGroup(e: PalaceEvidence): "A" | "B" | "C" | "D" | "E" | "F" | "G" | null {
  if (e.category === "major-star") {
    return e.palaceRole === "focus" && !e.borrowedFromOpposite ? "A" : "B";
  }
  if (e.category === "transformation") return "C";
  if (e.category === "minor-star-family") {
    return e.axes.support >= e.axes.pressure ? "D" : "E";
  }
  if (e.category === "chang-sheng" || e.category === "void-environment") return "F";
  if (e.category === "structural-rule") return "G";
  return null;
}

function groupByFamilyLabel(items: PalaceEvidence[]): Array<[string, PalaceEvidence[]]> {
  const map = new Map<string, PalaceEvidence[]>();
  for (const e of items) {
    const key = e.familyLabel ?? "Khác";
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return [...map.entries()];
}

function CompactEvidenceLine({ e }: { e: PalaceEvidence }) {
  const contrib = formatContribution(e.axes);
  const brightness = e.starBrightness ? ` · ${e.starBrightness}` : "";
  return (
    <li title={contrib === "—" ? undefined : contrib}>
      {e.label}
      {brightness}
    </li>
  );
}

/** V1.2.1 — compact minor-star row showing only the one relevant axis
 * (support OR pressure), never all four, per the independent grouping. */
function MinorAxisLine({
  e,
  axis,
}: {
  e: PalaceEvidence;
  axis: "support" | "pressure";
}) {
  return (
    <li title={Math.abs(e.axes[axis]) < 0.05 ? undefined : formatAxisContribution(axis, e.axes[axis])}>
      {e.label}
    </li>
  );
}

function DriverList({ drivers }: { drivers: PalaceEvidence[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? drivers : drivers.slice(0, 3);
  return (
    <>
      <ul>
        {shown.length === 0 ? (
          <li>—</li>
        ) : (
          shown.map((e) => <CompactEvidenceLine key={e.id} e={e} />)
        )}
      </ul>
      {drivers.length > 3 ? (
        <button
          type="button"
          className="palace-overview-detail__expand"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Thu gọn" : `Xem thêm (+${drivers.length - 3})`}
        </button>
      ) : null}
    </>
  );
}

function PalaceOverviewDetail({
  result,
  semanticStatus,
  onClose,
}: {
  result: PalaceOverviewResult;
  semanticStatus: "available" | "unavailable";
  onClose: () => void;
}) {
  const groupA = result.allEvidence.filter((e) => classifyGroup(e) === "A");
  const groupB = result.allEvidence.filter((e) => classifyGroup(e) === "B");
  const groupC = result.allEvidence.filter((e) => classifyGroup(e) === "C");
  const groupF = result.allEvidence.filter((e) => classifyGroup(e) === "F");
  const groupG = result.allEvidence.filter((e) => classifyGroup(e) === "G");
  const voidEnvironment = groupF.filter((e) => e.category === "void-environment");
  const supportMinors = result.allEvidence.filter(
    (e) => e.category === "minor-star-family" && e.axes.support > 0,
  );
  const pressureMinors = result.allEvidence.filter(
    (e) => e.category === "minor-star-family" && e.axes.pressure > 0,
  );

  const coreIds = new Set(groupA.map((e) => e.id));
  const extraSupport = result.topSupportDrivers.filter((e) => !coreIds.has(e.id));
  const extraPressure = result.topPressureDrivers.filter((e) => !coreIds.has(e.id));

  return (
    <div className="palace-overview-detail">
      <h4 className="palace-overview-detail__title">
        Chi tiết · {result.palaceName}
        {result.isMenh ? (
          <span className="palace-overview-detail__badge">Mệnh</span>
        ) : null}
        {result.isThan ? (
          <span className="palace-overview-detail__badge">Thân</span>
        ) : null}
      </h4>
      <p className="palace-overview-detail__band">
        {BAND_LABEL[result.band]} · {result.score}
      </p>

      <section className="palace-overview-detail__section">
        <h5>Cấu trúc lõi</h5>
        <ul>
          {groupA.length === 0 ? (
            <li>—</li>
          ) : (
            groupA.map((e) => <CompactEvidenceLine key={e.id} e={e} />)
          )}
        </ul>
        {groupC.length > 0 ? (
          <p className="palace-overview-detail__meta">
            Tứ Hóa: {groupC.map((e) => e.label).join(", ")}
          </p>
        ) : null}
        {voidEnvironment.some((e) => e.palaceRole === "focus") ? (
          <ul>
            {[
              ...new Map(
                voidEnvironment
                  .filter((e) => e.palaceRole === "focus")
                  .map((e) => [e.explanationKey, e]),
              ).values(),
            ].map((e) => (
              <li key={e.id} title={renderExplanationKey(e.explanationKey, e.label)}>
                {e.label.replace(/\+/g, " · ")}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {extraSupport.length > 0 ? (
        <section className="palace-overview-detail__section">
          <h5>Hỗ trợ nổi bật</h5>
          <DriverList drivers={extraSupport} />
        </section>
      ) : null}

      {extraPressure.length > 0 ? (
        <section className="palace-overview-detail__section">
          <h5>Áp lực nổi bật</h5>
          <DriverList drivers={extraPressure} />
        </section>
      ) : null}

      <details className="palace-overview-detail__section palace-overview-detail__full-evidence">
        <summary>Xem toàn bộ bằng chứng</summary>

        <section className="palace-overview-detail__section">
          <h5>A. Chính tinh tại cung</h5>
          <ul>
            {groupA.length === 0 ? <li>—</li> : groupA.map((e) => <CompactEvidenceLine key={e.id} e={e} />)}
          </ul>
        </section>

        <section className="palace-overview-detail__section">
          <h5>B. Chính tinh hội chiếu</h5>
          <ul>
            {groupB.length === 0 ? <li>—</li> : groupB.map((e) => <CompactEvidenceLine key={e.id} e={e} />)}
          </ul>
        </section>

        <section className="palace-overview-detail__section">
          <h5>C. Tứ Hóa gốc</h5>
          <ul>
            {groupC.length === 0 ? <li>—</li> : groupC.map((e) => <CompactEvidenceLine key={e.id} e={e} />)}
          </ul>
        </section>

        <section className="palace-overview-detail__section">
          <h5>D. Phụ tinh hỗ trợ</h5>
          {supportMinors.length === 0 ? (
            <ul><li>—</li></ul>
          ) : (
            groupByFamilyLabel(supportMinors).map(([label, items]) => (
              <div key={label} className="palace-overview-detail__family-group">
                <p className="palace-overview-detail__family-label">{label}</p>
                <ul>
                  {items.map((e) => <MinorAxisLine key={e.id} e={e} axis="support" />)}
                </ul>
              </div>
            ))
          )}
        </section>

        <section className="palace-overview-detail__section">
          <h5>E. Phụ tinh áp lực</h5>
          {pressureMinors.length === 0 ? (
            <ul><li>—</li></ul>
          ) : (
            groupByFamilyLabel(pressureMinors).map(([label, items]) => (
              <div key={label} className="palace-overview-detail__family-group">
                <p className="palace-overview-detail__family-label">{label}</p>
                <ul>
                  {items.map((e) => <MinorAxisLine key={e.id} e={e} axis="pressure" />)}
                </ul>
              </div>
            ))
          )}
        </section>

        <section className="palace-overview-detail__section">
          <h5>F. Trường Sinh / môi trường</h5>
          <ul>
            {groupF.length === 0 ? <li>—</li> : groupF.map((e) => <CompactEvidenceLine key={e.id} e={e} />)}
          </ul>
        </section>

        <section className="palace-overview-detail__section">
          <h5>G. Cách cục</h5>
          <ul>
            {groupG.length === 0 ? <li>—</li> : groupG.map((e) => <CompactEvidenceLine key={e.id} e={e} />)}
          </ul>
        </section>

        {result.contextOnlyStars.length > 0 ? (
          <section className="palace-overview-detail__section">
            <h5>H. Sao ngữ cảnh chưa chấm điểm</h5>
            <ul>
              {result.contextOnlyStars.map((s, i) => (
                <li key={`${s.name}-${s.role}-${i}`}>
                  {s.name} · {s.role}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </details>

      <details className="palace-overview-detail__section palace-overview-detail__meta-details">
        <summary>Thông tin mô hình</summary>
        <p className="palace-overview-detail__meta">
          Mức đánh giá {BAND_LABEL[result.band]} · Độ đầy đủ dữ liệu{" "}
          {result.evidenceCompleteness} · {result.school}
        </p>
        <p className="palace-overview-detail__meta">
          Trạng thái semantic:{" "}
          {semanticStatus === "available" ? "Có sẵn" : "Không khả dụng"}
        </p>
      </details>

      <button type="button" className="palace-overview-detail__close" onClick={onClose}>
        Đóng
      </button>
    </div>
  );
}
