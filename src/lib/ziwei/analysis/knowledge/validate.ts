import type {
  AxisSeed,
  KnowledgeRecordMeta,
  KnowledgeStatus,
  PalaceOverviewKnowledgeV1,
  PalaceOverviewProfile,
} from "./schema";

const ALLOWED_LOAD: ReadonlySet<KnowledgeStatus> = new Set([
  "approved",
  "experimental",
]);

export interface KnowledgeValidationIssue {
  path: string;
  message: string;
}

export interface KnowledgeValidationResult {
  ok: boolean;
  issues: KnowledgeValidationIssue[];
}

function isMeta(value: unknown): value is KnowledgeRecordMeta {
  if (!value || typeof value !== "object") return false;
  const m = value as KnowledgeRecordMeta;
  return (
    typeof m.id === "string" &&
    typeof m.version === "string" &&
    typeof m.status === "string" &&
    Array.isArray(m.schoolProfiles) &&
    Array.isArray(m.sourceIds) &&
    typeof m.confidence === "number" &&
    typeof m.effectiveFrom === "string"
  );
}

function validateMeta(
  meta: KnowledgeRecordMeta,
  path: string,
  issues: KnowledgeValidationIssue[],
  seenIds: Set<string>,
): void {
  if (seenIds.has(meta.id)) {
    issues.push({ path: `${path}.id`, message: `duplicate knowledge id ${meta.id}` });
  }
  seenIds.add(meta.id);

  if (!["draft", "experimental", "approved", "deprecated"].includes(meta.status)) {
    issues.push({ path: `${path}.status`, message: `invalid status ${meta.status}` });
  }
  if (meta.confidence < 0 || meta.confidence > 1) {
    issues.push({
      path: `${path}.confidence`,
      message: `confidence out of range: ${meta.confidence}`,
    });
  }
  if (!meta.version) {
    issues.push({ path: `${path}.version`, message: "version missing" });
  }
}

function validateAxes(
  axes: AxisSeed,
  path: string,
  issues: KnowledgeValidationIssue[],
): void {
  for (const key of ["support", "pressure", "stability", "activation"] as const) {
    if (typeof axes[key] !== "number" || Number.isNaN(axes[key])) {
      issues.push({ path: `${path}.${key}`, message: "axis must be a number" });
    }
  }
}

function validateProfile(
  profile: PalaceOverviewProfile,
  issues: KnowledgeValidationIssue[],
): void {
  const scales = [
    profile.qualityNormalization.scale,
    profile.axisNormalization.supportScale,
    profile.axisNormalization.pressureScale,
    profile.axisNormalization.activationScale,
    profile.axisNormalization.stabilityScale,
    profile.intensityNormalization.scale,
    profile.geometry.focus,
    profile.geometry.opposite,
    profile.geometry.trine,
  ];
  for (const scale of scales) {
    if (!(scale > 0)) {
      issues.push({ path: "profile.scales", message: `scale must be > 0 (got ${scale})` });
    }
  }
  if (profile.familyMaxContributors < 1) {
    issues.push({
      path: "profile.familyMaxContributors",
      message: "must be >= 1",
    });
  }
}

export function validatePalaceOverviewKnowledge(
  knowledge: PalaceOverviewKnowledgeV1,
): KnowledgeValidationResult {
  const issues: KnowledgeValidationIssue[] = [];
  const seenIds = new Set<string>();

  const catalogs: Array<{ path: string; meta: KnowledgeRecordMeta }> = [
    { path: "profile", meta: knowledge.profile },
    { path: "majorStars", meta: knowledge.majorStars },
    { path: "transformations", meta: knowledge.transformations },
    { path: "minorFamilies", meta: knowledge.minorFamilies },
    { path: "voidEnvironment", meta: knowledge.voidEnvironment },
    { path: "changSheng", meta: knowledge.changSheng },
    { path: "structuralRules", meta: knowledge.structuralRules },
  ];

  for (const { path, meta } of catalogs) {
    if (!isMeta(meta)) {
      issues.push({ path, message: "missing knowledge meta fields" });
      continue;
    }
    validateMeta(meta, path, issues, seenIds);
  }

  validateProfile(knowledge.profile, issues);

  if (knowledge.majorStars.stars.length !== 14) {
    issues.push({
      path: "majorStars.stars",
      message: `expected 14 major stars, got ${knowledge.majorStars.stars.length}`,
    });
  }
  for (const star of knowledge.majorStars.stars) {
    validateAxes(star.axes, `majorStars.${star.name}`, issues);
  }

  const familyStars = new Set<string>();
  for (const family of knowledge.minorFamilies.families) {
    for (const name of family.starNames) {
      if (familyStars.has(name)) {
        issues.push({
          path: `minorFamilies.${family.id}`,
          message: `duplicate star across families: ${name}`,
        });
      }
      familyStars.add(name);
    }
    validateAxes(family.axes, `minorFamilies.${family.id}`, issues);
  }

  for (const rule of knowledge.structuralRules.rules) {
    if (!rule.participants.length) {
      issues.push({
        path: `structuralRules.${rule.id}`,
        message: "participants missing",
      });
    }
    validateAxes(rule.baseAxes, `structuralRules.${rule.id}`, issues);
  }

  for (const source of knowledge.sources.sources) {
    validateMeta(source, `sources.${source.id}`, issues, seenIds);
  }

  return { ok: issues.length === 0, issues };
}

export function isLoadableStatus(status: KnowledgeStatus): boolean {
  return ALLOWED_LOAD.has(status);
}

export function assertLoadableCatalogs(
  knowledge: PalaceOverviewKnowledgeV1,
): KnowledgeValidationIssue[] {
  const issues: KnowledgeValidationIssue[] = [];
  const entries: Array<[string, KnowledgeStatus]> = [
    ["profile", knowledge.profile.status],
    ["majorStars", knowledge.majorStars.status],
    ["transformations", knowledge.transformations.status],
    ["minorFamilies", knowledge.minorFamilies.status],
    ["voidEnvironment", knowledge.voidEnvironment.status],
    ["changSheng", knowledge.changSheng.status],
    ["structuralRules", knowledge.structuralRules.status],
  ];
  for (const [path, status] of entries) {
    if (status === "draft") {
      issues.push({ path, message: "draft knowledge must not load" });
    }
    if (!isLoadableStatus(status) && status !== "deprecated") {
      issues.push({ path, message: `status ${status} is not loadable` });
    }
    if (status === "deprecated") {
      issues.push({ path, message: "deprecated knowledge must not load" });
    }
  }
  return issues;
}
