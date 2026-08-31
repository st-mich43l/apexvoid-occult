/**
 * Monthly Flow production release selection — routing only, no scoring.
 *
 * Historical: V0.3 was released for Nam Phái (#138). V0.1.2 executor was
 * later deleted (8b953d0) while a ghost available@0.1.2 status remained.
 * This module is the single SSOT for production availability after that fix.
 */
import type { School as ZiweiSchool } from "@/types/chart";
import {
  isMonthlyFlowV01Enabled,
  isMonthlyFlowV03Enabled,
} from "../../feature-flags";

export type MonthlyFlowProductionUnavailableReason =
  | "module-disabled"
  | "v03-disabled"
  | "unsupported-school";

export type MonthlyFlowProductionRoute =
  | {
      available: true;
      school: "nam-phai";
      version: "0.3.0";
      implementation: "v0.3";
    }
  | {
      available: false;
      school: ZiweiSchool;
      reason: MonthlyFlowProductionUnavailableReason;
    };

/**
 * Resolve the released Monthly Flow production route for a school.
 * Default school (undefined) resolves as Nam Phái for backward compatibility.
 */
export function resolveMonthlyFlowProductionRoute(
  school: ZiweiSchool | undefined = "nam-phai",
): MonthlyFlowProductionRoute {
  const resolvedSchool = school ?? "nam-phai";

  if (!isMonthlyFlowV01Enabled()) {
    return {
      available: false,
      school: resolvedSchool,
      reason: "module-disabled",
    };
  }

  if (resolvedSchool !== "nam-phai") {
    return {
      available: false,
      school: resolvedSchool,
      reason: "unsupported-school",
    };
  }

  if (!isMonthlyFlowV03Enabled()) {
    return {
      available: false,
      school: "nam-phai",
      reason: "v03-disabled",
    };
  }

  return {
    available: true,
    school: "nam-phai",
    version: "0.3.0",
    implementation: "v0.3",
  };
}
