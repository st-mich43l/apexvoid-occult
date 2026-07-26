import { describe, it, expect, vi, afterEach } from "vitest";
import {
  setMajorFortuneTelemetrySink,
  withMajorFortuneTelemetrySink,
  emitMajorFortuneScoredTelemetry,
  noopMajorFortuneTelemetrySink,
} from "../emit";
import { buildMajorFortuneScoredTelemetryEvent } from "../build-event";
import type { MajorFortuneOrdinalV03Analysis } from "../../v0.3-ordinal-adapter/types";
import type { MajorFortuneScoredTelemetryEvent, MajorFortuneTelemetrySink } from "../types";
import { MAJOR_FORTUNE_INTEGRATION_VERSION, MAJOR_FORTUNE_ADAPTER_VERSION } from "../types";

describe("Major Fortune Telemetry — V0.4.2", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    // Restore noop sink after each test that may have called setMajorFortuneTelemetrySink.
    setMajorFortuneTelemetrySink(noopMajorFortuneTelemetrySink);
  });

  // ─── Constants ─────────────────────────────────────────────────────────────

  describe("Version constants", () => {
    it("integration version is 0.4.2", () => {
      expect(MAJOR_FORTUNE_INTEGRATION_VERSION).toBe("0.4.2");
    });
    it("adapter version is 0.3.3", () => {
      expect(MAJOR_FORTUNE_ADAPTER_VERSION).toBe("0.3.3");
    });
  });

  // ─── Event Builder ─────────────────────────────────────────────────────────

  describe("Event Builder", () => {
    it("safely builds event from unavailable analysis", () => {
      const mockAnalysis: MajorFortuneOrdinalV03Analysis = {
        model: "v0.3-ordinal",
        experimental: false,
        version: "0.3.3",
        school: "nam-phai",
        adapterStatus: "unavailable",
        cycle: null,
        result: null,
        adapterDiagnostics: { outOfFrameTransformationCount: 0, incompleteTransformations: [] } as any,
        emittedEvidence: [],
        display: {} as any,
      };

      const event = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);
      expect(event.fallbackState).toBe("unavailable-data");
      expect(event.directTransformationActivationCount).toBe(0);
      expect(event.acceptedTransformationEvidenceCount).toBe(0);
      // V0.4.2: integration version correct.
      expect(event.integrationVersion).toBe("0.4.2");
    });

    it("uses contractVersion from result.versions.contractVersion (not knowledgeVersion)", () => {
      const mockAnalysis: MajorFortuneOrdinalV03Analysis = {
        model: "v0.3-ordinal",
        experimental: false,
        version: "0.3.3",
        school: "nam-phai",
        adapterStatus: "ready",
        cycle: { activePalaceIndex: 0 } as any,
        result: {
          status: "available",
          scoreState: "scored",
          score: 50,
          band: "neutral",
          coverage: { contextCoverageWeight: 1, scoringCoverageWeight: 1, scoredPillarIds: [], partialPillarIds: [], missingPillarIds: [], evaluablePillarIds: [], coverageWeight: 1 },
          versions: {
            formulaVersion: "v0.3-ordinal-four-pillar",
            knowledgeVersion: "k-1.2.3",
            contractVersion: "c-9.9.9",  // Deliberately different from knowledgeVersion.
            engineVersion: "e-1.0",
          },
          diagnostics: { acceptedEvidenceCount: 0, rejectedEvidenceCount: 0, duplicatePhysicalFactRejects: 0, duplicateClusterRejects: 0, excludedTemporalRejects: 0, schoolGateRejects: 0, invalidContract: [] },
          pillars: {},
          trace: { baseScore: 50, pillarDeltas: {}, sumDelta: 0, rawScoreBeforeClamp: 50, yearInCycleIgnored: true, forbidsPerRuleRawDelta: true, formulaVersion: "v0.3-ordinal-four-pillar", modelNature: "", numericAuthority: "" },
        } as any,
        adapterDiagnostics: { outOfFrameTransformationCount: 0, incompleteTransformations: [] } as any,
        emittedEvidence: [],
        display: {} as any,
      };

      const event = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);
      // V0.4.2 fix: must use contractVersion, not knowledgeVersion.
      expect(event.contractVersion).toBe("c-9.9.9");
      expect(event.contractVersion).not.toBe("k-1.2.3");
    });

    /**
     * V0.4.2 fix: acceptedTransformationEvidenceCount must count only
     * major-fortune-transformations evidence accepted in tu-hoa-sat-tinh pillar.
     * Not total accepted evidence.
     */
    it("acceptedTransformationEvidenceCount counts only transformation family evidence in tu-hoa-sat-tinh", () => {
      const mockAnalysis: MajorFortuneOrdinalV03Analysis = {
        model: "v0.3-ordinal",
        experimental: false,
        version: "0.3.3",
        school: "nam-phai",
        adapterStatus: "ready",
        cycle: { activePalaceIndex: 2 } as any,
        result: {
          status: "available",
          scoreState: "scored",
          score: 62,
          band: "good",
          coverage: { contextCoverageWeight: 1, scoringCoverageWeight: 1, scoredPillarIds: [], partialPillarIds: [], missingPillarIds: [], evaluablePillarIds: [], coverageWeight: 1 },
          versions: { formulaVersion: "v0.3-ordinal-four-pillar", knowledgeVersion: "0.3.0", contractVersion: "0.3.0", engineVersion: "0.3.3" },
          diagnostics: {
            acceptedEvidenceCount: 4, // 3 non-transformation + 1 transformation
            rejectedEvidenceCount: 1,
            duplicatePhysicalFactRejects: 0, duplicateClusterRejects: 0,
            excludedTemporalRejects: 0, schoolGateRejects: 0, invalidContract: [],
          },
          pillars: {
            "tu-hoa-sat-tinh": {
              acceptedEvidenceIds: ["ev-xf-accepted"], // Only 1 transformation evidence accepted.
              rejectedEvidence: [{ evidenceId: "ev-xf-rejected", reason: "out-of-frame" }],
            },
            "thien-thoi": { acceptedEvidenceIds: ["ev-non-xf-1", "ev-non-xf-2"] },
            "dia-loi": { acceptedEvidenceIds: ["ev-non-xf-3"] },
          },
          trace: { baseScore: 50, pillarDeltas: {}, sumDelta: 0, rawScoreBeforeClamp: 50, yearInCycleIgnored: true, forbidsPerRuleRawDelta: true, formulaVersion: "v0.3-ordinal-four-pillar", modelNature: "", numericAuthority: "" },
        } as any,
        adapterDiagnostics: { outOfFrameTransformationCount: 1, incompleteTransformations: [] } as any,
        emittedEvidence: [
          // 3 non-transformation accepted evidence in other pillars.
          { evidenceId: "ev-non-xf-1", signalFamilyId: "element-relation" } as any,
          { evidenceId: "ev-non-xf-2", signalFamilyId: "brightness-pattern" } as any,
          { evidenceId: "ev-non-xf-3", signalFamilyId: "element-relation" } as any,
          // 1 accepted transformation evidence (in tu-hoa-sat-tinh, direct).
          {
            evidenceId: "ev-xf-accepted",
            signalFamilyId: "major-fortune-transformations",
            transformationTuple: { targetPalaceIndex: 2 }, // = activePalaceIndex → direct
          } as any,
          // 1 rejected transformation evidence — should NOT count.
          {
            evidenceId: "ev-xf-rejected",
            signalFamilyId: "major-fortune-transformations",
            transformationTuple: { targetPalaceIndex: 2 },
          } as any,
          // 1 out-of-frame transformation (not in tu-hoa-sat-tinh accepted list).
          {
            evidenceId: "ev-xf-out",
            signalFamilyId: "major-fortune-transformations",
            transformationTuple: { targetPalaceIndex: 5 },
          } as any,
        ],
        display: {} as any,
      };

      const event = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);

      // Total accepted evidence = 4 (all pillars combined).
      // acceptedTransformationEvidenceCount = 1 (only ev-xf-accepted, accepted in tu-hoa-sat-tinh).
      // directTransformationActivationCount = 1 (same evidence, targetPalaceIndex === activePalaceIndex).
      expect(event.acceptedTransformationEvidenceCount).toBe(1);
      expect(event.directTransformationActivationCount).toBe(1);
      expect(event.outOfFrameTransformationCount).toBe(1);

      // Invariant: direct <= accepted <= total.
      expect(event.directTransformationActivationCount).toBeLessThanOrEqual(event.acceptedTransformationEvidenceCount);
      expect(event.acceptedTransformationEvidenceCount).not.toBeGreaterThan(
        mockAnalysis.result!.diagnostics.acceptedEvidenceCount,
      );
    });

    it("accepted out-of-frame transformation is not a direct activation", () => {
      const mockAnalysis: MajorFortuneOrdinalV03Analysis = {
        model: "v0.3-ordinal",
        experimental: false,
        version: "0.3.3",
        school: "nam-phai",
        adapterStatus: "ready",
        cycle: { activePalaceIndex: 3 } as any,
        result: {
          status: "available",
          scoreState: "scored",
          score: 62,
          band: "good",
          coverage: { contextCoverageWeight: 1, scoringCoverageWeight: 1, scoredPillarIds: [], partialPillarIds: [], missingPillarIds: [], evaluablePillarIds: [], coverageWeight: 1 },
          versions: { formulaVersion: "v0.3-ordinal-four-pillar", knowledgeVersion: "0.3.0", contractVersion: "0.3.0", engineVersion: "0.3.3" },
          diagnostics: { acceptedEvidenceCount: 1, rejectedEvidenceCount: 0, duplicatePhysicalFactRejects: 0, duplicateClusterRejects: 0, excludedTemporalRejects: 0, schoolGateRejects: 0, invalidContract: [] },
          pillars: {
            "tu-hoa-sat-tinh": {
              acceptedEvidenceIds: ["ev-out-frame"], // Accepted but not in-frame.
            },
          },
          trace: { baseScore: 50, pillarDeltas: {}, sumDelta: 0, rawScoreBeforeClamp: 50, yearInCycleIgnored: true, forbidsPerRuleRawDelta: true, formulaVersion: "v0.3-ordinal-four-pillar", modelNature: "", numericAuthority: "" },
        } as any,
        adapterDiagnostics: { outOfFrameTransformationCount: 1, incompleteTransformations: [] } as any,
        emittedEvidence: [
          {
            evidenceId: "ev-out-frame",
            signalFamilyId: "major-fortune-transformations",
            transformationTuple: { targetPalaceIndex: 7 }, // ≠ activePalaceIndex (3) → out-of-frame.
          } as any,
        ],
        display: {} as any,
      };

      const event = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);
      expect(event.acceptedTransformationEvidenceCount).toBe(1); // Accepted in tu-hoa.
      expect(event.directTransformationActivationCount).toBe(0); // Not in-frame.
    });

    it("missing result produces zero transformation counts", () => {
      const mockAnalysis: MajorFortuneOrdinalV03Analysis = {
        model: "v0.3-ordinal",
        experimental: false,
        version: "0.3.3",
        school: "nam-phai",
        adapterStatus: "unavailable",
        cycle: null,
        result: null,
        adapterDiagnostics: { outOfFrameTransformationCount: 0, incompleteTransformations: [] } as any,
        emittedEvidence: [],
        display: {} as any,
      };

      const event = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);
      expect(event.acceptedTransformationEvidenceCount).toBe(0);
      expect(event.directTransformationActivationCount).toBe(0);
    });

    it("Trung Châu event uses correct school field", () => {
      const mockAnalysis: MajorFortuneOrdinalV03Analysis = {
        model: "v0.3-ordinal",
        experimental: false,
        version: "0.3.3",
        school: "trung-chau",
        adapterStatus: "unavailable",
        cycle: null,
        result: null,
        adapterDiagnostics: { outOfFrameTransformationCount: 0, incompleteTransformations: [] } as any,
        emittedEvidence: [],
        display: {} as any,
      };

      const event = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);
      expect(event.school).toBe("trung-chau");
    });

    it("event building is deterministic — same input produces same output", () => {
      const mockAnalysis: MajorFortuneOrdinalV03Analysis = {
        model: "v0.3-ordinal",
        experimental: false,
        version: "0.3.3",
        school: "nam-phai",
        adapterStatus: "unavailable",
        cycle: null,
        result: null,
        adapterDiagnostics: { outOfFrameTransformationCount: 0, incompleteTransformations: [] } as any,
        emittedEvidence: [],
        display: {} as any,
      };

      const event1 = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);
      const event2 = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);
      expect(JSON.stringify(event1)).toBe(JSON.stringify(event2));
    });

    it("event has no private birth information fields", () => {
      const mockAnalysis: MajorFortuneOrdinalV03Analysis = {
        model: "v0.3-ordinal",
        experimental: false,
        version: "0.3.3",
        school: "nam-phai",
        adapterStatus: "unavailable",
        cycle: null,
        result: null,
        adapterDiagnostics: { outOfFrameTransformationCount: 0, incompleteTransformations: [] } as any,
        emittedEvidence: [],
        display: {} as any,
      };

      const event = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);
      const keys = Object.keys(event);
      const privateFields = ["birthYear", "birthDate", "birthTime", "birthPlace", "name", "gender"];
      for (const field of privateFields) {
        expect(keys).not.toContain(field);
      }
    });
  });

  // ─── Sink Lifecycle ─────────────────────────────────────────────────────────

  describe("Sink Lifecycle", () => {
    it("withMajorFortuneTelemetrySink restores previous sink after operation", () => {
      const events1: MajorFortuneScoredTelemetryEvent[] = [];
      const events2: MajorFortuneScoredTelemetryEvent[] = [];

      setMajorFortuneTelemetrySink({ emit: (e) => events1.push(e) });

      withMajorFortuneTelemetrySink(
        { emit: (e) => events2.push(e) },
        () => {
          emitMajorFortuneScoredTelemetry({ event: "major_fortune_scored" } as any);
        },
      );

      // Outer sink should still receive events.
      emitMajorFortuneScoredTelemetry({ event: "major_fortune_scored" } as any);

      expect(events2).toHaveLength(1);
      expect(events1).toHaveLength(1);
    });

    it("withMajorFortuneTelemetrySink restores sink even if operation throws", () => {
      const outerEvents: MajorFortuneScoredTelemetryEvent[] = [];
      setMajorFortuneTelemetrySink({ emit: (e) => outerEvents.push(e) });

      expect(() => {
        withMajorFortuneTelemetrySink({ emit: () => {} }, () => {
          throw new Error("operation failed");
        });
      }).toThrow("operation failed");

      // Outer sink should be restored.
      emitMajorFortuneScoredTelemetry({ event: "major_fortune_scored" } as any);
      expect(outerEvents).toHaveLength(1);
    });

    it("catches exceptions from sink without affecting caller", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("NODE_ENV", "development");

      const throwingSink: MajorFortuneTelemetrySink = {
        emit() { throw new Error("Sink failed"); },
      };
      setMajorFortuneTelemetrySink(throwingSink);

      expect(() => {
        emitMajorFortuneScoredTelemetry({ event: "major_fortune_scored" } as any);
      }).not.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });

    it("default sink is noop (no process dependency in browser)", () => {
      // After restoring noop sink, emission should not throw or call console.
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      setMajorFortuneTelemetrySink(noopMajorFortuneTelemetrySink);

      expect(() => {
        emitMajorFortuneScoredTelemetry({ event: "major_fortune_scored" } as any);
      }).not.toThrow();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
