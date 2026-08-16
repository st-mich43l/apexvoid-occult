import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import type { AnnualAxisDomain } from "@/lib/ziwei/analysis";
import {
  analyzeAnnualAxes,
  type AnnualAxesResult,
} from "@/lib/ziwei/analysis/modules/annual-axes";
import { AnnualAxesRadar } from "./AnnualAxesRadar";
import { AnnualAxisDetail } from "./AnnualAxisDetail";
import { ANNUAL_AXIS_BAND_LABEL_VI, ANNUAL_AXIS_DOMAIN_ORDER, ANNUAL_AXIS_LABEL_VI } from "./labels";
import "./annual-axes.css";

export interface AnnualAxesSectionProps {
  chart: ChartData;
  school: School;
  result?: AnnualAxesResult;
}

export function AnnualAxesSection({ chart, school, result }: AnnualAxesSectionProps) {
  const computed = useMemo(() => {
    if (result) return result;
    return analyzeAnnualAxes(chart, { school });
  }, [chart, school, result]);

  const [selectedDomain, setSelectedDomain] = useState<AnnualAxisDomain | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<AnnualAxisDomain | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedDomain(null);
    setHoveredDomain(null);
  }, [chart, school]);

  useEffect(() => {
    if (!selectedDomain) return;
    const node = detailRef.current;
    if (typeof node?.scrollIntoView === "function") {
      node.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedDomain]);

  const activeDomain: AnnualAxisDomain | null = (() => {
    const candidate = selectedDomain ?? hoveredDomain;
    return candidate && ANNUAL_AXIS_DOMAIN_ORDER.includes(candidate) ? candidate : null;
  })();

  const previewDomain = hoveredDomain ?? selectedDomain;
  const previewAxis =
    previewDomain && ANNUAL_AXIS_DOMAIN_ORDER.includes(previewDomain)
      ? computed.axes[previewDomain]
      : null;
  const previewPlottable =
    previewAxis &&
    (previewAxis.status === "available" || previewAxis.status === "partial-data");

  function toggleDomain(domain: string) {
    setSelectedDomain((cur) => (cur === domain ? null : (domain as AnnualAxisDomain)));
  }

  return (
    <section
      className="annual-axes-section"
      data-module="annual-axes"
      aria-label={`Sáu trục khí vận ${computed.annualYear}`}
    >
      <header className="annual-axes-section__head">
        <h3 className="annual-axes-section__title">Sáu trục khí vận</h3>
        <span className="annual-axes-section__year">{computed.annualYear}</span>
      </header>

      <div className="annual-axes-section__body">
        <AnnualAxesRadar
          result={computed}
          selectedDomain={selectedDomain}
          activeDomain={activeDomain}
          onSelect={toggleDomain}
          onHover={(domain) => setHoveredDomain(domain as AnnualAxisDomain | null)}
        />
        <p className="annual-axes-section__hint" role="status">
          {previewAxis && previewDomain ? (
            <>
              <strong>{ANNUAL_AXIS_LABEL_VI[previewDomain]}</strong>
              <span>
                {previewPlottable
                  ? `${ANNUAL_AXIS_BAND_LABEL_VI[previewAxis.band]} · ${previewAxis.score.toFixed(1)}`
                  : "Không đủ dữ liệu"}
              </span>
            </>
          ) : (
            "Chạm một trục để xem chi tiết."
          )}
        </p>
      </div>

      {selectedDomain && computed.axes[selectedDomain] ? (
        <div ref={detailRef}>
          <AnnualAxisDetail
            domain={selectedDomain}
            axis={computed.axes[selectedDomain]}
            onClose={() => setSelectedDomain(null)}
          />
        </div>
      ) : null}
    </section>
  );
}
