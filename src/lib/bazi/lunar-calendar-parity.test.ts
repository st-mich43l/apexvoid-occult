import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import { solarToLunar } from "../calendar/lunar-vn";
import { solarToLunar as namPhaiSolarToLunar } from "../ziwei/engine-nam-phai";
import { solarToLunar as trungChauSolarToLunar } from "../ziwei/engine-trung-chau";

const FIXTURES: Array<{
  d: number;
  m: number;
  y: number;
  tz: number;
}> = [
  { d: 1, m: 1, y: 1990, tz: 7 },
  { d: 31, m: 12, y: 1999, tz: 7 },
  { d: 4, m: 2, y: 2024, tz: 7 },
  { d: 12, m: 8, y: 2026, tz: 7 },
  { d: 15, m: 6, y: 2000, tz: 8 },
  { d: 29, m: 2, y: 2024, tz: 7 },
];

test("shared lunar-vn matches both school engine re-exports", () => {
  for (const f of FIXTURES) {
    const shared = solarToLunar(f.d, f.m, f.y, f.tz);
    expect(namPhaiSolarToLunar(f.d, f.m, f.y, f.tz)).toEqual(shared);
    expect(trungChauSolarToLunar(f.d, f.m, f.y, f.tz)).toEqual(shared);
  }
});

test("civil-display imports calendar lunar-vn, not Nam Phái engine", () => {
  const src = readFileSync(
    resolve(process.cwd(), "src/lib/bazi/civil-display.ts"),
    "utf8",
  );
  expect(src).not.toMatch(/engine-nam-phai/);
  expect(src).toMatch(/calendar\/lunar-vn/);
});
