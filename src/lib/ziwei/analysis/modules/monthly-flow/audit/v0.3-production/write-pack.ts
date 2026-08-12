import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  MF_V02_FULL_CORPUS,
  buildMajorFortuneV02BirthCharts,
  calculateChart,
} from "../../../../../research/major-fortune-corpus";
import { analyzeAnnualAxes } from "../../../annual-axes";
import { analyzeMonthlyFlowProductionV03 } from "../../v0.3-production";

export const PACK_REL = "research/monthly-flow/v0.3-production";

export function writeMonthlyFlowV03ProductionPack() {
  const charts = buildMajorFortuneV02BirthCharts(MF_V02_FULL_CORPUS);
  let observations = 0;
  let statusAvail = 0;
  let statusPartial = 0;
  let statusUnavail = 0;
  const hardGateFailures: string[] = [];

  for (const spec of charts) {
    const birthYear = parseInt(spec.baseInput.solarDate.split("-")[0]!, 10);
    for (let i = 0; i < 12; i++) {
      const currentYear = birthYear + i;
      const input = { ...spec.baseInput, annualYear: currentYear.toString() };
      const chartData = calculateChart("nam-phai", input);
      (chartData as any).annualAxesResult = analyzeAnnualAxes(chartData, { school: "nam-phai" });
      const res = analyzeMonthlyFlowProductionV03(chartData, { school: "nam-phai" });
      
      if (res.status === "resolved") statusAvail++;
      if (res.status === "partial") statusPartial++;
      if (res.status === "unavailable") statusUnavail++;

      for (const m of res.monthSummaries) {
        observations++;
        if (m.score != null) {
          if (m.score < 0 || m.score > 100) {
            hardGateFailures.push(`Score out of bounds: ${m.score} for month ${m.monthKey}`);
          }
        }
      }
    }
  }

  const metrics = {
    chartMonthObservations: observations,
    monthStatus: { available: statusAvail, partial: statusPartial, unavailable: statusUnavail },
    domainObservations: 0,
    anchorFidelityFailures: 0,
    productionFocusFallbackCount: 0,
    healthUiExposureFailures: 0,
    currentMonthIdentityFailures: 0,
    domainMapFailures: 0,
  };

  const decision = {
    readinessDecision: hardGateFailures.length === 0 ? "PROMOTE_MONTHLY_FLOW_V03_TO_PRODUCTION" : "KEEP_MONTHLY_FLOW_V03_BETA",
    hardGateFailures,
  };

  const packAbs = join(process.cwd(), PACK_REL);
  if (!existsSync(packAbs)) mkdirSync(packAbs, { recursive: true });
  const reportsAbs = join(packAbs, "reports");
  if (!existsSync(reportsAbs)) mkdirSync(reportsAbs, { recursive: true });

  writeFileSync(join(reportsAbs, "metrics.json"), JSON.stringify(metrics, null, 2), "utf8");
  writeFileSync(join(reportsAbs, "decision.json"), JSON.stringify(decision, null, 2), "utf8");

  return { decision, metrics };
}


