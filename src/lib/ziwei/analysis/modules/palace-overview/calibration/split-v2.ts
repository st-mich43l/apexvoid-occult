import { createHash } from "node:crypto";

export const SPLIT_SEED = "palace-overview-benchmark-split-v2";
const CALIBRATION_FRACTION = 0.8;

export function assignCaseSplit(caseId: string): "calibration" | "holdout" {
  const digest = createHash("sha256")
    .update(`${SPLIT_SEED}\0${caseId}`, "utf8")
    .digest();
  const u = digest.readUInt32BE(0) / 2 ** 32;
  return u < CALIBRATION_FRACTION ? "calibration" : "holdout";
}
