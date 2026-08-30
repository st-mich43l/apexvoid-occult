import { describe, expect, it } from "vitest";
import { NAM_PHAI_TU_HOA } from "@/lib/ziwei/schools/nam-phai-policy";
import {
  TRUNG_CHAU_KHOI_VIET,
  TRUNG_CHAU_TU_HOA,
} from "@/lib/ziwei/schools/trung-chau-policy";
import {
  loadTrungChauResearchPackV0,
  resetTrungChauResearchPackCache,
} from "../index";

/**
 * Committed research observations vs live typed school policy.
 * If Calculation Core changes later, these fail and require review —
 * do not silently rewrite both sides in an unrelated PR.
 */
describe("trung-chau-research-v0 runtime comparison", () => {
  it("OBS-TC-TUHOA-CANH-KHOA matches TRUNG_CHAU_TU_HOA", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const obs = loaded.pack.runtimeObservations.observations.find(
      (o) => o.observationId === "OBS-TC-TUHOA-CANH-KHOA",
    );
    expect(obs).toBeDefined();
    expect(obs!.observedBehavior).toBe("Thiên Phủ");
    expect(TRUNG_CHAU_TU_HOA.Canh.Khoa).toBe("Thiên Phủ");
    expect(obs!.observedBehavior).toBe(TRUNG_CHAU_TU_HOA.Canh.Khoa);
    // Contrast column stays explicit (committed literal, not derived).
    expect(obs!.contrastBehavior).toBe("Thái Âm");
    expect(NAM_PHAI_TU_HOA.Canh.Khoa).toBe("Thái Âm");
  });

  it("OBS-TC-KHOIVIET-CANH matches TRUNG_CHAU_KHOI_VIET", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const obs = loaded.pack.runtimeObservations.observations.find(
      (o) => o.observationId === "OBS-TC-KHOIVIET-CANH",
    );
    expect(obs).toBeDefined();
    expect(obs!.observedBehavior).toEqual(["Sửu", "Mùi"]);
    expect([...TRUNG_CHAU_KHOI_VIET.Canh]).toEqual(["Sửu", "Mùi"]);
    expect(obs!.observedBehavior).toEqual([...TRUNG_CHAU_KHOI_VIET.Canh]);
  });
});
