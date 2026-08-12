export interface MonthlyFlowVersionContract {
  integrationVersion: string;
  engineVersion: string;
}

export const MONTHLY_FLOW_VERSION: MonthlyFlowVersionContract = {
  integrationVersion: "0.3.0",
  engineVersion: "v0.3-production",
} as const;
