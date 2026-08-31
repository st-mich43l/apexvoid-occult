import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MONTHLY_FLOW_V01_FEATURE_FLAG } from "../../../feature-flags";
import { resolveMonthlyFlowProductionRoute } from "../release-policy";

describe("resolveMonthlyFlowProductionRoute", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Nam / default → V0.3", () => {
    expect(resolveMonthlyFlowProductionRoute("nam-phai")).toEqual({
      available: true,
      school: "nam-phai",
      version: "0.3.0",
      implementation: "v0.3",
    });
    expect(resolveMonthlyFlowProductionRoute()).toEqual({
      available: true,
      school: "nam-phai",
      version: "0.3.0",
      implementation: "v0.3",
    });
  });

  it("TC / default → unsupported", () => {
    expect(resolveMonthlyFlowProductionRoute("trung-chau")).toEqual({
      available: false,
      school: "trung-chau",
      reason: "unsupported-school",
    });
  });

  it("Nam / V01 off → unavailable", () => {
    vi.stubEnv("VITE_ZIWEI_MONTHLY_FLOW_V01", "false");
    expect(resolveMonthlyFlowProductionRoute("nam-phai")).toEqual({
      available: false,
      school: "nam-phai",
      reason: "module-disabled",
    });
  });

  it("Nam / V03 off → unavailable (no 0.1.2 fallback)", () => {
    vi.stubEnv("VITE_ZIWEI_MONTHLY_FLOW_V03", "false");
    expect(resolveMonthlyFlowProductionRoute("nam-phai")).toEqual({
      available: false,
      school: "nam-phai",
      reason: "v03-disabled",
    });
  });

  it("TC / V03 forced on → still unsupported", () => {
    vi.stubEnv("VITE_ZIWEI_MONTHLY_FLOW_V03", "true");
    expect(resolveMonthlyFlowProductionRoute("trung-chau")).toEqual({
      available: false,
      school: "trung-chau",
      reason: "unsupported-school",
    });
  });

  it("query kill-switch disables V01 for session", () => {
    window.history.replaceState({}, "", `/?${MONTHLY_FLOW_V01_FEATURE_FLAG}=0`);
    expect(resolveMonthlyFlowProductionRoute("nam-phai").available).toBe(false);
  });
});
