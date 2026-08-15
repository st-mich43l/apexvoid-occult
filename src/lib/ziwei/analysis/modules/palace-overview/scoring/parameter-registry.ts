import type { PalaceOverviewKnowledgeV1 } from "../../../knowledge";

export interface ParameterRecord {
  id: string;
  category: string;
  value: number | string;
  file: string;
  purpose: string;
  astrologyBasis: string;
  numericProvenance: string;
  status: string;
  trainable: boolean;
  minimum: number | null;
  maximum: number | null;
  constraint: string;
  usedBy: string;
  risk: string;
}

export function buildParameterRegistry(
  knowledge: PalaceOverviewKnowledgeV1,
): ParameterRecord[] {
  const heuristic = "heuristic-seed";
  const frozen = knowledge.profile.status;
  const out: ParameterRecord[] = [];

  const geo = knowledge.profile.geometry;
  out.push({
    id: "geometry.focus",
    category: "GEOMETRY",
    value: geo.focus,
    file: "profile.json",
    purpose: "Focus-palace geometry weight",
    astrologyBasis: "TP4C focus is the palace under analysis",
    numericProvenance: heuristic,
    status: frozen,
    trainable: true,
    minimum: 0,
    maximum: 2,
    constraint: "focus > 2×trine + opposite; trine >= opposite",
    usedBy: "buildStaticFrame / collect-evidence",
    risk: "medium",
  });
  out.push({
    id: "geometry.opposite",
    category: "GEOMETRY",
    value: geo.opposite,
    file: "profile.json",
    purpose: "Opposite-palace geometry weight",
    astrologyBasis: "Đối cung",
    numericProvenance: heuristic,
    status: frozen,
    trainable: true,
    minimum: 0,
    maximum: 1,
    constraint: "focus > trine >= opposite",
    usedBy: "collect-evidence",
    risk: "medium",
  });
  out.push({
    id: "geometry.trine",
    category: "GEOMETRY",
    value: geo.trine,
    file: "profile.json",
    purpose: "Trine-palace geometry weight",
    astrologyBasis: "Tam hợp",
    numericProvenance: heuristic,
    status: frozen,
    trainable: true,
    minimum: 0,
    maximum: 1,
    constraint: "focus > trine >= opposite",
    usedBy: "collect-evidence",
    risk: "medium",
  });

  const xc = knowledge.profile.xungChieu;
  const xungEntries: Array<[string, number, string]> = [
    ["phaCachFactor", xc.phaCachFactor, "Hung đối phá cát (KB xung chiếu)"],
    ["cuuGiaiFactor", xc.cuuGiaiFactor, "Cát đối cứu hung — weaker than phá cách"],
    ["bothCatFactor", xc.bothCatFactor, "Cả hai cát still 矛盾 — mild assist"],
    ["bothHungFactor", xc.bothHungFactor, "Cả hai hung: xung khắc stacks"],
  ];
  for (const [id, value, purpose] of xungEntries) {
    out.push({
      id: `xungChieu.${id}`,
      category: "XUNG_CHIEU",
      value,
      file: "profile.json",
      purpose,
      astrologyBasis: "Nam Phái 六 cặp xung chiếu — cung_vi_va_tam_hop.md",
      numericProvenance: heuristic,
      status: frozen,
      trainable: true,
      minimum: 0,
      maximum: 2,
      constraint: "in [0, 2]; Cần thầy duyệt",
      usedBy: "computePalaceScore xungChieuNet",
      risk: "high",
    });
  }

  for (const star of knowledge.majorStars.stars) {
    for (const axis of ["support", "pressure", "stability", "activation"] as const) {
      out.push({
        id: `major.${star.name}.${axis}`,
        category: "MAJOR STAR",
        value: star.axes[axis],
        file: "major-stars.json",
        purpose: `Baseline ${axis} seed for ${star.name}`,
        astrologyBasis: "Classical qualitative star nature; numeric seed only",
        numericProvenance: heuristic,
        status: frozen,
        trainable: true,
        minimum: -10,
        maximum: 10,
        constraint: "grouped calibration preferred; ±20% until expert data",
        usedBy: "collect-evidence major",
        risk: "high",
      });
    }
  }

  for (const brightness of Object.keys(knowledge.majorStars.brightnessModifiers)) {
    const mod = knowledge.majorStars.brightnessModifiers[brightness]!;
    out.push({
      id: `brightness.${brightness}.supportFactor`,
      category: "MAJOR STAR",
      value: mod.supportFactor,
      file: "major-stars.json",
      purpose: `Brightness support factor ${brightness}`,
      astrologyBasis: "Miếu/Vượng/Hãm as qualitative brightness",
      numericProvenance: heuristic,
      status: frozen,
      trainable: true,
      minimum: 0,
      maximum: 3,
      constraint: "supportive stars: Miếu must not be worse than Hãm without exception",
      usedBy: "applyBrightness",
      risk: "high",
    });
    out.push({
      id: `brightness.${brightness}.supportDelta`,
      category: "MAJOR STAR",
      value: mod.supportDelta ?? 0,
      file: "major-stars.json",
      purpose: `Brightness additive support delta ${brightness}`,
      astrologyBasis: "全書 廟旺落陷 = amplitude of expression, not 吉/殺 polarity reversal",
      numericProvenance: heuristic,
      status: frozen,
      trainable: true,
      minimum: -5,
      maximum: 5,
      constraint: "v2.1: must stay 0 until a primary source supplies numeric deltas",
      usedBy: "applyBrightness",
      risk: "high",
    });
    out.push({
      id: `brightness.${brightness}.pressureDelta`,
      category: "MAJOR STAR",
      value: mod.pressureDelta ?? 0,
      file: "major-stars.json",
      purpose: `Brightness additive pressure delta ${brightness}`,
      astrologyBasis: "全書 廟旺落陷 = amplitude of expression, not 吉/殺 polarity reversal",
      numericProvenance: heuristic,
      status: frozen,
      trainable: true,
      minimum: -5,
      maximum: 5,
      constraint: "v2.1: must stay 0 until a primary source supplies numeric deltas",
      usedBy: "applyBrightness",
      risk: "high",
    });
  }

  for (const t of knowledge.transformations.transformations) {
    for (const axis of ["support", "pressure", "stability", "activation"] as const) {
      out.push({
        id: `tuhoa.${t.transformation}.${axis}`,
        category: "TRANSFORMATION",
        value: t.axes[axis],
        file: "transformations.json",
        purpose: `Natal Hóa ${t.transformation} ${axis}`,
        astrologyBasis: "Tứ Hóa natal only",
        numericProvenance: heuristic,
        status: frozen,
        trainable: true,
        minimum: -10,
        maximum: 10,
        constraint: "Quyền/Kỵ activation is not automatic bad quality",
        usedBy: "collect-evidence Tứ Hóa fallback / matrix",
        risk: "high",
      });
    }
  }

  for (const cell of knowledge.transformationMatrix.cells) {
    if (cell.usesFallback) continue;
    for (const axis of ["supportDelta", "pressureDelta", "stabilityDelta", "activationDelta"] as const) {
      out.push({
        id: `tuhoa.cell.${cell.star}.${cell.transformation}.${axis}`,
        category: "TRANSFORMATION",
        value: cell[axis],
        file: "transformation-matrix.v1.json",
        purpose: `${cell.label} ${axis}`,
        astrologyBasis: cell.semantics,
        numericProvenance: heuristic,
        status: frozen,
        trainable: true,
        minimum: -10,
        maximum: 10,
        constraint: "star-specific Tứ Hóa transform; not a second evidence copy",
        usedBy: "collect-evidence applyTuHoaDeltas",
        risk: "high",
      });
    }
  }

  for (const family of knowledge.minorFamilies.families) {
    out.push({
      id: `family.${family.id}.support`,
      category: "MINOR",
      value: family.axes.support,
      file: "minor-star-families.json",
      purpose: `Family support seed ${family.id}`,
      astrologyBasis: family.label,
      numericProvenance: heuristic,
      status: frozen,
      trainable: true,
      minimum: -5,
      maximum: 5,
      constraint: "tune family before per-star overrides",
      usedBy: "collect-evidence minor",
      risk: "medium",
    });
  }

  knowledge.profile.familyDiminishingReturns.forEach((factor: number, i: number) => {
    out.push({
      id: `diminishing.rank${i}`,
      category: "MINOR",
      value: factor,
      file: "profile.json",
      purpose: `Diminishing factor for contributor rank ${i}`,
      astrologyBasis: "engineering diminishing returns",
      numericProvenance: heuristic,
      status: frozen,
      trainable: true,
      minimum: 0,
      maximum: 1,
      constraint: "non-increasing sequence",
      usedBy: "collect-evidence minor",
      risk: "medium",
    });
  });

  out.push({
    id: "vcd.borrowFactor",
    category: "VOID",
    value: knowledge.voidEnvironment.voidMajorBorrowFactor,
    file: "void-environment.json",
    purpose: "VCD borrowed opposite major magnitude",
    astrologyBasis: "Vô chính diệu mượn đối cung",
    numericProvenance: heuristic,
    status: frozen,
    trainable: true,
    minimum: 0,
    maximum: 1,
    constraint: "must match profile.voidMajorBorrowFactor",
    usedBy: "collect-evidence VCD",
    risk: "medium",
  });
  out.push({
    id: "void.single.localStructuralMagnitudeFactor",
    category: "VOID",
    value: knowledge.voidEnvironment.singleVoid.localStructuralMagnitudeFactor,
    file: "void-environment.json",
    purpose: "Tuần/Triệt magnitude on structural-rule (phá cách)",
    astrologyBasis: "Tuần Triệt phá cách — stronger than star attenuation",
    numericProvenance: heuristic,
    status: frozen,
    trainable: true,
    minimum: 0,
    maximum: 1,
    constraint: "must be < localMajorMagnitudeFactor (formation break is sharper)",
    usedBy: "applyLocalVoidAttenuation",
    risk: "high",
  });
  out.push({
    id: "void.double.localStructuralMagnitudeFactor",
    category: "VOID",
    value: knowledge.voidEnvironment.doubleVoid.localStructuralMagnitudeFactor,
    file: "void-environment.json",
    purpose: "Double void magnitude on structural-rule (phá cách)",
    astrologyBasis: "Tuần Triệt phá cách",
    numericProvenance: heuristic,
    status: frozen,
    trainable: true,
    minimum: 0,
    maximum: 1,
    constraint: "must be < single-void structural factor",
    usedBy: "applyLocalVoidAttenuation",
    risk: "high",
  });

  for (const rule of knowledge.structuralRules.rules) {
    out.push({
      id: `structural.${rule.id}.support`,
      category: "STRUCTURE",
      value: rule.baseAxes.support,
      file: "structural-rules.json",
      purpose: "Interaction-delta support (not a second star copy)",
      astrologyBasis: rule.label,
      numericProvenance: heuristic,
      status: frozen,
      trainable: true,
      minimum: -10,
      maximum: 10,
      constraint: "calibrate last; stacking must remain bounded",
      usedBy: "evaluate-structural-rules",
      risk: "high",
    });
  }

  for (const stage of knowledge.changSheng.stages) {
    out.push({
      id: `changSheng.${stage.stage}.support`,
      category: "CHANG_SHENG",
      value: stage.axes.support,
      file: "chang-sheng.json",
      purpose: `Tràng Sinh stage ${stage.stage} support`,
      astrologyBasis: "Tràng Sinh vòng",
      numericProvenance: heuristic,
      status: frozen,
      trainable: true,
      minimum: -5,
      maximum: 5,
      constraint: "do not compensate base-star error with this layer",
      usedBy: "collect-evidence chang-sheng",
      risk: "low",
    });
  }

  const qn = knowledge.profile.qualityNormalization;
  out.push({
    id: "quality.scale",
    category: "NORMALIZATION",
    value: qn.scale,
    file: "profile.json",
    purpose: "One Miếu tọa = |net| that maps to 0 or 100",
    astrologyBasis: "trang_thai_va_tuong_tac_sao.md — Miếu địa bản cung is 体 saturation",
    numericProvenance: "formula.display.mieuRef = brightnessQuality.Miếu × geometry.focus",
    status: frozen,
    trainable: true,
    minimum: 1,
    maximum: 40,
    constraint: "production method is linear-net; scale is saturation, not logistic",
    usedBy: "computeRadarScore linear-net",
    risk: "low",
  });
  out.push({
    id: "quality.midpoint",
    category: "NORMALIZATION",
    value: qn.midpoint,
    file: "profile.json",
    purpose: "Neutral score when cát = hung (net 0, including empty palace)",
    astrologyBasis: "equal 吉/兇 is undecided — 50",
    numericProvenance: "linear-net identity at net 0",
    status: frozen,
    trainable: false,
    minimum: 50,
    maximum: 50,
    constraint: "must be 50",
    usedBy: "computePalaceScore",
    risk: "low",
  });
  out.push({
    id: "quality.ceiling",
    category: "NORMALIZATION",
    value: qn.ceiling ?? 100,
    file: "profile.json",
    purpose: "Hard maximum when cát−hung ≥ scale",
    astrologyBasis: "吉星入垣 đủ mạnh — full cát",
    numericProvenance: heuristic,
    status: frozen,
    trainable: false,
    minimum: 100,
    maximum: 100,
    constraint: "must be 100",
    usedBy: "computePalaceScore",
    risk: "low",
  });
  out.push({
    id: "quality.offset",
    category: "NORMALIZATION",
    value: qn.offset,
    file: "profile.json",
    purpose: "Unused by linear-net (production score has no offset)",
    astrologyBasis: "none",
    numericProvenance: heuristic,
    status: frozen,
    trainable: false,
    minimum: -20,
    maximum: 20,
    constraint: "must be 0 for linear-net",
    usedBy: "unused in production computePalaceScore",
    risk: "low",
  });
  out.push({
    id: "quality.stabilityWeight",
    category: "NORMALIZATION",
    value: 0,
    file: "profile.json",
    purpose: "Production score ignores stability; four-axis candidate uses 0.15 in candidates/four-axis-v1",
    astrologyBasis: "none — research candidate only; production weight is 0",
    numericProvenance: heuristic,
    status: frozen,
    trainable: true,
    minimum: 0,
    maximum: 1,
    constraint: "production must remain 0 until expert evidence exists",
    usedBy: "computeFourAxisCandidateScore",
    risk: "high",
  });

  const an = knowledge.profile.axisNormalization;
  const axisScales: Array<[string, number]> = [
    ["supportScale", an.supportScale],
    ["pressureScale", an.pressureScale],
    ["activationScale", an.activationScale],
    ["stabilityScale", an.stabilityScale],
  ];
  for (const [id, value] of axisScales) {
    out.push({
      id: `axis.${id}`,
      category: "NORMALIZATION",
      value,
      file: "profile.json",
      purpose: `Saturating/logistic scale for ${id}`,
      astrologyBasis: "presentation",
      numericProvenance: heuristic,
      status: frozen,
      trainable: true,
      minimum: 1,
      maximum: 40,
      constraint: "positive",
      usedBy: "normalizeAxes",
      risk: "medium",
    });
  }

  out.push({
    id: "intensity.scale",
    category: "NORMALIZATION",
    value: knowledge.profile.intensityNormalization.scale,
    file: "profile.json",
    purpose: "Saturating scale for intensity (not quality)",
    astrologyBasis: "presentation",
    numericProvenance: heuristic,
    status: frozen,
    trainable: true,
    minimum: 1,
    maximum: 50,
    constraint: "positive",
    usedBy: "computeIntensity",
    risk: "medium",
  });

  const bands = knowledge.profile.bandThresholds;
  const bandEntries: Array<[string, number]> = [
    ["lowMaxInclusive", bands.lowMaxInclusive],
    ["guardedMaxExclusive", bands.guardedMaxExclusive],
    ["balancedMaxExclusive", bands.balancedMaxExclusive],
    ["supportiveMaxExclusive", bands.supportiveMaxExclusive],
  ];
  for (const [id, value] of bandEntries) {
    out.push({
      id: `band.${id}`,
      category: "NORMALIZATION",
      value,
      file: "profile.json",
      purpose: "Band label threshold (not a score change)",
      astrologyBasis: "historical labels; not classical constants",
      numericProvenance: "historical V1",
      status: frozen,
      trainable: false,
      minimum: 0,
      maximum: 100,
      constraint: "strictly increasing",
      usedBy: "bandForScore",
      risk: "low",
    });
  }

  return out;
}
