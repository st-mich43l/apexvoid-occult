import type {
  AnnualAxesKnowledgeV08NamPhai,
  AnnualDomainMappingV08,
  AnnualPointClassesV08,
  AnnualScoreBandsV08,
  AnnualStarAliasesV08,
  AnnualStarRegistryV08,
  AnnualDistributionGatesV08,
  V08PointClass,
  V08StarRule,
} from "./schema";
import { V08_CANONICAL_PALACES, V08_KNOWLEDGE_VERSION } from "./schema";
import type { AnnualAxisDomainId } from "../schema";
import { exactCanonicalStarName, isAnnualOnlyStarName } from "./star-name";

export interface AnnualKnowledgeV08ValidationIssue {
  path: string;
  message: string;
}

const DOMAINS: AnnualAxisDomainId[] = [
  "health",
  "family",
  "wealth",
  "career",
  "social",
  "romance",
];

const POINT_CLASSES: V08PointClass[] = [
  "annualTransformStrongPositive",
  "annualTransformPositive",
  "annualTransformNegative",
  "otherAnnualPositive",
  "otherAnnualNegative",
  "staticPositive",
  "staticNegative",
  "dignifiedStaticPositive",
];

const POSITIVE_CLASSES = new Set<V08PointClass>([
  "annualTransformStrongPositive",
  "annualTransformPositive",
  "otherAnnualPositive",
  "staticPositive",
  "dignifiedStaticPositive",
]);

const NEGATIVE_CLASSES = new Set<V08PointClass>([
  "annualTransformNegative",
  "otherAnnualNegative",
  "staticNegative",
]);

const KNOWN_GATE_METRICS = new Set([
  "meanIntraYearAxisStandardDeviationMin",
  "medianIntraYearAxisRangeMin",
  "p25IntraYearRangeMin",
  "p10IntraYearRangeMin",
  "medianPerDomainTwelveYearRangeMin",
  "medianAdjacentYearAbsoluteDeltaMin",
  "exactDuplicateVectorRateMax",
  "nearDuplicateVectorRateMax",
  "unavailableRateMax",
  "absoluteInterAxisCorrelationMax",
  "boundaryScoreRateMax",
  "atLeastTwoOutside42To58RateMin",
  "atLeastOneAtOrBelow40RateMin",
  "atLeastOneAtOrAbove60RateMin",
  "oneLowAndOneHighRateMin",
  "allSixAbove50RateMax",
  "fiveOrMoreAbove50RateMax",
  "allSixInside45To65RateMax",
]);

const PALACE_ALLOWLIST = new Set<string>(V08_CANONICAL_PALACES);

function issue(path: string, message: string): AnnualKnowledgeV08ValidationIssue {
  return { path, message };
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function validateMapping(
  mapping: AnnualDomainMappingV08,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  if (mapping.schemaVersion !== "0.8.0") {
    issues.push(issue("domainMapping.schemaVersion", "must be 0.8.0"));
  }
  if (mapping.catalogId !== "annual-domain-mapping-nam-phai-v0-8") {
    issues.push(issue("domainMapping.catalogId", "unexpected catalogId"));
  }
  if (mapping.formulaVersion !== "v0.8-annual-palace-weighted-score") {
    issues.push(issue("domainMapping.formulaVersion", "must be v0.8-annual-palace-weighted-score"));
  }

  const domainKeys = Object.keys(mapping.domains);
  if (domainKeys.length !== 6) {
    issues.push(issue("domainMapping.domains", "must contain exactly six domains"));
  }
  const seenDomains = new Set<string>();
  for (const domain of DOMAINS) {
    if (seenDomains.has(domain)) {
      issues.push(issue(`domainMapping.domains.${domain}`, "duplicate domain id"));
    }
    seenDomains.add(domain);
    const entry = mapping.domains[domain];
    if (!entry) {
      issues.push(issue(`domainMapping.domains.${domain}`, "missing"));
      continue;
    }
    const primary = entry.primary;
    if (!isFiniteNumber(primary.weight) || primary.weight < 0) {
      issues.push(issue(`domainMapping.domains.${domain}.primary.weight`, "must be non-negative finite"));
    }
    if (Math.abs(primary.weight - 0.6) > 1e-9) {
      issues.push(issue(`domainMapping.domains.${domain}.primary.weight`, "must equal 0.60"));
    }
    if (primary.type === "annual-palace") {
      if (!primary.palace) {
        issues.push(issue(`domainMapping.domains.${domain}.primary.palace`, "required"));
      } else if (!PALACE_ALLOWLIST.has(primary.palace)) {
        issues.push(
          issue(`domainMapping.domains.${domain}.primary.palace`, `unknown palace ${primary.palace}`),
        );
      }
    }
    const roleIds = new Set<string>();
    const primaryRole = primary.role ?? "primary";
    roleIds.add(primaryRole);

    const coopSum = entry.cooperating.reduce((s, c) => s + (c.weight ?? 0), 0);
    if (Math.abs(coopSum - 0.4) > 1e-9) {
      issues.push(
        issue(`domainMapping.domains.${domain}.cooperating`, "weights must sum to 0.40"),
      );
    }
    for (const [i, coop] of entry.cooperating.entries()) {
      if (!isFiniteNumber(coop.weight) || coop.weight < 0) {
        issues.push(
          issue(`domainMapping.domains.${domain}.cooperating[${i}].weight`, "must be non-negative finite"),
        );
      }
      if (coop.type === "annual-palace") {
        if (!coop.palace) {
          issues.push(
            issue(`domainMapping.domains.${domain}.cooperating[${i}].palace`, "required"),
          );
        } else if (!PALACE_ALLOWLIST.has(coop.palace)) {
          issues.push(
            issue(
              `domainMapping.domains.${domain}.cooperating[${i}].palace`,
              `unknown palace ${coop.palace}`,
            ),
          );
        }
      }
      const role = coop.role ?? `cooperating-${i}`;
      if (roleIds.has(role)) {
        issues.push(
          issue(`domainMapping.domains.${domain}.cooperating[${i}].role`, "duplicate role id"),
        );
      }
      roleIds.add(role);
    }
    const total = primary.weight + coopSum;
    if (Math.abs(total - 1) > 1e-9) {
      issues.push(issue(`domainMapping.domains.${domain}`, "weights must sum to 1.00"));
    }
  }
  for (const sourceId of mapping.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`domainMapping.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validatePointClasses(
  profile: AnnualPointClassesV08,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  if (profile.schemaVersion !== "0.8.0") {
    issues.push(issue("pointClasses.schemaVersion", "must be 0.8.0"));
  }
  for (const key of POINT_CLASSES) {
    if (!isFiniteNumber(profile.classes[key])) {
      issues.push(issue(`pointClasses.classes.${key}`, "must be a finite number"));
    }
  }
  const expected: Record<V08PointClass, number> = {
    annualTransformStrongPositive: 3,
    annualTransformPositive: 2,
    annualTransformNegative: -3,
    otherAnnualPositive: 2,
    otherAnnualNegative: -2,
    staticPositive: 1,
    staticNegative: -1,
    dignifiedStaticPositive: 2,
  };
  for (const [key, value] of Object.entries(expected) as Array<[V08PointClass, number]>) {
    if (profile.classes[key] !== value) {
      issues.push(issue(`pointClasses.classes.${key}`, `must be ${value}`));
    }
  }
  if (profile.palaceRawClamp.minimum !== -8 || profile.palaceRawClamp.maximum !== 8) {
    issues.push(issue("pointClasses.palaceRawClamp", "must be [-8, 8]"));
  }
  if (profile.axisRawClamp.minimum !== -8 || profile.axisRawClamp.maximum !== 8) {
    issues.push(issue("pointClasses.axisRawClamp", "must be [-8, 8]"));
  }
  if (profile.thaiTueMultiplier !== 1.25) {
    issues.push(issue("pointClasses.thaiTueMultiplier", "must be 1.25"));
  }
  if (profile.thaiTueNeutralMultiplier !== 1.0) {
    issues.push(issue("pointClasses.thaiTueNeutralMultiplier", "must be 1.0"));
  }
  if (profile.score.neutral !== 50 || profile.score.pointsPerRawUnit !== 5) {
    issues.push(issue("pointClasses.score", "must use 50 + 5 * raw"));
  }
  if (profile.score.minimum !== 10 || profile.score.maximum !== 90) {
    issues.push(issue("pointClasses.score.bounds", "must clamp to [10, 90]"));
  }
  if (profile.score.precision !== 1) {
    issues.push(issue("pointClasses.score.precision", "must be 1"));
  }
  for (const sourceId of profile.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`pointClasses.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validateRule(
  domain: AnnualAxisDomainId,
  rule: V08StarRule,
  polarity: "positive" | "negative",
  seenRuleIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  const path = `starRegistry.axes.${domain}.${rule.ruleId}`;
  if (!rule.starName || !rule.ruleId || !POINT_CLASSES.includes(rule.pointClass)) {
    issues.push(issue(path, "invalid rule"));
    return;
  }
  if (seenRuleIds.has(rule.ruleId)) {
    issues.push(issue(path, "duplicate rule id"));
  }
  seenRuleIds.add(rule.ruleId);

  if (rule.polarity !== polarity) {
    issues.push(issue(path, `polarity must be ${polarity}`));
  }
  if (polarity === "positive" && !POSITIVE_CLASSES.has(rule.pointClass)) {
    issues.push(issue(path, "positive rule using a negative point class"));
  }
  if (polarity === "negative" && !NEGATIVE_CLASSES.has(rule.pointClass)) {
    issues.push(issue(path, "negative rule using a positive point class"));
  }
  if (!Array.isArray(rule.allowedTemporalLayers) || rule.allowedTemporalLayers.length === 0) {
    issues.push(issue(path, "allowedTemporalLayers required"));
  } else if (
    isAnnualOnlyStarName(exactCanonicalStarName(rule.starName)) &&
    rule.allowedTemporalLayers.includes("natal") &&
    !rule.allowedTemporalLayers.includes("annual")
  ) {
    issues.push(issue(path, "annual-only star cannot be natal-only"));
  } else if (
    isAnnualOnlyStarName(exactCanonicalStarName(rule.starName)) &&
    rule.allowedTemporalLayers.length === 1 &&
    rule.allowedTemporalLayers[0] === "natal"
  ) {
    issues.push(issue(path, "Lưu star rule cannot allow only natal layer"));
  }
}

function validateRegistry(
  registry: AnnualStarRegistryV08,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  if (registry.schemaVersion !== "0.8.0") {
    issues.push(issue("starRegistry.schemaVersion", "must be 0.8.0"));
  }
  if (registry.catalogId !== "annual-star-registry-nam-phai-v0-8") {
    issues.push(issue("starRegistry.catalogId", "unexpected catalogId"));
  }
  const seenRuleIds = new Set<string>();
  for (const domain of DOMAINS) {
    const axis = registry.axes[domain];
    if (!axis) {
      issues.push(issue(`starRegistry.axes.${domain}`, "missing"));
      continue;
    }
    for (const rule of axis.positive) validateRule(domain, rule, "positive", seenRuleIds, issues);
    for (const rule of axis.negative) validateRule(domain, rule, "negative", seenRuleIds, issues);
  }
  for (const sourceId of registry.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`starRegistry.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validateAliases(
  aliases: AnnualStarAliasesV08,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  if (aliases.schemaVersion !== "0.8.0") {
    issues.push(issue("starAliases.schemaVersion", "must be 0.8.0"));
  }
  if (!Array.isArray(aliases.aliases)) {
    issues.push(issue("starAliases.aliases", "must be an array"));
    return;
  }

  const aliasToCanonical = new Map<string, string>();
  const familyMemberSet = new Set<string>();
  for (const [familyId, members] of Object.entries(aliases.families ?? {})) {
    if (!Array.isArray(members) || members.length < 2) {
      issues.push(issue(`starAliases.families.${familyId}`, "family must have ≥2 members"));
      continue;
    }
    for (const member of members) {
      familyMemberSet.add(exactCanonicalStarName(member));
    }
  }

  for (const [i, entry] of aliases.aliases.entries()) {
    const alias = exactCanonicalStarName(entry.alias);
    const canonical = exactCanonicalStarName(entry.canonical);
    if (!alias || !canonical) {
      issues.push(issue(`starAliases.aliases[${i}]`, "alias and canonical required"));
      continue;
    }
    if (aliasToCanonical.has(alias) && aliasToCanonical.get(alias) !== canonical) {
      issues.push(issue(`starAliases.aliases[${i}]`, "alias points to multiple canonical stars"));
    }
    aliasToCanonical.set(alias, canonical);

    const aliasAnnual = isAnnualOnlyStarName(alias);
    const canonAnnual = isAnnualOnlyStarName(canonical);
    if (aliasAnnual !== canonAnnual && alias !== canonical) {
      // Allow "Thiên Khôi (Lưu)" → "Lưu Thiên Khôi" style via spelling map already exact.
      if (!(alias.includes("Lưu") || canonical.includes("Lưu"))) {
        issues.push(issue(`starAliases.aliases[${i}]`, "alias crosses temporal layers"));
      }
    }

    // Distinct family members must not be registered as exact aliases of each other.
    if (
      familyMemberSet.has(alias) &&
      familyMemberSet.has(canonical) &&
      alias !== canonical
    ) {
      // Only reject if they appear in the same family as interchangeable aliases.
      for (const members of Object.values(aliases.families)) {
        const set = new Set(members.map(exactCanonicalStarName));
        if (set.has(alias) && set.has(canonical) && alias !== canonical) {
          issues.push(
            issue(
              `starAliases.aliases[${i}]`,
              "family members must not be registered as exact aliases",
            ),
          );
          break;
        }
      }
    }
  }

  const requiredFamilies = [
    "khoi-viet",
    "kinh-da",
    "khong-kiep",
    "long-phuong",
    "thai-toa",
    "quang-quy",
  ];
  for (const key of requiredFamilies) {
    if (!Array.isArray(aliases.families[key]) || aliases.families[key]!.length === 0) {
      issues.push(issue(`starAliases.families.${key}`, "required non-empty family"));
    }
  }

  for (const sourceId of aliases.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`starAliases.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validateScoreBands(
  bands: AnnualScoreBandsV08,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  if (!bands || !Array.isArray(bands.bands) || bands.bands.length === 0) {
    issues.push(issue("scoreBands.bands", "required"));
    return;
  }
  for (const [i, band] of bands.bands.entries()) {
    if (!isFiniteNumber(band.minInclusive)) {
      issues.push(issue(`scoreBands.bands[${i}].minInclusive`, "must be finite"));
    }
    const max = band.maxExclusive ?? band.maxInclusive;
    if (max !== undefined && isFiniteNumber(band.minInclusive) && max < band.minInclusive) {
      issues.push(issue(`scoreBands.bands[${i}]`, "minimum must be <= maximum"));
    }
  }
  for (const sourceId of bands.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`scoreBands.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

function validateGates(
  gates: AnnualDistributionGatesV08,
  resolvedSourceIds: Set<string>,
  issues: AnnualKnowledgeV08ValidationIssue[],
): void {
  for (const [key, value] of Object.entries(gates.hardGates)) {
    if (!KNOWN_GATE_METRICS.has(key)) {
      issues.push(issue(`distributionGates.hardGates.${key}`, "unknown metric name"));
    }
    if (!isFiniteNumber(value)) {
      issues.push(issue(`distributionGates.hardGates.${key}`, "must be finite"));
    }
  }
  for (const sourceId of gates.sourceIds) {
    if (!resolvedSourceIds.has(sourceId)) {
      issues.push(issue(`distributionGates.sourceIds.${sourceId}`, "unresolved source id"));
    }
  }
}

export function validateAnnualAxesKnowledgeV08NamPhai(
  knowledge: AnnualAxesKnowledgeV08NamPhai,
  resolvedSourceIds: Set<string>,
): { ok: true } | { ok: false; issues: AnnualKnowledgeV08ValidationIssue[] } {
  const issues: AnnualKnowledgeV08ValidationIssue[] = [];
  if (knowledge.knowledgeVersion !== V08_KNOWLEDGE_VERSION) {
    issues.push(issue("knowledgeVersion", `must be ${V08_KNOWLEDGE_VERSION}`));
  }
  validateMapping(knowledge.domainMapping, resolvedSourceIds, issues);
  validatePointClasses(knowledge.pointClasses, resolvedSourceIds, issues);
  validateRegistry(knowledge.starRegistry, resolvedSourceIds, issues);
  validateAliases(knowledge.starAliases, resolvedSourceIds, issues);
  validateScoreBands(knowledge.scoreBands, resolvedSourceIds, issues);
  validateGates(knowledge.distributionGates, resolvedSourceIds, issues);
  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
