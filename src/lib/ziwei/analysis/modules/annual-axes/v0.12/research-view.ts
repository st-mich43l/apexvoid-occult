/**
 * DEV-only Annual Axes candidate preview.
 * Production remains V0.11 unless explicitly opted in.
 *
 *   ?annualAxesCandidate=v011  (default / control)
 *   ?annualAxesCandidate=v012  (research candidate)
 */
export type AnnualAxesCandidateView = "v011" | "v012";

function readEnv(name: string): string | undefined {
  try {
    return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[
      name
    ];
  } catch {
    return undefined;
  }
}

export function readAnnualAxesCandidateView(
  search = typeof window !== "undefined" ? window.location.search : "",
): AnnualAxesCandidateView {
  const isDev =
    readEnv("DEV") === "true" || readEnv("MODE") === "development";
  if (!isDev) return "v011";
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const raw = (params.get("annualAxesCandidate") ?? "v011").toLowerCase();
  if (raw === "v012" || raw === "0.12" || raw === "v0.12") return "v012";
  return "v011";
}
