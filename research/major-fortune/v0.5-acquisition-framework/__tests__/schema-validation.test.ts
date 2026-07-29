import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  assertMajorFortuneResearchSources,
  assertSourceExtractionRecords,
} from "../schema/runtime-validation.js";
import { validateAcquisitionPack } from "../validate-pack.js";
import fs from "fs";
import os from "os";
import path from "path";

describe("Focused Schema Validation and Regression Tests", () => {
  describe("assertMajorFortuneResearchSources", () => {
    const baseSource = {
      sourceId: "S1",
      authorityClass: "classical-text",
      schoolScope: "nam-phai",
    };

    it("throws invalid acquisitionStatus", () => {
      expect(() => {
        assertMajorFortuneResearchSources([
          {
            ...baseSource,
            verificationStatus: "metadata-only",
            acquisitionStatus: "identified", // Invalid
          },
        ]);
      }).toThrow(/invalid acquisitionStatus "identified"/);
    });

    it("throws metadata-only acquisition inconsistency when acquired", () => {
      expect(() => {
        assertMajorFortuneResearchSources([
          {
            ...baseSource,
            verificationStatus: "metadata-only",
            acquisitionStatus: "acquired", // Inconsistent
            copyIdentity: { acquisitionMethod: "metadata-only", artifactHash: null },
          },
        ]);
      }).toThrow(/metadata-only but has acquisitionStatus "acquired"/);
    });

    it("throws invalid schoolScope", () => {
      expect(() => {
        assertMajorFortuneResearchSources([
          {
            ...baseSource,
            schoolScope: "mixed-school", // Invalid
            verificationStatus: "metadata-only",
            acquisitionStatus: "catalogued-only",
          },
        ]);
      }).toThrow(/invalid schoolScope "mixed-school"/);
    });

    it("catalogued-only + metadata-only passes", () => {
      expect(() => {
        assertMajorFortuneResearchSources([
          {
            ...baseSource,
            verificationStatus: "metadata-only",
            acquisitionStatus: "catalogued-only",
            copyIdentity: { acquisitionMethod: "metadata-only", artifactHash: null },
          },
        ]);
      }).not.toThrow();
    });
  });

  describe("assertSourceExtractionRecords", () => {
    it("throws invalid evidenceExplicitness", () => {
      expect(() => {
        assertSourceExtractionRecords([
          {
            extractionId: "E1",
            statementForm: "rule",
            evidenceExplicitness: "verified-by-summary", // Invalid
          },
        ]);
      }).toThrow(/invalid evidenceExplicitness "verified-by-summary"/);
    });
  });

  describe("validateAcquisitionPack - Contradictory Provenance", () => {
    let tmpDir: string;
    let foundationDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "val-test-"));
      foundationDir = fs.mkdtempSync(path.join(os.tmpdir(), "val-fd-test-"));
      fs.mkdirSync(path.join(tmpDir, "sources"), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, "extractions"), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, "claims"), { recursive: true });
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      fs.rmSync(foundationDir, { recursive: true, force: true });
    });

    it("throws contradictory provenance state when verified provenance has reported-unverified extraction", () => {
      const sources = [{
        sourceId: "S1",
        authorityClass: "classical-text",
        schoolScope: "nam-phai",
        verificationStatus: "verified-copy",
        acquisitionStatus: "acquired",
        supportedFamilyIds: ["F1"],
        locators: [{
          locatorId: "L1",
          extractionId: "E1",
          locatorVerification: "verified-against-copy",
          copyId: "C1"
        }],
        copyIdentity: {
          copyId: "C1",
          acquisitionMethod: "physical-scan",
          editionFingerprint: "fingerprint",
          acquiredAt: "today",
          verifiedBy: "me",
          verifiedAt: "today",
          artifactHash: "hash"
        }
      }];

      const extractions = [{
        extractionId: "E1",
        sourceId: "S1",
        locatorId: "L1",
        familyId: "F1",
        schoolScope: "nam-phai",
        statementForm: "rule",
        evidenceExplicitness: "reported-unverified" // Contradictory
      }];

      fs.writeFileSync(path.join(tmpDir, "sources/source-registry.json"), JSON.stringify(sources));
      fs.writeFileSync(path.join(tmpDir, "extractions/extraction-ledger.json"), JSON.stringify(extractions));
      fs.writeFileSync(path.join(tmpDir, "claims/claim-registry.json"), JSON.stringify([]));

      fs.writeFileSync(path.join(tmpDir, "pack-manifest.json"), JSON.stringify({
        schemaVersion: "0.5.0",
        packId: "test-pack",
        roundId: "r1",
        pillarId: "dia-loi",
        targetFamilyIds: ["F1"],
        requiredSchoolScopes: ["nam-phai"],
        maintainedInputs: {
          sourceRegistry: "sources/source-registry.json",
          extractionLedger: "extractions/extraction-ledger.json",
          claimRegistry: "claims/claim-registry.json"
        },
        generatedOutputs: {}
      }));

      expect(() => {
        validateAcquisitionPack({
          manifestPath: path.join(tmpDir, "pack-manifest.json"),
          packBase: tmpDir,
          foundationBase: foundationDir
        });
      }).toThrow(/reported-unverified but has verified provenance without an explicit validation error explanation/);
    });
  });
});
