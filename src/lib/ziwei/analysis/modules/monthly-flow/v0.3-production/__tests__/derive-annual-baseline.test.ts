import { describe, it, expect } from "vitest";
import { deriveAnnualBaseline } from "../derive-annual-baseline";
import type { AnnualAxesResult } from "../../../annual-axes/types";

describe("deriveAnnualBaseline", () => {
  it("returns null when no result is provided", () => {
    expect(deriveAnnualBaseline(null)).toBeNull();
    expect(deriveAnnualBaseline(undefined)).toBeNull();
  });

  it("returns null when status is unavailable", () => {
    expect(
      deriveAnnualBaseline({
        status: "unavailable",
      } as AnnualAxesResult)
    ).toBeNull();
  });

  it("extracts scores and returns lower-median with valid scores", () => {
    const mockAnnualAxesResult = {
      status: "available",
      versions: {
        contractVersion: "1.0",
        engineVersion: "1.0",
        knowledgeVersion: "1.0"
      },
      axes: {
        axis1: { status: "available", score: 40 },
        axis2: { status: "available", score: 60 },
        axis3: { status: "available", score: 50 },
        axis4: { status: "available", score: 70 },
      }
    } as unknown as AnnualAxesResult;
    
    // Scores: 40, 50, 60, 70
    // median index: floor((4 - 1) / 2) = floor(1.5) = 1
    // validScores[1] = 50
    expect(deriveAnnualBaseline(mockAnnualAxesResult)).toEqual({
      score: 50,
      sourceModule: "annual-axes",
      sourceContractVersion: "1.0",
      sourceEngineVersion: "1.0",
      sourceKnowledgeVersion: "1.0",
      aggregationMethod: "lower-median-v1",
      sourceScoreCount: 4,
      sourceScores: [40, 50, 60, 70]
    });
  });

  it("ignores unavailable or null scores", () => {
    const mockAnnualAxesResult = {
      status: "partial",
      versions: {
        contractVersion: "1.0",
        engineVersion: "1.0",
        knowledgeVersion: "1.0"
      },
      axes: {
        axis1: { status: "available", score: 40 },
        axis2: { status: "unavailable", score: null },
        axis3: { status: "available", score: 50 },
        axis4: { status: "partial-data", score: 70 },
        axis5: { status: "available", score: 60 },
        axis6: { status: "unavailable", score: 80 } // status takes precedence
      }
    } as unknown as AnnualAxesResult;
    
    // Valid: 40, 50, 60, 70
    // Median is 50
    const res = deriveAnnualBaseline(mockAnnualAxesResult);
    expect(res?.score).toBe(50);
  });

  it("returns null if less than 4 valid scores", () => {
    const mockAnnualAxesResult = {
      status: "partial",
      versions: {},
      axes: {
        axis1: { status: "available", score: 40 },
        axis2: { status: "available", score: 60 },
        axis3: { status: "available", score: 50 },
      }
    } as unknown as AnnualAxesResult;
    
    expect(deriveAnnualBaseline(mockAnnualAxesResult)).toBeNull();
  });
});
