import type { PalaceEvidence } from "../types";
import { physicalIdentityKey } from "./trace";

/** Component (non-interaction) evidence must not share a physical identity. */
export function duplicateComponentIdentities(evidence: PalaceEvidence[]): string[] {
  const counts = new Map<string, number>();
  for (const ev of evidence) {
    if (ev.category === "structural-rule" || ev.category === "void-environment") {
      continue;
    }
    const key = physicalIdentityKey(ev);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k);
}

/** A natal fact id must not appear both as borrowed VCD major and opposite major. */
export function borrowedMajorAlsoScoredAsOpposite(evidence: PalaceEvidence[]): string[] {
  const borrowed = new Set(
    evidence.filter((e) => e.borrowedFromOpposite).flatMap((e) => e.factIds),
  );
  const collisions: string[] = [];
  for (const ev of evidence) {
    if (ev.borrowedFromOpposite) continue;
    if (ev.category !== "major-star") continue;
    for (const id of ev.factIds) {
      if (borrowed.has(id)) collisions.push(id);
    }
  }
  return collisions;
}

export function duplicateMinorFactIds(evidence: PalaceEvidence[]): string[] {
  const counts = new Map<string, number>();
  for (const ev of evidence) {
    if (ev.category !== "minor-star-family") continue;
    const starFactId = ev.factIds[0];
    if (!starFactId) continue;
    counts.set(starFactId, (counts.get(starFactId) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k);
}
