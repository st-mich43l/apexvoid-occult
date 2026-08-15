import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { applyBrightness } from "../collect-evidence";
import type { ZiweiBrightness } from "@/lib/ziwei/analysis/facts";

function knowledge() {
  const loaded = loadPalaceOverviewKnowledgeV1();
  if (!loaded.ok) throw new Error("knowledge");
  return loaded.knowledge;
}

function netOf(starName: string, brightness: ZiweiBrightness): number {
  const k = knowledge();
  const star = k.majorStars.stars.find((s) => s.name === starName);
  if (!star) throw new Error(starName);
  const axes = applyBrightness(star.axes, brightness, k);
  return axes.support - axes.pressure;
}

describe("brightness as amplitude (全書 廟旺落陷)", () => {
  it("for 吉 stars, Miếu nets higher than Hãm on the same identity", () => {
    for (const name of ["Tử Vi", "Thiên Phủ", "Thiên Tướng", "Thiên Lương", "Thái Dương"]) {
      expect(netOf(name, "Miếu")).toBeGreaterThan(netOf(name, "Hãm"));
    }
  });

  it("Hãm does not raise support versus Miếu on the same star", () => {
    const k = knowledge();
    for (const star of k.majorStars.stars) {
      const mieu = applyBrightness(star.axes, "Miếu", k);
      const ham = applyBrightness(star.axes, "Hãm", k);
      expect(ham.support).toBeLessThanOrEqual(mieu.support + 1e-9);
    }
  });

  it("support and pressure stay non-negative after Hãm", () => {
    const k = knowledge();
    for (const star of k.majorStars.stars) {
      const axes = applyBrightness(star.axes, "Hãm", k);
      expect(axes.support).toBeGreaterThanOrEqual(0);
      expect(axes.pressure).toBeGreaterThanOrEqual(0);
    }
  });

  it("武 stars sit near net 0 at Bình (style, not automatic bad quality)", () => {
    for (const name of ["Thất Sát", "Phá Quân", "Tham Lang", "Liêm Trinh", "Cự Môn"]) {
      expect(Math.abs(netOf(name, "Bình"))).toBeLessThan(0.2);
    }
  });
});
