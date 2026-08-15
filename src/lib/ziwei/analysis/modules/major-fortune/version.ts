export interface MajorFortuneVersionContract {
  integrationVersion: string;
  modelVersion: string;
  formulaVersion: string;
}

export const MAJOR_FORTUNE_VERSION: MajorFortuneVersionContract = {
  integrationVersion: "0.5.3",
  modelVersion: "v0.5.3",
  formulaVersion: "v0.3-ordinal-body-yong",
} as const;
