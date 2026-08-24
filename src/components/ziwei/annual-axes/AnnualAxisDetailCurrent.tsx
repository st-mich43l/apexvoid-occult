import type { AnnualAxisDomain } from "@/lib/ziwei/analysis";
import type {
  AnnualAxisNamPhaiV10Result,
  AnnualAxisResult,
} from "@/lib/ziwei/analysis/modules/annual-axes";
import { AnnualAxisDetail as AnnualAxisDetailLegacy } from "./AnnualAxisDetail";
import { ANNUAL_AXIS_BAND_LABEL_VI, ANNUAL_AXIS_LABEL_VI } from "./labels";

export interface AnnualAxisDetailCurrentProps {
  domain: AnnualAxisDomain;
  axis: AnnualAxisResult;
  onClose: () => void;
}

function isV10(axis: AnnualAxisResult): axis is AnnualAxisNamPhaiV10Result {
  return axis.engine === "v0.10";
}

function signed(value: number): string {
  if (value > 0) return `+${value.toFixed(3)}`;
  return value.toFixed(3);
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function AnnualAxisDetailCurrent({
  domain,
  axis,
  onClose,
}: AnnualAxisDetailCurrentProps) {
  if (!isV10(axis)) {
    return <AnnualAxisDetailLegacy domain={domain} axis={axis} onClose={onClose} />;
  }

  const trace = axis.v10Trace;
  const label = ANNUAL_AXIS_LABEL_VI[domain];
  const plottable = axis.status === "available" || axis.status === "partial-data";

  const rows = [
    {
      id: "natal",
      label: "Nền lá số",
      weight: trace.profileWeights.natalFoundation,
      layer: trace.natal,
    },
    {
      id: "decade",
      label: "Đại vận",
      weight: trace.profileWeights.majorFortune,
      layer: trace.decade,
    },
    {
      id: "annual",
      label: "Lưu niên",
      weight: trace.profileWeights.annualTrigger,
      layer: trace.annual,
    },
    {
      id: "resonance",
      label: "Cộng hưởng",
      weight: trace.profileWeights.resonance,
      layer: trace.resonance,
    },
  ];

  return (
    <div
      className="annual-axis-detail"
      role="region"
      aria-label={`Chi tiết ${label}`}
      data-axis-engine="v0.10"
    >
      <h4 className="annual-axis-detail__title">Chi tiết · {label}</h4>

      {plottable ? (
        <p className="annual-axis-detail__band">
          {ANNUAL_AXIS_BAND_LABEL_VI[axis.band]} · Điểm {axis.score.toFixed(1)}
        </p>
      ) : (
        <p className="annual-axis-detail__band">Không đủ dữ liệu</p>
      )}

      <section className="annual-axis-detail__section" aria-label="V0.10 layered trace">
        <h5>V0.10 · Layered fortune</h5>
        <ul className="annual-axis-detail__list">
          {rows.map((row) => (
            <li key={row.id}>
              <strong>{row.label}</strong> · trọng số {pct(row.weight)} · net{" "}
              {signed(row.layer.signedNet)} · coverage {pct(row.layer.coverage)}
              {row.layer.availability !== "available"
                ? ` · ${row.layer.availability}`
                : ""}
            </li>
          ))}
        </ul>
        <p className="annual-axis-detail__note">
          Composite net {signed(trace.compositeNet)} · raw {trace.compositeRaw.toFixed(3)}
        </p>
        <p className="annual-axis-detail__note">
          Profile {trace.profileId} · projection {trace.projectionVariant}
        </p>
      </section>

      {axis.reasonCodes.length > 0 ? (
        <section className="annual-axis-detail__section">
          <h5>Diagnostics</h5>
          <ul className="annual-axis-detail__list">
            {axis.reasonCodes.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <button
        type="button"
        className="annual-axis-detail__close"
        onClick={onClose}
        aria-label="Đóng chi tiết"
      >
        Đóng
      </button>
    </div>
  );
}
