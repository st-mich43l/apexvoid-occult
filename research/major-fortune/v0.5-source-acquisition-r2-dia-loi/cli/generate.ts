import fs from 'fs';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2-dia-loi');

function writeJson(filePath: string, data: any) {
  const fullPath = path.join(BASE_DIR, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
}

export function generate() {
  // 1. sources/canonical-work-registry.json
  writeJson('sources/canonical-work-registry.json', [
    {
      canonicalWorkId: 'WORK-TVDSTT',
      title: 'Tử Vi Đẩu Số Toàn Thư',
      authorOrCompiler: 'Trần Đoàn (attributed)',
      schoolScope: 'nam-phai'
    },
    {
      canonicalWorkId: 'WORK-TCTVDS',
      title: 'Trung Châu Tử Vi Đẩu Số Tứ Hóa Phái',
      authorOrCompiler: 'Vương Đình Chi',
      schoolScope: 'trung-chau'
    }
  ]);

  // 2. sources/edition-registry.json
  writeJson('sources/edition-registry.json', [
    {
      editionIdentityId: 'ED-TVDSTT-VN-1994',
      canonicalWorkId: 'WORK-TVDSTT',
      translatorOrEditor: 'Vũ Tài Lục (translated)',
      publisher: null,
      publicationYear: '1994',
      language: 'vi'
    },
    {
      editionIdentityId: 'ED-TCTVDS-STD',
      canonicalWorkId: 'WORK-TCTVDS',
      translatorOrEditor: null,
      publisher: 'Unknown',
      publicationYear: '1980s',
      language: 'vi'
    }
  ]);

  // 3. sources/copy-registry.json
  writeJson('sources/copy-registry.json', [
    {
      sourceId: 'SRC-NAM-PHAI-001',
      canonicalWorkId: 'WORK-TVDSTT',
      editionIdentityId: 'ED-TVDSTT-VN-1994',
      copyIdentityId: 'COPY-TVDSTT-NP-001',
      title: 'Tử Vi Đẩu Số Toàn Thư',
      authorOrCompiler: 'Trần Đoàn (attributed)',
      translatorOrEditor: 'Vũ Tài Lục (translated)',
      publisher: null,
      publicationYear: '1994',
      language: 'vi',
      acquisitionMethod: 'metadata-only',
      archiveLocator: '',
      artifactSha256: '',
      inspectionStatus: 'not-acquired',
      verificationNotes: ['Metadata only. No physical or digital copy available for R2 inspection.']
    },
    {
      sourceId: 'SRC-TRUNG-CHAU-001',
      canonicalWorkId: 'WORK-TCTVDS',
      editionIdentityId: 'ED-TCTVDS-STD',
      copyIdentityId: 'COPY-TCTVDS-TC-001',
      title: 'Trung Châu Tử Vi Đẩu Số Tứ Hóa Phái',
      authorOrCompiler: 'Vương Đình Chi',
      translatorOrEditor: null,
      publisher: 'Unknown',
      publicationYear: '1980s',
      language: 'vi',
      acquisitionMethod: 'metadata-only',
      archiveLocator: '',
      artifactSha256: '',
      inspectionStatus: 'not-acquired',
      verificationNotes: ['Metadata only. No physical or digital copy available for R2 inspection.']
    }
  ]);

  // 4. sources/locator-registry.json
  writeJson('sources/locator-registry.json', [
    {
      locatorId: 'LOC-NP-001-DIGNITY',
      sourceId: 'SRC-NAM-PHAI-001',
      copyIdentityId: 'COPY-TVDSTT-NP-001',
      volume: '1',
      chapter: '3',
      section: 'Miếu Vượng Đắc Bình Hãm',
      pageStart: 45,
      pageEnd: 47,
      scanId: null,
      pageImageHashes: [],
      verificationStatus: 'unverified',
      verifiedBy: null,
      verificationNotes: ['Unverified due to not-acquired copy.']
    },
    {
      locatorId: 'LOC-NP-001-VCD',
      sourceId: 'SRC-NAM-PHAI-001',
      copyIdentityId: 'COPY-TVDSTT-NP-001',
      volume: '1',
      chapter: '5',
      section: 'Vô Chính Diệu',
      pageStart: 112,
      pageEnd: 113,
      scanId: null,
      pageImageHashes: [],
      verificationStatus: 'unverified',
      verifiedBy: null,
      verificationNotes: ['Unverified due to not-acquired copy.']
    },
    {
      locatorId: 'LOC-TC-001-DIGNITY',
      sourceId: 'SRC-TRUNG-CHAU-001',
      copyIdentityId: 'COPY-TCTVDS-TC-001',
      volume: '1',
      chapter: 'Phụ lục Tinh Tính',
      section: 'Miếu Vượng',
      pageStart: 30,
      pageEnd: 31,
      scanId: null,
      pageImageHashes: [],
      verificationStatus: 'unverified',
      verifiedBy: null,
      verificationNotes: ['Unverified due to not-acquired copy.']
    },
    {
      locatorId: 'LOC-TC-001-VCD',
      sourceId: 'SRC-TRUNG-CHAU-001',
      copyIdentityId: 'COPY-TCTVDS-TC-001',
      volume: '2',
      chapter: 'Luận Cung Vô Chính Diệu',
      section: null,
      pageStart: 85,
      pageEnd: 86,
      scanId: null,
      pageImageHashes: [],
      verificationStatus: 'unverified',
      verifiedBy: null,
      verificationNotes: ['Unverified due to not-acquired copy.']
    }
  ]);

  // 5. sources/source-alias-registry.json
  writeJson('sources/source-alias-registry.json', {
    'vo-chinh-dieu-opposite-palace': 'vcd-opposite-palace-borrowing'
  });

  // claims/claim-registry.json (Pack-local claims)
  writeJson('claims/claim-registry.json', [
    {
      packClaimId: 'CLM-NP-001',
      description: 'Nam Phai principal star dignity applies to Major Fortune'
    },
    {
      packClaimId: 'CLM-NP-002',
      description: 'Nam Phai VCD borrows opposite palace for Major Fortune'
    },
    {
      packClaimId: 'CLM-TC-001',
      description: 'Trung Chau principal star dignity applies to Major Fortune'
    },
    {
      packClaimId: 'CLM-TC-002',
      description: 'Trung Chau VCD borrows opposite palace for Major Fortune'
    }
  ]);

  // bindings/foundation-claim-bindings.json
  writeJson('bindings/foundation-claim-bindings.json', [
    {
      foundationClaimId: 'CLM-MF-V03-ADAPTER-DIGNITY-NAM-PHAI',
      packClaimId: 'CLM-NP-001',
      familyId: 'principal-star-dignity',
      schoolScope: 'nam-phai',
      bindingStatus: 'verified',
      reasonCodes: []
    },
    {
      foundationClaimId: 'CLM-MF-V03-ADAPTER-VCD-NAM-PHAI',
      packClaimId: 'CLM-NP-002',
      familyId: 'vcd-opposite-palace-borrowing',
      schoolScope: 'nam-phai',
      bindingStatus: 'verified',
      reasonCodes: []
    },
    {
      foundationClaimId: 'CLM-MF-V03-ADAPTER-DIGNITY-TRUNG-CHAU',
      packClaimId: 'CLM-TC-001',
      familyId: 'principal-star-dignity',
      schoolScope: 'trung-chau',
      bindingStatus: 'verified',
      reasonCodes: []
    },
    {
      foundationClaimId: 'CLM-MF-V03-ADAPTER-VCD-TRUNG-CHAU',
      packClaimId: 'CLM-TC-002',
      familyId: 'vcd-opposite-palace-borrowing',
      schoolScope: 'trung-chau',
      bindingStatus: 'verified',
      reasonCodes: []
    }
  ]);

  // extractions/extraction-registry.json
  writeJson('extractions/extraction-registry.json', [
    {
      extractionId: 'EXT-NP-001',
      claimId: 'CLM-NP-001',
      familyId: 'principal-star-dignity',
      schoolScope: 'nam-phai',
      sourceId: 'SRC-NAM-PHAI-001',
      canonicalWorkId: 'WORK-TVDSTT',
      editionIdentityId: 'ED-TVDSTT-VN-1994',
      copyIdentityId: 'COPY-TVDSTT-NP-001',
      locatorId: 'LOC-NP-001-DIGNITY',
      proposition: 'The dignity (Miếu Vượng Đắc Bình Hãm) of principal stars applies to the active Major Fortune palace.',
      temporalScope: 'major-fortune',
      palaceFrame: 'active-major-fortune-palace',
      targetFrame: 'active-major-fortune-palace',
      polarity: 'support',
      strength: 'unspecified',
      exceptionPolicy: [],
      structuredValues: {},
      evidenceMaturity: 'catalogued-hypothesis',
      verificationNotes: ['Not verified, source not acquired.']
    },
    {
      extractionId: 'EXT-NP-002',
      claimId: 'CLM-NP-002',
      familyId: 'vcd-opposite-palace-borrowing',
      schoolScope: 'nam-phai',
      sourceId: 'SRC-NAM-PHAI-001',
      canonicalWorkId: 'WORK-TVDSTT',
      editionIdentityId: 'ED-TVDSTT-VN-1994',
      copyIdentityId: 'COPY-TVDSTT-NP-001',
      locatorId: 'LOC-NP-001-VCD',
      proposition: 'When a Major Fortune palace is Vô Chính Diệu (lacking principal stars), it borrows the stars from the opposite palace.',
      temporalScope: 'major-fortune',
      palaceFrame: 'active-major-fortune-palace',
      targetFrame: 'opposite-palace',
      polarity: 'support',
      strength: 'unspecified',
      exceptionPolicy: [],
      structuredValues: {},
      evidenceMaturity: 'catalogued-hypothesis',
      verificationNotes: ['Not verified, source not acquired.']
    },
    {
      extractionId: 'EXT-TC-001',
      claimId: 'CLM-TC-001',
      familyId: 'principal-star-dignity',
      schoolScope: 'trung-chau',
      sourceId: 'SRC-TRUNG-CHAU-001',
      canonicalWorkId: 'WORK-TCTVDS',
      editionIdentityId: 'ED-TCTVDS-STD',
      copyIdentityId: 'COPY-TCTVDS-TC-001',
      locatorId: 'LOC-TC-001-DIGNITY',
      proposition: 'The dignity (Miếu Vượng) of principal stars applies to the active Major Fortune palace.',
      temporalScope: 'major-fortune',
      palaceFrame: 'active-major-fortune-palace',
      targetFrame: 'active-major-fortune-palace',
      polarity: 'support',
      strength: 'unspecified',
      exceptionPolicy: [],
      structuredValues: {},
      evidenceMaturity: 'catalogued-hypothesis',
      verificationNotes: ['Not verified, source not acquired.']
    },
    {
      extractionId: 'EXT-TC-002',
      claimId: 'CLM-TC-002',
      familyId: 'vcd-opposite-palace-borrowing',
      schoolScope: 'trung-chau',
      sourceId: 'SRC-TRUNG-CHAU-001',
      canonicalWorkId: 'WORK-TCTVDS',
      editionIdentityId: 'ED-TCTVDS-STD',
      copyIdentityId: 'COPY-TCTVDS-TC-001',
      locatorId: 'LOC-TC-001-VCD',
      proposition: 'When a Major Fortune palace is Vô Chính Diệu, it borrows the stars from the opposite palace.',
      temporalScope: 'major-fortune',
      palaceFrame: 'active-major-fortune-palace',
      targetFrame: 'opposite-palace',
      polarity: 'support',
      strength: 'unspecified',
      exceptionPolicy: [],
      structuredValues: {},
      evidenceMaturity: 'catalogued-hypothesis',
      verificationNotes: ['Not verified, source not acquired.']
    }
  ]);

  console.log('Successfully generated R2 Dia Loi JSON registries.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generate();
}
