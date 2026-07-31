/**
 * Feature flag for palace-overview V1.
 * Default ON. Kill-switch via VITE_ZIWEI_PALACE_OVERVIEW_V1=false, or
 * ?ziweiPalaceOverviewV1=0 (persisted in sessionStorage) for a per-session
 * opt-out; ?ziweiPalaceOverviewV1=1 persists a per-session opt-in override.
 */
const PALACE_OVERVIEW_FEATURE_FLAG = "ziweiPalaceOverviewV1";

function readEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  return (import.meta as any).env?.[key];
}

function readSessionFlag(
  flag: string,
  envValue: string | undefined,
  defaultOn: boolean,
): boolean {
  if (envValue === "false") return false;
  if (envValue === "true" && typeof window === "undefined") return true;
  if (typeof window === "undefined") return defaultOn;
  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(flag);
    if (queryValue === "0" || queryValue === "1") {
      window.sessionStorage.setItem(flag, queryValue);
    }
    const stored = window.sessionStorage.getItem(flag);
    if (stored === "0") return false;
    if (stored === "1") return true;
    if (envValue === "true") return true;
    if (envValue === "false") return false;
    return defaultOn;
  } catch {
    return defaultOn;
  }
}

export function isPalaceOverviewV1Enabled(): boolean {
  return readSessionFlag(
    PALACE_OVERVIEW_FEATURE_FLAG,
    readEnv("VITE_ZIWEI_PALACE_OVERVIEW_V1"),
    true,
  );
}

/**
 * Annual Axes module visibility — default ON.
 * Kill-switch: ?ziweiAnnualAxes=0
 */
const ANNUAL_AXES_FEATURE_FLAG = "ziweiAnnualAxes";
export function isAnnualAxesEnabled(): boolean {
  return readSessionFlag(
    ANNUAL_AXES_FEATURE_FLAG,
    readEnv("VITE_ZIWEI_ANNUAL_AXES"),
    true,
  );
}

export const HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG = "ziweiHuyenKhiPreviewV01";

export function isHuyenKhiPreviewV01Enabled(): boolean {
  if (typeof window === "undefined") return false;
  const envVal = readEnv("VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01");
  if (envVal === "false") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG);
    if (queryValue === "0" || queryValue === "1") {
      window.sessionStorage.setItem(HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG, queryValue);
    }
    const stored = window.sessionStorage.getItem(HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG);
    if (stored === "0") return false;
    if (stored === "1") return true;
    return readEnv("VITE_ZIWEI_HUYEN_KHI_PREVIEW_V01") === "true";
  } catch {
    return false;
  }
}

/**
 * Major Fortune V0.3 ordinal — production path with kill-switch.
 * Default ON. Disable via VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL=false
 * or ?ziweiMajorFortuneV03Ordinal=0 (session).
 */
export const MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG = "ziweiMajorFortuneV03Ordinal";

export function isMajorFortuneV03OrdinalEnabled(): boolean {
  return readSessionFlag(
    MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG,
    readEnv("VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL"),
    true,
  );
}

/**
 * Monthly Flow V0.1 production — default ON.
 * Kill-switch: VITE_ZIWEI_MONTHLY_FLOW_V01=false
 * or ?ziweiMonthlyFlowV01=0 (session).
 */
export const MONTHLY_FLOW_V01_FEATURE_FLAG = "ziweiMonthlyFlowV01";

export function isMonthlyFlowV01Enabled(): boolean {
  return readSessionFlag(
    MONTHLY_FLOW_V01_FEATURE_FLAG,
    readEnv("VITE_ZIWEI_MONTHLY_FLOW_V01"),
    true,
  );
}

/**
 * Monthly Flow V0.3 production — default ON for Nam Phái.
 * Kill-switch: VITE_ZIWEI_MONTHLY_FLOW_V03=false
 * or ?ziweiMonthlyFlowV03=0 (session).
 */
const MONTHLY_FLOW_V03_FEATURE_FLAG = "ziweiMonthlyFlowV03";

export function isMonthlyFlowV03Enabled(): boolean {
  return readSessionFlag(
    MONTHLY_FLOW_V03_FEATURE_FLAG,
    readEnv("VITE_ZIWEI_MONTHLY_FLOW_V03"),
    true,
  );
}

/**
 * Major Fortune V0.4 Nam Phái Transformation — production feature.
 * Default ON. Disable via VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS=false
 * or ?ziweiMajorFortuneV04NamPhaiTransformations=0 (session).
 */
export const MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS_FEATURE_FLAG =
  "ziweiMajorFortuneV04NamPhaiTransformations";

export function isMajorFortuneV04NamPhaiTransformationsEnabled(): boolean {
  return readSessionFlag(
    MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS_FEATURE_FLAG,
    readEnv("VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS"),
    false,
  );
}

/**
 * Major Fortune V0.5 Shadow Orchestrator.
 * Default ON in dev/test, OFF in production.
 * Disable via VITE_ZIWEI_MAJOR_FORTUNE_V05_SHADOW=false
 * or ?ziweiMajorFortuneV05Shadow=0 (session).
 */
const MAJOR_FORTUNE_V05_SHADOW_FEATURE_FLAG = "ziweiMajorFortuneV05Shadow";

export function isMajorFortuneV05ShadowEnabled(): boolean {
  let isProd = false;
  if (typeof process !== "undefined" && process.env) {
    isProd = process.env.NODE_ENV === "production";
  } else {
    isProd = (import.meta as any).env?.PROD === true;
  }
  return readSessionFlag(
    MAJOR_FORTUNE_V05_SHADOW_FEATURE_FLAG,
    readEnv("VITE_ZIWEI_MAJOR_FORTUNE_V05_SHADOW"),
    !isProd,
  );
}
