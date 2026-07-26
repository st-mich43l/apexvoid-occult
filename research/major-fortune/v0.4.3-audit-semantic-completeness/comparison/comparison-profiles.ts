import { MajorFortuneComparisonProfile } from "./types.js";

export function getAllowedMetadataPaths(profile: MajorFortuneComparisonProfile): string[] {
  const baseAllowed = [
    "mode", // Mode naturally differs between baseline and current run (e.g., v033-fallback-baseline vs v043-fallback)
    "integrationVersion",
    "contractVersion",
    "knowledgeVersion",
    "adapterVersion",
    "modelVersion",
    "formulaVersion"
  ];

  switch (profile) {
    case "exact-scoring":
      return [];
    case "fallback-equivalence":
    case "control-equivalence":
      return [...baseAllowed];
    case "timeline-equivalence":
      // Timeline might not have fortuneStem at the top level if it's missing, but prompt says we should compare it.
      // So we just allow the base differences.
      return [...baseAllowed];
    case "temporal-independence":
      return [...baseAllowed];
    default:
      return [];
  }
}
