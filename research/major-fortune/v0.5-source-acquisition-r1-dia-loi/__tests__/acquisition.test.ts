import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateAcquisitionPack } from "../../v0.5-acquisition-framework/validate-pack.js";
import fs from "fs";
import os from "os";
import path from "path";

describe("Source Acquisition Round 1A - Địa Lợi", () => {
  let tmpDir: string;
  let foundationDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "acquisition-test-"));
    foundationDir = fs.mkdtempSync(path.join(os.tmpdir(), "acquisition-foundation-test-"));
    fs.mkdirSync(path.join(tmpDir, "sources"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "extractions"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "claims"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "queue"), { recursive: true });
    fs.mkdirSync(path.join(foundationDir, "matrices"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(foundationDir, { recursive: true, force: true });
  });

  const writeFixtures = (sources: any[], extractions: any[], claims: any[], evidenceRecords: any[]) => {
    sources.forEach(s => {
      s.supportedFamilyIds = s.supportedFamilyIds || ["F1"];
      s.schoolScope = s.schoolScope || "nam-phai";
    });
    extractions.forEach(e => {
      e.familyId = e.familyId || "F1";
    });
    claims.forEach(c => {
      c.familyId = c.familyId || "F1";
    });

    const finalClaims = [
      { claimId: "dummy-np", familyId: "F1", schoolScope: "nam-phai", acquisitionStatus: "unadjudicated", sourceIds: [], extractionIds: [] },
      { claimId: "dummy-tc", familyId: "F1", schoolScope: "trung-chau", acquisitionStatus: "unadjudicated", sourceIds: [], extractionIds: [] },
      ...claims
    ];

    fs.writeFileSync(path.join(tmpDir, "sources/source-registry.json"), JSON.stringify(sources));
    fs.writeFileSync(path.join(tmpDir, "extractions/extraction-ledger.json"), JSON.stringify(extractions));
    fs.writeFileSync(path.join(tmpDir, "claims/claim-registry.json"), JSON.stringify(finalClaims));
    fs.writeFileSync(path.join(tmpDir, "queue/evidence-gap-evidence-ledger.json"), JSON.stringify(evidenceRecords));
    fs.writeFileSync(path.join(foundationDir, "matrices/evidence-gap-matrix.json"), JSON.stringify([]));

    fs.writeFileSync(path.join(tmpDir, "pack-manifest.json"), JSON.stringify({
      schemaVersion: "0.1.0",
      packId: "acq-r1-dia-loi",
      roundId: "r1",
      pillarId: "dia-loi",
      targetFamilyIds: ["F1"],
      requiredSchoolScopes: ["nam-phai", "trung-chau"],
      maintainedInputs: {
        sourceRegistry: "sources/source-registry.json",
        extractionLedger: "extractions/extraction-ledger.json",
        claimRegistry: "claims/claim-registry.json"
      },
      generatedOutputs: {
        evidenceLedger: "queue/evidence-gap-evidence-ledger.json",
        coverageMatrix: "matrices/source-coverage-matrix.json",
        schoolMatrix: "matrices/school-evidence-matrix.json",
        handoffQueue: "queue/claim-adjudication-handoff.json",
        summary: "reports/acquisition-summary.json"
      }
    }));
  };

  const validSource = {
    sourceId: "S1",
    locators: [],
    verificationStatus: "metadata-only",
    supportedFamilyIds: []
  };

  it("validates the standard constraints flawlessly", () => {
    writeFixtures([], [], [], []);
    expect(() => validateAcquisitionPack({ manifestPath: path.join(tmpDir, "pack-manifest.json"), packBase: tmpDir, foundationBase: foundationDir })).not.toThrow();
  });

  it("fails on duplicate source ID", () => {
    writeFixtures([{ ...validSource, sourceId: "A" }, { ...validSource, sourceId: "A" }], [], [], []);
    expect(() => validateAcquisitionPack({ manifestPath: path.join(tmpDir, "pack-manifest.json"), packBase: tmpDir, foundationBase: foundationDir })).toThrow(/Duplicate sourceId/);
  });

  it("fails on duplicate locator ID", () => {
    writeFixtures([{ ...validSource, locators: [{ locatorId: "L1", pageStart: null }, { locatorId: "L1", pageStart: null }] }], [], [], []);
    expect(() => validateAcquisitionPack({ manifestPath: path.join(tmpDir, "pack-manifest.json"), packBase: tmpDir, foundationBase: foundationDir })).toThrow(/Duplicate locatorId/);
  });

  it("fails on verified-copy without copy identity", () => {
    writeFixtures([{ ...validSource, verificationStatus: "verified-copy" }], [], [], []);
    expect(() => validateAcquisitionPack({ manifestPath: path.join(tmpDir, "pack-manifest.json"), packBase: tmpDir, foundationBase: foundationDir })).toThrow(/lacks copyId/);
  });

  it("fails on inference extraction without rationale", () => {
    writeFixtures(
      [{ ...validSource, locators: [{ locatorId: "L1", pageStart: null }] }],
      [{
         extractionId: "E1",
         sourceId: "S1",
         locatorId: "L1",
         proposedApplicationScope: { applicationKind: "inferred" },
         normalizedSummary: "summary"
      }],
      [],
      []
    );
    expect(() => validateAcquisitionPack({ manifestPath: path.join(tmpDir, "pack-manifest.json"), packBase: tmpDir, foundationBase: foundationDir })).toThrow(/lacks rationale/);
  });

  it("fails on cross-school fallback", () => {
    writeFixtures(
      [
        { ...validSource, sourceId: "S1", schoolScope: "nam-phai" },
        { ...validSource, sourceId: "S2", schoolScope: "trung-chau" }
      ],
      [],
      [{ claimId: "C1", sourceIds: ["S1", "S2"], extractionIds: [], schoolScope: "nam-phai", acquisitionStatus: "unadjudicated" }],
      []
    );
    expect(() => validateAcquisitionPack({ manifestPath: path.join(tmpDir, "pack-manifest.json"), packBase: tmpDir, foundationBase: foundationDir })).toThrow(/uses cross-school fallback/);
  });

  it("fails on acquisition claim using adjudication status", () => {
    writeFixtures(
      [{ ...validSource, sourceId: "S1" }],
      [],
      [{ claimId: "C1", sourceIds: ["S1"], extractionIds: [], schoolScope: "shared", acquisitionStatus: "supported-single-source" }],
      []
    );
    expect(() => validateAcquisitionPack({ manifestPath: path.join(tmpDir, "pack-manifest.json"), packBase: tmpDir, foundationBase: foundationDir })).toThrow(/forbidden in acquisition/);
  });

  it("fails on evidence record referencing missing family", () => {
    writeFixtures([], [], [], [{ recordId: "R1", gapId: "G1", familyId: "nonexistent-family" }]);
    expect(() => validateAcquisitionPack({ manifestPath: path.join(tmpDir, "pack-manifest.json"), packBase: tmpDir, foundationBase: foundationDir })).toThrow(/outside the pack manifest targets/);
  });

  it("fails on ready-for-adjudication claim relying on unverified sources", () => {
    writeFixtures(
      [{ ...validSource, sourceId: "S1", verificationStatus: "metadata-only" }],
      [],
      [{ claimId: "C1", sourceIds: ["S1"], extractionIds: [], schoolScope: "shared", acquisitionStatus: "ready-for-adjudication" }],
      []
    );
    expect(() => validateAcquisitionPack({ manifestPath: path.join(tmpDir, "pack-manifest.json"), packBase: tmpDir, foundationBase: foundationDir })).toThrow(/relies on unverified sources/);
  });
});
