import { describe, expect, it } from "vitest";
import { TRUNG_CHAU_TU_HOA } from "@/lib/ziwei/schools/trung-chau-policy";
import {
  loadTrungChauResearchPackV0,
  resetTrungChauResearchPackCache,
} from "../index";

describe("trung-chau-research-v0 tu-hoa audit", () => {
  it("covers all 10 stems × 4 mutagens without generating source from runtime", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const audit = loaded.pack.tuHoaAudit;
    expect(audit).toBeDefined();
    expect(audit!.cells.length).toBe(40);

    const stems = new Set(audit!.cells.map((c) => c.stem));
    expect(stems.size).toBe(10);

    for (const cell of audit!.cells) {
      expect(cell.runtimeTrungChau).toBe(
        TRUNG_CHAU_TU_HOA[cell.stem as keyof typeof TRUNG_CHAU_TU_HOA][
          cell.mutagen as "Lộc" | "Quyền" | "Khoa" | "Kỵ"
        ],
      );
      expect(cell.sourceRefs.length).toBeGreaterThan(0);
      expect(cell.sourceRefs).not.toContain("SRC-TC-ENGINE-001");
    }
  });

  it("records Mậu Khoa runtime↔source mismatch", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const mau = loaded.pack.tuHoaAudit!.cells.find(
      (c) => c.stem === "Mậu" && c.mutagen === "Khoa",
    );
    expect(mau?.runtimeTrungChau).toBe("Hữu Bật");
    expect(mau?.sourcePosition).toBe("Thái Dương");
    expect(mau?.result).toBe("runtime_source_mismatch");
  });

  it("records Canh Khoa aligned with inspected source", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const canh = loaded.pack.tuHoaAudit!.cells.find(
      (c) => c.stem === "Canh" && c.mutagen === "Khoa",
    );
    expect(canh?.runtimeTrungChau).toBe("Thiên Phủ");
    expect(canh?.sourcePosition).toBe("Thiên Phủ");
    expect(canh?.result).toBe("aligned");
  });

  it("records Nhâm Khoa runtime↔source mismatch", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const nham = loaded.pack.tuHoaAudit!.cells.find(
      (c) => c.stem === "Nhâm" && c.mutagen === "Khoa",
    );
    expect(nham?.runtimeTrungChau).toBe("Tả Phụ");
    expect(nham?.sourcePosition).toBe("Thiên Phủ");
    expect(nham?.result).toBe("runtime_source_mismatch");
  });
});

describe("trung-chau-research-v0 ERQ-005 cells", () => {
  it("remains expert_pending with structured Khoa cells", () => {
    resetTrungChauResearchPackCache();
    const loaded = loadTrungChauResearchPackV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const erq = loaded.pack.expertReview.reviews.find(
      (r) => r.reviewId === "ERQ-005",
    );
    expect(erq?.status).toBe("expert_pending");
    expect(erq?.cells?.length).toBeGreaterThanOrEqual(3);

    const mau = erq!.cells!.find((c) => c.stem === "Mậu" && c.mutagen === "Khoa");
    expect(mau?.runtimeAlignment).toBe("mismatch");

    const canh = erq!.cells!.find((c) => c.stem === "Canh" && c.mutagen === "Khoa");
    expect(canh?.runtimeAlignment).toBe("aligned");
  });
});
