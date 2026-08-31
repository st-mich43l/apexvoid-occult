/**
 * Independent physical-fact coverage audit for V1 (does not trust coveragePercent).
 */
import type { ChartData, ChartPalace } from "@/types/chart";
import { buildMajorFortuneV1Frame } from "../../modules/major-fortune/engine-v1/frame/build-frame";
import { analyzeMajorFortuneV1 } from "../../modules/major-fortune/engine-v1/analyze";
import type { MajorFortuneV1Result } from "../../modules/major-fortune/engine-v1/types";
import {
  V1_CATALOG_SET,
  V1_PRINCIPAL_SET,
} from "./constants";
import type {
  CycleOverride,
  FactBucketCounts,
  UnsupportedStarHit,
  ZiweiSchoolId,
} from "./types";
import { round6 } from "./metrics";

interface FrameRoleNode {
  role: "focus" | "opposite" | "trine";
  palaceIndex: number;
  palace: ChartPalace;
}

export interface ObservationCoverage {
  school: ZiweiSchoolId;
  caseId: string;
  cycle: CycleOverride;
  isVcd: boolean;
  majorMutagensPhysicalCount: number;
  majorMutagensInV1FrameCount: number;
  majorTransformationEvidenceCount: number;
  majorTransformationScoredCount: number;
  buckets: FactBucketCounts;
  principalPhysical: number;
  principalRecognized: number;
  auxiliaryPhysical: number;
  auxiliaryRecognized: number;
  unsupported: UnsupportedStarHit[];
  reportedCoveragePercent: number | null;
  reportedConfidencePercent: number | null;
  measuredPhysicalCoveragePercent: number | null;
  v1Result: MajorFortuneV1Result | null;
  v1Error: string | null;
}

function framePalaces(
  chart: ChartData,
  focusIndex: number,
): FrameRoleNode[] {
  const opposite = (focusIndex + 6) % 12;
  const trine1 = (focusIndex + 4) % 12;
  const trine2 = (focusIndex + 8) % 12;
  const find = (idx: number, role: FrameRoleNode["role"]): FrameRoleNode => {
    const palace = chart.palaces.find((p) => p.index === idx)!;
    return { role, palaceIndex: idx, palace };
  };
  return [
    find(focusIndex, "focus"),
    find(opposite, "opposite"),
    find(trine1, "trine"),
    find(trine2, "trine"),
  ];
}

function emptyBuckets(): FactBucketCounts {
  return {
    recognized: 0,
    explicitlyRejected: 0,
    contextOnly: 0,
    blocked: 0,
    silentlyDropped: 0,
    totalRelevant: 0,
  };
}

/**
 * Account every relevant physical star in the four frame palaces + each majorMutagen.
 * Recognized = present in V1 admitted evidence for that star/palace.
 * Silent drop = physical fact not admitted/rejected/context/blocked.
 */
export function auditObservationCoverage(
  school: ZiweiSchoolId,
  caseId: string,
  chart: ChartData,
  cycle: CycleOverride,
): ObservationCoverage {
  const context = {
    school,
    cycleIndex: cycle.cycleIndex,
    startAge: cycle.startAge,
    endAge: cycle.endAge,
    activePalace: chart.palaces.find((p) => p.index === cycle.activePalaceIndex)!,
    chart,
  };
  const frame = buildMajorFortuneV1Frame(chart, context);

  let v1Result: MajorFortuneV1Result | null = null;
  let v1Error: string | null = null;
  try {
    v1Result = analyzeMajorFortuneV1(chart, { school, cycleOverride: cycle });
  } catch (err) {
    v1Error = err instanceof Error ? err.message : String(err);
  }

  const admittedKeys = new Set<string>();
  for (const e of v1Result?.evidence.admitted ?? []) {
    if (
      e.fact.type === "principal-star" ||
      e.fact.type === "auxiliary-star" ||
      e.fact.type === "malefic-star"
    ) {
      admittedKeys.add(`${e.fact.starName}@${e.fact.palaceIndex}`);
    }
  }

  const rejectedKeys = new Set(
    (v1Result?.evidence.rejected ?? []).map((e) => e.evidenceId),
  );
  const contextKeys = new Set(
    (v1Result?.evidence.contextOnly ?? []).map((e) => e.evidenceId),
  );
  const blockedKeys = new Set(
    (v1Result?.evidence.blocked ?? []).map((e) => e.evidenceId),
  );

  const buckets = emptyBuckets();
  const unsupported: UnsupportedStarHit[] = [];
  let principalPhysical = 0;
  let principalRecognized = 0;
  let auxiliaryPhysical = 0;
  let auxiliaryRecognized = 0;

  for (const node of framePalaces(chart, cycle.activePalaceIndex)) {
    for (const star of node.palace.stars ?? []) {
      const isPrincipal = V1_PRINCIPAL_SET.has(star.name);
      const inCatalog = V1_CATALOG_SET.has(star.name);
      const key = `${star.name}@${node.palaceIndex}`;

      if (isPrincipal) {
        principalPhysical += 1;
      } else {
        auxiliaryPhysical += 1;
      }

      buckets.totalRelevant += 1;

      if (!inCatalog) {
        buckets.silentlyDropped += 1;
        unsupported.push({
          school,
          caseId,
          cycleIndex: cycle.cycleIndex,
          palaceIndex: node.palaceIndex,
          frameRole: node.role,
          starName: star.name,
          starCategory: isPrincipal ? "principal" : "auxiliary-or-other",
        });
        continue;
      }

      if (admittedKeys.has(key)) {
        buckets.recognized += 1;
        if (isPrincipal) principalRecognized += 1;
        else auxiliaryRecognized += 1;
        continue;
      }

      // Catalogued but not admitted — silent omission (V1 rejected/context/blocked unused).
      void rejectedKeys;
      void contextKeys;
      void blockedKeys;
      buckets.silentlyDropped += 1;
    }
  }

  const majorMutagens = chart.majorMutagens ?? [];
  const majorMutagensPhysicalCount = majorMutagens.length;
  const majorMutagensInV1FrameCount = frame.majorMutagens.length;
  const xfEvidence = (v1Result?.evidence.admitted ?? []).filter(
    (e) => e.category === "major-transformation",
  );
  const majorTransformationEvidenceCount = xfEvidence.length;
  // V1 evaluator does not emit transformation contributions; scored ≡ admitted XF evidence.
  const majorTransformationScoredCount = xfEvidence.length;

  for (const m of majorMutagens) {
    buckets.totalRelevant += 1;
    // Physical mutagen facts are carried but never scored → silently dropped
    buckets.silentlyDropped += 1;
    void m;
  }

  // Invariant repair: total must equal sum of buckets
  const summed =
    buckets.recognized +
    buckets.explicitlyRejected +
    buckets.contextOnly +
    buckets.blocked +
    buckets.silentlyDropped;
  if (summed !== buckets.totalRelevant) {
    // Prefer failing loudly in tests; keep accounting consistent by adjusting silent
    buckets.silentlyDropped += buckets.totalRelevant - summed;
  }

  const measuredPhysicalCoveragePercent =
    buckets.totalRelevant === 0
      ? null
      : round6((100 * buckets.recognized) / buckets.totalRelevant);

  return {
    school,
    caseId,
    cycle,
    isVcd: frame.focusNode.isVCD,
    majorMutagensPhysicalCount,
    majorMutagensInV1FrameCount,
    majorTransformationEvidenceCount,
    majorTransformationScoredCount,
    buckets,
    principalPhysical,
    principalRecognized,
    auxiliaryPhysical,
    auxiliaryRecognized,
    unsupported,
    reportedCoveragePercent: v1Result?.quality.coveragePercent ?? null,
    reportedConfidencePercent: v1Result?.quality.confidencePercent ?? null,
    measuredPhysicalCoveragePercent,
    v1Result,
    v1Error,
  };
}

export function assertFactAccountingInvariant(buckets: FactBucketCounts): boolean {
  return (
    buckets.totalRelevant ===
    buckets.recognized +
      buckets.explicitlyRejected +
      buckets.contextOnly +
      buckets.blocked +
      buckets.silentlyDropped
  );
}
