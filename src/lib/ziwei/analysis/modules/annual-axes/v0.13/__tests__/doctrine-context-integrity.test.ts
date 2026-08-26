import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import {
  V12_FORMULA_VERSION,
} from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.12";
import {
  loadAnnualAxesKnowledgeV13,
  type AnnualAxesKnowledgeV13,
  type V13DoctrineClaim,
} from "@/lib/ziwei/analysis/knowledge/annual-axes/v0.13";
import { CASE_AA10_M1998_DAN_2026 } from "../../v0.10-layered/compare";
import { collectDoctrineFallbackEvidence } from "../doctrine-bridge";

function cloneKnowledgeWithClaim(
  claim: V13DoctrineClaim,
): AnnualAxesKnowledgeV13 {
  const base = loadAnnualAxesKnowledgeV13();
  return {
    ...base,
    bridge: { claims: [claim] },
  };
}

function syntheticClaim(input: {
  claimId: string;
  star: string;
  palace: string;
  conditions?: V13DoctrineClaim["conditions"];
  tendency?: V13DoctrineClaim["tendency"];
}): V13DoctrineClaim {
  return {
    claimId: input.claimId,
    star: input.star,
    palace: input.palace,
    school: "classical-shared",
    conditions: input.conditions ?? {},
    tendency: input.tendency ?? { support: "up" },
    magnitudeOrdinal: "moderate",
    sourceIds: ["test-source"],
    locator: "test-exact-section",
    locatorType: "EXACT_SECTION",
    adjudication: "VERIFIED_PRIMARY",
    numericDelta: null,
  };
}

function diagnosticPalace() {
  const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
  const palace = chart.palaces.find((item) => item.name === "Quan Lộc");
  expect(palace).toBeDefined();
  if (!palace) throw new Error("missing diagnostic Quan Lộc palace");
  const host = (palace.stars ?? []).find(
    (star) =>
      star.name.length > 0 &&
      !star.name.startsWith("Lưu ") &&
      !String(star.source ?? "").startsWith("annual"),
  );
  expect(host).toBeDefined();
  if (!host) throw new Error("missing diagnostic natal host star");
  return { chart, palace, host };
}

describe("Annual Axes candidate lineage", () => {
  it("keeps V0.12 as the immutable registry-only scale control", () => {
    expect(V12_FORMULA_VERSION).toBe(
      "v0.12-static-direction-activation-role-compose",
    );
    const source = readFileSync(
      join(
        process.cwd(),
        "src/lib/ziwei/analysis/modules/annual-axes/v0.12/score-static-palace.ts",
      ),
      "utf8",
    );
    expect(source).not.toMatch(/doctrineFallback|doctrine-fallback/);
    expect(source).not.toMatch(/verified-primary-fallback/);
  });
});

describe("Annual Axes V0.13 natal doctrine context", () => {
  it("does not let an annual flow star satisfy a doctrine co-star condition", () => {
    const { chart, palace, host } = diagnosticPalace();
    const chartWithAnnualCoStar = {
      ...chart,
      palaces: chart.palaces.map((item) =>
        item.index === palace.index
          ? {
              ...item,
              stars: [
                ...(item.stars ?? []),
                {
                  name: "Kình Dương",
                  layer: "annual",
                  source: "annual",
                },
              ],
            }
          : item,
      ),
    };
    const claim = syntheticClaim({
      claimId: "test-annual-costar-must-not-satisfy",
      star: host.name,
      palace: palace.name,
      conditions: { coStars: ["Kình Dương"] },
    });

    const evidence = collectDoctrineFallbackEvidence({
      chart: chartWithAnnualCoStar,
      palaceIndex: palace.index,
      palaceName: palace.name,
      knowledge: cloneKnowledgeWithClaim(claim),
      alreadyScoredStars: new Set(),
    });

    expect(evidence).toEqual([]);
  });

  it("resolves branch conditions against the physical natal palace", () => {
    const { chart, palace, host } = diagnosticPalace();
    const matching = syntheticClaim({
      claimId: "test-branch-match",
      star: host.name,
      palace: palace.name,
      conditions: { branches: [palace.branch] },
    });
    const otherBranch = palace.branch === "Tý" ? "Sửu" : "Tý";
    const mismatching = syntheticClaim({
      claimId: "test-branch-mismatch",
      star: host.name,
      palace: palace.name,
      conditions: { branches: [otherBranch] },
    });

    const admitted = collectDoctrineFallbackEvidence({
      chart,
      palaceIndex: palace.index,
      palaceName: palace.name,
      knowledge: cloneKnowledgeWithClaim(matching),
      alreadyScoredStars: new Set(),
    });
    const rejected = collectDoctrineFallbackEvidence({
      chart,
      palaceIndex: palace.index,
      palaceName: palace.name,
      knowledge: cloneKnowledgeWithClaim(mismatching),
      alreadyScoredStars: new Set(),
    });

    expect(admitted.some((item) => item.admittedForNumeric)).toBe(true);
    expect(rejected).toEqual([]);
  });

  it("resolves transformation conditions from natalMutagens on the same palace", () => {
    const { chart, palace, host } = diagnosticPalace();
    const claim = syntheticClaim({
      claimId: "test-natal-transformation",
      star: host.name,
      palace: palace.name,
      conditions: { transformations: ["Hóa Lộc"] },
    });
    const chartWithNatalTransformation = {
      ...chart,
      natalMutagens: [
        ...(chart.natalMutagens ?? []),
        {
          mutagen: "Hóa Lộc",
          starName: host.name,
          palace,
        },
      ],
    };

    const evidence = collectDoctrineFallbackEvidence({
      chart: chartWithNatalTransformation,
      palaceIndex: palace.index,
      palaceName: palace.name,
      knowledge: cloneKnowledgeWithClaim(claim),
      alreadyScoredStars: new Set(),
    });

    expect(evidence.some((item) => item.admittedForNumeric)).toBe(true);
  });

  it("maps down-direction semantics without discarding them", () => {
    const { chart, palace, host } = diagnosticPalace();
    const supportDown = syntheticClaim({
      claimId: "test-support-down",
      star: host.name,
      palace: palace.name,
      tendency: { support: "down" },
    });
    const pressureDown = syntheticClaim({
      claimId: "test-pressure-down",
      star: host.name,
      palace: palace.name,
      tendency: { pressure: "down" },
    });

    const supportDownEvidence = collectDoctrineFallbackEvidence({
      chart,
      palaceIndex: palace.index,
      palaceName: palace.name,
      knowledge: cloneKnowledgeWithClaim(supportDown),
      alreadyScoredStars: new Set(),
    });
    const pressureDownEvidence = collectDoctrineFallbackEvidence({
      chart,
      palaceIndex: palace.index,
      palaceName: palace.name,
      knowledge: cloneKnowledgeWithClaim(pressureDown),
      alreadyScoredStars: new Set(),
    });

    expect(supportDownEvidence[0]?.direction).toBe("pressure");
    expect(pressureDownEvidence[0]?.direction).toBe("support");
  });
});
