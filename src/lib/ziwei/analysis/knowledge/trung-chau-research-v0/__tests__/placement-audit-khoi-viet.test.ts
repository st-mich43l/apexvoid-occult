import { describe, expect, it } from "vitest";
import { TRUNG_CHAU_KHOI_VIET } from "@/lib/ziwei/schools/trung-chau-policy";
import sourceTables from "../trung-chau-source-placement-tables.v0.2.json";

describe("trung-chau-research-v0 Khôi/Việt full audit", () => {
  const sourceTable = sourceTables.khoiViet as Record<string, [string, string]>;

  it("compares explicit source 10-stem table against TRUNG_CHAU_KHOI_VIET", () => {
    for (const [stem, expected] of Object.entries(sourceTable)) {
      const runtime = TRUNG_CHAU_KHOI_VIET[stem as keyof typeof TRUNG_CHAU_KHOI_VIET];
      expect([...runtime]).toEqual(expected);
    }
    expect(Object.keys(sourceTable).length).toBe(10);
  });
});
