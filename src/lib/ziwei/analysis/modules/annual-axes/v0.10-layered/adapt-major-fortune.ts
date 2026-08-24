import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV10,
  V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import { loadMajorFortuneOrdinalKnowledge } from "../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import { analyzeMajorFortune } from "../../major-fortune";
import type { MajorFortuneOrdinalEvidence } from "../../major-fortune/v0.3-ordinal/types";
import {
  buildLayerSignal,
  emptyLayerSignal,
} from "./layer-contract";
import { projectDomainAnchors } from "./domain-projection";
import type { AnnualLayerContributor, AnnualLayerSignal } from "./types";

const MF_MASS = { normal: 1, strong: 2 } as const;
// Existing V0.10 activation reference, previously used only as trace metadata.
// Reuse it to prevent a single low-mass one-sided fact from saturating signedNet.
const MF_ACTIVATION_REFERENCE_MASS = 4;

function evidenceTargetPalace(
  evidence: MajorFortuneOrdinalEvidence,
  activePalaceName: string | null,
): string | null {
  if (evidence.transformationTuple?.targetPalace) {
    return evidence.transformationTuple.targetPalace;
  }
  // Non-Tứ Hóa pillars describe the active decade palace environment.
  return activePalaceName;
}

function resolveTargetIndex(
  evidence: MajorFortuneOrdinalEvidence,
  chart: ChartData,
  palaceName: string | null,
): number | undefined {
  if (evidence.transformationTuple?.targetPalaceIndex !== undefined) {
    return evidence.transformationTuple.targetPalaceIndex;
  }
  if (!palaceName) return undefined;
  return chart.palaces.find((p) => p.name === palaceName)?.index;
}

function resolveActivatedDirectionalNet(
  supportMass: number,
  pressureMass: number,
): { activation: number; signedNet: number } {
  const totalMass = supportMass + pressureMass;
  if (totalMass <= 0) {
    return { activation: 0, signedNet: 0 };
  }

  const directionalNet = (supportMass - pressureMass) / totalMass;
  const activation = Math.min(1, totalMass / MF_ACTIVATION_REFERENCE_MASS);
  return {
    activation,
    signedNet: directionalNet * activation,
  };
}

export function adaptMajorFortuneContext(input: {
  chart: ChartData;
  knowledge: AnnualAxesKnowledgeV10;
  domains: readonly AnnualAxisDomain[];
  projectionVariant: V10ProjectionVariantId;
}): Record<AnnualAxisDomain, AnnualLayerSignal> {
  const { chart, knowledge, domains, projectionVariant } = input;
  const analysis = analyzeMajorFortune(chart, { school: "nam-phai" });
  const out = {} as Record<AnnualAxisDomain, AnnualLayerSignal>;

  // ChartData always carries annual/monthly fields; MF adapter records their
  // presence for isolation audits. Scoring still excludes annual/monthly
  // evidence via temporalScope + evaluator exclusion registry.
  if (
    analysis.candidateStatus === "unavailable-context" ||
    !analysis.cycle ||
    analysis.result == null
  ) {
    for (const domain of domains) {
      out[domain] = emptyLayerSignal("major-fortune", domain, "unavailable", [
        "missing-major-fortune",
        analysis.candidateStatus,
      ]);
    }
    return out;
  }

  const contaminatedEvidence = analysis.emittedEvidence.filter(
    (e) => e.temporalScope === "annual" || e.temporalScope === "monthly",
  );
  if (contaminatedEvidence.length > 0) {
    for (const domain of domains) {
      out[domain] = emptyLayerSignal("major-fortune", domain, "unavailable", [
        "forbidden-temporal-evidence-in-decade-layer",
        ...contaminatedEvidence.slice(0, 3).map((e) => e.evidenceId),
      ]);
    }
    return out;
  }

  const massLoaded = loadMajorFortuneOrdinalKnowledge();
  const massWeights = massLoaded.ok
    ? massLoaded.knowledge.formula.massWeights
    : MF_MASS;

  const activePalaceName = analysis.cycle.activePalaceName;

  // V0.5 production admission is only the first gate. The ordinal evaluator
  // subsequently applies conflict, duplicate-cluster, physical-fact and
  // cross-pillar ownership guards. Annual Axes must consume only evidence that
  // survived those evaluator gates, otherwise rejected upstream facts can be
  // accidentally reintroduced into the decade layer.
  const evaluatorAcceptedIds = new Set(
    Object.values(analysis.result.pillars).flatMap((pillar) =>
      pillar.acceptedEvidenceIds,
    ),
  );
  const majorFortuneEvidence = analysis.emittedEvidence.filter(
    (e) => e.temporalScope === "major-fortune",
  );
  const evidencePool = majorFortuneEvidence.filter((e) =>
    evaluatorAcceptedIds.has(e.evidenceId),
  );
  const evaluatorRejectedCount = majorFortuneEvidence.length - evidencePool.length;

  for (const domain of domains) {
    const projection = projectDomainAnchors({
      knowledge,
      domain,
      variant: projectionVariant,
      layer: "major-fortune",
      resolvePalace: (palace) => chart.palaces.some((p) => p.name === palace),
    });

    const domainPalaceSet = new Set(projection.resolved.map((a) => a.palace));
    const weightByPalace = new Map(
      projection.resolved.map((a) => [a.palace, a.effectiveLayerWeight] as const),
    );

    let supportMass = 0;
    let pressureMass = 0;
    const contributors: AnnualLayerContributor[] = [];

    for (const ev of evidencePool) {
      const target = evidenceTargetPalace(ev, activePalaceName);
      if (!target || !domainPalaceSet.has(target)) continue;
      const w = weightByPalace.get(target) ?? 0;
      if (w <= 0) continue;
      const mass = (massWeights[ev.strength] ?? 1) * w;
      if (ev.direction === "support") supportMass += mass;
      else pressureMass += mass;

      contributors.push({
        id: `mf:${domain}:${ev.evidenceId}`,
        layer: "major-fortune",
        palaceName: target,
        palaceIndex: resolveTargetIndex(ev, chart, target),
        physicalFactIds: [ev.physicalFactId],
        sourceIds: ev.sourceIds.length ? ev.sourceIds : ["SRC-MF-UPSTREAM"],
        direction: ev.direction,
        magnitude: mass,
        sourceModule: "major-fortune",
        contextualReuse: true,
        originalWeight: projection.resolved.find((a) => a.palace === target)?.originalWeight,
        effectiveLayerWeight: w,
      });
    }

    // If no evidence mapped into domain anchors but decade exists, mark partial
    // with neutral net (do NOT fabricate support). Coverage still reported.
    const hasMapped = contributors.length > 0;
    const availability =
      analysis.result.status === "unavailable"
        ? "unavailable"
        : !hasMapped
          ? "partial"
          : analysis.result.status === "partial"
            ? "partial"
            : projection.coverage < 0.999
              ? "partial"
              : "available";

    const { activation, signedNet } = resolveActivatedDirectionalNet(
      supportMass,
      pressureMass,
    );

    const reasonCodes: string[] = [];
    if (!hasMapped) reasonCodes.push("decade-evidence-not-mapped-to-domain");
    if (analysis.result.status === "partial") reasonCodes.push("major-fortune-partial");
    if (projection.coverage < 0.999) reasonCodes.push("decade-projection-partial-coverage");
    if (evaluatorRejectedCount > 0) {
      reasonCodes.push(
        `decade-upstream-evaluator-rejections-filtered:${evaluatorRejectedCount}`,
      );
    }
    if (hasMapped && activation < 1) {
      reasonCodes.push("decade-sparse-evidence-damped");
    }

    out[domain] = buildLayerSignal({
      layer: "major-fortune",
      domain,
      supportMass,
      pressureMass,
      activation,
      coverage: projection.coverage,
      availability,
      contributors,
      reasonCodes,
      signedNetOverride: signedNet,
    });
  }

  return out;
}
