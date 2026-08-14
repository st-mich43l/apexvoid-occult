import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { applyBrightness } from "../collect-evidence";
import type { ZiweiBrightness } from "@/lib/ziwei/analysis/facts";

const BRIGHTNESS: ZiweiBrightness[] = ["Miếu", "Vượng", "Đắc", "Bình", "Hãm"];

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

describe("brightness polarity", () => {
  it("Phá Quân Miếu nets higher than Thiên Phủ Hãm", () => {
    expect(netOf("Phá Quân", "Miếu")).toBeGreaterThan(netOf("Thiên Phủ", "Hãm"));
  });

  it("brightness can reverse any 14-star base-net order", () => {
    const k = knowledge();
    const stars = k.majorStars.stars;
    for (const a of stars) {
      for (const b of stars) {
        if (a.name === b.name) continue;
        const baseA = a.axes.support - a.axes.pressure;
        const baseB = b.axes.support - b.axes.pressure;
        if (!(baseA > baseB)) continue;
        let reversed = false;
        for (const ba of BRIGHTNESS) {
          for (const bb of BRIGHTNESS) {
            const na = applyBrightness(a.axes, ba, k);
            const nb = applyBrightness(b.axes, bb, k);
            if (na.support - na.pressure < nb.support - nb.pressure) {
              reversed = true;
              break;
            }
          }
          if (reversed) break;
        }
        expect(reversed).toBe(true);
      }
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
});
