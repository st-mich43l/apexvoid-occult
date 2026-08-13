import type { MajorFortuneV1Frame, MajorFortuneV1Result, MajorFortuneV1Evidence, MajorFortuneV1Contribution, MajorFortuneV1Score, MajorFortuneV1Node } from "../types";
import { V1_PARAMETERS } from "./parameters";
import { RC1_STAR_CATALOG, type StarVector } from "./star-catalog";
import type { ChartStar } from "@/types/chart";

const GEOMETRY_WEIGHTS: Record<string, number> = {
  "focus": V1_PARAMETERS.GEOMETRY_FOCUS.value,
  "opposite": V1_PARAMETERS.GEOMETRY_OPPOSITE.value,
  "trine-1": V1_PARAMETERS.GEOMETRY_TRINE.value,
  "trine-2": V1_PARAMETERS.GEOMETRY_TRINE.value,
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

  // Process Major Mutagens (Tứ Hóa)
  for (const mutagen of frame.majorMutagens) {
    // Only apply if the mutagen targets a star inside our frame
    const allFrameStars = [
      ...frame.focusNode.principalStars, ...frame.focusNode.auxiliaryStars,
      ...frame.oppositeNode.principalStars, ...frame.oppositeNode.auxiliaryStars,
      ...frame.trine1Node.principalStars, ...frame.trine1Node.auxiliaryStars,
      ...frame.trine2Node.principalStars, ...frame.trine2Node.auxiliaryStars
    ];
    const targetStar = allFrameStars.find(s => s.name === mutagen.starName);
    
    if (targetStar) {
      let vector: StarVector | null = null;
      let pId = "";
      switch (mutagen.mutagen) {
        case "Lộc": vector = { support: V1_PARAMETERS.TU_HOA_LOC_SUPPORT.value, pressure: V1_PARAMETERS.TU_HOA_LOC_PRESSURE.value, stability: V1_PARAMETERS.TU_HOA_LOC_STABILITY.value, activation: V1_PARAMETERS.TU_HOA_LOC_ACTIVATION.value }; pId = "Lộc"; break;
        case "Quyền": vector = { support: V1_PARAMETERS.TU_HOA_QUYEN_SUPPORT.value, pressure: V1_PARAMETERS.TU_HOA_QUYEN_PRESSURE.value, stability: V1_PARAMETERS.TU_HOA_QUYEN_STABILITY.value, activation: V1_PARAMETERS.TU_HOA_QUYEN_ACTIVATION.value }; pId = "Quyền"; break;
        case "Khoa": vector = { support: V1_PARAMETERS.TU_HOA_KHOA_SUPPORT.value, pressure: V1_PARAMETERS.TU_HOA_KHOA_PRESSURE.value, stability: V1_PARAMETERS.TU_HOA_KHOA_STABILITY.value, activation: V1_PARAMETERS.TU_HOA_KHOA_ACTIVATION.value }; pId = "Khoa"; break;
        case "Kỵ": vector = { support: V1_PARAMETERS.TU_HOA_KY_SUPPORT.value, pressure: V1_PARAMETERS.TU_HOA_KY_PRESSURE.value, stability: V1_PARAMETERS.TU_HOA_KY_STABILITY.value, activation: V1_PARAMETERS.TU_HOA_KY_ACTIVATION.value }; pId = "Kỵ"; break;
      }

      if (vector) {
        // Assume geom weight 1 for transformation affecting the frame.
        supportRaw += vector.support;
        pressureRaw += vector.pressure;
        stabilityRaw += vector.stability;
        activationRaw += vector.activation;

        const evidenceId = `ev-tu-hoa-${mutagen.starName}-${pId}`;
        admittedEvidence.push({
          evidenceId,
          physicalFactId: `fact-tu-hoa-${mutagen.starName}-${pId}`,
          evidenceClusterId: `cluster-tu-hoa`,
          familyId: "tu-hoa",
          category: "major-transformation",
          school: frame.context.school,
          temporalScope: "dai-van",
          frameRole: "focus", // simplified
          targetPalaceIndex: targetStar.palace?.index ?? -1,
          sourceIds: ["SRC-TVDS-01", "SRC-TT-01"],
          claimIds: ["CLM-TUHOA-01"],
          scoringAuthority: "ENGINEERING_CALIBRATED",
          fact: {
            type: "transformation",
            starName: mutagen.starName,
            transformation: pId,
            palaceIndex: targetStar.palace?.index ?? -1
          }
        });
        
        trace.push({
          evidenceId,
          rawContribution: vector.support || vector.pressure,
          adjustedContribution: vector.support || vector.pressure,
          reason: `Transformation ${pId} on ${mutagen.starName}`
        });
      }
    }
  }

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
  if (!frame.majorMutagens || frame.majorMutagens.length === 0) {
    status = "partial";
    coveragePercent -= 15;
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
