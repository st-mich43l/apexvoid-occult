import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { sha256File } from "../types/hash.js";
import { MajorFortuneDeterminismReport } from "../types/reports.js";

export function compareDeterminismRuns(runADir: string, runBDir: string): MajorFortuneDeterminismReport {
  const filesA = existsSync(runADir) ? readdirSync(runADir) : [];
  const filesB = existsSync(runBDir) ? readdirSync(runBDir) : [];
  
  const setA = new Set(filesA);
  const setB = new Set(filesB);

  const missingInRunA = filesB.filter(f => !setA.has(f));
  const missingInRunB = filesA.filter(f => !setB.has(f));

  const report: MajorFortuneDeterminismReport = {
    schemaVersion: "0.4.4",
    runAId: "runA",
    runBId: "runB",
    comparedArtifacts: 0,
    matchingArtifacts: 0,
    mismatchingArtifacts: 0,
    missingInRunA,
    missingInRunB,
    differences: [],
    deterministicDifferences: 0,
    passed: false,
  };

  const commonFiles = filesA.filter(f => setB.has(f));
  report.comparedArtifacts = commonFiles.length;

  for (const f of commonFiles) {
    const hashA = sha256File(join(runADir, f));
    const hashB = sha256File(join(runBDir, f));

    if (hashA === hashB) {
      report.matchingArtifacts++;
    } else {
      report.mismatchingArtifacts++;
      report.deterministicDifferences++;
      report.differences.push({
        path: f,
        runAHash: hashA,
        runBHash: hashB,
      });
    }
  }

  report.passed = report.mismatchingArtifacts === 0 && report.missingInRunA.length === 0 && report.missingInRunB.length === 0;

  return report;
}
