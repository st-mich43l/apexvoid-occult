import { describe, expect, it } from "vitest";
import {
  getSmallLimitIndex,
  PALACE_BRANCHES,
} from "@/lib/ziwei/annual-flow";

const CYCLE = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ",
  "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi",
] as const;

/** Source-side start branches per Wang Tiểu Hạn table (explicit fixtures). */
const SOURCE_START: Record<string, string> = {
  Dần: "Thìn", Ngọ: "Thìn", Tuất: "Thìn",
  Hợi: "Sửu", Mão: "Sửu", Mùi: "Sửu",
  Thân: "Tuất", Tý: "Tuất", Thìn: "Tuất",
  Tỵ: "Mùi", Dậu: "Mùi", Sửu: "Mùi",
};

describe("trung-chau-research-v0 Tiểu Hạn parity", () => {
  for (const birth of CYCLE) {
    for (const gender of ["male", "female"] as const) {
      it(`${birth} / ${gender}: birth-year anchor matches source start group`, () => {
        const idx = getSmallLimitIndex(birth, gender, birth);
        expect(PALACE_BRANCHES[idx]).toBe(SOURCE_START[birth]);
      });
    }
  }
});
