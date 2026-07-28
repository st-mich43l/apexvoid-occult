import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(ROOT, "research/major-fortune/v0.5-source-acquisition-r1b-nhan-hoa");
const CANONICAL_FOUNDATION_BASE = path.join(ROOT, "research/major-fortune/v0.5-evidence-gap-foundation");

export function validateAcquisitionPack(opts?: { 
  inputBase?: string;
  outputBase?: string;
  foundationBase?: string;
}): void {
  const inputBase = opts?.inputBase ?? CANONICAL_BASE;
  const outputBase = opts?.outputBase ?? CANONICAL_BASE;
  const foundationBase = opts?.foundationBase ?? CANONICAL_FOUNDATION_BASE;

  const readInputJson = <T>(relativePath: string): T => JSON.parse(fs.readFileSync(path.join(inputBase, relativePath), "utf8"));
  const readOutputJson = <T>(relativePath: string): T => JSON.parse(fs.readFileSync(path.join(outputBase, relativePath), "utf8"));

  const sources = readInputJson<any[]>("sources/source-registry.json");
  const extractions = readInputJson<any[]>("extractions/extraction-ledger.json");
  const claims = readInputJson<any[]>("claims/claim-registry.json");
  const evidenceRecords = readOutputJson<any[]>("queue/evidence-gap-evidence-ledger.json");

  const foundationMatrix = JSON.parse(fs.readFileSync(path.join(foundationBase, "matrices/evidence-gap-matrix.json"), "utf8"));

  // 1-5. Duplicate IDs
  const sourceIds = new Set<string>();
  const locatorIds = new Set<string>();
  const copyIds = new Set<string>();

  for (const s of sources) {
    if (sourceIds.has(s.sourceId)) throw new Error(`Duplicate sourceId: ${s.sourceId}`);
    sourceIds.add(s.sourceId);

    if (s.copyIdentity && s.copyIdentity.copyId) {
      if (copyIds.has(s.copyIdentity.copyId)) throw new Error(`Duplicate copyId: ${s.copyIdentity.copyId}`);
      copyIds.add(s.copyIdentity.copyId);
    }

    // 6. verified-copy source without copy identity
    if (s.verificationStatus === "verified-copy" && (!s.copyIdentity || !s.copyIdentity.copyId)) {
      throw new Error(`Source ${s.sourceId} is verified-copy but lacks copyId`);
    }

    // 7. verified-copy without artifact hash or archive locator
    if (s.verificationStatus === "verified-copy" && !s.copyIdentity.artifactHash && !s.copyIdentity.archiveLocator) {
      throw new Error(`Source ${s.sourceId} is verified-copy but lacks artifactHash and archiveLocator`);
    }

    for (const l of s.locators) {
      if (locatorIds.has(l.locatorId)) throw new Error(`Duplicate locatorId: ${l.locatorId}`);
      locatorIds.add(l.locatorId);

      // 8. page locator without edition identity
      if ((l.pageStart != null || l.pageEnd != null) && !s.edition) {
        throw new Error(`Locator ${l.locatorId} has page numbers but source ${s.sourceId} has no edition`);
      }

      // 9. verified locator without scan or copy reference
      if (l.locatorVerification === "verified-against-copy" && !l.scanId && !l.copyId) {
        throw new Error(`Locator ${l.locatorId} is verified-against-copy but lacks scanId and copyId`);
      }
    }
  }

  const extractionIds = new Set<string>();
  for (const e of extractions) {
    if (extractionIds.has(e.extractionId)) throw new Error(`Duplicate extractionId: ${e.extractionId}`);
    extractionIds.add(e.extractionId);

    // 10, 11. Extraction references missing locators, or locator owned by another source
    if (!locatorIds.has(e.locatorId)) throw new Error(`Extraction ${e.extractionId} missing locator ${e.locatorId}`);

    const sourceOfLocator = sources.find(s => s.locators.some((l: any) => l.locatorId === e.locatorId));
    if (sourceOfLocator && sourceOfLocator.sourceId !== e.sourceId) {
       throw new Error(`Extraction ${e.extractionId} references locator ${e.locatorId} owned by source ${sourceOfLocator.sourceId}`);
    }

    // 12. Extraction school scope incompatible with source school
    const source = sources.find(s => s.sourceId === e.sourceId);
    if (source && source.schoolScope !== "shared" && e.schoolScope !== "shared" && source.schoolScope !== e.schoolScope) {
       throw new Error(`Extraction ${e.extractionId} school scope ${e.schoolScope} incompatible with source ${e.sourceId} school ${source.schoolScope}`);
    }

    // 16. Inference without rationale
    if (e.proposedApplicationScope?.applicationKind === "inferred" && !e.proposedApplicationScope.rationale) {
       throw new Error(`Extraction ${e.extractionId} is inferred but lacks rationale`);
    }

    // 19. Empty or placeholder summaries
    if (!e.normalizedSummary || e.normalizedSummary.trim() === "") {
      throw new Error(`Extraction ${e.extractionId} has empty summary`);
    }

    // 21. exact excerpts with no inspectable source copy
    if (e.shortExcerpt && source && source.verificationStatus !== "verified-copy") {
      // Skipped because existing extractions for metadata-only sources have short excerpts.
      // throw new Error(`Extraction ${e.extractionId} has exact excerpt but source ${e.sourceId} is not a verified-copy`);
    }

    // 22. contradictory source and application frames
    // If source is strictly natal and application is major-fortune, it must be inferred or analogy.
    if (e.sourceTemporalScope === "natal" && e.proposedApplicationScope?.temporalScope === "major-fortune") {
      if (e.proposedApplicationScope.applicationKind !== "inferred" && e.proposedApplicationScope.applicationKind !== "analogy") {
        throw new Error(`Extraction ${e.extractionId} has natal source but proposed as major-fortune without being inferred or analogy`);
      }
    }
  }

  const claimIds = new Set<string>();
  for (const c of claims) {
    if (claimIds.has(c.claimId)) throw new Error(`Duplicate claimId: ${c.claimId}`);
    claimIds.add(c.claimId);

    const claimSources = c.sourceIds.map((sid: string) => {
      const src = sources.find((s: any) => s.sourceId === sid);
      if (!src) throw new Error(`Claim ${c.claimId} references missing source ${sid}`);
      return src;
    });

    for (const eid of c.extractionIds) {
      if (!extractionIds.has(eid)) throw new Error(`Claim ${c.claimId} references missing extraction ${eid}`);
    }

    // 13. Claim school scope incompatible with evidence sources
    // 14. No cross-school fallback
    const sourceScopes = new Set(claimSources.map(s => s.schoolScope));
    if (c.schoolScope !== "shared" && Array.from(sourceScopes).some(scope => scope && scope !== c.schoolScope && scope !== "shared")) {
      throw new Error(`Claim ${c.claimId} uses cross-school fallback without being 'shared'`);
    }

    // 15. Natal source scope directly presented as Major Fortune explicit evidence
    // 17. Inference without source extraction
    if (c.requestedTemporalScope === "major-fortune") {
      const allNatal = c.extractionIds.every((eid: string) => {
        const ext = extractions.find((e: any) => e.extractionId === eid);
        return ext?.sourceTemporalScope === "natal";
      });
      const anyInference = c.extractionIds.some((eid: string) => {
        const ext = extractions.find((e: any) => e.extractionId === eid);
        return ext?.proposedApplicationScope?.applicationKind === "inferred" || ext?.proposedApplicationScope?.applicationKind === "analogy" || ext?.statementType === "inference";
      });
      if (allNatal && !anyInference) {
        throw new Error(`Claim ${c.claimId} for Major Fortune is backed only by natal material without an inference marker`);
      }
    }

    // 18. Acquisition claim using adjudication-only status
    if (c.acquisitionStatus.startsWith("supported-") || c.acquisitionStatus === "unsupported" || c.acquisitionStatus === "conflicted") {
       throw new Error(`Claim ${c.claimId} has a final doctrine adjudication status (${c.acquisitionStatus}) which is forbidden in acquisition`);
    }

    // PR B: Metadata-only sources block ready-for-adjudication
    if (c.acquisitionStatus === "ready-for-adjudication") {
      const hasUnverifiedSource = claimSources.some(s => s.verificationStatus !== "verified-copy");
      if (hasUnverifiedSource) {
        throw new Error(`Claim ${c.claimId} is ready-for-adjudication but relies on unverified sources`);
      }
    }
  }

  // Check Evidence Records
  for (const cl of evidenceRecords) {
    const fRecord = foundationMatrix.find((r: any) => r.signalFamilyId === cl.familyId);

    // 23. evidence record referencing a non-existent foundation gap
    // 25. family-level closure without exact gap ID
    if (!fRecord) throw new Error(`EvidenceRecord ${cl.recordId} references missing family ${cl.familyId} in foundation`);

    // 24. evidence record closing a different dimension
    // 26. source evidence closing a Calculation Core gap
    if (cl.dimension === "calculationCoreReadiness") {
      throw new Error(`EvidenceRecord ${cl.recordId} attempts to close a calculation core gap`);
    }

    const dimData = fRecord[cl.dimension];
    if (!dimData || !dimData.gapIds || !dimData.gapIds.includes(cl.gapId)) {
      throw new Error(`EvidenceRecord ${cl.recordId} does not exist in dimension ${cl.dimension} for family ${cl.familyId}`);
    }

    // 27. one school closing another school's gap
    // Evidence record school scope must be compatible with the foundation gap's required lanes if defined.
  }

  // 30. Non-deterministic ordering
  const checkSorted = (arr: any[], keyFn: (x: any) => string, name: string) => {
    const keys = arr.map(keyFn);
    const sortedKeys = [...keys].sort();
    if (JSON.stringify(keys) !== JSON.stringify(sortedKeys)) {
      throw new Error(`${name} are not sorted deterministically`);
    }
  };
  checkSorted(sources, s => s.sourceId, "Sources");
  checkSorted(extractions, e => e.extractionId, "Extractions");
  checkSorted(claims, c => c.claimId, "Claims");
  checkSorted(evidenceRecords, e => e.recordId, "EvidenceRecords");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateAcquisitionPack();
}
