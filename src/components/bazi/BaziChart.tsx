import { useState, useMemo, type ReactNode } from "react";
import { BaziFullChart, BaziPillarDetail, DerivedPillarDetail } from "@/lib/bazi/bazi-engine";
import { LuckPillar } from "@/lib/bazi/luck-pillars";
import { SymbolicStar } from "@/lib/bazi/symbolic-stars";
import { calculateElementStrength } from "@/lib/bazi/element-strength";
import { determineYongShen } from "@/lib/bazi/yong-shen";
import { getElement } from "@/lib/bazi/elements";
import { tenGodAbbr } from "@/lib/bazi/ten-gods";
import { pad2, polarityElementLabel } from "@/lib/bazi/civil-display";
import { ELEMENT_COLOR_VAR } from "./element-colors";
import { ElementRadar } from "./ElementRadar";
import { AnnualYearsTable } from "./AnnualYearsTable";
import { useDragScroll } from "./useDragScroll";

// Màu ngũ hành của can/chi — dùng chung token --element-* (xem element-colors.ts),
// phân loại can/chi dựa trên getElement() đã có ở lib/bazi/elements.ts (không lặp
// lại mảng ngũ hành riêng, không đụng logic phân loại đó).
function getElementColor(char: string): string {
  return ELEMENT_COLOR_VAR[getElement(char)];
}

const STAR_SOURCE_LABEL: Record<SymbolicStar["sourceType"], string> = {
  DayStem: "từ can ngày",
  YearStem: "từ can năm",
  DayBranch: "từ chi ngày",
  YearBranch: "từ chi năm",
};

function StarPill({ star }: { star: SymbolicStar }) {
  return (
    <span
      title={STAR_SOURCE_LABEL[star.sourceType]}
      className="inline-flex flex-col items-center text-[11px] bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-paper/80 leading-tight"
    >
      <span>{star.name}</span>
      <span className="text-[8px] text-muted/50">{STAR_SOURCE_LABEL[star.sourceType]}</span>
    </span>
  );
}

function RowLabel({ children }: { children: string }) {
  return (
    <div className="px-2 py-2 text-[10px] uppercase tracking-widest text-muted/70 flex items-center border-t border-[var(--border-subtle)] bg-[var(--surface-2)]">
      {children}
    </div>
  );
}

function PillarCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-2 py-2 border-t border-[var(--border-subtle)] flex flex-col items-center justify-center text-center ${className}`}>
      {children}
    </div>
  );
}

interface HiddenStemStyle {
  stem: string;
  role: string;
  tenGod: string;
}

// Bản khí là khí chủ đạo của Chi, nên phải nổi bật hơn Trung khí và Dư khí.
const HIDDEN_STEM_STYLE: Record<string, HiddenStemStyle> = {
  "Bản khí": {
    stem: "text-base font-bold",
    role: "text-[10px] tracking-wide text-muted/70",
    tenGod: "text-xs text-muted/80",
  },
  "Trung khí": {
    stem: "text-sm font-medium opacity-80",
    role: "text-[9px] tracking-wide text-muted/50",
    tenGod: "text-[11px] text-muted/60",
  },
  "Dư khí": {
    stem: "text-xs font-normal opacity-60",
    role: "text-[9px] tracking-wide text-muted/40",
    tenGod: "text-[10px] text-muted/50",
  },
};
const FALLBACK_HIDDEN_STEM_STYLE = HIDDEN_STEM_STYLE["Dư khí"]!;

function HiddenStemsBlock({ detail }: { detail: BaziPillarDetail }) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {detail.hiddenStems.map((hidden, i) => {
        const style = HIDDEN_STEM_STYLE[hidden.type] ?? FALLBACK_HIDDEN_STEM_STYLE;
        return (
          <div key={i} className="flex justify-between items-baseline gap-2">
            <span className="flex items-baseline gap-1 min-w-0">
              <span className={style.stem} style={{ color: getElementColor(hidden.stem) }}>{hidden.stem}</span>
              <span className={style.role}>{hidden.type}</span>
            </span>
            <span className={`${style.tenGod} shrink-0`}>
              {tenGodAbbr(hidden.tenGod)} · {hidden.tenGod}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FourPillarsTable({ chart }: { chart: BaziFullChart }) {
  const c = chart.metadata.civil;
  const clock = c ? `${pad2(c.clockHour)}:${pad2(c.clockMinute)}` : "—";
  const lunarMonth = c ? (c.lunarLeap ? `${c.lunarMonth} nhuận` : String(c.lunarMonth)) : "—";
  const pillars: { title: string; detail: BaziPillarDetail; isDayPillar: boolean; key: "year" | "month" | "day" | "hour" }[] = [
    { title: "Trụ Năm", detail: chart.details.year, isDayPillar: false, key: "year" },
    { title: "Trụ Tháng", detail: chart.details.month, isDayPillar: false, key: "month" },
    { title: "Trụ Ngày", detail: chart.details.day, isDayPillar: true, key: "day" },
    { title: "Trụ Giờ", detail: chart.details.hour, isDayPillar: false, key: "hour" },
  ];

  const calendarFor = (key: "year" | "month" | "day") => {
    if (!c) return { solar: "—", lunar: "—", agri: "—" };
    if (key === "year") return { solar: String(c.solarYear), lunar: String(c.lunarYear), agri: String(c.solarYear) };
    if (key === "month") return { solar: String(c.solarMonth), lunar: lunarMonth, agri: c.jieqi };
    return { solar: String(c.solarDay), lunar: String(c.lunarDay), agri: String(c.lunarDay) };
  };

  return (
    <div
      data-testid="bazi-calendar-header"
      className="overflow-x-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]"
    >
      <div className="min-w-[52rem] grid grid-cols-[6.75rem_repeat(4,minmax(9.5rem,1fr))] grid-rows-[repeat(11,auto)]">
        <div className="grid grid-rows-subgrid row-span-11">
          <div className="px-2 py-2 text-[10px] uppercase tracking-widest text-muted/60 font-semibold flex items-center bg-[var(--surface-2)]">
            Lá số
          </div>
          <RowLabel>Dương lịch</RowLabel>
          <RowLabel>Âm lịch</RowLabel>
          <RowLabel>Nông lịch</RowLabel>
          <RowLabel>Thiên can</RowLabel>
          <RowLabel>Địa chi</RowLabel>
          <RowLabel>Tàng can</RowLabel>
          <RowLabel>Nạp âm</RowLabel>
          <RowLabel>Trường sinh</RowLabel>
          <RowLabel>Tuần không</RowLabel>
          <RowLabel>Thần sát</RowLabel>
        </div>

        {pillars.map((p, i) => {
          const cal = p.key === "hour" ? null : calendarFor(p.key);
          return (
            <div
              key={p.key}
              data-testid={`pillar-column-${p.key}`}
              className={`grid grid-rows-subgrid row-span-11 border-l border-[var(--border-subtle)] ${
                p.isDayPillar ? "bg-gold/[0.06] ring-1 ring-inset ring-gold/40" : ""
              }`}
              style={{ gridColumn: i + 2 }}
            >
              <div
                className={`px-2 py-2 text-center text-xs font-semibold tracking-wider uppercase ${
                  p.isDayPillar ? "text-gold bg-gold/10" : "text-muted bg-[var(--surface-2)]"
                }`}
              >
                {p.title}
              </div>

              {p.key === "hour" ? (
                <PillarCell className="row-span-3">
                  <span className="text-xl font-mono font-semibold text-paper">{clock}</span>
                  <span className="text-[10px] text-muted/70 mt-1">{c?.hourBranch ?? ""}</span>
                </PillarCell>
              ) : (
                <>
                  <PillarCell className="text-sm text-paper">{cal!.solar}</PillarCell>
                  <PillarCell className="text-sm text-paper">{cal!.lunar}</PillarCell>
                  <PillarCell className="text-sm text-paper">{cal!.agri}</PillarCell>
                </>
              )}

              <PillarCell>
                <div
                  className={
                    p.isDayPillar
                      ? "text-[11px] font-bold text-gold tracking-widest uppercase"
                      : "text-[10px] text-muted/70 tracking-wider uppercase"
                  }
                >
                  {p.detail.tenGod}
                  {p.detail.tenGod !== "Nhật Chủ" ? (
                    <span className="ml-1 opacity-70">{tenGodAbbr(p.detail.tenGod)}</span>
                  ) : null}
                </div>
                <div
                  className="text-2xl font-han font-bold leading-none mt-1"
                  style={{ color: getElementColor(p.detail.pillar.stem) }}
                >
                  {p.detail.pillar.stem}
                </div>
                <div className="text-[10px] text-muted/70 mt-0.5">
                  {polarityElementLabel(p.detail.pillar.stem)}
                </div>
              </PillarCell>

              <PillarCell>
                <div
                  className="text-2xl font-han font-bold leading-none"
                  style={{ color: getElementColor(p.detail.pillar.branch) }}
                >
                  {p.detail.pillar.branch}
                </div>
                <div className="text-[10px] text-muted/70 mt-0.5">
                  {polarityElementLabel(p.detail.pillar.branch)}
                </div>
              </PillarCell>

              <PillarCell>
                <HiddenStemsBlock detail={p.detail} />
              </PillarCell>

              <PillarCell className="text-sm text-paper/90">
                {p.detail.nayin.replace("Hoả", "Hỏa").replace("Thuỷ", "Thủy")}
              </PillarCell>

              <PillarCell>
                <span className="text-sm text-paper font-medium" data-testid="life-stage">
                  {p.detail.lifeStage}
                </span>
              </PillarCell>

              <PillarCell className="text-sm text-paper/80">
                {p.detail.isVoid ? chart.voids.join(" · ") : "—"}
              </PillarCell>

              <PillarCell className="justify-start">
                {p.detail.stars.length === 0 ? (
                  <span className="text-muted/50">—</span>
                ) : (
                  <div className="flex flex-wrap justify-center gap-1">
                    {p.detail.stars.map((s, si) => (
                      <StarPill key={si} star={s} />
                    ))}
                  </div>
                )}
              </PillarCell>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VoidCard({ voids }: { voids: [string, string] }) {
  return (
    <div className="border border-[var(--border-subtle)] rounded-lg p-3 bg-[var(--surface-1)]">
      <div className="text-xs uppercase text-muted tracking-wide border-b border-[var(--border-subtle)] pb-1 mb-2">
        Không Vong (Tuần Không)
      </div>
      <div className="text-sm text-paper/80">
        Chi Không Vong: <strong className="text-paper">{voids[0]}</strong> ·{" "}
        <strong className="text-paper">{voids[1]}</strong>
      </div>
    </div>
  );
}

function DerivedInfoCard({ detail }: { detail: DerivedPillarDetail }) {
  return (
    <div className="border border-[var(--border-subtle)] rounded-lg p-3 bg-[var(--surface-1)]">
      <div className="text-xs uppercase text-muted tracking-wide border-b border-[var(--border-subtle)] pb-1 mb-2">
        {detail.name}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl font-han font-bold" style={{ color: getElementColor(detail.pillar.stem) }}>
          {detail.pillar.stem}
        </span>
        <span className="text-xl font-han font-bold" style={{ color: getElementColor(detail.pillar.branch) }}>
          {detail.pillar.branch}
        </span>
      </div>
      <div className="text-sm text-paper/80 mb-2">Nạp Âm: {detail.nayin}</div>
      {detail.stars.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {detail.stars.map((s, i) => (
            <StarPill key={i} star={s} />
          ))}
        </div>
      )}
    </div>
  );
}

// Trước khi bước vào Đại Vận đầu tiên, chưa có ô nào "đang chạy" - đây là kết quả
// đúng theo tuổi khởi vận, không phải lỗi cần mặc định về ô đầu tiên.
function isLuckPillarActive(pillars: LuckPillar[], index: number, now: Date): boolean {
  const current = pillars[index];
  if (!current || now < current.startDate) return false;
  const next = pillars[index + 1];
  if (next && now >= next.startDate) return false;
  return true;
}

export function BaziChart({ chart }: { chart: BaziFullChart }) {
  const now = new Date();
  const [showLuck, setShowLuck] = useState(true);
  const [showYongShenCalc, setShowYongShenCalc] = useState(false);

  const strength = useMemo(() => calculateElementStrength(chart), [chart]);
  const yongShen = useMemo(() => determineYongShen(strength, chart.month.branch), [strength, chart.month.branch]);
  
  const dragScroll = useDragScroll();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-display text-paper mb-4">Tứ Trụ (Bát Tự)</h2>
        <FourPillarsTable chart={chart} />
      </section>

      {/* Dụng Thần & Radar */}
      <section>
        <h2 className="text-xl font-display text-paper mb-4">Phân Tích Ngũ Hành & Dụng Thần</h2>
        <div className="border border-[var(--border-subtle)] rounded-lg p-5 lg:p-6 bg-ink flex flex-col lg:flex-row gap-8 items-center lg:items-start">
          <div className="flex-1 space-y-5 w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-2 py-1 rounded text-xs uppercase tracking-wide font-medium
                ${yongShen.dayMasterVerdict === "vượng" ? "bg-cinnabar/20 text-cinnabar" : 
                  yongShen.dayMasterVerdict === "nhược" ? "bg-water/20 text-water" : "bg-gold/20 text-gold"}`}
              >
                Nhật Chủ: {yongShen.dayMasterVerdict}
              </span>
              <span className="text-sm text-muted">
                {yongShen.method === "dieu-hau"
                  ? `Nhật Chủ trung hòa — tham chiếu Pháp Điều Hậu: thiên về ${yongShen.dungThan.join(", ")}`
                  : `Theo ${yongShen.methodLabel}`}
              </span>
            </div>

            <div className="text-paper leading-relaxed">
              Dụng Thần thiên về <strong className="text-gold">{yongShen.dungThan.join(", ") || "Không rõ"}</strong> · 
              Hỷ Thần: <strong className="text-jade">{yongShen.hyThan.join(", ") || "-"}</strong> · 
              Kỵ Thần: <strong className="text-cinnabar">{yongShen.kyThan.join(", ") || "-"}</strong>
            </div>

            {yongShen.confidence === "cần cân nhắc" && (
              <div className="text-sm text-gold/80 bg-gold/10 p-2 rounded border border-gold/20">
                {yongShen.method === "thong-quan"
                  ? "⚠ Cặp hành đối địch cần thông quan — Dụng là cầu nối; Hỷ/Kỵ không gắn tuyệt đối hai phe."
                  : yongShen.method === "chuyen-vuong"
                    ? "⚠ Khí thế thiên một phương (Chuyên Vượng) — ngưỡng heuristic, nên đối chiếu thêm."
                    : "⚠ Cục diện gần trung hòa, dụng thần chưa rõ ràng — nên tham chiếu thêm (Thông Quan / Điều Hậu / thầy)."}
              </div>
            )}

            <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
              <button 
                onClick={() => setShowYongShenCalc(!showYongShenCalc)}
                className="text-xs text-muted hover:text-paper flex items-center gap-1"
              >
                {showYongShenCalc ? "▼ Thu gọn cách tính" : "▶ Xem cách tính (Minh Bạch)"}
              </button>
              
              {showYongShenCalc && (
                <div className="mt-3 space-y-4 bg-black/20 p-3 rounded text-sm text-muted">
                  <div>
                    <strong className="text-paper block mb-1">Cách tính điểm Ngũ Hành:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      {strength.breakdown.map((item, idx) => (
                        <li key={idx}>
                          <span className="font-medium" style={{ color: ELEMENT_COLOR_VAR[item.element] }}>{item.element}</span> từ {item.source}: {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-paper block mb-1">Lý luận tìm Dụng Thần:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      {yongShen.reasoning.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  {yongShen.pipelineNotes.length > 0 && (
                    <div>
                      <strong className="text-paper block mb-1">Pipeline lấy Dụng:</strong>
                      <ul className="list-disc pl-4 space-y-1 text-xs">
                        {yongShen.pipelineNotes.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="w-full lg:w-auto flex justify-center py-4 lg:py-0">
            <div className="max-w-full overflow-visible">
              <ElementRadar strength={strength} size={280} />
            </div>
          </div>
        </div>
      </section>

      {/* Thông Tin Bổ Sung */}
      <section>
        <h2 className="text-xl font-display text-paper mb-4">Thông Tin Bổ Sung</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <VoidCard voids={chart.voids} />
          <DerivedInfoCard detail={chart.derived.conception} />
          <DerivedInfoCard detail={chart.derived.lifePalace} />
        </div>
      </section>

      {/* Đại Vận */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-display text-paper m-0">Đại Vận (10 Năm)</h2>
          <button 
            onClick={() => setShowLuck(!showLuck)}
            className="text-xs text-gold/80 hover:text-gold border border-gold/20 hover:border-gold/50 rounded px-2 py-1 transition-colors bg-gold/5"
          >
            {showLuck ? "Thu gọn" : "Hiển thị"}
          </button>
        </div>
        
        {showLuck && (
          <div 
            className={`grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 px-1 pt-2 pb-4 overflow-x-auto custom-scrollbar ${dragScroll.className}`}
            onPointerDown={dragScroll.onPointerDown}
            onPointerMove={dragScroll.onPointerMove}
            onPointerUp={dragScroll.onPointerUp}
            onPointerCancel={dragScroll.onPointerCancel}
            onWheel={dragScroll.onWheel}
          >
            {chart.luck.pillars.map((lp, i) => {
              const active = isLuckPillarActive(chart.luck.pillars, i, now);
              return (
                <div
                  key={i}
                  data-testid="luck-pillar-tile"
                  onClickCapture={dragScroll.onClickCapture}
                  className={`flex flex-col border rounded-lg overflow-hidden text-center transition-all ${
                    active ? "border-gold/80 ring-2 ring-gold/40 bg-gold/10 scale-105 z-10 shadow-lg" : "border-[var(--border-subtle)] bg-black/30 hover:bg-black/10"
                  }`}
                >
                  <div className={`py-1.5 px-1 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap ${
                    active ? "bg-gold/20 text-gold" : "bg-[var(--surface-2)] text-muted border-b border-[var(--border-subtle)]"
                  }`}>
                    Tuổi {lp.startAgeYear} {lp.startAgeMonth ? `${lp.startAgeMonth} tháng` : ""}
                  </div>
                  <div className="py-3 px-1 flex flex-col gap-1">
                    <div className="text-[10px] text-muted/60 uppercase tracking-widest">{lp.tenGod}</div>
                    <div
                      className="text-2xl font-han font-bold leading-none"
                      style={{ color: getElementColor(lp.pillar.stem) }}
                    >
                      {lp.pillar.stem}
                    </div>
                    <div
                      className="text-2xl font-han font-bold leading-none mt-1"
                      style={{ color: getElementColor(lp.pillar.branch) }}
                    >
                      {lp.pillar.branch}
                    </div>
                    <div className="text-[10px] text-muted/60 uppercase tracking-widest mt-1">{lp.lifeStage}</div>
                  </div>
                  <div className={`py-1.5 text-[11px] font-mono ${
                    active ? "bg-gold/10 text-gold font-bold" : "bg-[var(--surface-2)] text-muted/60 border-t border-[var(--border-subtle)]"
                  }`}>
                    {lp.startDate.getUTCFullYear()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Lưu Niên */}
      {chart.luck.annualYears && chart.luck.annualYears.length > 0 && (
        <AnnualYearsTable annualYears={chart.luck.annualYears} getElementColor={getElementColor} />
      )}
    </div>
  );
}
