import fs from "fs";
import path from "path";
import type {
  BacklogInventoryRecord,
  MajorFortuneResearchFrame,
  ProvenanceReconciliationRecord,
  SignalInventoryRecord,
} from "../schema/foundation.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);

const RUNTIME_FILE_MAPPING: Record<string, string> = {
  "element-relation": "emit-thien-thoi.ts",
  "principal-star-dignity": "emit-dia-loi.ts",
  "support-pressure-auxiliary-sets": "emit-nhan-hoa.ts",
  "major-fortune-transformations": "emit-tu-hoa.ts",
};

const RUNTIME_FRAME_MAPPING: Record<
  string,
  SignalInventoryRecord["frame"]
> = {
  "element-relation": "active-major-fortune-palace-only",
  "principal-star-dignity": "active-major-fortune-palace-only",
  "support-pressure-auxiliary-sets":
    "active-major-fortune-palace-only",
  "major-fortune-transformations":
    "direct-active-major-fortune-palace-only",
};

const BACKLOG_FRAME_MAPPING: Record<
  string,
  { proposedFrame: MajorFortuneResearchFrame; targetFrame: MajorFortuneResearchFrame }
> = {
  "vcd-opposite-palace-borrowing": {
    proposedFrame: "proposed-opposite-palace",
    targetFrame: "proposed-opposite-palace",
  },
  "partial-auxiliary-pair-semantics": {
    proposedFrame: "active-major-fortune-palace-only",
    targetFrame: "not-applicable",
  },
  "hinh-ho-set": {
    proposedFrame: "active-major-fortune-palace-only",
    targetFrame: "not-applicable",
  },
  "severe-pressure-evidence": {
    proposedFrame: "active-major-fortune-palace-only",
    targetFrame: "not-applicable",
  },
  "tuan-triet": {
    proposedFrame: "active-major-fortune-palace-only",
    targetFrame: "not-applicable",
  },
  "tam-khong": {
    proposedFrame: "active-major-fortune-palace-only",
    targetFrame: "not-applicable",
  },
  "natal-to-van-star-pattern-compatibility": {
    proposedFrame: "natal-and-major-fortune",
    targetFrame: "natal-and-major-fortune",
  },
  "natal-palace-groups": {
    proposedFrame: "natal-and-major-fortune",
    targetFrame: "not-applicable",
  },
  "out-of-frame-transformation-influence": {
    proposedFrame: "direct-active-major-fortune-palace-only",
    targetFrame: "out-of-frame-target",
  },
  "natal-transit-transformation-stacking": {
    proposedFrame: "natal-and-major-fortune",
    targetFrame: "natal-and-major-fortune",
  },
};

function extractIds(
  filePath: string,
): {
  sourceIds: string[];
  claimIds: string[];
  sourceSymbol: string;
  claimSymbol: string;
} {
  const content = fs.readFileSync(filePath, "utf8");
  const declarations = [
    ...content.matchAll(
      /const\s+([A-Za-z0-9_]+)\s*=\s*\[([\s\S]*?)\]\s*;/g,
    ),
  ];

  const readIds = (prefix: "SRC-" | "CLM-") => {
    for (const match of declarations) {
      const values = [
        ...match[2].matchAll(/["']([^"']+)["']/g),
      ].map((value) => value[1]);
      const ids = values.filter((value) => value.startsWith(prefix));
      if (ids.length > 0) {
        return { ids, symbol: match[1] };
      }
    }
    return { ids: [], symbol: "" };
  };

  const sources = readIds("SRC-");
  const claims = readIds("CLM-");
  return {
    sourceIds: sources.ids,
    claimIds: claims.ids,
    sourceSymbol: sources.symbol,
    claimSymbol: claims.symbol,
  };
}

export function extractInventory(opts?: { outputBase?: string }): void {
  const outputBase = opts?.outputBase ?? CANONICAL_BASE;
  const adapterBase = path.join(
    ROOT,
    "src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter",
  );
  const registryBase = path.join(
    ROOT,
    "src/lib/ziwei/analysis/knowledge/major-fortune-scoring/v0.3-ordinal",
  );

  const adapterPolicy = JSON.parse(
    fs.readFileSync(
      path.join(adapterBase, "policy/adapter-policy.v0.3.json"),
      "utf8",
    ),
  );
  const pillarRegistry = JSON.parse(
    fs.readFileSync(
      path.join(registryBase, "pillar-registry.v0.3.json"),
      "utf8",
    ),
  );
  const maintainedBacklog = JSON.parse(
    fs.readFileSync(
      path.join(CANONICAL_BASE, "inventory/backlog-registry.json"),
      "utf8",
    ),
  );

  const runtimeInventory: SignalInventoryRecord[] = [];
  const backlogInventory: BacklogInventoryRecord[] = [];
  const reconciliation: ProvenanceReconciliationRecord[] = [];

  for (const familyId of adapterPolicy.enabledSignalFamilies as string[]) {
    const pillar = pillarRegistry.pillars.find((candidate: any) =>
      candidate.allowedSignalFamilyIds.includes(familyId),
    );
    const filename = RUNTIME_FILE_MAPPING[familyId];
    if (!pillar || !filename) {
      throw new Error(`No runtime mapping for ${familyId}`);
    }

    const runtimePath = path.join(adapterBase, filename);
    const {
      sourceIds,
      claimIds,
      sourceSymbol,
      claimSymbol,
    } = extractIds(runtimePath);

    const engineeringMappings: SignalInventoryRecord["engineeringMappings"] =
      [];
    if (familyId === "element-relation") {
      for (const [scenario, mapping] of Object.entries(
        adapterPolicy.elementRelationMapping,
      )) {
        engineeringMappings.push({
          scenario,
          direction: (mapping as any).direction,
          strength: (mapping as any).strength,
        });
      }
    } else if (familyId === "principal-star-dignity") {
      for (const [scenario, mapping] of Object.entries(
        adapterPolicy.dignityMapping,
      )) {
        engineeringMappings.push({
          scenario,
          direction: mapping ? (mapping as any).direction : "neutral",
          strength: mapping ? (mapping as any).strength : "none",
        });
      }
    } else if (familyId === "major-fortune-transformations") {
      for (const [scenario, mapping] of Object.entries(
        adapterPolicy.transformationPolarity,
      )) {
        engineeringMappings.push({
          scenario,
          direction: (mapping as any).direction,
          strength: (mapping as any).strength,
        });
      }
    }

    runtimeInventory.push({
      signalFamilyId: familyId,
      pillarId: pillar.pillarId,
      runtimeStatus: "production-enabled",
      doctrineStatus: "unverified",
      frame: RUNTIME_FRAME_MAPPING[familyId],
      sourceIds,
      claimIds,
      schoolScope: ["nam-phai", "trung-chau"],
      engineeringMappings,
      numericAuthority: "engineering-defined",
    });

    const relativePath =
      `src/lib/ziwei/analysis/modules/major-fortune/` +
      `v0.3-ordinal/adapter/${filename}`;

    for (const sourceId of sourceIds) {
      reconciliation.push({
        identifier: sourceId,
        identifierKind: "source",
        origin: "runtime",
        definingPath: relativePath,
        definingSymbol: sourceSymbol,
        runtimeExists: true,
        authorityClass: "engineering-policy",
        schoolScope: ["nam-phai", "trung-chau"],
        relatedIdentifiers: claimIds,
        notes: "Extracted from the production adapter declaration.",
      });
    }

    for (const claimId of claimIds) {
      reconciliation.push({
        identifier: claimId,
        identifierKind: "claim",
        origin: "runtime",
        definingPath: relativePath,
        definingSymbol: claimSymbol,
        runtimeExists: true,
        authorityClass: "engineering-policy",
        schoolScope: ["nam-phai", "trung-chau"],
        relatedIdentifiers: sourceIds,
        notes: "Extracted from the production adapter declaration.",
      });
    }
  }

  for (const item of maintainedBacklog) {
    const frames = BACKLOG_FRAME_MAPPING[item.signalFamilyId];
    if (!frames) {
      throw new Error(
        `Missing maintained frame mapping for ${item.signalFamilyId}`,
      );
    }

    backlogInventory.push({
      signalFamilyId: item.signalFamilyId,
      implemented: Boolean(item.implemented),
      emittedAsDiagnosticOnly:
        Boolean(item.emittedAsDiagnosticOnly) ||
        item.signalFamilyId === "partial-auxiliary-pair-semantics",
      blockedOnEvidence: Boolean(item.blockedOnEvidence),
      blockedOnCalculationCore: Boolean(item.blockedOnCalculationCore),
      measurableFromCorpus: item.measurableFromCorpus,
      doctrineStatus: "unverified",
      schoolScope: item.schoolScope ?? "unresolved",
      pillarOwnership: item.pillarOwnership ?? "unresolved",
      proposedFrame: frames.proposedFrame,
      targetFrame: frames.targetFrame,
    });
  }

  fs.mkdirSync(path.join(outputBase, "inventory"), { recursive: true });
  fs.writeFileSync(
    path.join(outputBase, "inventory/runtime-signal-inventory.json"),
    `${JSON.stringify(runtimeInventory, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outputBase, "inventory/research-backlog-registry.json"),
    `${JSON.stringify(backlogInventory, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outputBase, "inventory/provenance-reconciliation.json"),
    `${JSON.stringify(reconciliation, null, 2)}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  extractInventory();
}
