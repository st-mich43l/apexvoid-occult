/**
 * Shared Tứ Hóa / mutagen mechanics — table injected, no school branching.
 */
import type { ChartPhiFlow, MutagenRecord } from "@/types/chart";
import type { TuHoaTable } from "../schools/policy-types";
import { tuHoaRow } from "../schools/policy-types";
import { findStar } from "./shared-chart-geometry";
import type { ZiweiWorkingPalace } from "./shared-primitives";

export function getTuHoaTargets(
  table: TuHoaTable,
  stem: string,
): Array<{ mutagen: string; starName: string }> {
  const row = tuHoaRow(table, stem);
  if (!row) return [];
  return Object.entries(row).map(([mutagen, starName]) => ({ mutagen, starName }));
}

export function resolveMutagenRecords(
  table: TuHoaTable,
  stem: string,
  palaces: ZiweiWorkingPalace[],
  source = "natal",
): MutagenRecord[] {
  return getTuHoaTargets(table, stem).map(({ mutagen, starName }) => {
    const found = findStar(palaces, starName);
    return {
      source,
      mutagen,
      starName,
      palace: found ? found.palace : null,
    };
  });
}

export function resolvePhiFlows(
  table: TuHoaTable,
  palaces: ZiweiWorkingPalace[],
): ChartPhiFlow[] {
  const flows: ChartPhiFlow[] = [];
  for (const source of palaces) {
    for (const { mutagen, starName } of getTuHoaTargets(table, source.stem ?? "")) {
      const found = findStar(palaces, starName);
      flows.push({
        source,
        mutagen,
        starName,
        target: found ? found.palace : null,
        self: !!found && found.palace.index === source.index,
      });
    }
  }
  return flows;
}
