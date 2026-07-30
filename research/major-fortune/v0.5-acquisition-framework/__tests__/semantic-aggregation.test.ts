import { describe, expect, it } from 'vitest';
import {
  evaluateMaturity,
  evaluatePathDimension,
  aggregateDimension,
  detectCrossSchoolFallback,
  evaluateEvidenceObligation
} from '../generate-pack.js';
import {
  AcquisitionClaim,
  MajorFortuneResearchSource,
  SourceExtractionRecord,
  EvidencePath,
  EvidencePathAssessment,
  SourceLocator
} from '../schema/pack.js';

function makeLocator(overrides?: Partial<SourceLocator>): SourceLocator {
  return {
    locatorId: "loc1",
    volume: null,
    chapter: null,
    section: null,
    pageStart: null,
    pageEnd: null,
    copyId: null,
    scanId: null,
    pageImageHash: null,
    extractionId: "e1",
    locatorVerification: "verified-against-copy",
    ...overrides
  };
}

function makeSource(overrides?: Partial<MajorFortuneResearchSource>): MajorFortuneResearchSource {
  return {
    sourceId: "s1",
    title: "Default Title",
    authorOrCompiler: "Default Author",
    edition: "Default Edition",
    publisher: "Default Publisher",
    publicationYear: "2000",
    language: "vi",
    authorityClass: "secondary",
    schoolScope: "nam-phai",
    acquisitionStatus: "acquired",
    verificationStatus: "verified-copy",
    copyIdentity: { title: "C", format: "digital", expectedPages: 0, visualQuality: "good", complete: true },
    locators: [makeLocator()],
    supportedFamilyIds: ["f1"],
    notes: "",
    ...overrides
  };
}

function makeExtraction(overrides?: Partial<SourceExtractionRecord>): SourceExtractionRecord {
  return {
    extractionId: "e1",
    sourceId: "s1",
    locatorId: "loc1",
    extractedText: "Text",
    translationOrSummary: "Summary",
    statementForm: "rule",
    evidenceExplicitness: "verified-explicit",
    sourceTemporalScope: "major-fortune",
    sourcePalaceFrame: "single",
    sourceTargetFrame: "native",
    sourcePolarity: "positive",
    sourceStrength: "major",
    sourcePillarOwnership: "none",
    sourceStacking: "independent",
    sourceDeduplication: "standard",
    sourceExceptionPolicy: "none",
    proposedApplicationScope: {
      temporalScope: "major-fortune",
      palaceFrame: "single",
      targetFrame: "native",
      applicationKind: "direct"
    },
    ...overrides
  };
}

function makeClaim(overrides?: Partial<AcquisitionClaim>): AcquisitionClaim {
  return {
    claimId: "c1",
    familyId: "f1",
    schoolScope: "nam-phai",
    acquisitionStatus: "ready-for-adjudication",
    requestedTemporalScope: "major-fortune",
    requestedPalaceFrame: "single",
    requestedTargetFrame: "native",
    requestedPolarity: "positive",
    requestedStrength: "major",
    requestedPillarOwnership: "none",
    requestedStacking: "independent",
    requestedDeduplication: "standard",
    requestedExceptionPolicy: "none",
    matchedExtractionIds: ["e1"],
    ...overrides
  };
}

function makePath(overrides?: Partial<EvidencePath>): EvidencePath {
  return {
    claimId: "c1",
    extractionId: "e1",
    sourceId: "s1",
    locatorId: "loc1",
    familyId: "f1",
    schoolScope: "nam-phai",
    sourceVerificationStatus: "verified-copy",
    locatorVerification: "verified-against-copy",
    evidenceExplicitness: "verified-explicit",
    applicationKind: "direct",
    statementForm: "rule",
    ...overrides
  };
}

function makeAssessment(overrides?: Partial<EvidencePathAssessment>): EvidencePathAssessment {
  return {
    requestedValue: "major-fortune",
    sourceValue: "major-fortune",
    proposedValue: "major-fortune",
    applicationKind: "direct",
    evidenceExplicitness: "verified-explicit",
    maturity: "verified-extraction",
    outcome: "verified",
    reasons: [],
    ...overrides
  };
}

describe('Major Fortune V0.5 Semantic Aggregation', () => {
  describe('evaluateMaturity', () => {
    it('treats metadata-only as catalogued-hypothesis', () => {
      const s = makeSource({ verificationStatus: "metadata-only" });
      const e = makeExtraction({ evidenceExplicitness: "verified-explicit", statementForm: "rule" });
      const l = makeLocator({ locatorVerification: "metadata-only" });
      expect(evaluateMaturity(s, e, l)).toBe("catalogued-hypothesis");
    });

    it('fails if verified inference is treated as verified extraction', () => {
      const s = makeSource({ verificationStatus: "verified-copy" });
      const e = makeExtraction({ evidenceExplicitness: "verified-inferred", statementForm: "rule" });
      const l = makeLocator({ locatorVerification: "verified-against-copy" });
      expect(evaluateMaturity(s, e, l)).toBe("verified-inferred");
    });

    it('preserves analogy state', () => {
      const s = makeSource({ verificationStatus: "verified-copy" });
      const e = makeExtraction({ evidenceExplicitness: "analogy", statementForm: "rule" });
      const l = makeLocator({ locatorVerification: "verified-against-copy" });
      expect(evaluateMaturity(s, e, l)).toBe("verified-analogy");
    });

    it('reports inspected-extraction for unverified locators', () => {
      const s = makeSource({ verificationStatus: "verified-copy" });
      const e = makeExtraction({ evidenceExplicitness: "verified-explicit", statementForm: "rule" });
      const l = makeLocator({ locatorVerification: "reported-unverified" });
      expect(evaluateMaturity(s, e, l)).toBe("inspected-extraction");
    });
  });

  describe('evaluatePathDimension', () => {
    it('handles direct verified extraction correctly', () => {
      const path = makePath({ applicationKind: "direct", evidenceExplicitness: "verified-explicit" });
      const claim = makeClaim({ requestedTemporalScope: "major-fortune" });
      const ext = makeExtraction({ sourceTemporalScope: "major-fortune", evidenceExplicitness: "verified-explicit", proposedApplicationScope: { temporalScope: "major-fortune", applicationKind: "direct" } });
      const src = makeSource({ verificationStatus: "verified-copy", locators: [makeLocator({ locatorVerification: "verified-against-copy" })] });

      const res = evaluatePathDimension("majorFortuneTemporalScope", path, [claim], [ext], [src]);
      expect(res?.outcome).toBe("verified");
      expect(res?.maturity).toBe("verified-extraction");
    });

    it('does not verify inspected extractions without explicit verified evidence', () => {
      const path = makePath({ applicationKind: "direct", evidenceExplicitness: "verified-explicit" });
      const claim = makeClaim({ requestedTemporalScope: "major-fortune" });
      const ext = makeExtraction({ sourceTemporalScope: "major-fortune", proposedApplicationScope: { temporalScope: "major-fortune", applicationKind: "direct" } });
      const src = makeSource({ verificationStatus: "verified-copy", locators: [makeLocator({ locatorVerification: "reported-unverified" })] });

      const res = evaluatePathDimension("majorFortuneTemporalScope", path, [claim], [ext], [src]);
      expect(res?.outcome).toBe("partial");
      expect(res?.maturity).toBe("inspected-extraction");
    });

    it('correctly reports metadata-only locator quality as catalogued', () => {
      const path = makePath({ applicationKind: "direct", evidenceExplicitness: "verified-explicit" });
      const claim = makeClaim({ requestedTemporalScope: "major-fortune" });
      const ext = makeExtraction({ sourceTemporalScope: "major-fortune", proposedApplicationScope: { temporalScope: "major-fortune", applicationKind: "direct" } });
      const src = makeSource({ verificationStatus: "metadata-only", locators: [makeLocator({ locatorVerification: "metadata-only" })] });

      const res = evaluatePathDimension("sourceLocatorQuality", path, [claim], [ext], [src]);
      expect(res?.outcome).toBe("catalogued");
    });
  });

  describe('aggregateDimension', () => {
    it('properly resolves conflicts', () => {
      const path1 = makePath({ claimId: "c1" });
      const path2 = makePath({ claimId: "c2" });

      const ass1 = makeAssessment({ outcome: "verified" });
      const ass2 = makeAssessment({ outcome: "conflicted" });

      const src1 = makeSource({ sourceId: "s1" });
      const src2 = makeSource({ sourceId: "s2" });

      const agg = aggregateDimension("someDim", [path1, path2], [ass1, ass2], [src1, src2], []);

      expect(agg.outcome).toBe("conflicted");
      expect(agg.aggregateExplicitness).toBe("conflicted");
      expect(agg.blockingEvidenceState).toBe("conflicted");
    });

    it('aggregates mixed explicitness correctly', () => {
      const path1 = makePath({ applicationKind: "direct", evidenceExplicitness: "verified-explicit" });
      const path2 = makePath({ applicationKind: "inferred", evidenceExplicitness: "verified-inferred" });

      const ass1 = makeAssessment({ outcome: "verified", maturity: "verified-extraction" });
      const ass2 = makeAssessment({ outcome: "partial", maturity: "verified-inferred" });

      const src1 = makeSource({ sourceId: "s1" });
      const src2 = makeSource({ sourceId: "s2" });

      const agg = aggregateDimension("someDim", [path1, path2], [ass1, ass2], [src1, src2], []);

      expect(agg.outcome).toBe("verified");
      expect(agg.aggregateExplicitness).toBe("mixed");
    });
    it('handles canonical source crossSourceAgreement', () => {
      const path1 = makePath({ claimId: "c1", applicationKind: "direct", evidenceExplicitness: "verified-explicit" });
      const path2 = makePath({ claimId: "c2", applicationKind: "direct", evidenceExplicitness: "verified-explicit" });
      const path3 = makePath({ claimId: "c3", applicationKind: "direct", evidenceExplicitness: "verified-explicit" });

      const ass1 = makeAssessment({ outcome: "verified", maturity: "verified-extraction" });
      const ass2 = makeAssessment({ outcome: "verified", maturity: "verified-extraction" });
      const ass3 = makeAssessment({ outcome: "verified", maturity: "verified-extraction" });

      const src1 = makeSource({ sourceId: "s1", title: "Book", authorOrCompiler: "Author" });
      const src2 = makeSource({ sourceId: "s2", title: " BOOK ", authorOrCompiler: "author" });

      const aggSame = aggregateDimension("crossSourceAgreement", [path1, path2], [ass1, ass2], [src1, src2], []);
      expect(aggSame.outcome).toBe("partial");

      // We should really test evaluateEvidenceObligation here
    });
  });

  describe('evaluateEvidenceObligation', () => {
    it('verifies explicit obligation when minimum independent sources met', () => {
      const policy: any = {
        obligationId: "ob1", gapId: "g1", familyId: "f1", schoolScope: "nam-phai", dimension: "crossSourceAgreement", required: true, requiredClaimIds: ["c1"],
        closurePolicy: { minimumEvidenceState: "verified-explicit", minimumIndependentVerifiedSources: 2 }
      };
      const claim = makeClaim({ claimId: "c1" });
      const path1 = makePath({ claimId: "c1", sourceId: "s1" });
      const path2 = makePath({ claimId: "c1", sourceId: "s2" });
      const ass1 = makeAssessment({ outcome: "verified", evidenceExplicitness: "verified-explicit", maturity: "verified-extraction" });
      const ass2 = makeAssessment({ outcome: "verified", evidenceExplicitness: "verified-explicit", maturity: "verified-extraction" });
      const src1 = makeSource({ sourceId: "s1", title: "Source 1" });
      const src2 = makeSource({ sourceId: "s2", title: "Source 2" });

      const ob = evaluateEvidenceObligation({
        policy, claim, paths: [path1, path2], pathAssessments: [ass1, ass2], sources: [src1, src2], extractions: []
      });
      expect(ob.state).toBe("verified");
    });

    it('returns partial if sources are not independent', () => {
      const policy: any = {
        obligationId: "ob1", gapId: "g1", familyId: "f1", schoolScope: "nam-phai", dimension: "crossSourceAgreement", required: true, requiredClaimIds: ["c1"],
        closurePolicy: { minimumEvidenceState: "verified-explicit", minimumIndependentVerifiedSources: 2 }
      };
      const claim = makeClaim({ claimId: "c1" });
      const path1 = makePath({ claimId: "c1", sourceId: "s1" });
      const path2 = makePath({ claimId: "c1", sourceId: "s2" });
      const ass1 = makeAssessment({ outcome: "verified", evidenceExplicitness: "verified-explicit", maturity: "verified-extraction" });
      const ass2 = makeAssessment({ outcome: "verified", evidenceExplicitness: "verified-explicit", maturity: "verified-extraction" });
      const src1 = makeSource({ sourceId: "s1", title: "Source 1" });
      const src2 = makeSource({ sourceId: "s2", title: "SOURCE 1" }); // same normalized

      const ob = evaluateEvidenceObligation({
        policy, claim, paths: [path1, path2], pathAssessments: [ass1, ass2], sources: [src1, src2], extractions: []
      });
      expect(ob.state).toBe("partial");
    });
  });
});

