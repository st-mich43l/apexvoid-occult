export type ExpertOrdinal = "low" | "medium" | "high";

export function engineOrdinalFromNormalizedAxis(value: number): ExpertOrdinal {
  if (value < 40) return "low";
  if (value < 70) return "medium";
  return "high";
}

export function ordinalAgreement(
  pairs: Array<{ expert: ExpertOrdinal | null; engine: ExpertOrdinal }>,
): { compared: number; agree: number; rate: number | null } {
  const usable = pairs.filter((p) => p.expert != null) as Array<{
    expert: ExpertOrdinal;
    engine: ExpertOrdinal;
  }>;
  if (usable.length === 0) return { compared: 0, agree: 0, rate: null };
  const agree = usable.filter((p) => p.expert === p.engine).length;
  return { compared: usable.length, agree, rate: agree / usable.length };
}

export function catastrophicInversionRate(
  pairs: Array<{
    expertNet: "guarded" | "neutral" | "supportive" | "strong" | "unknown" | null;
    engineBand: string;
  }>,
): { compared: number; inversions: number; rate: number | null } {
  const usable = pairs.filter(
    (p) => p.expertNet && p.expertNet !== "unknown" && p.expertNet !== "neutral",
  );
  if (usable.length === 0) return { compared: 0, inversions: 0, rate: null };
  let inversions = 0;
  for (const p of usable) {
    if (p.expertNet === "supportive" || p.expertNet === "strong") {
      if (p.engineBand === "low" || p.engineBand === "guarded") inversions += 1;
    }
    if (p.expertNet === "guarded") {
      if (p.engineBand === "strong") inversions += 1;
    }
  }
  return { compared: usable.length, inversions, rate: inversions / usable.length };
}
