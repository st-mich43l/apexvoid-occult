import { describe, expect, it } from 'vitest';
import {
  evaluateMaturity,
  evaluatePathDimension,
  aggregateDimension,
  buildEvidencePaths,
  detectCrossSchoolFallback
} from '../generate-pack.js';
import {
  AcquisitionClaim,
  MajorFortuneResearchSource,
  SourceExtractionRecord,
  EvidencePath,
  EvidencePathAssessment
} from '../schema/pack.js';

describe('Major Fortune V0.5 Semantic Aggregation', () => {
  describe('evaluateMaturity', () => {
    it('treats metadata-only as located-unverified', () => {
      const s = { verificationStatus: "metadata-only" } as any;
      const e = { evidenceExplicitness: "verified-explicit", statementForm: "rule" } as any;
      const l = { locatorVerification: "metadata-only" } as any;
      expect(evaluateMaturity(s, e, l)).toBe("located-unverified");
    });

    it('fails if verified inference is treated as verified extraction', () => {
      const s = { verificationStatus: "verified-copy" } as any;
      const e = { evidenceExplicitness: "verified-inferred", statementForm: "rule" } as any;
      const l = { locatorVerification: "verified-against-copy" } as any;
      expect(evaluateMaturity(s, e, l)).toBe("verified-inferred");
    });

    it('preserves analogy state', () => {
      const s = { verificationStatus: "verified-copy" } as any;
      const e = { evidenceExplicitness: "analogy", statementForm: "rule" } as any;
      const l = { locatorVerification: "verified-against-copy" } as any;
      expect(evaluateMaturity(s, e, l)).toBe("verified-analogy");
    });

    it('reports inspected-extraction for unverified locators', () => {
      const s = { verificationStatus: "verified-copy" } as any;
      const e = { evidenceExplicitness: "verified-explicit", statementForm: "rule" } as any;
      const l = { locatorVerification: "reported-unverified" } as any;
      expect(evaluateMaturity(s, e, l)).toBe("inspected-extraction");
    });
  });

  describe('evaluatePathDimension', () => {
    it('handles direct verified extraction correctly', () => {
      const path = { claimId: "c1", extractionId: "e1", sourceId: "s1", locatorId: "loc1", applicationKind: "direct", evidenceExplicitness: "verified-explicit" } as any;
      const claim = { claimId: "c1", requestedTemporalScope: "major-fortune" } as any;
      const ext = { extractionId: "e1", sourceTemporalScope: "major-fortune", evidenceExplicitness: "verified-explicit", proposedApplicationScope: { temporalScope: "major-fortune", applicationKind: "direct" } } as any;
      const src = { sourceId: "s1", verificationStatus: "verified-copy", locators: [{ locatorId: "loc1", locatorVerification: "verified-against-copy" }] } as any;
      
      const res = evaluatePathDimension("majorFortuneTemporalScope", path, [claim], [ext], [src]);
      expect(res?.outcome).toBe("verified");
      expect(res?.maturity).toBe("verified-extraction");
    });
    
    it('does not verify inspected extractions without explicit verified evidence', () => {
      const path = { claimId: "c1", extractionId: "e1", sourceId: "s1", locatorId: "loc1", applicationKind: "direct", evidenceExplicitness: "verified-explicit" } as any;
      const claim = { claimId: "c1", requestedTemporalScope: "major-fortune" } as any;
      const ext = { extractionId: "e1", sourceTemporalScope: "major-fortune", proposedApplicationScope: { temporalScope: "major-fortune" } } as any;
      const src = { sourceId: "s1", verificationStatus: "verified-copy", locators: [{ locatorId: "loc1", locatorVerification: "reported-unverified" }] } as any;
      
      const res = evaluatePathDimension("majorFortuneTemporalScope", path, [claim], [ext], [src]);
      expect(res?.outcome).toBe("partial");
      expect(res?.maturity).toBe("inspected-extraction");
    });

    it('correctly reports metadata-only locator quality as catalogued', () => {
      const path = { claimId: "c1", extractionId: "e1", sourceId: "s1", locatorId: "loc1", applicationKind: "direct", evidenceExplicitness: "verified-explicit" } as any;
      const claim = { claimId: "c1", requestedTemporalScope: "major-fortune" } as any;
      const ext = { extractionId: "e1", sourceTemporalScope: "major-fortune", proposedApplicationScope: { temporalScope: "major-fortune" } } as any;
      const src = { sourceId: "s1", verificationStatus: "metadata-only", locators: [{ locatorId: "loc1", locatorVerification: "metadata-only" }] } as any;
      
      const res = evaluatePathDimension("sourceLocatorQuality", path, [claim], [ext], [src]);
      expect(res?.outcome).toBe("catalogued");
    });
  });

  describe('aggregateDimension', () => {
    it('properly resolves conflicts', () => {
      const path1 = { applicationKind: "direct", evidenceExplicitness: "verified-explicit", claimId: "c1", extractionId: "e1", sourceId: "s1", locatorId: "loc1" } as any;
      const path2 = { applicationKind: "direct", evidenceExplicitness: "verified-explicit", claimId: "c2", extractionId: "e2", sourceId: "s2", locatorId: "loc2" } as any;
      
      const ass1 = { outcome: "verified", maturity: "verified-extraction", requestedValue: "valueA", sourceValue: "valueA" } as any;
      const ass2 = { outcome: "conflicted", maturity: "verified-extraction", requestedValue: "valueA", sourceValue: "valueB" } as any;

      const src1 = { sourceId: "s1", verificationStatus: "verified-copy" } as any;
      const src2 = { sourceId: "s2", verificationStatus: "verified-copy" } as any;

      const agg = aggregateDimension("someDim", [path1, path2], [ass1, ass2], [src1, src2]);
      
      expect(agg.outcome).toBe("conflicted");
      expect(agg.aggregateExplicitness).toBe("conflicted");
      expect(agg.blockingEvidenceState).toBe("conflicted");
    });

    it('aggregates mixed explicitness correctly', () => {
      const path1 = { applicationKind: "direct", evidenceExplicitness: "verified-explicit", claimId: "c1", extractionId: "e1", sourceId: "s1", locatorId: "loc1" } as any;
      const path2 = { applicationKind: "inferred", evidenceExplicitness: "verified-inferred", claimId: "c2", extractionId: "e2", sourceId: "s2", locatorId: "loc2" } as any;
      
      const ass1 = { outcome: "verified", maturity: "verified-extraction", requestedValue: "valueA", sourceValue: "valueA" } as any;
      const ass2 = { outcome: "partial", maturity: "verified-inferred", requestedValue: "valueA", sourceValue: "valueA" } as any;

      const src1 = { sourceId: "s1", verificationStatus: "verified-copy" } as any;
      const src2 = { sourceId: "s2", verificationStatus: "verified-copy" } as any;

      const agg = aggregateDimension("someDim", [path1, path2], [ass1, ass2], [src1, src2]);
      
      expect(agg.outcome).toBe("verified");
      expect(agg.aggregateExplicitness).toBe("mixed");
    });

    it('handles canonical source crossSourceAgreement', () => {
      const path1 = { applicationKind: "direct", evidenceExplicitness: "verified-explicit", claimId: "c1", extractionId: "e1", sourceId: "s1", locatorId: "loc1" } as any;
      const path2 = { applicationKind: "direct", evidenceExplicitness: "verified-explicit", claimId: "c2", extractionId: "e2", sourceId: "s2", locatorId: "loc2" } as any;
      const path3 = { applicationKind: "direct", evidenceExplicitness: "verified-explicit", claimId: "c3", extractionId: "e3", sourceId: "s3", locatorId: "loc3" } as any;
      
      const ass1 = { outcome: "verified", maturity: "verified-extraction" } as any;
      const ass2 = { outcome: "verified", maturity: "verified-extraction" } as any;
      const ass3 = { outcome: "verified", maturity: "verified-extraction" } as any;

      const src1 = { sourceId: "s1", title: "Book", authorOrCompiler: "Author", edition: "1", publisher: "Pub", publicationYear: "2000", language: "vi", schoolScope: "nam-phai" } as any;
      // Same canonical identity (case/whitespace variations)
      const src2 = { sourceId: "s2", title: " BOOK ", authorOrCompiler: "author", edition: "1", publisher: "pub", publicationYear: "2000", language: "VI", schoolScope: "nam-phai" } as any;

      const aggSame = aggregateDimension("crossSourceAgreement", [path1, path2], [ass1, ass2], [src1, src2]);
      expect(aggSame.outcome).toBe("partial"); // only 1 unique canonical source

      const src3 = { sourceId: "s3", title: "Book", authorOrCompiler: "Other Author", edition: "1", publisher: "Pub", publicationYear: "2000", language: "vi", schoolScope: "nam-phai" } as any;
      const aggDiff = aggregateDimension("crossSourceAgreement", [path1, path3], [ass1, ass3], [src1, src3]);
      expect(aggDiff.outcome).toBe("verified"); // 2 unique canonical sources
    });
  });
});
