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
    constraint: "focus >= opposite >= trine > 0",
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
    constraint: "focus >= opposite >= trine",
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
    constraint: "focus >= opposite >= trine",
    usedBy: "collect-evidence",
    risk: "medium",
  });

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
        usedBy: "collect-evidence transformation",
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
    purpose: "Logistic scale for net-quality score",
    astrologyBasis: "presentation / normalization, not doctrine",
    numericProvenance: heuristic,
    status: frozen,
    trainable: true,
    minimum: 1,
    maximum: 40,
    constraint: "method=logistic; midpoint must remain 50",
    usedBy: "computeRadarScore",
    risk: "high",
  });
  out.push({
    id: "quality.midpoint",
    category: "NORMALIZATION",
    value: qn.midpoint,
    file: "profile.json",
    purpose: "Neutral score when support==pressure",
    astrologyBasis: "documented net-quality identity, not astrology",
    numericProvenance: "mathematical identity of logistic(0)",
    status: frozen,
    trainable: false,
    minimum: 50,
    maximum: 50,
    constraint: "must be 50 for current logistic",
    usedBy: "computeRadarScore",
    risk: "low",
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
