import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(ROOT, "research/major-fortune/v0.5-evidence-gap-foundation");
const REGISTRY_PATH = path.join(CANONICAL_BASE, "acquisition-pack-registry.json");

export function validateAcquisitionRegistry(): void {
  const packRegistry: Array<any> = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const gapMatrix = JSON.parse(fs.readFileSync(path.join(CANONICAL_BASE, "matrices/evidence-gap-matrix.json"), "utf8"));
  const validFamilyIds = new Set(gapMatrix.map((f: any) => f.signalFamilyId));

  const packIds = new Set<string>();
  const manifestPaths = new Set<string>();

  const allRecordIds = new Set<string>();
  const allClaimIds = new Set<string>();
  const allExtractionIds = new Set<string>();
  const allLocatorIds = new Set<string>();

  const sourceIdentities = new Map<string, string>(); // sourceId -> identity string (title|author|edition|school)

  for (const pack of packRegistry) {
    if (!pack.enabled) continue;

    if (packIds.has(pack.packId)) throw new Error(`Duplicate packId: ${pack.packId}`);
    packIds.add(pack.packId);

    const absManifest = path.resolve(CANONICAL_BASE, pack.manifestPath);
    if (manifestPaths.has(absManifest)) throw new Error(`Duplicate manifest path: ${absManifest}`);
    manifestPaths.add(absManifest);

    if (!fs.existsSync(absManifest)) throw new Error(`Manifest missing: ${absManifest}`);

    const absLedger = path.resolve(CANONICAL_BASE, pack.evidenceLedgerPath);
    if (!fs.existsSync(absLedger)) throw new Error(`Evidence ledger missing: ${absLedger}`);

    const manifest = JSON.parse(fs.readFileSync(absManifest, "utf8"));
    const ledger = JSON.parse(fs.readFileSync(absLedger, "utf8"));

    if (pack.packId !== manifest.packId) {
      throw new Error(`Registry packId ${pack.packId} does not match manifest packId ${manifest.packId}`);
    }

    for (const fam of manifest.targetFamilyIds) {
      if (!validFamilyIds.has(fam)) {
        throw new Error(`Manifest ${manifest.packId} target family ${fam} is not a valid foundation signal.`);
      }
    }

    const packBase = path.dirname(absManifest);
    const sources = JSON.parse(fs.readFileSync(path.join(packBase, manifest.maintainedInputs.sourceRegistry), "utf8"));
    const claims = JSON.parse(fs.readFileSync(path.join(packBase, manifest.maintainedInputs.claimRegistry), "utf8"));
    const extractions = JSON.parse(fs.readFileSync(path.join(packBase, manifest.maintainedInputs.extractionLedger), "utf8"));

    for (const record of ledger) {
      if (allRecordIds.has(record.recordId)) throw new Error(`Duplicate recordId: ${record.recordId}`);
      allRecordIds.add(record.recordId);
    }

    for (const claim of claims) {
      const namespacedId = `${pack.packId}:${claim.claimId}`;
      if (allClaimIds.has(namespacedId)) throw new Error(`Duplicate claimId: ${namespacedId}`);
      allClaimIds.add(namespacedId);
    }

    for (const extraction of extractions) {
      const namespacedId = `${pack.packId}:${extraction.extractionId}`;
      if (allExtractionIds.has(namespacedId)) throw new Error(`Duplicate extractionId: ${namespacedId}`);
      allExtractionIds.add(namespacedId);
    }

    for (const source of sources) {
      const identity = `${source.title}|${source.authorOrCompiler}|${source.edition}|${source.schoolScope}`;
      if (sourceIdentities.has(source.sourceId)) {
        if (sourceIdentities.get(source.sourceId) !== identity) {
          throw new Error(`Source ${source.sourceId} silently changed canonical identity across packs.`);
        }
      } else {
        sourceIdentities.set(source.sourceId, identity);
      }
      for (const loc of source.locators) {
        const namespacedLocId = `${pack.packId}:${loc.locatorId}`;
        if (allLocatorIds.has(namespacedLocId)) throw new Error(`Duplicate locatorId: ${namespacedLocId}`);
        allLocatorIds.add(namespacedLocId);
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateAcquisitionRegistry();
}
