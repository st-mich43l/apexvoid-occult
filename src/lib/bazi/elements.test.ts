import { expect, test } from "vitest";
import {
  FIVE_ELEMENTS,
  assertEarthlyBranch,
  assertFiveElement,
  assertHeavenlyStem,
  isEarthlyBranch,
  isHeavenlyStem,
  normalizeEarthlyBranch,
  normalizeFiveElement,
  normalizeHeavenlyStem,
} from "../calendar/domain-tokens";
import { getTenGod } from "./ten-gods";
import {
  elementForDisplay,
  getElement,
  getGeneratingElement,
  getOvercomingElement,
  tryGetElement,
  ELEMENTS,
  assertCanonicalStemBranchTables,
} from "./elements";
import { STEMS, BRANCHES, STEM_ELEMENTS } from "../calendar/sexagenary";

test("strict getElement never invents Thổ for garbage", () => {
  expect(() => getElement("NotAStem")).toThrow(/Invalid/);
  expect(tryGetElement("NotAStem")).toBeNull();
  expect(elementForDisplay("NotAStem")).toBeNull();
});

test("exhaustive stems and branches map to elements", () => {
  assertCanonicalStemBranchTables();
  expect([...FIVE_ELEMENTS]).toEqual(ELEMENTS);
  for (const s of STEMS) {
    expect(ELEMENTS).toContain(getElement(s));
    expect(getElement(s)).toBe(STEM_ELEMENTS[s]);
    expect(isHeavenlyStem(s)).toBe(true);
    expect(normalizeHeavenlyStem(s)).toBe(s);
    expect(assertHeavenlyStem(s)).toBe(s);
  }
  for (const b of BRANCHES) {
    expect(ELEMENTS).toContain(getElement(b));
    expect(isEarthlyBranch(b)).toBe(true);
    expect(assertEarthlyBranch(b)).toBe(b);
  }
  for (const el of ELEMENTS) {
    expect(assertFiveElement(el)).toBe(el);
  }
});

test("Tỵ alias normalizes to Tị without changing element", () => {
  expect(normalizeEarthlyBranch("Tỵ")).toBe("Tị");
  expect(assertEarthlyBranch("Tỵ")).toBe("Tị");
  expect(getElement("Tỵ")).toBe(getElement("Tị"));
  expect(getElement("Tị")).toBe("Hỏa");
});

test("five-element aliases Hoả/Thuỷ normalize to Hỏa/Thủy", () => {
  expect(normalizeFiveElement("Hoả")).toBe("Hỏa");
  expect(normalizeFiveElement("Thuỷ")).toBe("Thủy");
});

test("generation and control cycles close", () => {
  for (const el of ELEMENTS) {
    expect(
      getGeneratingElement(
        getGeneratingElement(
          getGeneratingElement(getGeneratingElement(getGeneratingElement(el))),
        ),
      ),
    ).toBe(el);
    expect(
      getOvercomingElement(
        getOvercomingElement(
          getOvercomingElement(getOvercomingElement(getOvercomingElement(el))),
        ),
      ),
    ).toBe(el);
  }
});

test("ten-gods uses canonical elements (Giáp vs Bính = Tài)", () => {
  // Giáp Mộc dương vs Bính Hỏa dương → same polarity produce → Thực Thần
  expect(getTenGod("Giáp", "Bính")).toBe("Thực Thần");
  expect(getTenGod("Giáp", "Ất")).toBe("Kiếp Tài");
});
