export interface MonthlyFlowVersionContract {
  integrationVersion: string;
  engineVersion: string;
}

/** Stable user-facing production resolver. */
export const MONTHLY_FLOW_VERSION: MonthlyFlowVersionContract = {
  integrationVersion: "0.3.0",
  engineVersion: "v0.3-production",
} as const;

/** Evidence-engine candidate. This is shadow/release-gate metadata only. */
export const MONTHLY_FLOW_V1_VERSION = {
  contractVersion: "1.0.0-rc.1",
  engineVersion: "1.0.0-rc.1",
} as const;
