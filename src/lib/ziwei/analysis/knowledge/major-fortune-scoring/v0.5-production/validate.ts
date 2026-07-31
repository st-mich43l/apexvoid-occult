import type { AdmittedFamilyRegistry } from "./types";
import { loadAdmittedFamilyRegistry } from "./loader";

export function resolveMajorFortuneProductionAdmission(
  registry?: AdmittedFamilyRegistry,
): { admittedFamilies: Set<string> } {
  const reg = registry ?? loadAdmittedFamilyRegistry();
  const admittedFamilies = new Set<string>();

  for (const family of reg.families) {
    if (
      family.admissionStatus === "legacy-engineering-admitted" ||
      family.admissionStatus === "production-admitted"
    ) {
      admittedFamilies.add(family.signalFamilyId);
    }
  }

  return { admittedFamilies };
}
