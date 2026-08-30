/**
 * PR #257 — policy registry routing locks (literal expectations).
 */
import { describe, expect, it } from "vitest";
import { getZiweiStaticSchoolPolicy } from "../schools/policy-registry";

describe("ZIWEI_SCHOOL_POLICIES registry", () => {
  it("Nam Canh Khoa is Thái Âm", () => {
    expect(getZiweiStaticSchoolPolicy("nam-phai").tuHoa.Canh.Khoa).toBe("Thái Âm");
  });

  it("Trung Châu Canh Khoa is Thiên Phủ", () => {
    expect(getZiweiStaticSchoolPolicy("trung-chau").tuHoa.Canh.Khoa).toBe(
      "Thiên Phủ",
    );
  });

  it("Nam Canh Khôi/Việt is Ngọ/Dần", () => {
    expect(getZiweiStaticSchoolPolicy("nam-phai").khoiViet.Canh).toEqual([
      "Ngọ",
      "Dần",
    ]);
  });

  it("Trung Châu Canh Khôi/Việt is Sửu/Mùi", () => {
    expect(getZiweiStaticSchoolPolicy("trung-chau").khoiViet.Canh).toEqual([
      "Sửu",
      "Mùi",
    ]);
  });
});
