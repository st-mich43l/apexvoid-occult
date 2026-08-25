export type PalaceStaticCandidateView =
  | "control"
  | "context-normalized"
  | "context-diminishing"
  | "local-context";

/**
 * DEV-only preview for Palace Overview static V1.3 RC candidates.
 * Production always returns "control" (V1.2 frozen numeric).
 *
 * Query: ?palaceStaticCandidate=control|context-normalized|context-diminishing|local-context
 */
export function readPalaceStaticCandidateView(): PalaceStaticCandidateView {
  const dev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);
  if (!dev) return "control";
  if (typeof window === "undefined") return "control";
  try {
    const v = new URLSearchParams(window.location.search).get(
      "palaceStaticCandidate",
    );
    if (
      v === "control" ||
      v === "context-normalized" ||
      v === "context-diminishing" ||
      v === "local-context"
    ) {
      return v;
    }
  } catch {
    return "control";
  }
  return "control";
}
