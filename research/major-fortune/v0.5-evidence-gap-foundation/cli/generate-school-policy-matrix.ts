import crypto from "crypto";
import fs from "fs";
import path from "path";
import { isMajorFortuneV04NamPhaiTransformationsEnabled } from "../../../../src/lib/ziwei/analysis/feature-flags.js";
import type { SchoolPolicyMatrixRecord } from "../schema/foundation.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);

export function generateSchoolPolicyMatrix(opts?: {
  outputBase?: string;
}): void {
  const outputBase = opts?.outputBase ?? CANONICAL_BASE;
  const runtimeInventory = JSON.parse(
    fs.readFileSync(
      path.join(outputBase, "inventory/runtime-signal-inventory.json"),
      "utf8",
    ),
  );
  const backlogInventory = JSON.parse(
    fs.readFileSync(
      path.join(outputBase, "inventory/research-backlog-registry.json"),
      "utf8",
    ),
  );
  const contradictionLog = JSON.parse(
    fs.readFileSync(
      path.join(outputBase, "contradictions/contradiction-log.json"),
      "utf8",
    ),
  );
  const namPhaiTransformationEnabled =
    isMajorFortuneV04NamPhaiTransformationsEnabled();

  const matrix: SchoolPolicyMatrixRecord[] = [];
  for (const family of [...runtimeInventory, ...backlogInventory]) {
    const isRuntime = typeof family.runtimeStatus === "string";
    const scopes: string[] = Array.isArray(family.schoolScope)
      ? family.schoolScope
      : [];
    const researchNamPhai = scopes.includes("nam-phai");
    const researchTrungChau = scopes.includes("trung-chau");
    const namPhaiGated =
      family.signalFamilyId === "major-fortune-transformations" &&
      !namPhaiTransformationEnabled;
    const trungChauGated = false;
    const openSchoolContradiction =
      contradictionLog.contradictions.some(
        (contradiction: any) =>
          contradiction.status === "open" &&
          contradiction.affectedFamilies.includes(
            family.signalFamilyId,
          ),
      );

    const runtimeNamPhai =
      isRuntime && researchNamPhai && !namPhaiGated;
    const runtimeTrungChau =
      isRuntime && researchTrungChau && !trungChauGated;

    matrix.push({
      signalFamilyId: family.signalFamilyId,
      runtimeAdmittedByNamPhai: runtimeNamPhai,
      runtimeAdmittedByTrungChau: runtimeTrungChau,
      featureGatedByNamPhai: namPhaiGated,
      featureGatedByTrungChau: trungChauGated,
      researchAdmittedByNamPhai: researchNamPhai,
      researchAdmittedByTrungChau: researchTrungChau,
      doctrineVerifiedByNamPhai:
        family.doctrineStatus === "verified" && researchNamPhai,
      doctrineVerifiedByTrungChau:
        family.doctrineStatus === "verified" && researchTrungChau,
      sharedImplementation: runtimeNamPhai && runtimeTrungChau,
      sharedCalculationFacts:
        isRuntime && researchNamPhai && researchTrungChau,
      sharedDoctrine:
        family.doctrineStatus === "verified" &&
        researchNamPhai &&
        researchTrungChau,
      crossSchoolFallbackForbidden: true,
      unresolvedSchoolContradictions:
        family.schoolScope === "unresolved" ||
        scopes.length === 0 ||
        family.doctrineStatus === "school-specific-unresolved" ||
        openSchoolContradiction,
    });
  }

  fs.mkdirSync(path.join(outputBase, "matrices"), {
    recursive: true,
  });
  const output = `${JSON.stringify(matrix, null, 2)}\n`;
  fs.writeFileSync(
    path.join(outputBase, "matrices/school-policy-matrix.json"),
    output,
  );
  fs.writeFileSync(
    path.join(outputBase, "matrices/school-policy-matrix.hash"),
    `${crypto.createHash("sha256").update(output).digest("hex")}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSchoolPolicyMatrix();
}
