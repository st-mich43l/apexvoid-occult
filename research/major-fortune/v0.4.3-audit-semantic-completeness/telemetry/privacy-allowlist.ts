export const TELEMETRY_PRIVACY_ALLOWLIST = new Set([
  "event",
  "integrationVersion",
  "modelVersion",
  "formulaVersion",
  "contractVersion",
  "adapterVersion",
  "school",
  "scoreState",
  "evaluationStatus",
  "contextCoverage",
  "scoringCoverage",
  "activePillarCount",
  "partialPillarCount",
  "missingPillarCount",
  "namPhaiTransformationsEnabled",
  "acceptedTransformationEvidenceCount",
  "directTransformationActivationCount",
  "outOfFrameTransformationCount",
  "fallbackState",
]);

export function validateTelemetryPrivacy(event: any): string[] {
  const violations: string[] = [];
  for (const key of Object.keys(event)) {
    if (!TELEMETRY_PRIVACY_ALLOWLIST.has(key)) {
      violations.push(`Unexpected field '${key}' might contain private data.`);
    }
  }
  return violations;
}
