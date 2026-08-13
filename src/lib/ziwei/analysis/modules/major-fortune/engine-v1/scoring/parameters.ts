export interface V1Parameter {
  parameterId: string;
  value: number;
  version: string;
  purpose: string;
  authority: "ENGINEERING_CALIBRATED" | "EXPERIMENTAL" | "DOMAIN_VERIFIED";
  rationale: string;
}

export const V1_PARAMETERS = {
  GEOMETRY_FOCUS: {
    parameterId: "param-geometry-focus-v1",
    value: 1.00,
    version: "1.0",
    purpose: "Multiplier for physical facts located in the active Major Fortune palace.",
    authority: "ENGINEERING_CALIBRATED",
    rationale: "Baseline weight for active period context."
  } as V1Parameter,
  GEOMETRY_OPPOSITE: {
    parameterId: "param-geometry-opposite-v1",
    value: 0.75,
    version: "1.0",
    purpose: "Multiplier for physical facts located in the opposite (Xung Chiếu) palace.",
    authority: "ENGINEERING_CALIBRATED",
    rationale: "Discounted influence of opposing forces."
  } as V1Parameter,
  GEOMETRY_TRINE: {
    parameterId: "param-geometry-trine-v1",
    value: 0.65,
    version: "1.0",
    purpose: "Multiplier for physical facts located in the trine (Tam Hợp) palaces.",
    authority: "ENGINEERING_CALIBRATED",
    rationale: "Discounted influence of structural support."
  } as V1Parameter,

  TU_HOA_LOC_SUPPORT: { parameterId: "tu-hoa-loc-support", value: 1.00, version: "1.0", purpose: "Lộc support axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_LOC_PRESSURE: { parameterId: "tu-hoa-loc-pressure", value: 0.00, version: "1.0", purpose: "Lộc pressure axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_LOC_STABILITY: { parameterId: "tu-hoa-loc-stability", value: 0.10, version: "1.0", purpose: "Lộc stability axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_LOC_ACTIVATION: { parameterId: "tu-hoa-loc-activation", value: 0.70, version: "1.0", purpose: "Lộc activation axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },

  TU_HOA_QUYEN_SUPPORT: { parameterId: "tu-hoa-quyen-support", value: 0.35, version: "1.0", purpose: "Quyền support axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_QUYEN_PRESSURE: { parameterId: "tu-hoa-quyen-pressure", value: 0.25, version: "1.0", purpose: "Quyền pressure axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_QUYEN_STABILITY: { parameterId: "tu-hoa-quyen-stability", value: 0.00, version: "1.0", purpose: "Quyền stability axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_QUYEN_ACTIVATION: { parameterId: "tu-hoa-quyen-activation", value: 1.00, version: "1.0", purpose: "Quyền activation axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },

  TU_HOA_KHOA_SUPPORT: { parameterId: "tu-hoa-khoa-support", value: 0.75, version: "1.0", purpose: "Khoa support axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_KHOA_PRESSURE: { parameterId: "tu-hoa-khoa-pressure", value: 0.00, version: "1.0", purpose: "Khoa pressure axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_KHOA_STABILITY: { parameterId: "tu-hoa-khoa-stability", value: 0.80, version: "1.0", purpose: "Khoa stability axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_KHOA_ACTIVATION: { parameterId: "tu-hoa-khoa-activation", value: 0.40, version: "1.0", purpose: "Khoa activation axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },

  TU_HOA_KY_SUPPORT: { parameterId: "tu-hoa-ky-support", value: 0.00, version: "1.0", purpose: "Kỵ support axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_KY_PRESSURE: { parameterId: "tu-hoa-ky-pressure", value: 1.00, version: "1.0", purpose: "Kỵ pressure axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_KY_STABILITY: { parameterId: "tu-hoa-ky-stability", value: -0.75, version: "1.0", purpose: "Kỵ stability axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
  TU_HOA_KY_ACTIVATION: { parameterId: "tu-hoa-ky-activation", value: 0.80, version: "1.0", purpose: "Kỵ activation axis", authority: "ENGINEERING_CALIBRATED", rationale: "RC1 baseline" },
};
