import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../../facts";
import type { MajorFortuneV1Result, MajorFortuneV1Context } from "./types";
import { buildMajorFortuneV1Frame } from "./frame/build-frame";
import { evaluateMajorFortuneV1 } from "./scoring/evaluate";

export interface AnalyzeMajorFortuneV1Options {
  school: ZiweiSchool;
  cycleOverride?: {
    cycleIndex: number;
    startAge: number;
    endAge: number;
    activePalaceIndex: number;
  };
}

export function analyzeMajorFortuneV1(
  chart: ChartData,
  options: AnalyzeMajorFortuneV1Options
): MajorFortuneV1Result | null {
  const override = options.cycleOverride;
  if (!override) return null;

  const palace = chart.palaces.find(p => p.index === override.activePalaceIndex) ?? chart.majorFortunePalace;
  if (!palace) return null;

  const context: MajorFortuneV1Context = {
    school: options.school,
    cycleIndex: override.cycleIndex,
    startAge: override.startAge,
    endAge: override.endAge,
    activePalace: palace,
    chart,
  };

  const frame = buildMajorFortuneV1Frame(chart, context);
  const result = evaluateMajorFortuneV1(frame);
  
  return result;
}
