/**
 * V0.12 static palace signal: separate direction from evidence activation.
 *
 * directionalNet = (pos - neg) / max(pos + neg, ε)
 * activation     = min(1, (pos + neg) / referenceMass)
 * palaceSignedNet = directionalNet * activation
 */
function directionalNet(
  positive: number,
  negative: number,
  epsilon: number,
): number {
  const denom = Math.max(positive + negative, epsilon);
  return (positive - negative) / denom;
}

function evidenceActivation(
  positive: number,
  negative: number,
  referenceMass: number,
): number {
  const mass = positive + negative;
  if (referenceMass <= 0) return 0;
  return Math.min(1, mass / referenceMass);
}

export function palaceSignedNet(input: {
  positive: number;
  negative: number;
  epsilon: number;
  referenceMass: number;
}): {
  directionalNet: number;
  activation: number;
  evidenceMass: number;
  signedNet: number;
} {
  const evidenceMass = input.positive + input.negative;
  const dir = directionalNet(input.positive, input.negative, input.epsilon);
  const activation = evidenceActivation(
    input.positive,
    input.negative,
    input.referenceMass,
  );
  return {
    directionalNet: dir,
    activation,
    evidenceMass,
    signedNet: dir * activation,
  };
}

/** Flag sparse one-sided saturation on a signedNet that ignored mass. */
export function isSparseLayerSaturation(input: {
  signedNet: number;
  evidenceMass: number;
  massThreshold?: number;
  netThreshold?: number;
}): boolean {
  const massThreshold = input.massThreshold ?? 2;
  const netThreshold = input.netThreshold ?? 0.8;
  return (
    Math.abs(input.signedNet) >= netThreshold &&
    input.evidenceMass > 0 &&
    input.evidenceMass < massThreshold
  );
}
