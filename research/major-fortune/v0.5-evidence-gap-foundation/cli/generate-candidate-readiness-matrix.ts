import crypto from "crypto";
import fs from "fs";
import path from "path";
import type {
  CandidateReadinessMatrixRecord,
  EvidenceGapMatrixRecord,
} from "../schema/foundation.js";
import { calculateCandidateReadiness } from "./readiness.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);

export function generateCandidateReadinessMatrix(opts?: {
  outputBase?: string;
}): void {
  const outputBase = opts?.outputBase ?? CANONICAL_BASE;
  const gapMatrix: EvidenceGapMatrixRecord[] = JSON.parse(
    fs.readFileSync(
      path.join(outputBase, "matrices/evidence-gap-matrix.json"),
      "utf8",
    ),
  );

  const matrix: CandidateReadinessMatrixRecord[] = gapMatrix.map(
    (record) => {
      const result = calculateCandidateReadiness(record);
      return {
        signalFamilyId: record.signalFamilyId,
        readiness: result.readiness,
        blockingDimensions: result.blockingDimensions,
      };
    },
  );

  fs.mkdirSync(path.join(outputBase, "matrices"), {
    recursive: true,
  });
  const output = `${JSON.stringify(matrix, null, 2)}\n`;
  fs.writeFileSync(
    path.join(outputBase, "matrices/candidate-readiness-matrix.json"),
    output,
  );
  fs.writeFileSync(
    path.join(outputBase, "matrices/candidate-readiness-matrix.hash"),
    `${crypto.createHash("sha256").update(output).digest("hex")}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateCandidateReadinessMatrix();
}
