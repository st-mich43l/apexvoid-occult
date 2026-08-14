import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { computeRadarScore } from "../normalize-result";
import { emptyAxes } from "../types";

function knowledge() {
  const loaded = loadPalaceOverviewKnowledgeV1();
  if (!loaded.ok) throw new Error("numeric knowledge invalid");
  return loaded.knowledge;
}

export function supportiveStarHamDoesNotBeatMieu(starName: string): boolean {
  const k = knowledge();
  const star = k.majorStars.stars.find((s) => s.name === starName);
  if (!star || star.axes.support <= star.axes.pressure) return true;
  const mieu = k.majorStars.brightnessModifiers.Miếu!;
  const ham = k.majorStars.brightnessModifiers.Hãm!;
  const supportMieu = star.axes.support * mieu.supportFactor;
  const supportHam = star.axes.support * ham.supportFactor;
  return supportMieu >= supportHam;
}

export function locDoesNotReduceQualityVersusBaseline(): boolean {
  const k = knowledge();
  const loc = k.transformations.transformations.find((t) => t.transformation === "Lộc");
  if (!loc) return false;
  const base = computeRadarScore(emptyAxes(), k);
  const withLoc = computeRadarScore(
    {
      support: loc.axes.support,
      pressure: loc.axes.pressure,
      stability: loc.axes.stability,
      activation: loc.axes.activation,
    },
    k,
  );
  return withLoc >= base;
}

export function solePressureEvidenceRemainsPositive(): boolean {
  const k = knowledge();
  const ky = k.transformations.transformations.find((t) => t.transformation === "Kỵ");
  if (!ky) return false;
  return ky.axes.pressure > 0;
}
