import fs from "fs";
import path from "path";
import {
  AcquisitionPackManifest,
  MajorFortuneResearchSource,
  SourceExtractionRecord,
  AcquisitionClaim
} from "./pack.js";
import { ObligationClaimBindingRegistry } from "./binding.js";

function assertAcquisitionPackManifest(value: any): asserts value is AcquisitionPackManifest {
  if (!value || typeof value !== "object") throw new Error("Manifest is not an object.");

  if (value.schemaVersion !== "0.1.0" && value.schemaVersion !== "0.5.0") {
    throw new Error(`Manifest has invalid schemaVersion "${value.schemaVersion}". Expected 0.1.0 or 0.5.0.`);
  }

  const validPillars = ["dia-loi", "nhan-hoa", "thien-thoi"];
  if (!validPillars.includes(value.pillarId)) {
    throw new Error(`Manifest has invalid pillarId "${value.pillarId}". Expected one of: ${validPillars.join(", ")}.`);
  }

  const validSchools = ["nam-phai", "trung-chau"];
  if (!Array.isArray(value.requiredSchoolScopes)) {
    throw new Error(`Manifest requiredSchoolScopes is not an array.`);
  }

  const schoolSet = new Set(value.requiredSchoolScopes);
  if (schoolSet.size !== value.requiredSchoolScopes.length) {
    throw new Error(`Manifest requiredSchoolScopes contains duplicates.`);
  }

  for (const s of value.requiredSchoolScopes) {
    if (!validSchools.includes(s)) {
      throw new Error(`Manifest has invalid requiredSchoolScope "${s}". Expected one of: ${validSchools.join(", ")}.`);
    }
  }

  if (!Array.isArray(value.targetFamilyIds)) {
    throw new Error(`Manifest targetFamilyIds is not an array.`);
  }
  const familySet = new Set(value.targetFamilyIds);
  if (familySet.size !== value.targetFamilyIds.length) {
    throw new Error(`Manifest targetFamilyIds contains duplicates.`);
  }

  if (!value.maintainedInputs || !value.generatedOutputs) {
    throw new Error(`Manifest missing maintainedInputs or generatedOutputs.`);
  }
}

export function assertMajorFortuneResearchSources(value: any): asserts value is MajorFortuneResearchSource[] {
  if (!Array.isArray(value)) throw new Error("Sources is not an array.");

  const validAcquisition = ["acquired", "partially-acquired", "catalogued-only", "unavailable"];
  const validVerification = ["verified-copy", "metadata-only", "needs-verification"];
  const validSchool = ["nam-phai", "trung-chau", "shared", "unresolved"];
  const validAuthClass = ["classical-text", "school-manual", "named-commentary", "modern-reference", "research-summary", "engineering-policy"];

  for (const source of value) {
    if (!source.sourceId) throw new Error("Source missing sourceId.");
    const id = source.sourceId;

    if (!validAuthClass.includes(source.authorityClass)) {
      throw new Error(`Source ${id} has invalid authorityClass "${source.authorityClass}". Expected one of: ${validAuthClass.join(", ")}.`);
    }
    if (!validSchool.includes(source.schoolScope)) {
      throw new Error(`Source ${id} has invalid schoolScope "${source.schoolScope}". Expected one of: ${validSchool.join(", ")}.`);
    }
    if (!validAcquisition.includes(source.acquisitionStatus)) {
      throw new Error(`Source ${id} has invalid acquisitionStatus "${source.acquisitionStatus}". Expected one of: ${validAcquisition.join(", ")}.`);
    }
    if (!validVerification.includes(source.verificationStatus)) {
      throw new Error(`Source ${id} has invalid verificationStatus "${source.verificationStatus}". Expected one of: ${validVerification.join(", ")}.`);
    }

    if (source.verificationStatus === "metadata-only") {
      if (source.acquisitionStatus !== "catalogued-only" && source.acquisitionStatus !== "unavailable") {
         throw new Error(`Source ${id} is metadata-only but has acquisitionStatus "${source.acquisitionStatus}". Expected catalogued-only or unavailable.`);
      }
      if (source.copyIdentity?.acquisitionMethod !== "metadata-only") {
         throw new Error(`Source ${id} is metadata-only but acquisitionMethod is "${source.copyIdentity?.acquisitionMethod}". Expected metadata-only.`);
      }
      if (source.copyIdentity?.artifactHash !== null) {
         throw new Error(`Source ${id} is metadata-only but has non-null artifactHash.`);
      }
    }

    if (Array.isArray(source.locators)) {
      const validLocVerify = ["verified-against-copy", "reported-unverified", "metadata-only"];
      for (const loc of source.locators) {
         if (!validLocVerify.includes(loc.locatorVerification)) {
           throw new Error(`Source ${id} locator ${loc.locatorId} has invalid locatorVerification "${loc.locatorVerification}". Expected one of: ${validLocVerify.join(", ")}.`);
         }
      }
    }
  }
}

export function assertSourceExtractionRecords(value: any): asserts value is SourceExtractionRecord[] {
  if (!Array.isArray(value)) throw new Error("Extractions is not an array.");

  const validForm = ["rule", "definition", "example", "exception", "commentary", "inference", "unresolved"];
  const validExpl = ["verified-explicit", "verified-derived", "reported-unverified", "unverified-derivation", "disputed-provenance", "verified-by-summary"]; // Wait, verified-by-summary is invalid! The prompt explicitly said: "Fixture: evidenceExplicitness: verified-by-summary, Expected: throws invalid evidenceExplicitness"
  // Wait, let's look at schema/pack.ts
  const validExplSchema = ["verified-explicit", "verified-inferred", "reported-unverified", "analogy", "none"];

  for (const ext of value) {
    if (!ext.extractionId) throw new Error("Extraction missing extractionId.");
    const id = ext.extractionId;

    if (!validForm.includes(ext.statementForm)) {
      throw new Error(`Extraction ${id} has invalid statementForm "${ext.statementForm}". Expected one of: ${validForm.join(", ")}.`);
    }
    if (!validExplSchema.includes(ext.evidenceExplicitness)) {
      throw new Error(`Extraction ${id} has invalid evidenceExplicitness "${ext.evidenceExplicitness}". Expected one of: ${validExplSchema.join(", ")}.`);
    }
    if (ext.proposedApplicationScope) {
      const validAppKind = ["direct", "inferred", "analogy"];
      if (!validAppKind.includes(ext.proposedApplicationScope.applicationKind)) {
         throw new Error(`Extraction ${id} has invalid applicationKind "${ext.proposedApplicationScope.applicationKind}". Expected one of: ${validAppKind.join(", ")}.`);
      }
    }
    const validConf = ["high", "medium", "low"];
    if (ext.confidence && !validConf.includes(ext.confidence)) {
      throw new Error(`Extraction ${id} has invalid confidence "${ext.confidence}". Expected one of: ${validConf.join(", ")}.`);
    }
  }
}

function assertAcquisitionClaims(value: any): asserts value is AcquisitionClaim[] {
  if (!Array.isArray(value)) throw new Error("Claims is not an array.");

  const validSchool = ["nam-phai", "trung-chau", "shared", "unresolved"];
  const validAcquisition = [
    "unadjudicated",
    "ready-for-adjudication",
    "blocked-missing-provenance",
    "blocked-missing-locator",
    "blocked-scope-ambiguity",
    "blocked-school-ambiguity"
  ];

  for (const claim of value) {
    if (!claim.claimId) throw new Error("Claim missing claimId.");
    const id = claim.claimId;

    if (!validSchool.includes(claim.schoolScope)) {
      throw new Error(`Claim ${id} has invalid schoolScope "${claim.schoolScope}". Expected one of: ${validSchool.join(", ")}.`);
    }
    if (!validAcquisition.includes(claim.acquisitionStatus)) {
      throw new Error(`Claim ${id} has invalid acquisitionStatus "${claim.acquisitionStatus}". Expected one of: ${validAcquisition.join(", ")}.`);
    }
  }
}

function assertObligationClaimBindings(value: any): asserts value is ObligationClaimBindingRegistry {
  if (!value || typeof value !== "object") throw new Error("Bindings registry is not an object.");
  if (value.schemaVersion !== "0.5.0") throw new Error("Bindings registry schemaVersion must be 0.5.0.");
  if (!Array.isArray(value.bindings)) throw new Error("Bindings is not an array.");

  const validStatus = ["bound", "unbound", "ambiguous"];
  for (const b of value.bindings) {
    if (!b.bindingId) throw new Error("Binding missing bindingId.");
    if (!b.obligationId) throw new Error(`Binding ${b.bindingId} missing obligationId.`);
    if (!validStatus.includes(b.bindingStatus)) {
      throw new Error(`Binding ${b.bindingId} has invalid status "${b.bindingStatus}".`);
    }
    if (!Array.isArray(b.localClaimIds)) throw new Error(`Binding ${b.bindingId} localClaimIds is not an array.`);
  }
}

export function loadAndValidateAcquisitionPackInputs(opts: { manifestPath: string, packBase: string }) {
  const manifest = JSON.parse(fs.readFileSync(opts.manifestPath, "utf8"));
  assertAcquisitionPackManifest(manifest);

  const sourcesPath = path.join(opts.packBase, manifest.maintainedInputs.sourceRegistry);
  const sources = JSON.parse(fs.readFileSync(sourcesPath, "utf8"));
  assertMajorFortuneResearchSources(sources);

  const extractionsPath = path.join(opts.packBase, manifest.maintainedInputs.extractionLedger);
  const extractions = JSON.parse(fs.readFileSync(extractionsPath, "utf8"));
  assertSourceExtractionRecords(extractions);

  const claimsPath = path.join(opts.packBase, manifest.maintainedInputs.claimRegistry);
  const claims = JSON.parse(fs.readFileSync(claimsPath, "utf8"));
  assertAcquisitionClaims(claims);

  const bindingsPath = path.join(opts.packBase, manifest.maintainedInputs.obligationClaimBinding || "claims/obligation-claim-bindings.json");
  const bindingsRegistry = fs.existsSync(bindingsPath) ? JSON.parse(fs.readFileSync(bindingsPath, "utf8")) : null;
  if (bindingsRegistry) assertObligationClaimBindings(bindingsRegistry);

  return { manifest, sources, extractions, claims, bindingsRegistry };
}
