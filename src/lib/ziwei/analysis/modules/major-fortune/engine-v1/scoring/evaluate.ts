import type { MajorFortuneV1Frame, MajorFortuneV1Result, MajorFortuneV1Evidence, MajorFortuneV1Contribution, MajorFortuneV1Score, MajorFortuneV1Node } from "../types";
import { V1_PARAMETERS } from "./parameters";
import { RC1_STAR_CATALOG } from "./star-catalog";

const GEOMETRY_WEIGHTS: Record<string, number> = {
  "focus": V1_PARAMETERS.GEOMETRY_FOCUS.value,
  "opposite": V1_PARAMETERS.GEOMETRY_OPPOSITE.value,
  "trine": V1_PARAMETERS.GEOMETRY_TRINE.value,
};

function resolveGeometryWeight(role: string): number {
  return GEOMETRY_WEIGHTS[role] ?? 0;
}

export function evaluateMajorFortuneV1(frame: MajorFortuneV1Frame): MajorFortuneV1Result {
  const admittedEvidence: MajorFortuneV1Evidence[] = [];
  const rejectedEvidence: MajorFortuneV1Evidence[] = [];
  const blockedEvidence: MajorFortuneV1Evidence[] = [];
  const contextOnlyEvidence: MajorFortuneV1Evidence[] = [];
  const trace: MajorFortuneV1Contribution[] = [];

  let supportRaw = 0;
  let pressureRaw = 0;
  let stabilityRaw = 0;
  let activationRaw = 0;

  // Track occurrences of stars to apply diminishing returns (1 / sqrt(rank))
  const starCounts: Record<string, number> = {};

  const processNode = (node: MajorFortuneV1Node) => {
    const geomWeight = resolveGeometryWeight(node.role);

    // Process Principal Stars
    for (const star of node.principalStars) {
      starCounts[star.name] = (starCounts[star.name] || 0) + 1;
      const rank = starCounts[star.name]!;
      const dimReturn = 1.0 / Math.sqrt(rank);

      const catalog = RC1_STAR_CATALOG[star.name];
      if (catalog) {
        const evidenceId = `ev-principal-${node.palaceIndex}-${star.name}-${rank}`;

        supportRaw += catalog.support * geomWeight * dimReturn;
        pressureRaw += catalog.pressure * geomWeight * dimReturn;
        stabilityRaw += catalog.stability * geomWeight * dimReturn;
        activationRaw += catalog.activation * geomWeight * dimReturn;

        admittedEvidence.push({
          evidenceId,
          physicalFactId: `fact-star-${star.name}-${node.palaceIndex}`,
          evidenceClusterId: `cluster-principal-${node.role}`,
          familyId: "dia-loi",
          category: "principal-star",
          school: frame.context.school,
          temporalScope: "dai-van",
          frameRole: node.role,
          targetPalaceIndex: node.palaceIndex,
          sourceIds: ["SRC-TVDS-01"],
          claimIds: ["CLM-DIALOI-01"],
          scoringAuthority: "DOMAIN_VERIFIED",
          fact: {
            type: "principal-star",
            starName: star.name,
            palaceIndex: node.palaceIndex,
            dignity: star.brightness
          }
        });

        trace.push({
          evidenceId,
          rawContribution: catalog.support,
          adjustedContribution: catalog.support * geomWeight * dimReturn,
          reason: `Principal star ${star.name} at ${node.role} (rank ${rank}, geom ${geomWeight})`
        });
      }
    }

    // Process Auxiliary Stars
    for (const star of node.auxiliaryStars) {
      starCounts[star.name] = (starCounts[star.name] || 0) + 1;
      const rank = starCounts[star.name]!;
      const dimReturn = 1.0 / Math.sqrt(rank);

      const catalog = RC1_STAR_CATALOG[star.name];
      if (catalog) {
        const isMalefic = catalog.pressure > 0.4; // rough heuristic
        const category = isMalefic ? "malefic-pressure" : "auxiliary-support";
        const evidenceId = `ev-minor-${node.palaceIndex}-${star.name}-${rank}`;

        supportRaw += catalog.support * geomWeight * dimReturn;
        pressureRaw += catalog.pressure * geomWeight * dimReturn;
        stabilityRaw += catalog.stability * geomWeight * dimReturn;
        activationRaw += catalog.activation * geomWeight * dimReturn;

        admittedEvidence.push({
          evidenceId,
          physicalFactId: `fact-minor-${star.name}-${node.palaceIndex}`,
          evidenceClusterId: `cluster-minor-${node.role}`,
          familyId: "nhan-hoa",
          category,
          school: frame.context.school,
          temporalScope: "dai-van",
          frameRole: node.role,
          targetPalaceIndex: node.palaceIndex,
          sourceIds: ["SRC-TVDS-01"],
          claimIds: ["CLM-NHANHOA-01"],
          scoringAuthority: "DOMAIN_VERIFIED",
          fact: isMalefic ? {
            type: "malefic-star",
            starName: star.name,
            palaceIndex: node.palaceIndex
          } : {
            type: "auxiliary-star",
            starName: star.name,
            palaceIndex: node.palaceIndex
          }
        });

        trace.push({
          evidenceId,
          rawContribution: catalog.support || catalog.pressure,
          adjustedContribution: (catalog.support || catalog.pressure) * geomWeight * dimReturn,
          reason: `${isMalefic ? 'Malefic' : 'Auxiliary'} star ${star.name} at ${node.role} (rank ${rank}, geom ${geomWeight})`
        });
      }
    }
  };

  processNode(frame.focusNode);
  processNode(frame.oppositeNode);
  processNode(frame.trine1Node);
  processNode(frame.trine2Node);

  // Luck-stem Tứ Hóa is not scored. Natal year-stem hóa is production V0.3, not this shadow path.

  // Normalization logic
  const supportNorm = 1 - Math.exp(-supportRaw / 4.0);
  const pressureNorm = 1 - Math.exp(-pressureRaw / 4.0);
  const stabilityNorm = Math.tanh(stabilityRaw / 4.0);
  const activationNorm = 1 - Math.exp(-activationRaw / 4.0);

  const netQuality = supportNorm - pressureNorm + 0.35 * stabilityNorm;
  const activationGate = 0.55 + 0.45 * activationNorm;

  let normalizedScore = 50 + 45 * Math.tanh((netQuality * activationGate) / 1.35);
  normalizedScore = Math.max(0, Math.min(100, normalizedScore)); // clamp

  const intensity = Math.round(100 * activationNorm);
  const conflict = Math.round(100 * Math.min(supportNorm, pressureNorm) * activationNorm);

  let band = "bình-hòa";
  if (normalizedScore >= 80) band = "xuất-sắc";
  else if (normalizedScore >= 65) band = "tốt";
  else if (normalizedScore >= 55) band = "khá";
  else if (normalizedScore >= 45) band = "bình-hòa";
  else if (normalizedScore >= 35) band = "kém";
  else band = "xấu";

  const score: MajorFortuneV1Score = {
    rawAxes: {
      support: supportRaw,
      pressure: pressureRaw,
      stability: stabilityRaw,
      activation: activationRaw
    },
    normalizedScore,
    band,
    intensity,
    conflict
  };

  // Status and coverage
  let status: "available" | "partial" | "unavailable" = "available";
  let coveragePercent = 100;

  if (frame.focusNode.isVCD) {
    // Some coverage drop if VCD? Just a mock metric for now.
    coveragePercent -= 5;
  }

  const confidencePercent = 90; // mock derived from scoring authorities

  return {
    status,
    versions: {
      engineVersion: "1.0.0-rc.1",
      formulaVersion: "v1-baseline",
      knowledgeVersion: "1.0",
      contractVersion: "1.0",
      sourcePackVersion: "1.0",
    },
    score,
    quality: {
      coveragePercent,
      confidencePercent,
      engineeringContributionPercent: 50,
      experimentalContributionPercent: 0,
      verifiedDomainContributionPercent: 50,
    },
    evidence: {
      admitted: admittedEvidence,
      rejected: rejectedEvidence,
      contextOnly: contextOnlyEvidence,
      blocked: blockedEvidence,
    },
    diagnostics: {
      coveragePercent,
      confidencePercent,
      admittedEvidenceIds: admittedEvidence.map(e => e.evidenceId),
      rejectedEvidence: [],
      blockedFamilies: ["out-of-frame-transformations"],
    },
    trace
  };
}
