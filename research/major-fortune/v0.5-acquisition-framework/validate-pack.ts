import fs from "fs";
import path from "path";
import {
  MajorFortuneResearchSource,
  SourceExtractionRecord,
  AcquisitionClaim,
  AcquisitionPackManifest
} from "./schema/pack.js";

export function validateAcquisitionPack(opts: {
  manifestPath: string;
  packBase: string;
  foundationBase: string;
}): void {
  const manifest: AcquisitionPackManifest = JSON.parse(fs.readFileSync(opts.manifestPath, "utf8"));

  const sources: MajorFortuneResearchSource[] = JSON.parse(fs.readFileSync(path.join(opts.packBase, manifest.maintainedInputs.sourceRegistry), "utf8"));
  const extractions: SourceExtractionRecord[] = JSON.parse(fs.readFileSync(path.join(opts.packBase, manifest.maintainedInputs.extractionLedger), "utf8"));
  const claims: AcquisitionClaim[] = JSON.parse(fs.readFileSync(path.join(opts.packBase, manifest.maintainedInputs.claimRegistry), "utf8"));

  const targetFamilies = new Set(manifest.targetFamilyIds);
  if (targetFamilies.size !== manifest.targetFamilyIds.length) {
    throw new Error("Manifest targetFamilyIds contains duplicates.");
  }

  // Check claims
  for (const claim of claims) {
    if (!targetFamilies.has(claim.familyId)) {
      throw new Error(`Claim ${claim.claimId} references family ${claim.familyId} which is outside the pack manifest targets.`);
    }
    if (claim.acquisitionStatus === "blocked-missing-provenance") {
      if (!claim.unresolvedDimensions || claim.unresolvedDimensions.length === 0) {
        throw new Error(`Claim ${claim.claimId} is blocked-missing-provenance but has empty unresolvedDimensions.`);
      }
    }
  }

  // Check extractions
  for (const ext of extractions) {
    if (!targetFamilies.has(ext.familyId)) {
      throw new Error(`Extraction ${ext.extractionId} references family ${ext.familyId} which is outside the pack manifest targets.`);
    }
  }

  // Check sources
  for (const source of sources) {
    for (const fam of source.supportedFamilyIds) {
      if (!targetFamilies.has(fam)) {
        throw new Error(`Source ${source.sourceId} supports family ${fam} which is outside the pack manifest targets.`);
      }
    }
  }

  // Check if target families actually have maintained claims
  for (const fam of targetFamilies) {
    if (!claims.some(c => c.familyId === fam)) {
      throw new Error(`Manifest target family ${fam} has no maintained claims.`);
    }
    const hasNamPhai = claims.some(c => c.familyId === fam && (c.schoolScope === "nam-phai" || c.schoolScope === "shared"));
    const hasTrungChau = claims.some(c => c.familyId === fam && (c.schoolScope === "trung-chau" || c.schoolScope === "shared"));
    if (!hasNamPhai || !hasTrungChau) {
      // It depends on the required scopes, let's just check the ones required
      for (const req of manifest.requiredSchoolScopes) {
        if (!claims.some(c => c.familyId === fam && (c.schoolScope === req || c.schoolScope === "shared"))) {
          throw new Error(`Manifest target family ${fam} lacks claims for required school scope ${req}.`);
        }
      }
    }
  }

  // Check for duplicates
  const sourceIds = new Set();
  const locatorIds = new Set();
  for (const source of sources) {
    if (sourceIds.has(source.sourceId)) throw new Error(`Duplicate sourceId: ${source.sourceId}`);
    sourceIds.add(source.sourceId);

    if (source.locators) {
      for (const l of source.locators) {
        if (locatorIds.has(l.locatorId)) throw new Error(`Duplicate locatorId: ${l.locatorId}`);
        locatorIds.add(l.locatorId);
      }
    }

    if (source.verificationStatus === "verified-copy") {
      if (!source.copyIdentity) {
        throw new Error(`Source ${source.sourceId} is a verified-copy but lacks copyIdentity.`);
      }
      const { copyId, acquisitionMethod, editionFingerprint, acquiredAt, verifiedBy, verifiedAt, artifactHash, archiveLocator } = source.copyIdentity;
      if (!copyId || !acquisitionMethod || !editionFingerprint || !acquiredAt || !verifiedBy || !verifiedAt) {
        throw new Error(`Source ${source.sourceId} has incomplete copyIdentity provenance.`);
      }
      if (!artifactHash && !archiveLocator) {
        throw new Error(`Source ${source.sourceId} copyIdentity must have either artifactHash or archiveLocator.`);
      }

      if (!source.locators || source.locators.length === 0) {
        throw new Error(`Source ${source.sourceId} is verified-copy but has no locators.`);
      }

      let hasVerifiedLocator = false;
      for (const l of source.locators) {
        if (l.locatorVerification === "verified-against-copy") {
          hasVerifiedLocator = true;
          if (!l.copyId && !l.scanId) {
            throw new Error(`Source ${source.sourceId} locator ${l.locatorId} is verified-against-copy but lacks copyId/scanId.`);
          }
        }
        if ((l.pageStart !== null || l.pageEnd !== null) && !editionFingerprint) {
          throw new Error(`Source ${source.sourceId} locator ${l.locatorId} has page references but source lacks editionFingerprint.`);
        }
        if (l.extractionId) {
          const ext = extractions.find(e => e.extractionId === l.extractionId);
          if (ext && ext.sourceId !== source.sourceId) {
            throw new Error(`Source ${source.sourceId} locator ${l.locatorId} references extraction ${l.extractionId} belonging to source ${ext.sourceId}.`);
          }
        }
      }
      if (!hasVerifiedLocator) {
        throw new Error(`Source ${source.sourceId} is verified-copy but lacks any verified-against-copy locators.`);
      }
    }
  }

  // Check extractions
  for (const ext of extractions) {
    if (!targetFamilies.has(ext.familyId)) {
      throw new Error(`Extraction ${ext.extractionId} references family ${ext.familyId} which is outside the pack manifest targets.`);
    }
    if (ext.proposedApplicationScope?.applicationKind === "inferred" && !ext.proposedApplicationScope.rationale) {
      throw new Error(`Extraction ${ext.extractionId} is inferred but lacks rationale.`);
    }
  }

  // Check claims logic
  for (const claim of claims) {
    if (claim.acquisitionStatus === "supported-single-source" || claim.acquisitionStatus === "supported-multi-source") {
      throw new Error(`Claim ${claim.claimId} uses status ${claim.acquisitionStatus} which is forbidden in acquisition.`);
    }

    for (const sid of claim.sourceIds) {
      const source = sources.find(s => s.sourceId === sid);
      if (source) {
        if (claim.schoolScope !== "shared" && source.schoolScope !== "shared" && claim.schoolScope !== source.schoolScope) {
          throw new Error(`Claim ${claim.claimId} uses cross-school fallback`);
        }
        if (claim.acquisitionStatus === "ready-for-adjudication" && source.verificationStatus === "metadata-only") {
          throw new Error(`Claim ${claim.claimId} is ready-for-adjudication but relies on unverified sources`);
        }
      }
    }
  }

  // Check evidence records
  const evidenceLedgerPath = path.join(opts.packBase, manifest.generatedOutputs.evidenceLedger);
  if (fs.existsSync(evidenceLedgerPath)) {
    const evidenceLedger = JSON.parse(fs.readFileSync(evidenceLedgerPath, "utf8"));
    for (const record of evidenceLedger) {
      if (!targetFamilies.has(record.familyId)) {
        throw new Error(`Evidence record ${record.recordId} references family ${record.familyId} which is outside the pack manifest targets.`);
      }
    }
  }
}
