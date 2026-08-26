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

function isV11(axis: AnnualAxisResult): axis is AnnualAxisNamPhaiV10Result {
  return axis.engine === "v0.11";
}

export function AnnualAxisDetailCurrent({
  domain,
  axis,
  onClose,
}: AnnualAxisDetailCurrentProps) {
  if (!isV11(axis)) {
    return <AnnualAxisDetailLegacy domain={domain} axis={axis} onClose={onClose} />;
  }

  const label = ANNUAL_AXIS_LABEL_VI[domain];
  const plottable = axis.status === "available" || axis.status === "partial-data";

  return (
    <div
      className="annual-axis-detail"
      role="region"
      aria-label={`Chi tiết ${label}`}
      data-axis-engine="v0.11"
    >
      <h4 className="annual-axis-detail__title">Chi tiết · {label}</h4>

      {plottable ? (
        <p className="annual-axis-detail__band">
          {ANNUAL_AXIS_BAND_LABEL_VI[axis.band]} · Điểm {axis.score.toFixed(1)}
          {axis.status === "partial-data" ? " · dữ liệu một phần" : ""}
        </p>
      ) : (
        <p className="annual-axis-detail__band">Không đủ dữ liệu</p>
      )}

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
