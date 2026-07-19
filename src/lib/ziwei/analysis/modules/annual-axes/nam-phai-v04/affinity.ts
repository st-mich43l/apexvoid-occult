import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";

export type AffinitySubjectKey =
  | { kind: "star"; canonicalStarName: string; familyId?: string }
  | { kind: "transformation"; transformation: "Lộc" | "Quyền" | "Khoa" | "Kỵ" }
  | { kind: "category"; category: "star" | "mutagen" };

/**
 * Resolve domain affinity per V0.4 precedence:
 * exact star → star family → category default → null (no numeric evidence).
 */
export function resolveDomainAffinity(
  knowledge: AnnualAxesKnowledgeV04NamPhai,
  domain: AnnualAxisDomain,
  subject: AffinitySubjectKey,
): number | null {
  const records = knowledge.domainAffinity.records;

  if (subject.kind === "star") {
    const exact = records.find(
      (r) => r.subject.kind === "star" && r.subject.canonicalStarName === subject.canonicalStarName,
    );
    if (exact) return exact.affinities[domain];

    if (subject.familyId) {
      const family = records.find(
        (r) => r.subject.kind === "star-family" && r.subject.familyId === subject.familyId,
      );
      if (family) return family.affinities[domain];
    }

    return knowledge.domainAffinity.categoryDefaults.star[domain] ?? null;
  }

  if (subject.kind === "transformation") {
    const exact = records.find(
      (r) =>
        r.subject.kind === "transformation" && r.subject.transformation === subject.transformation,
    );
    if (exact) return exact.affinities[domain];
    return knowledge.domainAffinity.categoryDefaults.mutagen[domain] ?? null;
  }

  return knowledge.domainAffinity.categoryDefaults[subject.category][domain] ?? null;
}
