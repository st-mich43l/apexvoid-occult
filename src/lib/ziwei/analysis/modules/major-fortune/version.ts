export interface MajorFortuneVersionContract {
  productionIntegrationVersion: string;
  candidateIntegrationVersion: string;

  baselineModelVersion: string;
  candidateModelVersion: string;

  adapterVersion: string;
  contractVersion: string;
  knowledgeVersion: string;
  formulaVersion: string;

  uiVersion: string;
  telemetryVersion: string;

  rolloutStage:
    | "baseline"
    | "shadow"
    | "internal-canary"
    | "external-canary"
    | "full-production";
}

export const MAJOR_FORTUNE_PRODUCTION_VERSION: MajorFortuneVersionContract = {
  productionIntegrationVersion: "0.4.3",
  candidateIntegrationVersion: "0.5.0",

  baselineModelVersion: "v0.3-ordinal",
  candidateModelVersion: "v0.3-ordinal",

  adapterVersion: "0.3.3",
  contractVersion: "0.3.0",
  knowledgeVersion: "0.3.0",
  formulaVersion: "v0.3-ordinal-four-pillar",

  uiVersion: "0.4.0",
  telemetryVersion: "0.4.3",

  rolloutStage: "shadow",
} as const;
