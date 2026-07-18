/**
 * Soft calibration bands for experimental scoring audit.
 * preferred ranges are non-blocking expert audit bands — never fail CI alone.
 */

export type CalibrationSeverity = "report" | "warning" | "error";

export interface CalibrationBand {
  preferred?: [number, number];
  hardMin?: number;
  hardMax?: number;
  /** When true, normalized risk must be >= legacy-v1 hung for the same month. */
  atLeastLegacy?: boolean;
  /**
   * How hardMin / hardMax / atLeastLegacy violations are treated.
   * preferred mismatches are always non-blocking (report only).
   */
  severity: CalibrationSeverity;
}

export type AxisCalibration = Partial<
  Record<"benefit" | "risk" | "activation" | "conflict", CalibrationBand>
>;

export interface CalibrationEvalRow {
  targetId: string;
  axis: string;
  value: number | null;
  preferred?: [number, number];
  hardMin?: number;
  hardMax?: number;
  legacy?: number;
  status: "ok" | "preferred-miss" | "warning" | "error";
  detail: string;
}

function inPreferred(value: number, preferred: [number, number]): boolean {
  return value >= preferred[0] && value <= preferred[1];
}

/**
 * Evaluate one axis band. Preferred misses never become errors.
 * hardMin/hardMax/atLeastLegacy use band.severity.
 */
export function evaluateCalibrationBand(
  targetId: string,
  axis: string,
  value: number,
  band: CalibrationBand,
  legacy?: number,
): CalibrationEvalRow {
  const row: CalibrationEvalRow = {
    targetId,
    axis,
    value,
    preferred: band.preferred,
    hardMin: band.hardMin,
    hardMax: band.hardMax,
    legacy,
    status: "ok",
    detail: "",
  };

  const hardFails: string[] = [];
  if (band.hardMin != null && value < band.hardMin) {
    hardFails.push(`< hardMin ${band.hardMin}`);
  }
  if (band.hardMax != null && value > band.hardMax) {
    hardFails.push(`> hardMax ${band.hardMax}`);
  }
  if (band.atLeastLegacy && legacy != null && value < legacy) {
    hardFails.push(`< legacy ${legacy}`);
  }

  if (hardFails.length) {
    row.detail = hardFails.join("; ");
    row.status = band.severity === "error" ? "error" : band.severity === "warning" ? "warning" : "ok";
    if (band.severity === "report") {
      row.status = "preferred-miss";
      row.detail = `hard gate (report): ${row.detail}`;
    }
    return row;
  }

  if (band.preferred && !inPreferred(value, band.preferred)) {
    row.status = "preferred-miss";
    row.detail = `outside preferred [${band.preferred[0]}, ${band.preferred[1]}]`;
    return row;
  }

  row.detail = "within preferred / hard gates";
  return row;
}

export function formatCalibrationTable(rows: CalibrationEvalRow[]): string {
  const header = [
    "target",
    "axis",
    "value",
    "preferred",
    "hardMin",
    "hardMax",
    "legacy",
    "status",
    "detail",
  ];
  const lines = [header.join("\t")];
  for (const r of rows) {
    lines.push(
      [
        r.targetId,
        r.axis,
        r.value == null ? "" : String(r.value),
        r.preferred ? `[${r.preferred[0]},${r.preferred[1]}]` : "",
        r.hardMin == null ? "" : String(r.hardMin),
        r.hardMax == null ? "" : String(r.hardMax),
        r.legacy == null ? "" : String(r.legacy),
        r.status,
        r.detail,
      ].join("\t"),
    );
  }
  return lines.join("\n");
}
