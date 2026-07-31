import type { AdmittedFamilyRegistry, ProductionManifest } from "./types";
import manifestData from "./manifest.v0.5.json";
import registryData from "./admitted-family-registry.v0.5.json";



export function loadAdmittedFamilyRegistry(): AdmittedFamilyRegistry {
  return registryData as AdmittedFamilyRegistry;
}
