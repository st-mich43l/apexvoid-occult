/**
 * Exact star-name helpers for V0.8 knowledge validation.
 * Re-exports the shared identity module (alias catalog is the SoT).
 * @deprecated Import from `./star-identity` directly.
 */
export {
  exactCanonicalStarName,
  isAnnualOnlyStarName,
  inferTemporalLayerFromCanonicalName,
  baseCanonicalNameOf,
  bootstrapNormalizeStarName,
  type NameTemporalLayer,
} from "./star-identity";
