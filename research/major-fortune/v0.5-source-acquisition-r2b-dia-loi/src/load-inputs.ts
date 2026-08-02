import fs from 'fs';
import path from 'path';
import { CanonicalDiaLoiSourceObligation, DiaLoiFamilyId, SchoolScope, CanonicalDiaLoiDimension } from './types';

export function loadCanonicalObligations(): CanonicalDiaLoiSourceObligation[] {
  const reportPath = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r1-dia-loi/reports/source-obligation-report.json');
  if (!fs.existsSync(reportPath)) {
    throw new Error(`R1 source-obligation-report.json not found at ${reportPath}`);
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const rawObligations = report.obligations;

  if (!Array.isArray(rawObligations)) {
    throw new Error('Invalid R1 report format: obligations array missing');
  }

  const obligations: CanonicalDiaLoiSourceObligation[] = [];
  const validFamilies: Record<string, boolean> = { 'principal-star-dignity': true, 'vcd-opposite-palace-borrowing': true };
  const validSchools: Record<string, boolean> = { 'nam-phai': true, 'trung-chau': true };

  const uniqueGaps = new Set<string>();
  const obligationIds = new Set<string>();
  let principalCount = 0;
  let vcdCount = 0;

  for (const raw of rawObligations) {
    if (!validFamilies[raw.familyId] || !validSchools[raw.schoolScope]) {
      continue;
    }
    
    // Phase 7: Exclude non-R1 dimensions like pillar ownership, stacking, deduplication
    const excludedDimensions = ['pillarOwnership', 'stacking', 'deduplication'];
    if (excludedDimensions.includes(raw.dimension)) {
      continue; 
    }

    if (obligationIds.has(raw.obligationId)) {
      throw new Error(`Duplicate obligation ID found: ${raw.obligationId}`);
    }
    obligationIds.add(raw.obligationId);
    uniqueGaps.add(raw.gapId);

    if (raw.familyId === 'principal-star-dignity') {
      principalCount++;
    } else if (raw.familyId === 'vcd-opposite-palace-borrowing') {
      vcdCount++;
    }

    obligations.push({
      obligationId: raw.obligationId,
      gapId: raw.gapId,
      foundationClaimId: raw.claimId === 'none' ? null : raw.claimId,
      familyId: raw.familyId as DiaLoiFamilyId,
      schoolScope: raw.schoolScope as SchoolScope,
      dimension: raw.dimension as CanonicalDiaLoiDimension,
      required: raw.required === true
    });
  }

  if (obligations.length !== 38) {
    throw new Error(`Required obligation count must be exactly 38, found ${obligations.length}`);
  }
  if (uniqueGaps.size !== 19) {
    throw new Error(`Unique source-gap count must be exactly 19, found ${uniqueGaps.size}`);
  }
  if (principalCount !== 18) {
    throw new Error(`principal-star-dignity count must be exactly 18, found ${principalCount}`);
  }
  if (vcdCount !== 20) {
    throw new Error(`VCD borrowing count must be exactly 20, found ${vcdCount}`);
  }

  // Deterministic order
  obligations.sort((a, b) => a.obligationId.localeCompare(b.obligationId));

  return obligations;
}
