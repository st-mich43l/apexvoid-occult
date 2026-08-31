/**
 * PR #267 research tests — corpus, coverage, provenance, isolation, determinism.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeMajorFortune } from "../../../modules/major-fortune/production";
import { analyzeMajorFortuneTimeline } from "../../../modules/major-fortune/timeline";
import { analyzeMajorFortuneCandidateV05 } from "../../../modules/major-fortune/v0.5-candidate/candidate";
import {
  buildReadinessReport,
  RESEARCH_GENERATION_ID,
} from "../index";
import {
  enumerateObservations,
  loadFullCorpus,
  loadSchoolCorpus,
  observationKey,
} from "../corpus";
import {
  assertFactAccountingInvariant,
  auditObservationCoverage,
} from "../coverage";
import {
  collectEmittedIdsFromEvidence,
  inventoryEvidenceFamilies,
  inventoryNumericSurfaces,
} from "../authority";
import { buildHistoricalLineageInventory } from "../lineage";
import { V1_CATALOG_SET } from "../constants";
import { loadCurrentProvenanceIds } from "../constants";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("PR267 corpus accounting", () => {
  it("maps every golden case × school × valid cycle to exactly one observation", () => {
    const corpus = loadFullCorpus();
    expect(loadSchoolCorpus("nam-phai")).toHaveLength(55);
    expect(loadSchoolCorpus("trung-chau")).toHaveLength(55);
    expect(corpus).toHaveLength(110);

    const obs = enumerateObservations(corpus);
    expect(obs.length).toBeGreaterThan(110);

    const keys = obs.map(observationKey);
    expect(new Set(keys).size).toBe(keys.length);
  }, 120_000);
});

describe("PR267 physical-fact and unsupported-star accounting", () => {
  it("keeps fact-bucket invariant and surfaces unsupported stars", () => {
    const cases = loadSchoolCorpus("nam-phai").slice(0, 3);
    const obs = enumerateObservations(cases);
    expect(obs.length).toBeGreaterThan(0);

    for (const o of obs) {
      const cov = auditObservationCoverage(o.school, o.caseId, o.chart, o.cycle);
      expect(assertFactAccountingInvariant(cov.buckets)).toBe(true);
      for (const u of cov.unsupported) {
        expect(V1_CATALOG_SET.has(u.starName)).toBe(false);
      }
    }
  }, 60_000);
});

describe("PR267 provenance and DOMAIN_VERIFIED truthfulness", () => {
  it("treats V1 emitted source/claim IDs as unresolved against current registries", () => {
    const current = loadCurrentProvenanceIds();
    expect(current.sourceIds.has("SRC-TVDS-01")).toBe(false);
    expect(current.claimIds.has("CLM-DIALOI-01")).toBe(false);

    const families = inventoryEvidenceFamilies();
    const principal = families.find((f) => f.category === "principal-star")!;
    expect(principal.sourceIdsResolveCurrent).toBe(false);
    expect(principal.scoringAuthorityActuallySupported).toBe(false);
    expect(principal.classification).toBe("HISTORICAL_PROVENANCE_ONLY");

    const audit = collectEmittedIdsFromEvidence([
      {
        sourceIds: ["SRC-TVDS-01"],
        claimIds: ["CLM-DIALOI-01"],
        scoringAuthority: "DOMAIN_VERIFIED",
      },
    ]);
    expect(audit.domainVerifiedLabelTruthfulness).toBe("FAIL");
    expect(audit.unresolvedSourceIds).toContain("SRC-TVDS-01");
    expect(audit.unresolvedClaimIds).toContain("CLM-DIALOI-01");
  });

  it("classifies numeric surfaces without inventing sourced authority", () => {
    const surfaces = inventoryNumericSurfaces();
    expect(surfaces.some((s) => s.surfaceId === "maleficHeuristicThreshold")).toBe(
      true,
    );
    expect(
      surfaces.find((s) => s.surfaceId === "quality.confidencePercent")?.authority,
    ).toBe("PLACEHOLDER");
    expect(surfaces.every((s) => s.authority !== "SOURCED_NUMERIC_AUTHORITY")).toBe(
      true,
    );
  });
});

describe("PR267 majorMutagen / quality independence", () => {
  it("counts physical mutagens separately from scored transformation evidence", () => {
    const c = loadSchoolCorpus("trung-chau")[0]!;
    const obs = enumerateObservations([c])[0]!;
    const cov = auditObservationCoverage(obs.school, obs.caseId, obs.chart, obs.cycle);
    expect(cov.majorMutagensInV1FrameCount).toBe(cov.majorMutagensPhysicalCount);
    expect(cov.majorTransformationEvidenceCount).toBe(0);
    expect(cov.majorTransformationScoredCount).toBe(0);
    // Independent measured coverage must not equal blind trust of reported 100
    expect(cov.measuredPhysicalCoveragePercent).not.toBeNull();
    if (cov.buckets.silentlyDropped > 0) {
      expect(cov.measuredPhysicalCoveragePercent).toBeLessThan(100);
    }
  }, 60_000);
});

describe("PR267 lineage inventory", () => {
  it("marks historical V1 pack / gate / decision as non-current", () => {
    const assets = buildHistoricalLineageInventory();
    expect(assets.find((a) => a.assetId === "source-registry")?.state).toBe(
      "DELETED_PROVENANCE_ONLY",
    );
    expect(assets.find((a) => a.assetId === "release-gate")?.state).toBe(
      "DELETED_PROVENANCE_ONLY",
    );
    expect(assets.find((a) => a.assetId === "release-decision")?.state).toBe(
      "INVALIDATED",
    );
    expect(assets.find((a) => a.assetId === "engine-v1")?.state).toBe("STILL_CURRENT");
  });
});

describe("PR267 production isolation + V0.5 protection", () => {
  it("keeps production equal to V0.5 and free of engine-v1 imports", () => {
    const chart = calculateNamPhai(REGRESSION);
    const cycle = {
      cycleIndex: chart.majorFortunePalace!.majorFortune!.order!,
      startAge: chart.majorFortunePalace!.majorFortune!.start!,
      endAge: chart.majorFortunePalace!.majorFortune!.end!,
      activePalaceIndex: chart.majorFortunePalace!.index,
    };
    const expected = analyzeMajorFortuneCandidateV05(chart, {
      school: "nam-phai",
      cycleOverride: cycle,
    });
    const actual = analyzeMajorFortune(chart, {
      school: "nam-phai",
      cycleOverride: cycle,
    });
    expect(actual).toEqual(expected);
    const timeline = analyzeMajorFortuneTimeline(chart, { school: "nam-phai" });
    expect(timeline.points.length).toBeGreaterThan(1);

    const productionSrc = readFileSync(
      resolve(
        process.cwd(),
        "src/lib/ziwei/analysis/modules/major-fortune/production.ts",
      ),
      "utf8",
    );
    const timelineSrc = readFileSync(
      resolve(
        process.cwd(),
        "src/lib/ziwei/analysis/modules/major-fortune/timeline.ts",
      ),
      "utf8",
    );
    expect(productionSrc).not.toContain("engine-v1");
    expect(timelineSrc).not.toContain("engine-v1");
  });

  it("runtime modules do not import the readiness research harness", () => {
    const roots = [
      "src/lib/ziwei/analysis/modules/major-fortune/production.ts",
      "src/lib/ziwei/analysis/modules/major-fortune/timeline.ts",
      "src/lib/ziwei/analysis/modules/major-fortune/shadow.ts",
      "src/lib/ziwei/analysis/modules/major-fortune/v0.5-candidate/candidate.ts",
      "src/lib/ziwei/analysis/modules/major-fortune/engine-v1/analyze.ts",
      "src/lib/ziwei/analysis/modules/major-fortune/engine-v1/scoring/evaluate.ts",
    ];
    for (const rel of roots) {
      const src = readFileSync(resolve(process.cwd(), rel), "utf8");
      expect(src).not.toContain("major-fortune-v1-readiness");
    }
  });
});

describe("PR267 school + temporal isolation smoke", () => {
  it("preserves school field on V1 evidence and ignores annualMutagens for scoring path", () => {
    const c = loadSchoolCorpus("nam-phai")[0]!;
    const obs = enumerateObservations([c])[0]!;
    const chart = structuredClone(obs.chart);
    const before = auditObservationCoverage(
      obs.school,
      obs.caseId,
      obs.chart,
      obs.cycle,
    );
    chart.annualMutagens = [
      ...(chart.annualMutagens ?? []),
      { mutagen: "Kỵ", starName: "Thiên Cơ", palace: null },
    ];
    const after = auditObservationCoverage(
      obs.school,
      obs.caseId,
      chart,
      obs.cycle,
    );
    expect(after.v1Result?.score?.normalizedScore).toBe(
      before.v1Result?.score?.normalizedScore,
    );
    for (const e of after.v1Result?.evidence.admitted ?? []) {
      expect(e.school).toBe("nam-phai");
      expect(e.temporalScope).toBe("dai-van");
    }
  }, 60_000);
});

describe("PR267 determinism", () => {
  it("buildReadinessReport is byte-identical across two runs for fixed baseSha", () => {
    const a = JSON.stringify(buildReadinessReport("determinism-test-sha"));
    const b = JSON.stringify(buildReadinessReport("determinism-test-sha"));
    expect(a).toBe(b);
    expect(a).toContain(RESEARCH_GENERATION_ID);
  }, 300_000);
});
