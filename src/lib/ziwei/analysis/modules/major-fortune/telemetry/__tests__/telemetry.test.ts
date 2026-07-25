import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { setMajorFortuneTelemetrySink, emitMajorFortuneScoredTelemetry } from "../emit";
import { buildMajorFortuneScoredTelemetryEvent } from "../build-event";
import type { MajorFortuneOrdinalV03Analysis } from "../../v0.3-ordinal-adapter/types";
import type { MajorFortuneScoredTelemetryEvent, MajorFortuneTelemetrySink } from "../types";

describe("Major Fortune Telemetry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("Event Builder", () => {
    it("safely builds event from partial analysis", () => {
      const mockAnalysis: MajorFortuneOrdinalV03Analysis = {
        model: "v0.3-ordinal",
        experimental: false,
        version: "0.3.3",
        school: "nam-phai",
        adapterStatus: "unavailable",
        cycle: null,
        result: null,
        adapterDiagnostics: { outOfFrameTransformationCount: 0 } as any,
        emittedEvidence: [],
        display: {} as any,
      };

      const event = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);
      expect(event.fallbackState).toBe("unavailable-data");
      expect(event.directTransformationActivationCount).toBe(0);
      expect(event.integrationVersion).toBe("0.4.1");
    });
    
    it("calculates direct transformation count correctly", () => {
      const mockAnalysis: MajorFortuneOrdinalV03Analysis = {
        model: "v0.3-ordinal",
        experimental: false,
        version: "0.3.3",
        school: "nam-phai",
        adapterStatus: "ready",
        cycle: { activePalaceIndex: 2 } as any,
        result: {
          status: "scored",
          scoreState: "scored",
          coverage: { contextCoverageWeight: 1, scoringCoverageWeight: 1, scoredPillarIds: ["tu-hoa-sat-tinh"], partialPillarIds: [], missingPillarIds: [] },
          versions: { formulaVersion: "test-ver", knowledgeVersion: "k-ver" },
          diagnostics: { acceptedEvidenceCount: 5 },
          pillars: {
            "tu-hoa-sat-tinh": {
              acceptedEvidenceIds: ["ev-direct-1"],
            }
          }
        } as any,
        adapterDiagnostics: { outOfFrameTransformationCount: 2 } as any,
        emittedEvidence: [
          { evidenceId: "ev-direct-1", signalFamilyId: "major-fortune-transformations", transformationTuple: { targetPalaceIndex: 2 } } as any,
          { evidenceId: "ev-out-1", signalFamilyId: "major-fortune-transformations", transformationTuple: { targetPalaceIndex: 5 } } as any,
          { evidenceId: "ev-other", signalFamilyId: "other-family" } as any,
        ],
        display: {} as any,
      };

      const event = buildMajorFortuneScoredTelemetryEvent(mockAnalysis);
      expect(event.directTransformationActivationCount).toBe(1);
      expect(event.acceptedTransformationEvidenceCount).toBe(5);
      expect(event.outOfFrameTransformationCount).toBe(2);
    });
  });

  describe("Emission Sink", () => {
    it("catches exceptions from sink", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("NODE_ENV", "development");

      const throwingSink: MajorFortuneTelemetrySink = {
        emit() { throw new Error("Sink failed"); }
      };
      setMajorFortuneTelemetrySink(throwingSink);

      expect(() => {
        emitMajorFortuneScoredTelemetry({ event: "major_fortune_scored" } as any);
      }).not.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
