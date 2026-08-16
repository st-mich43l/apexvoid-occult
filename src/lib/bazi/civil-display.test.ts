import { describe, expect, it } from "vitest";
import { generateBaziChart } from "./bazi-engine";
import { jieqiAt, polarityElementLabel } from "./civil-display";

describe("civil calendar display", () => {
  it("21/9/1991 18:30 ICT: âm 14/8, tiết Bạch Lộ", () => {
    const date = new Date(Date.UTC(1991, 8, 21, 11, 30, 0));
    const chart = generateBaziChart(date, 105.8, 420, "F");
    const c = chart.metadata.civil;
    expect(c?.solarYear).toBe(1991);
    expect(c?.solarMonth).toBe(9);
    expect(c?.solarDay).toBe(21);
    expect(c?.clockHour).toBe(18);
    expect(c?.clockMinute).toBe(30);
    expect(c?.lunarYear).toBe(1991);
    expect(c?.lunarMonth).toBe(8);
    expect(c?.lunarDay).toBe(14);
    expect(c?.lunarLeap).toBe(false);
    expect(c?.jieqi).toBe("Bạch Lộ");
    expect(c?.hourBranch).toBe("Dậu");
    expect(jieqiAt(date)).toBe("Bạch Lộ");
    expect(polarityElementLabel("Giáp")).toBe("+Mộc");
    expect(polarityElementLabel("Tân")).toBe("−Kim");
    expect(polarityElementLabel("Dậu")).toBe("−Kim");
    expect(polarityElementLabel("Ngọ")).toBe("+Hỏa");
  });
});
