import fs from 'fs';
import path from 'path';

export interface Gap {
  gapId: string;
  familyId: string;
  sourceAcquisitionState: string;
}

export function loadAllR1Gaps(): Gap[] {
  const qPath = path.resolve(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation/queue/source-acquisition-queue.json');
  return JSON.parse(fs.readFileSync(qPath, 'utf8'));
}

export function getDiaLoiGaps(): Gap[] {
  const all = loadAllR1Gaps();
  const diaLoiFamilies = ['principal-star-dignity', 'vcd-opposite-palace-borrowing'];
  const gaps = all.filter(g => diaLoiFamilies.includes(g.familyId));
  
  // Filter out any that might be explicitly disabled if there's a convention for it, 
  // but looking at the user instructions, there are 19 unique source gaps.
  // We'll return them directly.
  return gaps;
}

export function getExpectedObligations() {
  const gaps = getDiaLoiGaps();
  const obligations: { gapId: string, familyId: string, schoolScope: 'nam-phai' | 'trung-chau' }[] = [];
  for (const gap of gaps) {
    obligations.push({ gapId: gap.gapId, familyId: gap.familyId, schoolScope: 'nam-phai' });
    obligations.push({ gapId: gap.gapId, familyId: gap.familyId, schoolScope: 'trung-chau' });
  }
  return obligations;
}
