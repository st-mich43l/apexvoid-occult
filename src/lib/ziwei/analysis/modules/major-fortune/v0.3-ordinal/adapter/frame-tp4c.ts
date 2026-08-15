/** Nam Phái tam phương tứ chính around the active decade palace. */

export type MajorFortuneFrameRole = "focus" | "opposite" | "trine";

export function oppositePalaceIndex(focusIndex: number): number {
  return (focusIndex + 6) % 12;
}

export function trinePalaceIndices(focusIndex: number): [number, number] {
  return [(focusIndex + 4) % 12, (focusIndex + 8) % 12];
}

export function frameRoleForIndex(
  palaceIndex: number,
  focusIndex: number,
): MajorFortuneFrameRole | null {
  if (palaceIndex === focusIndex) return "focus";
  if (palaceIndex === oppositePalaceIndex(focusIndex)) return "opposite";
  const [a, b] = trinePalaceIndices(focusIndex);
  if (palaceIndex === a || palaceIndex === b) return "trine";
  return null;
}

export function tp4cIndices(focusIndex: number): number[] {
  const [t1, t2] = trinePalaceIndices(focusIndex);
  return [focusIndex, oppositePalaceIndex(focusIndex), t1, t2];
}
