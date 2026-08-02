import fs from 'fs';
import path from 'path';
import { CanonicalDiaLoiSourceObligation, CanonicalObligationClaimMap } from './types';

export function mapObligationClaims(
  baseDir: string,
  obligations: CanonicalDiaLoiSourceObligation[]
): CanonicalDiaLoiSourceObligation[] {
  const mapPath = path.join(baseDir, 'bindings/canonical-obligation-claim-map.json');
  
  let claimMap: CanonicalObligationClaimMap[] = [];
  if (fs.existsSync(mapPath)) {
    claimMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  } else {
    // Generate the baseline if it doesn't exist
    for (const obs of obligations) {
      let foundationClaimId = obs.foundationClaimId;
      let mappingStatus: 'verified' | 'not-applicable' | 'unresolved' = 'unresolved';
      
      if (obs.familyId === 'principal-star-dignity') {
        if (!foundationClaimId && obs.obligationId.includes('CLM-MF-V03-ADAPTER-DIGNITY')) {
          // Attempt to extract from obligation ID if it's there
          foundationClaimId = obs.obligationId.split('-').slice(-4).join('-');
        }
        if (foundationClaimId) {
          mappingStatus = 'verified';
        }
      } else if (obs.familyId === 'vcd-opposite-palace-borrowing') {
        if (!foundationClaimId) {
          mappingStatus = 'not-applicable'; // As adjudicated for VCD
        } else {
          mappingStatus = 'verified';
        }
      }

      claimMap.push({
        obligationId: obs.obligationId,
        foundationClaimId,
        mappingStatus,
        reasonCodes: []
      });
    }

    fs.mkdirSync(path.join(baseDir, 'bindings'), { recursive: true });
    fs.writeFileSync(mapPath, JSON.stringify(claimMap, null, 2) + '\n');
  }

  // Apply mapping to obligations
  const mappedObligations = obligations.map(obs => {
    const mapping = claimMap.find(m => m.obligationId === obs.obligationId);
    if (!mapping) {
      throw new Error(`Missing foundation claim mapping for obligation: ${obs.obligationId}`);
    }
    return {
      ...obs,
      foundationClaimId: mapping.foundationClaimId,
      _mappingStatus: mapping.mappingStatus // We can store it or use it during authorize
    };
  });

  return mappedObligations;
}
