import { createHash } from "node:crypto";
import { PALACES } from "../calibration/reviews-v2";
import { pairwiseLogicalKey } from "../calibration/benchmark-v2-types";
import type { AxisName } from "../calibration/benchmark-v2-types";
import type { School } from "@/types/chart";

const CORE: Array<[string, string]> = [
  ["Mệnh", "Thiên Di"],
  ["Quan Lộc", "Tài Bạch"],
  ["Phúc Đức", "Mệnh"],
  ["Phu Thê", "Nô Bộc"],
  ["Tật Ách", "Phúc Đức"],
];

const AXES: AxisName[] = ["support", "pressure", "netQuality"];

export interface AssignedPair {
  axis: AxisName;
  leftPalace: string;
  rightPalace: string;
}

function seededIndex(parts: string[], mod: number): number {
  const digest = createHash("sha256").update(parts.join("\0"), "utf8").digest();
  return digest.readUInt32BE(0) % mod;
}

export function assignPairwiseComparisons(input: {
  caseId: string;
  school: School;
  reviewerId: string;
  rubricVersion: string;
}): AssignedPair[] {
  const keys = new Set<string>();
  const out: AssignedPair[] = [];
  const push = (axis: AxisName, left: string, right: string) => {
    if (left === right) return;
    const key = pairwiseLogicalKey(input.caseId, input.school, axis, left, right);
    if (keys.has(key)) return;
    keys.add(key);
    out.push({ axis, leftPalace: left, rightPalace: right });
  };

  for (const [left, right] of CORE) {
    push("support", left, right);
  }

  const extraCount = 4;
  for (let i = 0; i < extraCount; i++) {
    const axis = AXES[seededIndex([input.caseId, input.school, input.reviewerId, input.rubricVersion, "axis", String(i)], AXES.length)]!;
    let left = PALACES[seededIndex([input.caseId, input.reviewerId, "L", String(i)], PALACES.length)]!;
    let right = PALACES[seededIndex([input.caseId, input.reviewerId, "R", String(i)], PALACES.length)]!;
    if (left === right) {
      right = PALACES[(PALACES.indexOf(left) + 1 + i) % PALACES.length]!;
    }
    push(axis, left, right);
  }
  return out;
}
