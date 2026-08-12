import fs from 'fs';
import path from 'path';
import type { CanonicalDiaLoiSourceObligation } from './types';

const EXPECTED_OBLIGATION_COUNT = 38;
const EXPECTED_GAP_COUNT = 19;

const VALID_FAMILIES = new Set(['principal-star-dignity', 'vcd-opposite-palace-borrowing']);
const VALID_SCHOOLS = new Set(['nam-phai', 'trung-chau']);

/**
 * Load canonical obligations from the R1 source-obligation-report.json
 * produced by the evidence-gap-foundation pipeline.
 * The R1 report is a nested object: { schemaVersion, packId, obligations: [...] }
 * This is the authoritative obligation source — R3 must not duplicate it.
 */
export function loadCanonicalObligations(baseDir: string): CanonicalDiaLoiSourceObligation[] {
  // Try to resolve from the project root (for when called from arbitrary dirs)
  // R1 report is always at a fixed path relative to the workspace root
  const cwdBased = path.resolve(
    process.cwd(),
    'research/major-fortune/v0.5-source-acquisition-r1-dia-loi/reports/source-obligation-report.json'
  );
  const baseDirBased = path.resolve(
    baseDir,
    '../v0.5-source-acquisition-r1-dia-loi/reports/source-obligation-report.json'
  );

  const r1ReportPath = fs.existsSync(cwdBased) ? cwdBased : baseDirBased;

  if (!fs.existsSync(r1ReportPath)) {
    throw new Error(
      `R1 source-obligation-report.json not found at ${r1ReportPath}. ` +
        'Run npm run research:major-fortune-v05-gap:all first.'
    );
  }

  const reportData = JSON.parse(fs.readFileSync(r1ReportPath, 'utf8')) as
    | CanonicalDiaLoiSourceObligation[]
    | { obligations: CanonicalDiaLoiSourceObligation[] };

  // R1 report is a nested object: { schemaVersion, packId, obligations: [...] }
  // But also handle flat array format for test fixtures
  const raw: CanonicalDiaLoiSourceObligation[] = Array.isArray(reportData)
    ? reportData
    : (reportData as { obligations: CanonicalDiaLoiSourceObligation[] }).obligations;

  if (!Array.isArray(raw)) {
    throw new Error('source-obligation-report.json must be a JSON array or have obligations array');
  }

  // Filter to only valid families and schools, and normalize foundationClaimId field
  const filtered = raw
    .filter(o => VALID_FAMILIES.has(o.familyId) && VALID_SCHOOLS.has(o.schoolScope))
    .map(o => ({
      obligationId: o.obligationId,
      gapId: o.gapId,
      // R1 uses 'claimId' field; R3 uses 'foundationClaimId'
      // R3.1: VCD does not have a canonical foundation claim, so we map to R3 research claims
      foundationClaimId: (() => {
        const rawClaimId = (o as any).foundationClaimId ?? ((o as any).claimId !== 'none' ? (o as any).claimId : null);
        if (rawClaimId) return rawClaimId;

        // Map VCD to specific research claims based on dimension
        if (o.familyId === 'vcd-opposite-palace-borrowing') {
          if (o.dimension === 'existence') return 'R3-CLM-VCD-EXISTENCE';
          if (o.dimension === 'majorFortuneTemporalScope') return 'R3-CLM-VCD-MAJOR-FORTUNE-SCOPE';
          if (o.dimension === 'crossSourceAgreement') return 'R3-CLM-VCD-INDEPENDENCE';
          if (o.dimension === 'targetFrame') return 'R3-CLM-VCD-TARGET-FRAME';
          if (o.dimension === 'strength') return 'R3-CLM-VCD-STRENGTH';
          if (o.dimension === 'exceptionPolicy') return 'R3-CLM-VCD-EXCEPTION-POLICY';
        }
        return null;
      })(),
      familyId: o.familyId,
      schoolScope: o.schoolScope,
      dimension: o.dimension,
      required: o.required ?? true,
    }));

  if (filtered.length !== EXPECTED_OBLIGATION_COUNT) {
    throw new Error(
      `Expected exactly ${EXPECTED_OBLIGATION_COUNT} canonical obligations, found ${filtered.length}`
    );
  }

  const gapIds = new Set(filtered.map(o => o.gapId));
  if (gapIds.size !== EXPECTED_GAP_COUNT) {
    throw new Error(
      `Expected exactly ${EXPECTED_GAP_COUNT} distinct gap IDs, found ${gapIds.size}`
    );
  }

  return filtered;
}


/** Load a JSON file if it exists, return defaultVal otherwise */
export function loadIfExists<T>(filePath: string, defaultVal: T): T {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  }
  return defaultVal;
}
