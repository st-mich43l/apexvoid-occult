export type PalaceCandidateView = "baseline" | "moderate" | "strong";

/** DEV/research only. Production always baseline. */
export function readPalaceCandidateView(): PalaceCandidateView {
  const dev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);
  if (!dev) return "baseline";
  if (typeof window === "undefined") return "baseline";
  try {
    const v = new URLSearchParams(window.location.search).get("palaceCandidate");
    if (v === "moderate" || v === "strong" || v === "baseline") return v;
  } catch {
    return "baseline";
  }
  return "baseline";
}
