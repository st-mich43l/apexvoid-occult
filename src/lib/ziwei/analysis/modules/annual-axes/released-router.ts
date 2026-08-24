import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import type { AnnualAxesResult } from "./released-types";
import { analyzeAnnualAxes as analyzeLegacyAnnualAxes } from "./analyze";
import { analyzeAnnualAxesNamPhaiCurrent } from "./v0.10-layered/release-adapter";

/**
 * Single released Annual Axes router.
 *
 * Nam Phái current runtime is V0.10 layered-balanced.
 * Trung Châu remains on the existing V0.2 implementation.
 * Historical Nam Phái V0.8 stays reachable only as an internal research
 * control for V0.10 comparison code; it is not a released runtime route.
 */
export function analyzeAnnualAxes(
  chart: ChartData,
  options: { school: ZiweiSchool },
): AnnualAxesResult {
  if (options.school === "nam-phai") {
    return analyzeAnnualAxesNamPhaiCurrent(chart);
  }
  return analyzeLegacyAnnualAxes(chart, options);
}
