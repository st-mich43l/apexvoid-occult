import { beforeEach, describe, expect, it } from "vitest";
import { calculateCandidateReadiness } from "../cli/readiness";
import { validateFoundation } from "../cli/validate-foundation";

const backlogIds = [
  "vcd-opposite-palace-borrowing",
  "partial-auxiliary-pair-semantics",
  "hinh-ho-set",
  "severe-pressure-evidence",
  "tuan-triet",
  "tam-khong",
  "natal-to-van-star-pattern-compatibility",
  "natal-palace-groups",
  "out-of-frame-transformation-influence",
  "natal-transit-transformation-stacking",
];

let gapCounter = 0;
function dimension(status: string, extras: Record<string, unknown> = {}) {
  gapCounter += 1;
  return {
    status,
    sourceIds: [],
    claimIds: [],
    gapIds:
      status === "verified" || status === "not-applicable"
        ? []
        : [`GAP-TEST-${gapCounter}`],
    derivation: "fixture",
    notes: "",
    ...extras,
  };
}

function matrixFixture() {
  const record: any = {
    signalFamilyId: "element-relation",
    existence: dimension("missing"),
    schoolScope: dimension("engineering-only"),
    majorFortuneTemporalScope: dimension("engineering-only"),
    palaceFrame: dimension("engineering-only"),
    targetFrame: dimension("not-applicable"),
    polarity: dimension("engineering-only"),
    strength: dimension("engineering-only"),
    pillarOwnership: dimension("engineering-only"),
    stacking: dimension("missing"),
    deduplication: dimension("engineering-only"),
    exceptionPolicy: dimension("missing"),
    calculationCoreReadiness: dimension("verified"),
    sourceLocatorQuality: dimension("engineering-only", {
      runtimeLocatorStatus: "verified",
      doctrineLocatorStatus: "verified-runtime-only",
    }),
    crossSourceAgreement: dimension("missing"),
    corpusMeasurability: dimension("verified"),
    openContradictionIds: [],
    candidateEligibility: "metadata-only",
  };
  record.candidateEligibility =
    calculateCandidateReadiness(record).readiness;
  return record;
}

describe("Major Fortune V0.5 foundation validation", () => {
  let fixture: any;

  beforeEach(() => {
    gapCounter = 0;
    const runtimeInventory = [
      {
        signalFamilyId: "element-relation",
        pillarId: "thien-thoi",
        runtimeStatus: "production-enabled",
        doctrineStatus: "unverified",
        frame: "active-major-fortune-palace-only",
        sourceIds: ["SRC-MF-V03-ADAPTER-ELEMENT"],
        claimIds: ["CLM-MF-V03-ADAPTER-ELEMENT"],
        schoolScope: ["nam-phai", "trung-chau"],
        engineeringMappings: [
          {
            scenario: "same_element",
            direction: "support",
            strength: "normal",
          },
        ],
        numericAuthority: "engineering-defined",
      },
      {
        signalFamilyId: "principal-star-dignity",
        pillarId: "dia-loi",
        runtimeStatus: "production-enabled",
        doctrineStatus: "unverified",
        frame: "active-major-fortune-palace-only",
        sourceIds: ["SRC-MF-V03-ADAPTER-DIGNITY"],
        claimIds: ["CLM-MF-V03-ADAPTER-DIGNITY"],
        schoolScope: ["nam-phai", "trung-chau"],
        engineeringMappings: [],
        numericAuthority: "engineering-defined",
      },
      {
        signalFamilyId: "support-pressure-auxiliary-sets",
        pillarId: "nhan-hoa",
        runtimeStatus: "production-enabled",
        doctrineStatus: "unverified",
        frame: "active-major-fortune-palace-only",
        sourceIds: ["SRC-MF-V03-ADAPTER-AUX"],
        claimIds: ["CLM-MF-V03-ADAPTER-AUX"],
        schoolScope: ["nam-phai", "trung-chau"],
        engineeringMappings: [],
        numericAuthority: "engineering-defined",
      },
      {
        signalFamilyId: "major-fortune-transformations",
        pillarId: "tu-hoa-sat-tinh",
        runtimeStatus: "production-enabled",
        doctrineStatus: "unverified",
        frame: "direct-active-major-fortune-palace-only",
        sourceIds: ["SRC-MF-V03-ADAPTER-XF"],
        claimIds: ["CLM-MF-V03-ADAPTER-XF"],
        schoolScope: ["nam-phai", "trung-chau"],
        engineeringMappings: [],
        numericAuthority: "engineering-defined",
      },
    ];

    const backlogInventory = backlogIds.map((signalFamilyId) => ({
      signalFamilyId,
      implemented: false,
      emittedAsDiagnosticOnly:
        signalFamilyId === "partial-auxiliary-pair-semantics",
      blockedOnEvidence: true,
      blockedOnCalculationCore:
        signalFamilyId.includes("natal-transit"),
      measurableFromCorpus: true,
      doctrineStatus: "unverified",
      schoolScope: "unresolved",
      pillarOwnership:
        signalFamilyId === "vcd-opposite-palace-borrowing"
          ? "dia-loi"
          : "unresolved",
      proposedFrame:
        signalFamilyId === "vcd-opposite-palace-borrowing"
          ? "proposed-opposite-palace"
          : "active-major-fortune-palace-only",
      targetFrame:
        signalFamilyId === "vcd-opposite-palace-borrowing"
          ? "proposed-opposite-palace"
          : "not-applicable",
    }));

    const matrix = matrixFixture();
    fixture = {
      runtimeInventory,
      backlogInventory,
      reconciliation: [
        {
          identifier: "SRC-MF-V03-ADAPTER-ELEMENT",
          identifierKind: "source",
          origin: "runtime",
          definingPath: "emit-thien-thoi.ts",
          definingSymbol: "EL_SOURCE",
          runtimeExists: true,
          authorityClass: "engineering-policy",
        },
        {
          identifier: "CLM-MF-V03-ADAPTER-ELEMENT",
          identifierKind: "claim",
          origin: "runtime",
          definingPath: "emit-thien-thoi.ts",
          definingSymbol: "EL_CLAIM",
          runtimeExists: true,
          authorityClass: "engineering-policy",
        },
      ],
      matrices: [matrix],
      readiness: [
        {
          signalFamilyId: matrix.signalFamilyId,
          ...calculateCandidateReadiness(matrix),
        },
      ],
      schoolPolicy: [
        {
          signalFamilyId: "element-relation",
          runtimeAdmittedByNamPhai: true,
          runtimeAdmittedByTrungChau: true,
          sharedImplementation: true,
          sharedDoctrine: false,
          crossSchoolFallbackForbidden: true,
        },
      ],
      corpus: {
        thienThoi: {
          elementRelationDistribution: { same_element: 10 },
        },
        diaLoi: {
          onePrincipalCases: 1,
          twoPrincipalCases: 1,
        },
        tuHoa: {
          completeTuples: 10,
          incompleteTuples: 2,
          resolvedTuples: 12,
          directActivePalaceTuples: 2,
          acceptedTransformationEvidence: 2,
          featureEnabledProductionState: false,
        },
        reconciliation: {
          status: "mismatched",
        },
      },
      contradictions: {
        contradictions: [
          {
            contradictionId: "CTR-MFV02-LOC-001",
            status: "open",
          },
        ],
      },
      sourceQueue: [{}],
      claimQueue: [{}],
      coreQueue: [],
      decision: {
        decision: "CURRENT_PRODUCTION_PROVENANCE_MISMATCH",
        openQueueCounts: {
          "source-acquisition": 1,
          "claim-adjudication": 1,
          "calculation-core-gap": 0,
        },
      },
    };
  });

  it("passes a structurally truthful baseline", () => {
    expect(() => validateFoundation(fixture)).not.toThrow();
  });

  it("blocks engineering-only polarity", () => {
    const result = calculateCandidateReadiness(fixture.matrices[0]);
    expect(result.readiness).toBe("research-blocked");
    expect(result.blockingDimensions).toContain("polarity");
  });

  it("rejects invalid evidence statuses", () => {
    fixture.matrices[0].existence.status = "unverified";
    expect(() => validateFoundation(fixture)).toThrow(
      /Invalid or missing evidence dimension/,
    );
  });

  it("rejects duplicate gap IDs", () => {
    fixture.matrices[0].schoolScope.gapIds =
      fixture.matrices[0].existence.gapIds;
    expect(() => validateFoundation(fixture)).toThrow(
      /Duplicate gap ID/,
    );
  });

  it("rejects missing backlog families", () => {
    fixture.backlogInventory.pop();
    expect(() => validateFoundation(fixture)).toThrow(
      /Backlog family omitted/,
    );
  });

  it("rejects a generic VCD frame", () => {
    fixture.backlogInventory[0].proposedFrame = "active-palace";
    expect(() => validateFoundation(fixture)).toThrow(
      /VCD opposite-palace frame/,
    );
  });

  it("requires partial-pair diagnostics", () => {
    fixture.backlogInventory[1].emittedAsDiagnosticOnly = false;
    expect(() => validateFoundation(fixture)).toThrow(
      /Partial auxiliary pairs/,
    );
  });

  it("rejects false doctrine locator verification", () => {
    fixture.matrices[0].sourceLocatorQuality.status = "verified";
    expect(() => validateFoundation(fixture)).toThrow(
      /Runtime locator falsely marked/,
    );
  });

  it("rejects unresolved stacking marked not-applicable", () => {
    fixture.matrices[0].stacking.status = "not-applicable";
    fixture.matrices[0].stacking.notes = "Needs future research";
    expect(() => validateFoundation(fixture)).toThrow(
      /Unresolved stacking rule/,
    );
  });

  it("rejects zero tuple metrics with accepted evidence", () => {
    fixture.corpus.tuHoa.completeTuples = 0;
    fixture.corpus.tuHoa.resolvedTuples = 2;
    fixture.corpus.tuHoa.directActivePalaceTuples = 0;
    expect(() => validateFoundation(fixture)).toThrow(
      /Accepted transformation evidence/,
    );
  });

  it("rejects non-reconciling tuple totals", () => {
    fixture.corpus.tuHoa.resolvedTuples = 11;
    expect(() => validateFoundation(fixture)).toThrow(
      /tuple totals do not reconcile/,
    );
  });

  it("requires CURRENT mismatch decision for corpus mismatch", () => {
    fixture.decision.decision =
      "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN";
    expect(() => validateFoundation(fixture)).toThrow(
      /Production mismatch is not reflected/,
    );
  });

  it("rejects stale queue counts", () => {
    fixture.decision.openQueueCounts["source-acquisition"] = 0;
    expect(() => validateFoundation(fixture)).toThrow(
      /queue counts are stale/,
    );
  });

  it("rejects missing runtime provenance", () => {
    fixture.runtimeInventory[0].sourceIds = [];
    expect(() => validateFoundation(fixture)).toThrow(
      /Missing production family provenance/,
    );
  });

  it("rejects stale readiness", () => {
    fixture.readiness[0].readiness =
      "eligible-for-shape-design";
    expect(() => validateFoundation(fixture)).toThrow(
      /Candidate readiness matrix is stale/,
    );
  });
});
