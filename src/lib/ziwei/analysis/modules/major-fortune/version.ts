export interface MajorFortuneVersionContract {
  integrationVersion: string;
  modelVersion: string;
  formulaVersion: string;
}

export const MAJOR_FORTUNE_VERSION: MajorFortuneVersionContract = {
  integrationVersion: "0.5.0",
  modelVersion: "v0.5.0",
  formulaVersion: "v0.3-ordinal-four-pillar",
} as const;
