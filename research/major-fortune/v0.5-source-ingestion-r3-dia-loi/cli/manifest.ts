#!/usr/bin/env tsx
/**
 * R3 Manifest CLI
 * Computes SHA-256 checksums and byte lengths for all tracked R3 artifacts.
 */
import fs from 'fs';
import path from 'path';
import { sha256File } from '../src/canonical-json';
import { writePack } from '../src/write-pack';

const BASE_DIR = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-ingestion-r3-dia-loi');

const TRACKED_FILES = [
  'discovery/discovery-source-registry.json',
  'lineage/source-lineage-registry.json',
  'registries/verified-source-copy-registry.json',
  'registries/verified-locator-registry.json',
  'obligations/obligation-evaluation-registry.json',
  'adjudication/claim-adjudication-registry.json',
  'authorization/dia-loi-admission-authorization.json',
  'bindings/foundation-claim-binding-manifest.json',
  'bindings/canonical-obligation-claim-map.json',
  'reports/acquisition-summary.json',
  'reports/source-independence-report.json',
  'reports/source-obligation-report.json',
  'reports/source-gap-reconciliation.json',
  'reports/claim-adjudication-report.json',
  'reports/dia-loi-admission-authorization.json',
  'reports/decision.json',
  'reports/decision-check.json',
  'reports/determinism-report.json',
  'reports/pack-validation.json',
];

const entries = TRACKED_FILES
  .filter(relPath => fs.existsSync(path.join(BASE_DIR, relPath)))
  .map(relPath => {
    const fullPath = path.join(BASE_DIR, relPath);
    const stat = fs.statSync(fullPath);
    return {
      relativePath: relPath,
      sha256: sha256File(fullPath),
      byteLength: stat.size,
    };
  });

writePack(path.join(BASE_DIR, 'reports/artifact-manifest.json'), entries);
console.log(`Manifest generated: ${entries.length} entries.`);
