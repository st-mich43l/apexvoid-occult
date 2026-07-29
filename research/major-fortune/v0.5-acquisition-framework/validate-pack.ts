import fs from "fs";
import path from "path";
import { loadAndValidateAcquisitionPackInputs } from "./schema/runtime-validation.js";
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
  const { manifest, sources, extractions, claims } = loadAndValidateAcquisitionPackInputs(opts);

  const targetFamilies = new Set(manifest.targetFamilyIds);
  if (targetFamilies.size !== manifest.targetFamilyIds.length) {
    throw new Error("Manifest targetFamilyIds contains duplicates.");
  }

  const sourceIds = new Set<string>();
  const locatorIds = new Set<string>();
  const extractionIds = new Set<string>();
  const claimIds = new Set<string>();

  // Extract all IDs to sets first
  sources.forEach(s => sourceIds.add(s.sourceId));
  extractions.forEach(e => extractionIds.add(e.extractionId));
  claims.forEach(c => claimIds.add(c.claimId));

  // --- SOURCES & LOCATORS ---
  for (const source of sources) {
    if (sourceIds.has(source.sourceId) && sources.filter(s => s.sourceId === source.sourceId).length > 1) {
      throw new Error(`Duplicate sourceId: ${source.sourceId}`);
    }

    if (source.verificationStatus === "metadata-only" && source.acquisitionStatus === "acquired") {
      throw new Error(`Source ${source.sourceId} is metadata-only but uses acquisition status 'acquired'.`);
    }
    if (source.verificationStatus === "metadata-only" && source.acquisitionStatus !== "catalogued-only" && source.acquisitionStatus !== "unavailable") {
      throw new Error(`Source ${source.sourceId} is metadata-only but uses acquisition status '${source.acquisitionStatus}'. Expected catalogued-only or unavailable.`);
    }

    for (const fam of source.supportedFamilyIds) {
      if (!targetFamilies.has(fam)) {
        throw new Error(`Source ${source.sourceId} supports family ${fam} which is outside the pack manifest targets.`);
      }
    }

    if (source.locators) {
      for (const l of source.locators) {
        if (locatorIds.has(l.locatorId) && sources.flatMap(s => s.locators || []).filter(loc => loc.locatorId === l.locatorId).length > 1) {
          throw new Error(`Duplicate locatorId: ${l.locatorId}`);
        }
        locatorIds.add(l.locatorId);

        if (l.extractionId) {
          if (!extractionIds.has(l.extractionId)) {
            throw new Error(`Source ${source.sourceId} locator ${l.locatorId} references missing extraction ${l.extractionId}.`);
          }
          const ext = extractions.find(e => e.extractionId === l.extractionId);
          if (ext && ext.sourceId !== source.sourceId) {
            throw new Error(`Source ${source.sourceId} locator ${l.locatorId} references extraction ${l.extractionId} belonging to source ${ext.sourceId}.`);
          }
          if (ext && ext.locatorId !== l.locatorId) {
            throw new Error(`Locator ${l.locatorId} and extraction ${ext.extractionId} do not agree bidirectionally.`);
          }
        }

        if (l.locatorVerification === "verified-against-copy") {
          if (!l.copyId && !l.scanId) {
            throw new Error(`Source ${source.sourceId} locator ${l.locatorId} is verified-against-copy but lacks copyId/scanId.`);
          }
          if (l.pageStart !== null || l.pageEnd !== null) {
             if (source.verificationStatus !== "verified-copy") {
               throw new Error(`Source ${source.sourceId} locator ${l.locatorId} has verified page numbers but source is not verified-copy.`);
             }
             if (!source.copyIdentity || !source.copyIdentity.editionFingerprint) {
               throw new Error(`Source ${source.sourceId} locator ${l.locatorId} has verified page numbers but source lacks editionFingerprint.`);
             }
          }
        }
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
        }
      }
      if (!hasVerifiedLocator) {
        throw new Error(`Source ${source.sourceId} is verified-copy but lacks any verified-against-copy locators.`);
      }
    }
  }

  // --- EXTRACTIONS ---
  for (const ext of extractions) {
    if (extractions.filter(e => e.extractionId === ext.extractionId).length > 1) {
      throw new Error(`Duplicate extractionId: ${ext.extractionId}`);
    }
    if (!sourceIds.has(ext.sourceId)) throw new Error(`Extraction ${ext.extractionId} references missing source ${ext.sourceId}.`);
    if (!locatorIds.has(ext.locatorId)) throw new Error(`Extraction ${ext.extractionId} references missing locator ${ext.locatorId}.`);

    const source = sources.find(s => s.sourceId === ext.sourceId)!;
    const locator = source.locators?.find(l => l.locatorId === ext.locatorId);

    if (!locator) {
      throw new Error(`Extraction ${ext.extractionId} references locator ${ext.locatorId} which is not in its source.`);
    }
    if (locator.extractionId !== ext.extractionId) {
      throw new Error(`Extraction ${ext.extractionId} and locator ${locator.locatorId} do not agree bidirectionally.`);
    }

    if (!targetFamilies.has(ext.familyId)) {
      throw new Error(`Extraction ${ext.extractionId} references family ${ext.familyId} which is outside the pack manifest targets.`);
    }
    if (!source.supportedFamilyIds.includes(ext.familyId)) {
      throw new Error(`Extraction ${ext.extractionId} family ${ext.familyId} is not supported by source ${ext.sourceId}.`);
    }

    if (ext.schoolScope !== "shared" && source.schoolScope !== "shared" && ext.schoolScope !== source.schoolScope) {
      throw new Error(`Extraction ${ext.extractionId} school scope ${ext.schoolScope} is incompatible with source ${source.sourceId}.`);
    }

    if (ext.proposedApplicationScope?.applicationKind === "inferred" && !ext.proposedApplicationScope.rationale) {
      throw new Error(`Extraction ${ext.extractionId} is inferred but lacks rationale.`);
    }
    if (ext.proposedApplicationScope?.applicationKind === "analogy" && !ext.proposedApplicationScope.rationale) {
      throw new Error(`Extraction ${ext.extractionId} is analogy but lacks rationale.`);
    }

    if (ext.evidenceExplicitness === "verified-explicit" || ext.evidenceExplicitness === "verified-inferred") {
      if (source.verificationStatus !== "verified-copy") {
        throw new Error(`Extraction ${ext.extractionId} is ${ext.evidenceExplicitness} but source ${ext.sourceId} is not verified-copy.`);
      }
      if (locator.locatorVerification !== "verified-against-copy") {
        throw new Error(`Extraction ${ext.extractionId} is ${ext.evidenceExplicitness} but locator ${ext.locatorId} is not verified-against-copy.`);
      }
    }
    if (ext.evidenceExplicitness === "reported-unverified" && source.verificationStatus === "verified-copy" && locator.locatorVerification === "verified-against-copy") {
      throw new Error(`Extraction ${ext.extractionId} is reported-unverified but has verified provenance without an explicit validation error explanation.`);
    }

    if (ext.evidenceExplicitness === "verified-explicit" && !ext.shortExcerpt) {
      throw new Error(`Extraction ${ext.extractionId} is verified-explicit but lacks a shortExcerpt.`);
    }
  }

  // --- CLAIMS ---
  for (const claim of claims) {
    if (claims.filter(c => c.claimId === claim.claimId).length > 1) {
      throw new Error(`Duplicate claimId: ${claim.claimId}`);
    }

    if (!targetFamilies.has(claim.familyId)) {
      throw new Error(`Claim ${claim.claimId} references family ${claim.familyId} which is outside the pack manifest targets.`);
    }

    if (claim.acquisitionStatus === "supported-single-source" || claim.acquisitionStatus === "supported-multi-source") {
      throw new Error(`Claim ${claim.claimId} uses status ${claim.acquisitionStatus} which is forbidden in acquisition.`);
    }

    if (claim.acquisitionStatus.startsWith("blocked-") && (!claim.unresolvedDimensions?.length && !claim.provenanceWarnings?.length)) {
       throw new Error(`Claim ${claim.claimId} is blocked but has no unresolved dimensions or provenance warnings.`);
    }

    for (const sid of claim.sourceIds) {
      if (!sourceIds.has(sid)) throw new Error(`Claim ${claim.claimId} references missing source ${sid}.`);
      const source = sources.find(s => s.sourceId === sid)!;
      if (claim.schoolScope !== "shared" && source.schoolScope !== "shared" && claim.schoolScope !== source.schoolScope) {
        throw new Error(`Claim ${claim.claimId} uses cross-school fallback with source ${sid}.`);
      }
    }

    for (const eid of claim.extractionIds) {
      if (!extractionIds.has(eid)) throw new Error(`Claim ${claim.claimId} references missing extraction ${eid}.`);
      const ext = extractions.find(e => e.extractionId === eid)!;
      if (!claim.sourceIds.includes(ext.sourceId)) {
        throw new Error(`Claim ${claim.claimId} links extraction ${eid} but does not link its source ${ext.sourceId}.`);
      }
      if (ext.familyId !== claim.familyId) {
        throw new Error(`Claim ${claim.claimId} links extraction ${eid} which is for a different family.`);
      }
      if (claim.schoolScope !== "shared" && ext.schoolScope !== "shared" && claim.schoolScope !== ext.schoolScope) {
        throw new Error(`Claim ${claim.claimId} uses cross-school fallback with extraction ${eid}.`);
      }

      // Scope consistency checking
      if (claim.requestedTemporalScope !== "unresolved" && claim.requestedTemporalScope !== ext.sourceTemporalScope) {
        if (ext.proposedApplicationScope?.temporalScope !== claim.requestedTemporalScope) {
           throw new Error(`Claim ${claim.claimId} temporal scope (${claim.requestedTemporalScope}) mismatches extraction ${eid} (${ext.sourceTemporalScope}) with no proposed scope bridge.`);
        }
        if (ext.proposedApplicationScope?.applicationKind !== "inferred" && ext.proposedApplicationScope?.applicationKind !== "analogy") {
           throw new Error(`Claim ${claim.claimId} temporal scope mismatch requires inferred or analogy bridge in extraction ${eid}.`);
        }
      }

      if (claim.requestedPalaceFrame !== "unresolved" && claim.requestedPalaceFrame !== ext.sourcePalaceFrame) {
        if (ext.proposedApplicationScope?.palaceFrame !== claim.requestedPalaceFrame) {
           throw new Error(`Claim ${claim.claimId} palace frame (${claim.requestedPalaceFrame}) mismatches extraction ${eid} (${ext.sourcePalaceFrame}) with no proposed scope bridge.`);
        }
        if (ext.proposedApplicationScope?.applicationKind !== "inferred" && ext.proposedApplicationScope?.applicationKind !== "analogy") {
           throw new Error(`Claim ${claim.claimId} palace frame mismatch requires inferred or analogy bridge in extraction ${eid}.`);
        }
      }

      if (claim.requestedTargetFrame !== "unresolved" && claim.requestedTargetFrame !== ext.sourceTargetFrame) {
        if (ext.proposedApplicationScope?.targetFrame !== claim.requestedTargetFrame) {
           throw new Error(`Claim ${claim.claimId} target frame (${claim.requestedTargetFrame}) mismatches extraction ${eid} (${ext.sourceTargetFrame}) with no proposed scope bridge.`);
        }
        if (ext.proposedApplicationScope?.applicationKind !== "inferred" && ext.proposedApplicationScope?.applicationKind !== "analogy") {
           throw new Error(`Claim ${claim.claimId} target frame mismatch requires inferred or analogy bridge in extraction ${eid}.`);
        }
      }
    }

    if (claim.acquisitionStatus === "ready-for-adjudication") {
      if (claim.extractionIds.length === 0) {
        throw new Error(`Claim ${claim.claimId} is ready-for-adjudication but has no linked extractions.`);
      }
      if (claim.unresolvedDimensions && claim.unresolvedDimensions.length > 0) {
        throw new Error(`Claim ${claim.claimId} is ready-for-adjudication but has unresolved dimensions.`);
      }
      if (claim.provenanceWarnings && claim.provenanceWarnings.length > 0) {
        throw new Error(`Claim ${claim.claimId} is ready-for-adjudication but has provenance warnings.`);
      }

      for (const sid of claim.sourceIds) {
        const source = sources.find(s => s.sourceId === sid)!;
        if (source.verificationStatus !== "verified-copy") {
          throw new Error(`Claim ${claim.claimId} is ready-for-adjudication but relies on unverified source ${sid}.`);
        }
      }
      for (const eid of claim.extractionIds) {
        const ext = extractions.find(e => e.extractionId === eid)!;
        if (ext.evidenceExplicitness === "reported-unverified" || ext.evidenceExplicitness === "none") {
          throw new Error(`Claim ${claim.claimId} is ready-for-adjudication but relies on metadata-only extraction ${eid}.`);
        }
        const source = sources.find(s => s.sourceId === ext.sourceId)!;
        const locator = source.locators?.find(l => l.locatorId === ext.locatorId);
        if (!locator || locator.locatorVerification !== "verified-against-copy") {
          throw new Error(`Claim ${claim.claimId} is ready-for-adjudication but uses unverified locator ${ext.locatorId}.`);
        }
      }
    }
  }

  // --- EVIDENCE LEDGER CHECK ---
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

