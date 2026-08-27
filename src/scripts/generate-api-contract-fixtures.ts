/**
 * Generate cross-language ChartDTO fixtures from real serializeChart() (PR #251).
 *
 * Usage: npm run api:generate:fixtures
 * Do NOT run during ordinary tests — fixtures are review artifacts.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BirthInput } from "@/types/chart";
import { calculateForAnnualYear, serializeChart } from "@/lib/ziwei/chart";
import { buildTemporalSnapshotsFromCore } from "@/lib/ziwei/temporal-snapshots";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "tests/contracts");

const INPUT: BirthInput = {
  solarDate: "21/09/1991",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function writeJson(name: string, value: unknown) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(path.join(OUT, name), text, "utf-8");
  console.log(`wrote tests/contracts/${name}`);
}

mkdirSync(OUT, { recursive: true });

const nam = serializeChart(
  calculateForAnnualYear("nam-phai", INPUT, 2026),
  "nam-phai",
  "female",
);
const trung = serializeChart(
  calculateForAnnualYear("trung-chau", INPUT, 2026),
  "trung-chau",
  "female",
);
if (!nam || !trung) throw new Error("serializeChart failed");

writeJson("chart-dto-nam-phai.json", nam);
writeJson("chart-dto-trung-chau.json", trung);
writeJson(
  "temporal-snapshot-bundle.json",
  buildTemporalSnapshotsFromCore("nam-phai", "female", INPUT, 2026, [2027, 2028]),
);
