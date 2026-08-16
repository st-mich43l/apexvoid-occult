import { Pillar } from "../calendar/sexagenary";
import { BaziConventions, DEFAULT_CONVENTIONS } from "./conventions";
import catalog from "./knowledge/symbolic-stars.v1.json";

export interface SymbolicStar {
  name: string;
  sourceType: "DayStem" | "YearStem" | "DayBranch" | "YearBranch";
  sourceValue: string;
}

type StemAnchor = "DayStem" | "YearStem";
type BranchAnchor = "DayBranch" | "YearBranch";

const TRIAD_KEYS = ["danNgoTuat", "thanTyThin", "tyDauSuu", "hoiMaoMui"] as const;
const SEASON_KEYS = ["xuan", "ha", "thu", "dong"] as const;

function quyNhanBranches(stem: string, conventions: BaziConventions): string[] {
  const table = catalog.quyNhan[conventions.quyNhanVariant] as Record<string, string[]>;
  return table[stem] ?? [];
}

function triadKey(branch: string): (typeof TRIAD_KEYS)[number] | null {
  for (const key of TRIAD_KEYS) {
    if ((catalog.triads[key] as string[]).includes(branch)) return key;
  }
  return null;
}

function seasonKey(branch: string): (typeof SEASON_KEYS)[number] | null {
  for (const key of SEASON_KEYS) {
    if ((catalog.seasons[key] as string[]).includes(branch)) return key;
  }
  return null;
}

function stemFor(anchor: StemAnchor, day: Pillar, year: Pillar): string {
  return anchor === "DayStem" ? day.stem : year.stem;
}

function branchFor(anchor: BranchAnchor, day: Pillar, year: Pillar): string {
  return anchor === "DayBranch" ? day.branch : year.branch;
}

function branchAnchorOrder(conventions: BaziConventions): BranchAnchor[] {
  return conventions.thanSatBase === "yearFirst"
    ? ["YearBranch", "DayBranch"]
    : ["DayBranch", "YearBranch"];
}

/**
 * An thần sát lên một chi đích, tra can/chi năm và ngày từ catalog v1.
 */
export function getSymbolicStars(
  targetBranch: string,
  dayPillar: Pillar,
  yearPillar: Pillar,
  conventions: BaziConventions = DEFAULT_CONVENTIONS
): SymbolicStar[] {
  const stars: SymbolicStar[] = [];

  const addQuyNhan = (anchor: StemAnchor) => {
    const stem = stemFor(anchor, dayPillar, yearPillar);
    if (quyNhanBranches(stem, conventions).includes(targetBranch)) {
      stars.push({ name: "Thiên Ất Quý Nhân", sourceType: anchor, sourceValue: stem });
    }
  };
  addQuyNhan("YearStem");
  addQuyNhan("DayStem");

  const hePartner = (catalog.liuHe as Record<string, string>)[targetBranch];
  if (hePartner && quyNhanBranches(dayPillar.stem, conventions).includes(hePartner)) {
    stars.push({
      name: catalog.heGui.name,
      sourceType: "DayStem",
      sourceValue: dayPillar.stem,
    });
  }

  for (const spec of catalog.stemStars) {
    for (const anchor of spec.anchors as StemAnchor[]) {
      const stem = stemFor(anchor, dayPillar, yearPillar);
      const hits = (spec.byStem as Record<string, string[]>)[stem] ?? [];
      if (hits.includes(targetBranch)) {
        stars.push({ name: spec.name, sourceType: anchor, sourceValue: stem });
      }
    }
  }

  for (const anchor of branchAnchorOrder(conventions)) {
    const sourceBranch = branchFor(anchor, dayPillar, yearPillar);
    const triad = triadKey(sourceBranch);
    const season = seasonKey(sourceBranch);

    for (const spec of catalog.branchStars) {
      if (!(spec.anchors as string[]).includes(anchor)) continue;
      if (triad && spec.byTriad[triad] === targetBranch) {
        stars.push({ name: spec.name, sourceType: anchor, sourceValue: sourceBranch });
      }
    }

    for (const spec of catalog.seasonStars) {
      if (!(spec.anchors as string[]).includes(anchor)) continue;
      if (season && spec.bySeason[season] === targetBranch) {
        stars.push({ name: spec.name, sourceType: anchor, sourceValue: sourceBranch });
      }
    }
  }

  const uniqueStars: SymbolicStar[] = [];
  const seen = new Set<string>();
  for (const star of stars) {
    const key = `${star.name}_${star.sourceType}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueStars.push(star);
    }
  }

  return uniqueStars;
}
