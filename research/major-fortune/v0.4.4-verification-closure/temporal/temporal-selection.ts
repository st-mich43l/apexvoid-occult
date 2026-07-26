import type { MajorFortuneV02CycleObservation } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus.js";

/**
 * Stratified selection over school × stems.
 */
export function selectStratifiedTemporalObservations(allObservations: MajorFortuneV02CycleObservation[]): MajorFortuneV02CycleObservation[] {
  const selected: MajorFortuneV02CycleObservation[] = [];
  
  // We want to ensure at least 1 of each (school x stem) is represented.
  const buckets = new Map<string, MajorFortuneV02CycleObservation>();

  for (const obs of allObservations) {
    const key = `${obs.school}-${obs.cycleIndex}`; // cycleIndex acts as a proxy for different stem combinations due to deterministic cycle distribution
    if (!buckets.has(key)) {
      buckets.set(key, obs);
    }
  }

  // Also include 20 random from Nam Phai and Trung Chau for extra coverage
  const np = allObservations.filter(o => o.school === "nam-phai").slice(0, 20);
  const tc = allObservations.filter(o => o.school === "trung-chau").slice(0, 20);

  for (const obs of [...buckets.values(), ...np, ...tc]) {
    if (!selected.some(s => s.birthChartId === obs.birthChartId && s.cycleIndex === obs.cycleIndex)) {
      selected.push(obs);
    }
  }

  return selected;
}
