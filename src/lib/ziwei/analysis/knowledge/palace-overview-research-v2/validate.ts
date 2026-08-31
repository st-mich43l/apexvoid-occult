import type {
  AxisSeed,
  KnowledgeRecordMeta,
  KnowledgeStatus,
  MinorBrightnessPolicy,
  MinorFamilyRecord,
  MinorStarScoringMode,
  PalaceOverviewKnowledgeV1,
  PalaceOverviewProfile,
} from "./schema";
import scoreDistribution from "../palace-overview/v1/score-distribution.v1.json";

const SCORING_MODES: ReadonlySet<MinorStarScoringMode> = new Set([
  "direct",
  "context-only",
]);

const BRIGHTNESS_POLICIES: ReadonlySet<MinorBrightnessPolicy> = new Set([
  "none",
  "hoa-linh",
  "literary-if-present",
]);

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
  {
    const { focus, trine, opposite } = profile.geometry;
    if (!(focus > 2 * trine + opposite)) {
      issues.push({
        path: "profile.geometry",
        message: "bản cung must outweigh 2 tam hợp + 1 xung (focus > 2×trine + opposite)",
      });
    }
    if (!(trine >= opposite && trine < focus)) {
      issues.push({
        path: "profile.geometry",
        message: "focus > trine >= opposite (xung weaker than tam hợp, both < bản cung)",
      });
    }
  }
  if (profile.familyMaxContributors < 1) {
    issues.push({
      path: "profile.familyMaxContributors",
      message: "must be >= 1",
    });
  }
  {
    const dim = profile.focusMajorDiminishing;
    if (!Array.isArray(dim) || dim.length < 2 || dim[0] !== 1) {
      issues.push({
        path: "profile.focusMajorDiminishing",
        message: "focusMajorDiminishing[0] must be 1 (sao chủ)",
      });
    } else {
      for (let i = 1; i < dim.length; i++) {
        if (!(dim[i]! < dim[i - 1]! && dim[i]! > 0)) {
          issues.push({
            path: "profile.focusMajorDiminishing",
            message: "must be strictly decreasing and > 0 (同宫 không cộng tuyến tính)",
          });
          break;
        }
      }
      const dac = Math.abs(profile.brightnessQuality.Đắc ?? 0);
      if (dim[1]! > dac + 1e-9) {
        issues.push({
          path: "profile.focusMajorDiminishing",
          message: "second tọa star ≤ Đắc (辅, not a second 体 Miếu)",
        });
      }
    }
  }
  if (
    profile.qualityNormalization.method !== "logistic" &&
    profile.qualityNormalization.method !== "cat-share" &&
    profile.qualityNormalization.method !== "linear-net"
  ) {
    issues.push({
      path: "profile.qualityNormalization.method",
      message: "method must be logistic, cat-share, or linear-net",
    });
  }
  if (profile.qualityNormalization.midpoint !== 50) {
    issues.push({
      path: "profile.qualityNormalization.midpoint",
      message: "midpoint 50 is equal cát/hung (net 0)",
    });
  }
  if (
    profile.qualityNormalization.method === "cat-share" ||
    profile.qualityNormalization.method === "linear-net"
  ) {
    if (profile.qualityNormalization.offset !== 0) {
      issues.push({
        path: "profile.qualityNormalization.offset",
        message: `${profile.qualityNormalization.method} must keep offset 0`,
      });
    }
    if (profile.qualityNormalization.ceiling !== 100) {
      issues.push({
        path: "profile.qualityNormalization.ceiling",
        message: "ceiling must be 100",
      });
    }
    if (profile.qualityNormalization.floor !== 0) {
      issues.push({
        path: "profile.qualityNormalization.floor",
        message: "floor must be 0",
      });
    }
  }
  const offset = profile.qualityNormalization.offset;
  if (!Number.isFinite(offset) || Math.abs(offset) > 20) {
    issues.push({
      path: "profile.qualityNormalization.offset",
      message: `offset must be finite and |offset| <= 20 (got ${offset})`,
    });
  }
  const bands = profile.bandThresholds;
  if (!bands) {
    issues.push({
      path: "profile.bandThresholds",
      message: "band thresholds must be declared (no implicit magic numbers)",
    });
  } else if (
    !(
      bands.lowMaxInclusive < bands.guardedMaxExclusive &&
      bands.guardedMaxExclusive < bands.balancedMaxExclusive &&
      bands.balancedMaxExclusive < bands.supportiveMaxExclusive &&
      bands.supportiveMaxExclusive < 100
    )
  ) {
    issues.push({
      path: "profile.bandThresholds",
      message: "band thresholds must be strictly increasing and < 100",
    });
  } else {
    const dist = scoreDistribution as {
      profileVersion?: string;
      suggestedBandThresholds?: {
        lowMaxInclusive: number;
        guardedMaxExclusive: number;
        balancedMaxExclusive: number;
        supportiveMaxExclusive: number;
      };
    };
    if (dist.profileVersion !== profile.version) {
      console.warn(
        "palace-overview score-distribution.v1.json is stale; re-run research:palace-overview:derive-bands",
      );
    } else if (dist.suggestedBandThresholds) {
      const s = dist.suggestedBandThresholds;
      const pairs: Array<[keyof typeof s, number]> = [
        ["lowMaxInclusive", bands.lowMaxInclusive],
        ["guardedMaxExclusive", bands.guardedMaxExclusive],
        ["balancedMaxExclusive", bands.balancedMaxExclusive],
        ["supportiveMaxExclusive", bands.supportiveMaxExclusive],
      ];
      for (const [key, value] of pairs) {
        if (Math.abs(value - s[key]) > 2) {
          issues.push({
            path: `profile.bandThresholds.${key}`,
            message: `${key}=${value} is more than ±2 from derived quantile ${s[key]}`,
          });
        }
      }
    }
  }
  const xc = profile.xungChieu;
  if (!xc) {
    issues.push({
      path: "profile.xungChieu",
      message: "xung chiếu factors must be declared (KB cung đối diện)",
    });
  } else {
    for (const key of [
      "phaCachFactor",
      "cuuGiaiFactor",
      "bothCatFactor",
      "bothHungFactor",
    ] as const) {
      const v = xc[key];
      if (!Number.isFinite(v) || v < 0 || v > 2) {
        issues.push({
          path: `profile.xungChieu.${key}`,
          message: `${key} must be in [0, 2] (got ${v})`,
        });
      }
    }
  }
  const bq = profile.brightnessQuality;
  for (const key of ["Miếu", "Vượng", "Đắc", "Bình", "Hãm"]) {
    if (typeof bq?.[key] !== "number" || Number.isNaN(bq[key])) {
      issues.push({
        path: `profile.brightnessQuality.${key}`,
        message: "brightness quality must be a number",
      });
    }
  }
  const tq = profile.tuHoaQuality;
  for (const key of ["Lộc", "Quyền", "Khoa", "Kỵ", "kyInTuMo"] as const) {
    if (typeof tq?.[key] !== "number" || Number.isNaN(tq[key])) {
      issues.push({
        path: `profile.tuHoaQuality.${key}`,
        message: "tu hoa quality must be a number",
      });
    }
  }
  if (!Array.isArray(profile.tuMoBranches) || profile.tuMoBranches.length !== 4) {
    issues.push({
      path: "profile.tuMoBranches",
      message: "tứ mộ must be Thìn Tuất Sửu Mùi",
    });
  }
}

function validateMinorStars(
  knowledge: PalaceOverviewKnowledgeV1,
  familyById: Map<string, MinorFamilyRecord>,
  issues: KnowledgeValidationIssue[],
): void {
  const sourceIds = new Set(knowledge.sources.sources.map((s) => s.id));
  const seenStarIds = new Set<string>();
  const seenNames = new Set<string>();
  const seenCanonicalNames = new Set<string>();
  const stateModifierPolicyKeys = new Set(
    Object.keys(knowledge.minorStateModifiers.policies),
  );

  const excludedNames = new Set([
    ...knowledge.schoolCoverage.excludedFromStaticScoring.transformMarkers,
    ...knowledge.schoolCoverage.excludedFromStaticScoring.voidMarkers,
    ...knowledge.schoolCoverage.excludedFromStaticScoring.annualExamples,
    ...knowledge.schoolCoverage.excludedFromStaticScoring.changShengSeparate,
  ]);
  const specialCaseNames = new Set(
    knowledge.schoolCoverage.specialCases.map((c) => c.name),
  );

  for (const star of knowledge.minorStars.stars) {
    const path = `minorStars.${star.id}`;

    if (seenStarIds.has(star.id)) {
      issues.push({ path, message: `duplicate minor-star record id: ${star.id}` });
    }
    seenStarIds.add(star.id);

    if (seenNames.has(star.name)) {
      issues.push({ path, message: `duplicate minor-star name: ${star.name}` });
    }
    seenNames.add(star.name);

    if (seenCanonicalNames.has(star.canonicalName)) {
      issues.push({
        path,
        message: `canonical star assigned more than once: ${star.canonicalName}`,
      });
    }
    seenCanonicalNames.add(star.canonicalName);

    const family = familyById.get(star.familyId);
    if (!family) {
      issues.push({ path, message: `missing family: ${star.familyId}` });
    }

    const scoringMode = star.scoringMode as MinorStarScoringMode;
    if (!SCORING_MODES.has(scoringMode)) {
      issues.push({ path, message: `invalid scoringMode: ${star.scoringMode}` });
    }

    const brightnessPolicy = star.brightnessPolicy as MinorBrightnessPolicy;
    if (!BRIGHTNESS_POLICIES.has(brightnessPolicy)) {
      issues.push({
        path,
        message: `invalid brightnessPolicy: ${star.brightnessPolicy}`,
      });
    } else if (!stateModifierPolicyKeys.has(brightnessPolicy)) {
      issues.push({
        path,
        message: `unknown state modifier policy: ${brightnessPolicy}`,
      });
    }

    if (scoringMode === "context-only") {
      const axes = star.axesOverride;
      if (
        axes &&
        (axes.support !== 0 ||
          axes.pressure !== 0 ||
          axes.stability !== 0 ||
          axes.activation !== 0)
      ) {
        issues.push({
          path,
          message: "context-only record must not have non-zero axesOverride",
        });
      }
    }

    if (scoringMode === "direct" && family?.id === "context-only") {
      issues.push({
        path,
        message: "direct record cannot use a context-only family",
      });
    }

    if (star.axesOverride) validateAxes(star.axesOverride, path, issues);

    for (const id of star.sourceIds) {
      if (!sourceIds.has(id)) {
        issues.push({ path, message: `unsupported source id: ${id}` });
      }
    }

    if (!star.schoolProfiles.length) {
      issues.push({ path, message: "record absent from all school profiles" });
    }

    if (excludedNames.has(star.name) && !specialCaseNames.has(star.name)) {
      issues.push({
        path,
        message: `star present in exclusion list without explicit special case: ${star.name}`,
      });
    }
  }
}

function validateTransformationMatrix(
  knowledge: PalaceOverviewKnowledgeV1,
  issues: KnowledgeValidationIssue[],
): void {
  const matrix = knowledge.transformationMatrix;
  const hoaKinds = ["Lộc", "Quyền", "Khoa", "Kỵ"] as const;
  if (matrix.cells.length !== 41) {
    issues.push({
      path: "transformationMatrix.cells",
      message: `expected 41 cells (Nam∪TC school Tứ Hóa pairs after PR #262), got ${matrix.cells.length}`,
    });
  }
  const seen = new Set<string>();
  for (const cell of matrix.cells) {
    const key = `${cell.star}:${cell.transformation}`;
    if (seen.has(key)) {
      issues.push({ path: `transformationMatrix.${key}`, message: "duplicate cell" });
    }
    seen.add(key);
    if (cell.star === "Thiên Tướng" || cell.star === "Thất Sát") {
      issues.push({
        path: `transformationMatrix.${key}`,
        message: "Thiên Tướng and Thất Sát never receive Tứ Hóa",
      });
    }
    const fb = matrix.fallback[cell.transformation];
    if (!fb) {
      issues.push({ path: `transformationMatrix.${key}`, message: "missing fallback" });
      continue;
    }
    if (cell.usesFallback) {
      if (
        cell.supportDelta !== fb.supportDelta ||
        cell.pressureDelta !== fb.pressureDelta ||
        cell.stabilityDelta !== fb.stabilityDelta ||
        cell.activationDelta !== fb.activationDelta
      ) {
        issues.push({
          path: `transformationMatrix.${key}`,
          message: "usesFallback cell must copy fallback deltas exactly",
        });
      }
    }
  }
  for (const kind of hoaKinds) {
    const seed = knowledge.transformations.transformations.find((t) => t.transformation === kind);
    const fb = matrix.fallback[kind];
    if (!seed || !fb) continue;
    if (
      seed.axes.support !== fb.supportDelta ||
      seed.axes.pressure !== fb.pressureDelta ||
      seed.axes.stability !== fb.stabilityDelta ||
      seed.axes.activation !== fb.activationDelta
    ) {
      issues.push({
        path: `transformationMatrix.fallback.${kind}`,
        message: "fallback must equal transformations.json seed (migration guard)",
      });
    }
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
    { path: "transformationMatrix", meta: knowledge.transformationMatrix },
    { path: "minorFamilies", meta: knowledge.minorFamilies },
    { path: "minorStars", meta: knowledge.minorStars },
    { path: "minorStateModifiers", meta: knowledge.minorStateModifiers },
    { path: "starAliases", meta: knowledge.starAliases },
    { path: "schoolCoverage", meta: knowledge.schoolCoverage },
    { path: "voidEnvironment", meta: knowledge.voidEnvironment },
    { path: "changSheng", meta: knowledge.changSheng },
    { path: "structuralRules", meta: knowledge.structuralRules },
    { path: "starSystems", meta: knowledge.starSystems },
    { path: "formula", meta: knowledge.formula },
    { path: "gapMatrix", meta: knowledge.gapMatrix },
    { path: "palaceBranchDignity", meta: knowledge.palaceBranchDignity },
  ];

  for (const { path, meta } of catalogs) {
    if (!isMeta(meta)) {
      issues.push({ path, message: "missing knowledge meta fields" });
      continue;
    }
    validateMeta(meta, path, issues, seenIds);
  }

  validateProfile(knowledge.profile, issues);

  if (
    knowledge.profile.voidMajorBorrowFactor !==
    knowledge.voidEnvironment.voidMajorBorrowFactor
  ) {
    issues.push({
      path: "profile.voidMajorBorrowFactor",
      message:
        "must equal voidEnvironment.voidMajorBorrowFactor (runtime SSOT is void-environment.json)",
    });
  }

  if (knowledge.majorStars.stars.length !== 14) {
    issues.push({
      path: "majorStars.stars",
      message: `expected 14 major stars, got ${knowledge.majorStars.stars.length}`,
    });
  }
  for (const star of knowledge.majorStars.stars) {
    validateAxes(star.axes, `majorStars.${star.name}`, issues);
  }

  const familyById = new Map(
    knowledge.minorFamilies.families.map((f) => [f.id, f]),
  );
  const diminishingGroups = new Set<string>();
  for (const family of knowledge.minorFamilies.families) {
    validateAxes(family.axes, `minorFamilies.${family.id}`, issues);
    if (!family.diminishingGroup) {
      issues.push({
        path: `minorFamilies.${family.id}`,
        message: "family missing diminishingGroup",
      });
    } else if (diminishingGroups.has(family.diminishingGroup)) {
      issues.push({
        path: `minorFamilies.${family.id}`,
        message: `diminishingGroup not unique: ${family.diminishingGroup}`,
      });
    }
    diminishingGroups.add(family.diminishingGroup);
  }

  validateMinorStars(knowledge, familyById, issues);

  validateTransformationMatrix(knowledge, issues);

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

  validateStarSystems(knowledge, issues);
  validateFormula(knowledge, issues);
  validateGapMatrix(knowledge, issues);

  return { ok: issues.length === 0, issues };
}

const FORMULA_LAYER_IDS = [
  "major-brightness-tu-hoa",
  "geometry-tp4c",
  "structural-formations",
  "minor-family",
  "combinations",
  "thai-tue-loc-ton-void",
  "palace-role",
] as const;

function validateFormula(
  knowledge: PalaceOverviewKnowledgeV1,
  issues: KnowledgeValidationIssue[],
): void {
  const formula = knowledge.formula;
  if (!formula?.layers) {
    issues.push({ path: "formula.layers", message: "Apexvoid formula layers required" });
    return;
  }
  const ids = formula.layers.map((l) => l.id);
  for (const required of FORMULA_LAYER_IDS) {
    if (!ids.includes(required)) {
      issues.push({ path: "formula.layers", message: `missing layer ${required}` });
    }
  }
  const geo = formula.layers.find((l) => l.id === "geometry-tp4c");
  if (geo?.giapCung) {
    issues.push({
      path: "formula.layers.geometry-tp4c",
      message: "giapCung must stay false until adjacent frame roles exist (KB §3 vs KẾT LUẬN)",
    });
  }
  const palace = formula.layers.find((l) => l.id === "palace-role");
  if (palace?.enabled && knowledge.palaceBranchDignity.entries.length === 0) {
    issues.push({
      path: "formula.layers.palace-role",
      message: "palace-role stays disabled until palace×branch dignity cells exist",
    });
  }
  if (formula.display?.method !== "absolute-tanh") {
    issues.push({
      path: "formula.display.method",
      message: "display must be absolute-tanh (per-palace, not chart z-score)",
    });
  }
  const mieuRef = formula.display?.mieuRef;
  const expected =
    (knowledge.profile.brightnessQuality.Miếu ?? 1) * knowledge.profile.geometry.focus;
  if (typeof mieuRef !== "number" || Math.abs(mieuRef - expected) > 1e-9) {
    issues.push({
      path: "formula.display.mieuRef",
      message: `mieuRef must equal Miếu×focus (${expected})`,
    });
  }
  const wantScale = expected * Math.SQRT2;
  if (
    typeof formula.display?.tanhScale !== "number" ||
    Math.abs(formula.display.tanhScale - wantScale) > 1e-6
  ) {
    issues.push({
      path: "formula.display.tanhScale",
      message: `tanhScale must equal Miếu×√2 (${wantScale})`,
    });
  }
  if (Math.abs(knowledge.profile.qualityNormalization.scale - expected) > 1e-9) {
    issues.push({
      path: "profile.qualityNormalization.scale",
      message: `scale must equal one Miếu tọa (${expected}), not a free saturation constant`,
    });
  }
  const yongCap = formula.display?.yongCapMieu;
  if (typeof yongCap !== "number" || !(yongCap > 0 && yongCap <= expected)) {
    issues.push({
      path: "formula.display.yongCapMieu",
      message: "yongCapMieu must be in (0, one Miếu] so 用 cannot outrank 体",
    });
  }
  const ham = knowledge.profile.brightnessQuality.Hãm ?? 0;
  const dac = knowledge.profile.brightnessQuality.Đắc ?? 0;
  if (!(ham < 0 && Math.abs(ham) <= Math.abs(dac) + 1e-9)) {
    issues.push({
      path: "profile.brightnessQuality.Hãm",
      message: "Hãm is 失势: negative but |Hãm| ≤ Đắc so natal palaces do not map to empty",
    });
  }
  const combo = formula.layers.find((l) => l.id === "combinations");
  const formations = formula.layers.find((l) => l.id === "structural-formations");
  if (
    combo?.enabled &&
    formations &&
    (combo.gain ?? 1) > (formations.gain ?? 1) + 1e-9
  ) {
    issues.push({
      path: "formula.layers.combinations.gain",
      message: "tổ hợp 用 must not outrank cách cục 用",
    });
  }
}

function validateGapMatrix(
  knowledge: PalaceOverviewKnowledgeV1,
  issues: KnowledgeValidationIssue[],
): void {
  const gap = knowledge.gapMatrix;
  if (!gap?.entries?.length) {
    issues.push({ path: "gapMatrix.entries", message: "gap matrix must list stars and cách cục" });
    return;
  }
  const ids = new Set<string>();
  for (const row of knowledge.starSystems.roster) {
    ids.add(row.canonicalName);
  }
  for (const name of ids) {
    if (!gap.entries.some((e) => e.kind === "star" && e.id === name)) {
      issues.push({ path: "gapMatrix.entries", message: `missing roster star ${name}` });
    }
  }
}

function validateStarSystems(
  knowledge: PalaceOverviewKnowledgeV1,
  issues: KnowledgeValidationIssue[],
): void {
  const sys = knowledge.starSystems;
  if (!sys) {
    issues.push({ path: "starSystems", message: "nam-phai star systems catalog missing" });
    return;
  }
  if (sys.thaiTueTamHop?.length !== 4) {
    issues.push({
      path: "starSystems.thaiTueTamHop",
      message: "must list the 4 Nam Phái Thái Tuế tam hợp groups",
    });
  }
  if (!sys.locTonCycle) {
    issues.push({
      path: "starSystems.locTonCycle",
      message: "Lộc Tồn cycle weights required",
    });
  }
  if (!Array.isArray(sys.cycles?.thaiTue) || sys.cycles.thaiTue.length !== 12) {
    issues.push({
      path: "starSystems.cycles.thaiTue",
      message: "Thái Tuế cycle must have 12 names",
    });
  }
  if (!Array.isArray(sys.cycles?.bacSi) || sys.cycles.bacSi.length !== 12) {
    issues.push({
      path: "starSystems.cycles.bacSi",
      message: "Bác Sĩ cycle must have 12 names",
    });
  }

  const rosterNames = new Set<string>();
  for (const [i, row] of sys.roster.entries()) {
    if (!row.canonicalName) {
      issues.push({ path: `starSystems.roster[${i}]`, message: "missing canonicalName" });
      continue;
    }
    if (rosterNames.has(row.canonicalName)) {
      issues.push({
        path: `starSystems.roster.${row.canonicalName}`,
        message: "duplicate roster name",
      });
    }
    rosterNames.add(row.canonicalName);
  }

  for (const star of knowledge.majorStars.stars) {
    if (!rosterNames.has(star.name)) {
      issues.push({
        path: "starSystems.roster",
        message: `missing major ${star.name}`,
      });
    }
  }
  for (const name of knowledge.schoolCoverage.staticMinorStars.shared) {
    if (!rosterNames.has(name)) {
      issues.push({
        path: "starSystems.roster",
        message: `missing shared minor ${name}`,
      });
    }
  }
  for (const name of knowledge.schoolCoverage.staticMinorStars.trungChauOnly) {
    if (!rosterNames.has(name)) {
      issues.push({
        path: "starSystems.roster",
        message: `missing Trung Châu-only ${name}`,
      });
    }
  }

  const ruleIds = new Set(knowledge.structuralRules.rules.map((r) => r.id));
  const comboIds = new Set<string>();
  let numericPairs = 0;
  for (const c of sys.combinations) {
    const path = `starSystems.combinations.${c.id}`;
    if (comboIds.has(c.id)) {
      issues.push({ path, message: "duplicate combination id" });
    }
    comboIds.add(c.id);
    if (c.scoring === "numeric") numericPairs += 1;
    if (c.scoring === "via-structural-rule") {
      if (!c.structuralRuleId || !ruleIds.has(c.structuralRuleId)) {
        issues.push({
          path,
          message: `unknown structuralRuleId ${c.structuralRuleId ?? "(missing)"}`,
        });
      }
    }
    if (c.scoring === "numeric") {
      if (typeof c.support !== "number" || typeof c.pressure !== "number") {
        issues.push({ path, message: "numeric combination needs support/pressure" });
      }
    }
    for (const name of c.participants) {
      if (!rosterNames.has(name)) {
        issues.push({ path, message: `unknown participant ${name}` });
      }
    }
  }
  if (numericPairs < 4) {
    issues.push({
      path: "starSystems.combinations",
      message: "Tả Hữu / Khôi Việt / Xương Khúc / Không Kiếp required as numeric rows",
    });
  }
}

function isLoadableStatus(status: KnowledgeStatus): boolean {
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
    ["transformationMatrix", knowledge.transformationMatrix.status],
    ["minorFamilies", knowledge.minorFamilies.status],
    ["minorStars", knowledge.minorStars.status],
    ["minorStateModifiers", knowledge.minorStateModifiers.status],
    ["starAliases", knowledge.starAliases.status],
    ["schoolCoverage", knowledge.schoolCoverage.status],
    ["voidEnvironment", knowledge.voidEnvironment.status],
    ["changSheng", knowledge.changSheng.status],
    ["structuralRules", knowledge.structuralRules.status],
    ["starSystems", knowledge.starSystems.status],
    ["formula", knowledge.formula.status],
    ["gapMatrix", knowledge.gapMatrix.status],
    ["palaceBranchDignity", knowledge.palaceBranchDignity.status],
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
