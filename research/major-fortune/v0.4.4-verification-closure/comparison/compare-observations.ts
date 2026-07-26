import {
  MajorFortuneObservationComparisonOptions,
  MajorFortuneObservationComparisonResult,
  MajorFortuneObservationDifference,
  MajorFortuneObservationSetComparisonReport,
} from "./types.js";
import { canonicalizeObservation } from "./canonicalize-observation.js";
import { MajorFortuneAuditObservation } from "../types/audit-observation.js";
import { getAllowedMetadataPaths } from "./comparison-profiles.js";

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

function deepCompare(
  base: unknown,
  current: unknown,
  path: string,
  allowedPaths: Set<string>,
  differences: MajorFortuneObservationDifference[]
) {
  if (allowedPaths.has(path)) {
    return;
  }

  if (base === current) {
    return;
  }

  if (Array.isArray(base) && Array.isArray(current)) {
    if (base.length !== current.length) {
      differences.push({ path, baseValue: base, currentValue: current });
      return;
    }
    for (let i = 0; i < base.length; i++) {
      deepCompare(base[i], current[i], `${path}[${i}]`, allowedPaths, differences);
    }
    return;
  }

  if (isObject(base) && isObject(current)) {
    const keys = new Set([...Object.keys(base), ...Object.keys(current)]);
    for (const key of keys) {
      const childPath = path ? `${path}.${key}` : key;
      deepCompare(base[key], current[key], childPath, allowedPaths, differences);
    }
    return;
  }

  differences.push({ path, baseValue: base, currentValue: current });
}

export function compareMajorFortuneObservation(
  baseline: MajorFortuneAuditObservation,
  current: MajorFortuneAuditObservation,
  options: MajorFortuneObservationComparisonOptions
): MajorFortuneObservationComparisonResult {
  const allowedPaths = new Set(
    options.allowedMetadataPaths || getAllowedMetadataPaths(options.profile)
  );

  const canonBase = canonicalizeObservation(baseline);
  const canonCurr = canonicalizeObservation(current);

  const differences: MajorFortuneObservationDifference[] = [];
  deepCompare(canonBase, canonCurr, "", allowedPaths, differences);

  return {
    observationId: current.observationId,
    passed: differences.length === 0,
    differences,
  };
}

export function compareMajorFortuneObservationSets(
  baseline: MajorFortuneAuditObservation[],
  current: MajorFortuneAuditObservation[],
  options: MajorFortuneObservationComparisonOptions
): MajorFortuneObservationSetComparisonReport {
  const baseMap = new Map(baseline.map((o) => [o.observationId, o]));
  const currMap = new Map(current.map((o) => [o.observationId, o]));

  const missingBaselineIds: string[] = [];
  const missingCurrentIds: string[] = [];
  const differences: MajorFortuneObservationComparisonResult[] = [];

  for (const [id, currObs] of currMap.entries()) {
    const baseObs = baseMap.get(id);
    if (!baseObs) {
      missingBaselineIds.push(id);
      continue;
    }

    const res = compareMajorFortuneObservation(baseObs, currObs, options);
    if (!res.passed) {
      differences.push(res);
    }
  }

  for (const id of baseMap.keys()) {
    if (!currMap.has(id)) {
      missingCurrentIds.push(id);
    }
  }

  const comparedObservationCount = Math.min(baseline.length, current.length);
  // Re-evaluating: A compared observation is one where the ID exists in both sets.
  const actuallyComparedCount = Math.min(baseline.length - missingCurrentIds.length, current.length - missingBaselineIds.length);
  // Let's use the intersect size
  let intersectCount = 0;
  for (const id of currMap.keys()) {
    if (baseMap.has(id)) intersectCount++;
  }

  const mismatchingObservationCount = differences.length;
  const matchingObservationCount = intersectCount - mismatchingObservationCount;
  
  let differenceRowCount = 0;
  for (const diff of differences) {
    differenceRowCount += diff.differences.length;
  }

  return {
    comparedObservationCount: intersectCount,
    matchingObservationCount,
    mismatchingObservationCount,
    differenceRowCount,
    missingBaselineIds,
    missingCurrentIds,
    differences,
  };
}
