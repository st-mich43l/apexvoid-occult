import { describe, it, expect } from "vitest";
import { validateAcquisitionPack } from "../cli/validate-acquisition-pack.js";

describe("Source Acquisition Round 1A - Địa Lợi", () => {
  it("validates the standard constraints flawlessly", () => {
    expect(() => validateAcquisitionPack()).not.toThrow();
  });
});
