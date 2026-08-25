import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS } from "@/lib/ziwei/analysis/contracts/annual-axes";
import { analyzeAnnualAxesNamPhaiV10 } from "../../analyze";
import { CASE_AA10_M1998_DAN_2026 } from "../../compare";
import type { MajorStarPalaceClaim } from "@/lib/ziwei/analysis/modules/palace-overview/doctrine/types";
import type { PalaceOverviewResult } from "@/lib/ziwei/analysis/modules/palace-overview/types";
import {
  analyzeRomanceSemanticV01,
  buildRomanceCase1998Diagnostic,
  detectTendencyConflicts,
  gateClaimAdmission,
  resolveClaimAgainstPalace,
  resolveClaimConditions,
  buildPalaceFactContext,
  ROMANCE_SEMANTIC_MODEL_ID,
} from "../index";

const ROOT = join(
  process.cwd(),
  "src/lib/ziwei/analysis/modules/annual-axes/v0.10-layered/romance-semantic",
);

function walkTs(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkTs(full, out);
    else if (name.endsWith(".ts")) out.push(full);
  }
  return out;
}

function baseClaim(
  overrides: Partial<MajorStarPalaceClaim> & Pick<MajorStarPalaceClaim, "claimId" | "star" | "palace">,
): MajorStarPalaceClaim {
  return {
    school: "classical-shared",
    conditions: {},
    tendency: { support: "up" },
    magnitudeOrdinal: "moderate",
    sourceIds: ["src-ziwei-quanshu-juan-er"],
    locator: "test",
    locatorType: "EXACT_SECTION",
    adjudication: "VERIFIED_PRIMARY",
    numericDelta: null,
    ...overrides,
  };
}

function mockPalace(input: {
  name: string;
  branch?: string;
  majors?: Array<{ name: string; brightness: string | null }>;
  transformations?: string[];
}): PalaceOverviewResult {
  const majors = input.majors ?? [];
  return {
    module: "palace-overview",
    version: "1.0.0-experimental",
    versions: {
      contractVersion: "test",
      engineVersion: "test",
      knowledgeVersion: "test",
    },
    palaceIndex: 0,
    palaceName: input.name,
    palaceBranch: input.branch ?? "Tý",
    score: 50,
    structureNet: 0,
    band: "balanced",
    axes: { support: 0, pressure: 0, stability: 0, activation: 0 },
    rawAxes: { support: 1, pressure: 1, stability: 0, activation: 0 },
    intensity: 0,
    evidenceCompleteness: 1,
    majorStars: majors.map((m) => ({
      name: m.name,
      brightness: m.brightness as never,
      brightnessStatus: m.brightness ? "resolved" : "unavailable",
      role: "focus" as const,
    })),
    contextOnlyStars: [],
    isVoidMajor: false,
    topSupportDrivers: [],
    topPressureDrivers: [],
    allEvidence: (input.transformations ?? []).map((t, i) => ({
      id: `tf-${i}`,
      category: "transformation" as const,
      factIds: [],
      palaceRole: "focus" as const,
      palaceName: input.name,
      palaceBranch: input.branch ?? "Tý",
      axes: { support: 0, pressure: 0, stability: 0, activation: 0 },
      label: t,
      explanationKey: "t",
      sourceIds: [],
      knowledgeStatus: "experimental" as const,
      transformation: t as never,
    })),
    profileId: "test",
    school: "nam-phai",
    confidence: {
      evidenceCompletenessPercent: 100,
      sourceConfidencePercent: null,
      calibrationConfidence: "unvalidated",
      reasons: [],
    },
    calibration: {
      profileVersion: "t",
      benchmarkVersion: null,
      calibrationVersion: null,
      releaseStage: "experimental",
      scoringInfrastructureVersion: "t",
    },
    annotations: [],
    isMenh: false,
    isThan: false,
    palaceDomainCandidates: [],
  };
}

describe("romance-semantic-v0.1 source integrity", () => {
  it("admits verified primary claims with claimId + sourceIds", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const report = analyzeRomanceSemanticV01({ chart });
    for (const c of report.admittedClaims) {
      expect(c.claimId.length).toBeGreaterThan(0);
      expect(c.sourceIds.length).toBeGreaterThan(0);
      expect(c.adjudication).not.toBe("UNVERIFIED");
    }
    expect(report.numericAuthority).toBe("none");
    expect(report.scoreImpactAllowed).toBe(false);
    expect(report.model).toBe(ROMANCE_SEMANTIC_MODEL_ID);
  });

  it("rejects UNVERIFIED adjudication", () => {
    expect(
      gateClaimAdmission(
        baseClaim({
          claimId: "x-unverified",
          star: "Tử Vi",
          palace: "Mệnh",
          adjudication: "UNVERIFIED",
        }),
      ),
    ).toBe("rejected-source");
  });
});

describe("romance-semantic-v0.1 school isolation", () => {
  it("rejects Trung Châu-only claims for Nam Phái", () => {
    expect(
      gateClaimAdmission(
        baseClaim({
          claimId: "x-tc",
          star: "Tử Vi",
          palace: "Mệnh",
          school: "trung-chau",
        }),
      ),
    ).toBe("rejected-school");
  });

  it("allows classical-shared and nam-phai", () => {
    expect(
      gateClaimAdmission(
        baseClaim({ claimId: "x-cs", star: "Tử Vi", palace: "Mệnh", school: "classical-shared" }),
      ),
    ).toBeNull();
    expect(
      gateClaimAdmission(
        baseClaim({
          claimId: "x-np",
          star: "Tử Vi",
          palace: "Mệnh",
          school: "nam-phai",
          adjudication: "VERIFIED_SCHOOL",
        }),
      ),
    ).toBeNull();
  });
});

describe("romance-semantic-v0.1 condition resolution", () => {
  it("brightness match / mismatch / unresolved", () => {
    const palace = mockPalace({
      name: "Mệnh",
      majors: [{ name: "Tử Vi", brightness: "Miếu" }],
    });
    const match = resolveClaimConditions(
      baseClaim({
        claimId: "b-match",
        star: "Tử Vi",
        palace: "Mệnh",
        conditions: { brightness: ["Miếu", "Vượng"] },
      }),
      buildPalaceFactContext(palace),
    );
    expect(match[0]?.state).toBe("satisfied");

    const mismatch = resolveClaimConditions(
      baseClaim({
        claimId: "b-miss",
        star: "Tử Vi",
        palace: "Mệnh",
        conditions: { brightness: ["Hãm"] },
      }),
      buildPalaceFactContext(palace),
    );
    expect(mismatch[0]?.state).toBe("not-satisfied");

    const unresolvedPalace = mockPalace({
      name: "Mệnh",
      majors: [{ name: "Tử Vi", brightness: null }],
    });
    const unresolved = resolveClaimConditions(
      baseClaim({
        claimId: "b-unres",
        star: "Tử Vi",
        palace: "Mệnh",
        conditions: { brightness: ["Miếu"] },
      }),
      buildPalaceFactContext(unresolvedPalace),
    );
    expect(unresolved[0]?.state).toBe("unresolved");
    expect(
      resolveClaimAgainstPalace(
        baseClaim({
          claimId: "b-unres-2",
          star: "Tử Vi",
          palace: "Mệnh",
          conditions: { brightness: ["Miếu"] },
        }),
        unresolvedPalace,
      ).status,
    ).toBe("unresolved-condition");
  });

  it("branch / co-star / transformation conditions", () => {
    const palace = mockPalace({
      name: "Mệnh",
      branch: "Dần",
      majors: [
        { name: "Tử Vi", brightness: "Vượng" },
        { name: "Thiên Phủ", brightness: "Miếu" },
      ],
      transformations: ["Lộc"],
    });
    const ctx = buildPalaceFactContext(palace);
    expect(
      resolveClaimConditions(
        baseClaim({
          claimId: "br",
          star: "Tử Vi",
          palace: "Mệnh",
          conditions: { branches: ["Dần"] },
        }),
        ctx,
      )[0]?.state,
    ).toBe("satisfied");
    expect(
      resolveClaimConditions(
        baseClaim({
          claimId: "br-miss",
          star: "Tử Vi",
          palace: "Mệnh",
          conditions: { branches: ["Ngọ"] },
        }),
        ctx,
      )[0]?.state,
    ).toBe("not-satisfied");
    expect(
      resolveClaimConditions(
        baseClaim({
          claimId: "co",
          star: "Tử Vi",
          palace: "Mệnh",
          conditions: { coStars: ["Thiên Phủ"] },
        }),
        ctx,
      )[0]?.state,
    ).toBe("satisfied");
    expect(
      resolveClaimConditions(
        baseClaim({
          claimId: "co-miss",
          star: "Tử Vi",
          palace: "Mệnh",
          conditions: { coStars: ["Tham Lang"] },
        }),
        ctx,
      )[0]?.state,
    ).toBe("not-satisfied");
    expect(
      resolveClaimConditions(
        baseClaim({
          claimId: "tf",
          star: "Tử Vi",
          palace: "Mệnh",
          conditions: { transformations: ["Lộc"] },
        }),
        ctx,
      )[0]?.state,
    ).toBe("satisfied");
  });
});

describe("romance-semantic-v0.1 conflict safety", () => {
  it("keeps opposing tendencies visible", () => {
    const conflicts = detectTendencyConflicts([
      {
        claimId: "a",
        palace: "Phu Thê",
        starOrSystem: "Tham Lang",
        school: "classical-shared",
        adjudication: "VERIFIED_PRIMARY",
        sourceIds: ["src-ziwei-quanshu-juan-er"],
        tendency: { support: "up" },
        magnitudeOrdinal: "moderate",
        status: "admitted",
        conditions: [],
        tier: "A",
      },
      {
        claimId: "b",
        palace: "Phu Thê",
        starOrSystem: "Tham Lang",
        school: "classical-shared",
        adjudication: "VERIFIED_PRIMARY",
        sourceIds: ["src-ziwei-quanshu-juan-er"],
        tendency: { support: "down" },
        magnitudeOrdinal: "moderate",
        status: "admitted",
        conditions: [],
        tier: "A",
      },
    ]);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]?.claimIds).toEqual(["a", "b"]);
  });
});

describe("romance-semantic-v0.1 no numeric smuggling", () => {
  it("report forbids score authority fields", () => {
    const report = analyzeRomanceSemanticV01({
      chart: calculateNamPhai(CASE_AA10_M1998_DAN_2026),
    });
    expect(report.numericAuthority).toBe("none");
    expect(report.scoreImpactAllowed).toBe(false);
    expect(report).not.toHaveProperty("signedNet");
    expect(report).not.toHaveProperty("supportMass");
    expect(report).not.toHaveProperty("pressureMass");
    expect(report).not.toHaveProperty("finalScore");
  });

  it("module sources do not invent numericDelta or score exports", () => {
    const files = walkTs(ROOT);
    expect(files.length).toBeGreaterThan(0);
    for (const path of files) {
      const text = readFileSync(path, "utf8");
      expect(text).not.toMatch(/numericDelta\s*[:=]\s*(?!null)/);
      expect(text).not.toMatch(/scoreImpactAllowed:\s*true/);
      expect(text).not.toMatch(/from ["'][^"']*monthly-flow["']/);
      expect(text).not.toMatch(/analyzeMonthlyFlow/);
    }
  });
});

describe("romance-semantic-v0.1 runtime freeze", () => {
  it("does not change V0.10 domain scores when semantic report is computed", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const before = analyzeAnnualAxesNamPhaiV10(chart, {
      profileId: "layered-balanced",
      includeControl: true,
    });
    analyzeRomanceSemanticV01({ chart });
    const after = analyzeAnnualAxesNamPhaiV10(chart, {
      profileId: "layered-balanced",
      includeControl: true,
    });
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      expect(after.axes[domain].finalScore).toBe(before.axes[domain].finalScore);
      expect(after.axes[domain].natal.signedNet).toBe(before.axes[domain].natal.signedNet);
      expect(after.axes[domain].decade.signedNet).toBe(before.axes[domain].decade.signedNet);
      expect(after.axes[domain].annual.signedNet).toBe(before.axes[domain].annual.signedNet);
      expect(after.axes[domain].resonance.signedNet).toBe(
        before.axes[domain].resonance.signedNet,
      );
    }
    expect(after.versions.engineVersion).toBe(before.versions.engineVersion);
    expect(after.candidateId).toBe(before.candidateId);
  });
});

describe("romance-semantic-v0.1 temporal isolation", () => {
  it("natal semantic evidence invariant across annualYear", () => {
    const a = analyzeRomanceSemanticV01({
      chart: calculateNamPhai({ ...CASE_AA10_M1998_DAN_2026, annualYear: "2025" }),
    });
    const b = analyzeRomanceSemanticV01({
      chart: calculateNamPhai({ ...CASE_AA10_M1998_DAN_2026, annualYear: "2026" }),
    });
    expect(a.admittedClaims.map((c) => c.claimId)).toEqual(
      b.admittedClaims.map((c) => c.claimId),
    );
    expect(a.coverage.verifiedAdmittedClaimCount).toBe(
      b.coverage.verifiedAdmittedClaimCount,
    );
    expect(
      a.palaceBaselines.find((p) => p.palace === "Phu Thê")?.rawAxes,
    ).toEqual(b.palaceBaselines.find((p) => p.palace === "Phu Thê")?.rawAxes);
  });
});

describe("romance-semantic-v0.1 diagnostic case", () => {
  it("builds CASE-AA10 report without asserting score direction", () => {
    const report = buildRomanceCase1998Diagnostic();
    expect(report.caseId).toBe("CASE-AA10-M1998-DAN-2026");
    expect(report.romanceSemanticV01.scoreImpactAllowed).toBe(false);
    expect(report.romanceSemanticV01.numericAuthority).toBe("none");
    expect(report.romanceSemanticV01.researchDecision).toBe(
      "ROMANCE_SEMANTIC_EVIDENCE_PARTIAL",
    );
    // Explicitly do NOT assert finalScore < 50 or > 50.
    expect(typeof report.v10Romance.finalScore).toBe("number");
  });
});
