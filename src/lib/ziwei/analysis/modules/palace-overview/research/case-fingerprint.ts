import { createHash } from "node:crypto";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { indexFactsByPalace, normalizeNatalFacts } from "../../../facts";
import type { NatalZiweiFact } from "../../../facts/types";
import { buildStaticFrame } from "../../../frame";
import type { ChartData, School } from "@/types/chart";
import { FINGERPRINT_VERSION, natalIdentityKey, toBirthInput } from "./natal-input";
import type { NatalBenchmarkInput } from "./natal-input";

const GEOMETRY = { focus: 1, opposite: 1, trine: 1 };

const SYSTEMS: Array<{ id: string; participants: string[] }> = [
  {
    id: "system-tu-phu-vu-tuong",
    participants: ["Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng"],
  },
  {
    id: "system-co-nguyet-dong-luong",
    participants: ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"],
  },
  {
    id: "system-sat-pha-tham",
    participants: ["Thất Sát", "Phá Quân", "Tham Lang"],
  },
];

export interface BenchmarkCaseFingerprint {
  fingerprintVersion: string;
  school: School;
  palaceStructure: {
    menhPalace: string;
    thanPalace: string;
  };
  majorStars: Array<{
    star: string;
    palace: string;
    brightness: "Miếu" | "Vượng" | "Đắc" | "Bình" | "Hãm" | "unknown";
  }>;
  vcdPalaces: string[];
  void: {
    tuanPalaces: string[];
    trietPalaces: string[];
  };
  natalTransformations: Array<{
    transformation: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
    targetStar: string;
    palace: string;
  }>;
  structuralSystems: string[];
  brightnessDistribution: {
    mieu: number;
    vuong: number;
    dac: number;
    binh: number;
    ham: number;
    unknown: number;
  };
  minorStarSummary: {
    totalMapped: number;
    familyCounts: Record<string, number>;
  };
  changShengSummary: Record<string, number>;
}

const CALCULATORS: Record<School, (input: ReturnType<typeof toBirthInput>) => ChartData> = {
  "nam-phai": calculateNamPhai,
  "trung-chau": calculateTrungChau,
};

function brightnessLabel(
  value: NatalZiweiFact["brightness"],
): BenchmarkCaseFingerprint["majorStars"][number]["brightness"] {
  if (value === "Miếu" || value === "Vượng" || value === "Đắc" || value === "Bình" || value === "Hãm") {
    return value;
  }
  return "unknown";
}

function detectSystems(
  chart: ChartData,
  facts: NatalZiweiFact[],
): string[] {
  const byPalace = indexFactsByPalace(facts);
  const found = new Set<string>();
  for (const palace of chart.palaces) {
    const frame = buildStaticFrame(chart, palace.index, { geometry: GEOMETRY });
    const majors = new Set<string>();
    for (const node of frame.nodes) {
      for (const fact of byPalace.get(node.palaceIndex) ?? []) {
        if (fact.kind === "star" && fact.starClass === "major" && fact.canonicalStarName) {
          majors.add(fact.canonicalStarName);
        }
      }
    }
    for (const system of SYSTEMS) {
      if (system.participants.every((name) => majors.has(name))) {
        found.add(system.id);
      }
    }
  }
  return [...found].sort();
}

function fingerprintFromFacts(
  chart: ChartData,
  facts: NatalZiweiFact[],
  school: School,
): BenchmarkCaseFingerprint {
  const menh = chart.palaces.find((p) => p.index === chart.menhIndex);
  const than = chart.palaces.find((p) => p.index === chart.thanIndex);
  const majorStars = facts
    .filter((f) => f.kind === "star" && f.starClass === "major")
    .map((f) => ({
      star: f.canonicalStarName ?? f.starName ?? "",
      palace: f.palaceName,
      brightness: brightnessLabel(f.brightness),
    }))
    .sort((a, b) => a.star.localeCompare(b.star) || a.palace.localeCompare(b.palace));

  const vcdPalaces = chart.palaces
    .filter((p) => {
      const majors = facts.filter(
        (f) => f.palaceIndex === p.index && f.kind === "star" && f.starClass === "major",
      );
      return majors.length === 0;
    })
    .map((p) => p.name)
    .sort();

  const tuanPalaces = facts
    .filter((f) => f.kind === "void-marker" && f.voidType === "Tuần")
    .map((f) => f.palaceName)
    .sort();
  const trietPalaces = facts
    .filter((f) => f.kind === "void-marker" && f.voidType === "Triệt")
    .map((f) => f.palaceName)
    .sort();

  const natalTransformations = facts
    .filter((f) => f.kind === "transformation")
    .map((f) => ({
      transformation: (f.transformation ?? "Lộc") as "Lộc" | "Quyền" | "Khoa" | "Kỵ",
      targetStar: f.targetStar ?? "",
      palace: f.palaceName,
    }))
    .sort((a, b) => a.transformation.localeCompare(b.transformation));

  const dist = { mieu: 0, vuong: 0, dac: 0, binh: 0, ham: 0, unknown: 0 };
  for (const m of majorStars) {
    if (m.brightness === "Miếu") dist.mieu += 1;
    else if (m.brightness === "Vượng") dist.vuong += 1;
    else if (m.brightness === "Đắc") dist.dac += 1;
    else if (m.brightness === "Bình") dist.binh += 1;
    else if (m.brightness === "Hãm") dist.ham += 1;
    else dist.unknown += 1;
  }

  const minors = facts.filter((f) => f.kind === "star" && f.starClass !== "major");
  const familyCounts: Record<string, number> = {};
  for (const m of minors) {
    const key = m.starClass ?? "neutral";
    familyCounts[key] = (familyCounts[key] ?? 0) + 1;
  }

  const changShengSummary: Record<string, number> = {};
  for (const f of facts) {
    if (f.kind !== "chang-sheng" || !f.changShengStage) continue;
    changShengSummary[f.changShengStage] = (changShengSummary[f.changShengStage] ?? 0) + 1;
  }

  return {
    fingerprintVersion: FINGERPRINT_VERSION,
    school,
    palaceStructure: {
      menhPalace: menh?.name ?? "",
      thanPalace: than?.name ?? "",
    },
    majorStars,
    vcdPalaces,
    void: { tuanPalaces, trietPalaces },
    natalTransformations,
    structuralSystems: detectSystems(chart, facts),
    brightnessDistribution: dist,
    minorStarSummary: {
      totalMapped: minors.length,
      familyCounts,
    },
    changShengSummary,
  };
}

export function fingerprintNatalCase(
  input: NatalBenchmarkInput,
  school: School,
): BenchmarkCaseFingerprint {
  const chart = CALCULATORS[school](toBirthInput(input));
  const { facts } = normalizeNatalFacts(chart, { school });
  return fingerprintFromFacts(chart, facts, school);
}

export function fingerprintHash(fp: BenchmarkCaseFingerprint): string {
  return createHash("sha256").update(JSON.stringify(fp), "utf8").digest("hex");
}

export function syntheticCaseId(input: NatalBenchmarkInput): string {
  const digest = createHash("sha256").update(natalIdentityKey(input), "utf8").digest("hex");
  return `case-${digest.slice(0, 12)}`;
}
