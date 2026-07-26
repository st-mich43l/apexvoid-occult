import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  MajorFortuneResearchSource,
  SourceExtractionRecord,
  ResearchClaim,
  SourceCoverageMatrixRow,
  AcquisitionSummary,
} from "../schema/acquisition.js";

const ROOT = process.cwd();
const BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-source-acquisition-r1-dia-loi",
);

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(BASE, relativePath), "utf8"),
  );
}

function writeJson(relativePath: string, data: any): void {
  const fullPath = path.join(BASE, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const output = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(fullPath, output);
  const hash = crypto.createHash("sha256").update(output).digest("hex");
  fs.writeFileSync(fullPath.replace(".json", ".hash"), `${hash}\n`);
}

export function generateAcquisitionPack(opts?: { outputBase?: string }): void {
  const outputBase = opts?.outputBase ?? BASE;
  
  // Need local writeJson if outputBase is different, but for now we assume outputBase logic
  const localWriteJson = (relativePath: string, data: any) => {
    const fullPath = path.join(outputBase, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    const output = `${JSON.stringify(data, null, 2)}\n`;
    fs.writeFileSync(fullPath, output);
    const hash = crypto.createHash("sha256").update(output).digest("hex");
    fs.writeFileSync(fullPath.replace(".json", ".hash"), `${hash}\n`);
  };

  const sources: MajorFortuneResearchSource[] = JSON.parse(
    fs.readFileSync(path.join(BASE, "sources/source-registry.json"), "utf8"),
  );
  const extractions: SourceExtractionRecord[] = JSON.parse(
    fs.readFileSync(path.join(BASE, "extractions/extraction-ledger.json"), "utf8"),
  );
  const claims: ResearchClaim[] = JSON.parse(
    fs.readFileSync(path.join(BASE, "claims/claim-registry.json"), "utf8"),
  );

  // Queues
  const missingLocatorQueue = sources
    .filter((s) => s.verificationStatus === "verified-copy" && s.locators.length === 0)
    .map((s) => s.sourceId);

  const unresolvedSchoolQueue = claims
    .filter((c) => c.schoolScope === "unresolved")
    .map((c) => c.claimId);

  const handoffQueue = claims
    .filter((c) => c.adjudicationStatus.startsWith("supported"))
    .map((c) => c.claimId);

  localWriteJson("queue/missing-source-locator-queue.json", missingLocatorQueue);
  localWriteJson("queue/unresolved-school-scope-queue.json", unresolvedSchoolQueue);
  localWriteJson("queue/claim-adjudication-handoff.json", handoffQueue);

  // Matrices
  const targetFamilies = ["principal-star-dignity", "vcd-opposite-palace-borrowing"] as const;
  const targetSchools = ["nam-phai", "trung-chau"] as const;

  const coverageMatrix: SourceCoverageMatrixRow[] = [];

  for (const familyId of targetFamilies) {
    for (const schoolScope of targetSchools) {
      const relevantClaims = claims.filter(
        (c) => c.familyId === familyId && c.schoolScope === schoolScope,
      );
      const relevantExtractions = extractions.filter(
        (e) => e.familyId === familyId && e.schoolScope === schoolScope,
      );
      const relevantSources = sources.filter(
        (s) =>
          s.supportedFamilyIds.includes(familyId) &&
          s.schoolScope === schoolScope,
      );

      coverageMatrix.push({
        familyId,
        schoolScope,
        inspectedSourceCount: relevantSources.length,
        verifiedLocatorCount: relevantSources.reduce(
          (acc, s) => acc + s.locators.length,
          0,
        ),
        explicitMajorFortuneClaimCount: relevantClaims.filter(
          (c) => c.temporalScope === "major-fortune",
        ).length,
        natalOnlyClaimCount: relevantClaims.filter(
          (c) => c.temporalScope === "natal",
        ).length,
        unresolvedTemporalScopeCount: relevantClaims.filter(
          (c) => c.temporalScope === "unresolved",
        ).length,
        conflictingClaimCount: relevantClaims.filter(
          (c) => c.adjudicationStatus === "conflicted",
        ).length,
        coverage: {
          existence: relevantClaims.length > 0 ? "covered" : "missing",
          temporalScope: relevantClaims.some((c) => c.temporalScope !== "unresolved") ? "covered" : "missing",
          palaceFrame: relevantClaims.some((c) => c.palaceFrame !== "unresolved") ? "covered" : "missing",
          targetFrame: relevantClaims.some((c) => c.targetFrame !== "unresolved") ? "covered" : "missing",
          polarity: relevantClaims.some((c) => c.polarity !== null) ? "covered" : "missing",
          strength: relevantClaims.some((c) => c.strength !== null) ? "covered" : "missing",
          exceptionPolicy: "missing",
        },
      });
    }
  }

  localWriteJson("matrices/source-coverage-matrix.json", coverageMatrix);
  localWriteJson("matrices/school-evidence-matrix.json", { coverageMatrix });

  // Summary
  const summary: AcquisitionSummary = {
    sourcesTargeted: sources.length,
    sourcesAcquired: sources.filter((s) => s.acquisitionStatus === "acquired").length,
    extractionsCollected: extractions.length,
    claimsUnadjudicated: claims.filter((c) => c.adjudicationStatus === "unadjudicated").length,
    familiesCovered: targetFamilies.filter(f => claims.some(c => c.familyId === f)).length,
    familiesPartiallyCovered: 0,
  };

  localWriteJson("reports/acquisition-summary.json", summary);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAcquisitionPack();
}
