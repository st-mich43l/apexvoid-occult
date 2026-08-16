import type { ZiweiBrightness } from "../facts";
import correctionsCatalog from "./palace-overview/v1/brightness-corrections.v1.json";

const BY_STAR_BRANCH = new Map(
  correctionsCatalog.corrections.map((row) => [`${row.star}:${row.branch}`, row.brightness]),
);

const ALLOWED = new Set<ZiweiBrightness>(["Miếu", "Vượng", "Đắc", "Bình", "Hãm"]);

/** Teacher overlay on engine brightness. Does not mutate ChartData. */
export function correctedBrightness(
  starName: string,
  palaceBranch: string,
  engineBrightness: string | undefined,
): string | undefined {
  const overlay = BY_STAR_BRANCH.get(`${starName}:${palaceBranch}`);
  if (overlay && ALLOWED.has(overlay as ZiweiBrightness)) {
    return overlay;
  }
  return engineBrightness;
}
