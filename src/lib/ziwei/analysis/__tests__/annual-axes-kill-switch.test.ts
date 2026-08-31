import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getAnalysisStatus } from "../contracts/common";
import {
  ANNUAL_AXES_FEATURE_FLAG,
  isAnnualAxesEnabled,
} from "../feature-flags";

describe("isAnnualAxesEnabled", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults ON", () => {
    expect(isAnnualAxesEnabled()).toBe(true);
  });

  it("env false disables", () => {
    vi.stubEnv("VITE_ZIWEI_ANNUAL_AXES", "false");
    expect(isAnnualAxesEnabled()).toBe(false);
  });

  it("query 0 disables for session", () => {
    window.history.replaceState({}, "", `/?${ANNUAL_AXES_FEATURE_FLAG}=0`);
    expect(isAnnualAxesEnabled()).toBe(false);
  });

  it("env false + query 1 stays off", () => {
    vi.stubEnv("VITE_ZIWEI_ANNUAL_AXES", "false");
    window.history.replaceState({}, "", `/?${ANNUAL_AXES_FEATURE_FLAG}=1`);
    expect(isAnnualAxesEnabled()).toBe(false);
  });
});

describe("getAnalysisStatus annual-axes kill-switch", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("available for both schools when flag defaults ON", () => {
    expect(getAnalysisStatus("annual-axes", { school: "nam-phai" })).toMatchObject({
      status: "available",
      module: "annual-axes",
    });
    expect(getAnalysisStatus("annual-axes", { school: "trung-chau" })).toMatchObject({
      status: "available",
      module: "annual-axes",
    });
  });

  it("returns rebuilding for both schools when env disables the module", () => {
    vi.stubEnv("VITE_ZIWEI_ANNUAL_AXES", "false");
    expect(getAnalysisStatus("annual-axes", { school: "nam-phai" })).toEqual({
      status: "unavailable",
      module: "annual-axes",
      reason: "rebuilding",
    });
    expect(getAnalysisStatus("annual-axes", { school: "trung-chau" })).toEqual({
      status: "unavailable",
      module: "annual-axes",
      reason: "rebuilding",
    });
  });

  it("returns rebuilding for both schools when session query disables", () => {
    window.history.replaceState({}, "", `/?${ANNUAL_AXES_FEATURE_FLAG}=0`);
    expect(getAnalysisStatus("annual-axes", { school: "nam-phai" })).toEqual({
      status: "unavailable",
      module: "annual-axes",
      reason: "rebuilding",
    });
    expect(getAnalysisStatus("annual-axes", { school: "trung-chau" })).toEqual({
      status: "unavailable",
      module: "annual-axes",
      reason: "rebuilding",
    });
  });
});
