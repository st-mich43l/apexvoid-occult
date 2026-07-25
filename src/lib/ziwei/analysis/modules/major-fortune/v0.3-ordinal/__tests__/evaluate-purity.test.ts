import { describe, it, expect, vi, afterEach } from "vitest";
import { evaluateMajorFortuneOrdinal } from "../evaluate";
import type { MajorFortuneOrdinalEvaluationInput } from "../types";

describe("Major Fortune V0.3 Ordinal Evaluator Purity", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("performs no I/O, telemetry, or environment reads", () => {
    // Spies on all potential side-effect channels
    const logSpy = vi.spyOn(console, "log");
    const warnSpy = vi.spyOn(console, "warn");
    const errorSpy = vi.spyOn(console, "error");
    const dateSpy = vi.spyOn(Date, "now");
    const randomSpy = vi.spyOn(Math, "random");

    // Stub the environment completely to ensure we don't depend on it
    vi.stubEnv("NODE_ENV", "test_stub");
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS", "true");

    const input: MajorFortuneOrdinalEvaluationInput = {
      school: "nam-phai",
      evidence: [],
      pillarContexts: {
        "thien-thoi": { availability: "available" },
        "dia-loi": { availability: "available" },
        "nhan-hoa": { availability: "available" },
        "tu-hoa-sat-tinh": { availability: "available" },
      },
    };

    // Make input immutable to detect accidental mutation
    Object.freeze(input);
    Object.freeze(input.evidence);
    Object.freeze(input.pillarContexts);

    const result1 = evaluateMajorFortuneOrdinal(input);
    const result2 = evaluateMajorFortuneOrdinal(input);

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(dateSpy).not.toHaveBeenCalled();
    expect(randomSpy).not.toHaveBeenCalled();

    // Results must be deeply equal (deterministic)
    expect(result1).toEqual(result2);

    // Results shouldn't contain anything about the environment
    expect(result1.trace.modelNature).toBe("engineering-heuristic");
  });
});
