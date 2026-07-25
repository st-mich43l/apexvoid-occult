import type { 
  MonthlyTransformationContribution,
  MonthlyScoreBreakdown,
  MonthlyFlowV021Input
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function aggregateTransformations(
  contributions: MonthlyTransformationContribution[]
) {
  if (contributions.length === 0) {
    return {
      dominantContributionId: null,
      dominantDelta: 0,
      secondaryRawSum: 0,
      secondaryAppliedDelta: 0,
      authorizedAppliedDelta: 0,
      finalDelta: 0
    };
  }

  // Sort by absolute strength descending, tie-break Kỵ > Lộc > Quyền > Khoa
  const mutagenOrder = { "Kỵ": 4, "Lộc": 3, "Quyền": 2, "Khoa": 1 } as Record<string, number>;
  
  const sorted = [...contributions].sort((a, b) => {
    const absA = Math.abs(a.contribution);
    const absB = Math.abs(b.contribution);
    if (absA !== absB) return absB - absA; // 1. Absolute contribution descending
    
    const rankA = mutagenOrder[a.mutagen] ?? 0;
    const rankB = mutagenOrder[b.mutagen] ?? 0;
    if (rankA !== rankB) return rankB - rankA; // 2. Authorized mutagen rank

    const nameCompare = a.starName.localeCompare(b.starName);
    if (nameCompare !== 0) return nameCompare; // 3. Canonical star name

    return a.targetPalaceIndex - b.targetPalaceIndex; // 4. Target palace index
  });

  const dominant = sorted[0]!;
  const secondary = sorted.slice(1);
  const secondarySum = secondary.reduce((sum, t) => sum + t.contribution, 0);
  const secondaryApplied = 0.5 * secondarySum;
  
  const rawDelta = dominant.contribution + secondaryApplied;
  let finalDelta = clamp(rawDelta, -35, 35);

  return {
    dominantContributionId: `${dominant.mutagen}-${dominant.starName}`,
    dominantDelta: dominant.contribution,
    secondaryRawSum: secondarySum,
    secondaryAppliedDelta: secondaryApplied,
    authorizedAppliedDelta: finalDelta,
    finalDelta
  };
}

export function scoreMonth(input: MonthlyFlowV021Input): MonthlyScoreBreakdown {
  if (!Number.isFinite(input.annualBaseline.score) || input.annualBaseline.score < 0 || input.annualBaseline.score > 100) {
    throw new Error("Annual baseline out of range or not finite");
  }
  if (!Number.isFinite(input.palaceRawDelta)) {
    throw new Error("Palace raw delta must be finite");
  }

  for (const c of input.transformationContext.contributions) {
    if (!Number.isFinite(c.baseMutagenDelta) || !Number.isFinite(c.roleWeight) || !Number.isFinite(c.contribution)) {
      throw new Error("Transformation properties must be finite");
    }
    if (![1.0, 0.8, 0.65, 0.0].includes(c.roleWeight)) {
      throw new Error(`Role weight ${c.roleWeight} is not explicit/authorized`);
    }
  }

  const cappedPalace = clamp(input.palaceRawDelta, -25, 25);
  const dauQuanMultiplier = input.isDauQuanMonth ? 1.5 : 1;
  const amplifiedPalace = cappedPalace * dauQuanMultiplier;

  const transAgg = aggregateTransformations(
    input.transformationContext.contributions
  );

  const localActivation = amplifiedPalace + transAgg.finalDelta;
  const rawMonthlyScore = input.annualBaseline.score + localActivation;

  const ANNUAL_ENVELOPE_RADIUS = 30;
  const floor = Math.max(0, input.annualBaseline.score - ANNUAL_ENVELOPE_RADIUS);
  const ceiling = Math.min(100, input.annualBaseline.score + ANNUAL_ENVELOPE_RADIUS);

  let finalMonthlyScore = rawMonthlyScore;
  let clippedByAnnualFloor = false;
  let clippedByAnnualCeiling = false;

  if (finalMonthlyScore < floor) {
    finalMonthlyScore = floor;
    clippedByAnnualFloor = true;
  }
  if (finalMonthlyScore > ceiling) {
    finalMonthlyScore = ceiling;
    clippedByAnnualCeiling = true;
  }

  if (!Number.isFinite(finalMonthlyScore)) {
    throw new Error("Final score must be finite");
  }
  
  if (finalMonthlyScore < 0 || finalMonthlyScore > 100) {
    throw new Error("Final score out of [0, 100] bounds");
  }

  // Range validation should be mathematically guaranteed by floor/ceiling logic (if baseline is 0-100 and radius is 30)
  // `clippedByAbsoluteRange` was requested to be removed.
  
  // Precision policy: One decimal place at the result boundary
  finalMonthlyScore = Math.round(finalMonthlyScore * 10) / 10;

  return {
    annualBaseline: input.annualBaseline.score,
    palace: {
      raw: input.palaceRawDelta,
      capped: cappedPalace,
      dauQuanMultiplier,
      amplified: amplifiedPalace
    },
    transformations: {
      contributions: input.transformationContext.contributions,
      dominantContributionId: transAgg.dominantContributionId,
      dominantDelta: transAgg.dominantDelta,
      secondaryRawSum: transAgg.secondaryRawSum,
      secondaryAppliedDelta: transAgg.secondaryAppliedDelta,
      authorizedAppliedDelta: transAgg.authorizedAppliedDelta,
      collisionCandidates: input.transformationContext.collisionCandidates,
      collisionPolicyApplied: false,
      finalDelta: transAgg.finalDelta
    },
    localActivation,
    annualEnvelope: {
      radius: ANNUAL_ENVELOPE_RADIUS,
      floor,
      ceiling
    },
    rawMonthlyScore,
    finalMonthlyScore,
    clippedByAnnualFloor,
    clippedByAnnualCeiling
  };
}
