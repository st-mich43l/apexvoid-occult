import type { ChartData, ChartStar } from "@/types/chart";
import type { ZiweiSchool } from "../../../../facts";
import { isMajorFortuneV04NamPhaiTransformationsEnabled } from "../../../../feature-flags";
import type {
  MajorFortuneAdapterDiagnostics,
  MajorFortuneAdapterResolvedContext,
  MajorFortuneCycleOverride,
} from "./types";
import adapterPolicy from "./policy/adapter-policy.v0.3.json";
import { resolveMajorFortuneMutagensForStem } from "../../../../../calculation/resolve-major-fortune-mutagens";
import { tp4cIndices } from "./frame-tp4c";
import { isDecadeStaticStar } from "./natal-star";

const PRINCIPAL = new Set(adapterPolicy.principalStarNames as string[]);

function emptyDiagnostics(): MajorFortuneAdapterDiagnostics {
  return {
    forbiddenAnnualMonthlyFieldsPresent: [],
    noActiveMajorFortune: [],
    missingMenhElement: [],
    unsupportedBrightness: [],
    incompleteTransformationTuples: [],
    namPhaiTransformationBlocked: [],
    partialPairSets: [],
    disabledFamilies: [],
    evidenceValidationErrors: [],
    notes: [],
    outOfFrameTransformationCount: 0,
    menhIndexDiagnostics: [],
  };
}

function detectForbiddenFields(chart: ChartData, diagnostics: MajorFortuneAdapterDiagnostics): void {
  const checks: Array<{ name: string; present: boolean }> = [
    { name: "annualStars", present: Boolean(chart.annualStars && chart.annualStars.length > 0) },
    { name: "annualMutagens", present: Boolean(chart.annualMutagens && chart.annualMutagens.length > 0) },
    { name: "taiTuePalace", present: Boolean(chart.taiTuePalace) },
    { name: "smallLimitPalace", present: Boolean(chart.smallLimitPalace) },
    {
      name: "annualHeadPalace",
      present: Boolean((chart as { annualHeadPalace?: unknown }).annualHeadPalace),
    },
    { name: "isLuuNienDaiVan", present: chart.palaces.some((p) => p.isLuuNienDaiVan) },
    { name: "monthlyPalaces", present: Boolean(chart.monthlyPalaces && chart.monthlyPalaces.length > 0) },
    {
      name: "flowMonths",
      present: chart.palaces.some((p) => p.flowMonths && p.flowMonths.length > 0),
    },
  ];
  for (const c of checks) {
    if (c.present) diagnostics.forbiddenAnnualMonthlyFieldsPresent.push(c.name);
  }
}

export function resolveAdapterContext(
  chart: ChartData,
  school: ZiweiSchool,
  cycleOverride?: MajorFortuneCycleOverride,
): { context: MajorFortuneAdapterResolvedContext | null; diagnostics: MajorFortuneAdapterDiagnostics } {
  const diagnostics = emptyDiagnostics();
  detectForbiddenFields(chart, diagnostics);

  for (const disabled of adapterPolicy.round1DisabledFamilies) {
    diagnostics.disabledFamilies.push(`${disabled.signalFamilyId}:${disabled.reason}`);
  }

  const activePalace = cycleOverride
    ? (chart.palaces.find((p) => p.index === cycleOverride.activePalaceIndex) ?? null)
    : (chart.majorFortunePalace ?? null);

  if (!activePalace) {
    diagnostics.noActiveMajorFortune.push(
      cycleOverride
        ? `cycle-override:palace-not-found:${cycleOverride.activePalaceIndex}`
        : "chart:no-active-major-fortune-palace",
    );
    return { context: null, diagnostics };
  }

  const cycleIndex = cycleOverride?.cycleIndex ?? activePalace.majorFortune?.order;
  const startAge = cycleOverride?.startAge ?? activePalace.majorFortune?.start;
  const endAge = cycleOverride?.endAge ?? activePalace.majorFortune?.end;
  if (cycleIndex === undefined || startAge === undefined || endAge === undefined) {
    diagnostics.noActiveMajorFortune.push(
      cycleOverride
        ? "cycle-override incomplete"
        : "majorFortunePalace.majorFortune incomplete",
    );
    return { context: null, diagnostics };
  }

  const menhElement = chart.menhElement ?? null;
  if (!menhElement) {
    diagnostics.missingMenhElement.push("menhElement missing");
  }

  // --- Canonical Mệnh palace resolution ---
  // Use chart.menhIndex as the authoritative source (issue 3.3).
  // isMenh flag and palace name are diagnostics only.
  const canonicalMenhPalace =
    chart.palaces.find((p) => p.index === chart.menhIndex) ?? null;

  if (!canonicalMenhPalace) {
    diagnostics.menhIndexDiagnostics.push(
      `invalid-menh-index:${chart.menhIndex}:not-found-in-palaces`,
    );
  } else {
    // Check for isMenh flag mismatch (warning, not fail-closed)
    const flaggedMenh = chart.palaces.find((p) => p.isMenh);
    if (flaggedMenh && flaggedMenh.index !== chart.menhIndex) {
      diagnostics.menhIndexDiagnostics.push(
        `menh-index-flag-mismatch:menhIndex=${chart.menhIndex}:isMenh=${flaggedMenh.index}`,
      );
    }
    // Check for palace name mismatch (warning, not fail-closed)
    if (canonicalMenhPalace.name !== "Mệnh") {
      diagnostics.menhIndexDiagnostics.push(
        `menh-index-name-mismatch:menhIndex=${chart.menhIndex}:name=${canonicalMenhPalace.name}`,
      );
    }
  }
  const menhPalace = canonicalMenhPalace;

  const natalStarsInActivePalace = (activePalace.stars ?? []).filter(isDecadeStaticStar);

  const presentNatalStarNames = new Set(natalStarsInActivePalace.map((s) => s.name));
  const presentTp4cNatalStarNames = new Set<string>();
  for (const idx of tp4cIndices(activePalace.index)) {
    const palace = chart.palaces.find((p) => p.index === idx);
    for (const star of palace?.stars ?? []) {
      if (isDecadeStaticStar(star)) presentTp4cNatalStarNames.add(star.name);
    }
  }
  const fortuneStem = activePalace.stem ?? null;

  // Timeline overrides must resolve cycle-specific mutagens from Calculation Core
  // (never reuse the live chart.majorMutagens). The default single-cycle path keeps
  // chart.majorMutagens for backward compatibility with Core output / test fixtures.
  let majorMutagens: typeof chart.majorMutagens = [];
  if (school === "trung-chau") {
    if (cycleOverride) {
      majorMutagens = fortuneStem
        ? resolveMajorFortuneMutagensForStem(school, fortuneStem, chart.palaces)
        : [];
    } else if (chart.majorMutagens && chart.majorMutagens.length > 0) {
      majorMutagens = chart.majorMutagens;
    } else if (fortuneStem) {
      majorMutagens = resolveMajorFortuneMutagensForStem(school, fortuneStem, chart.palaces);
    }
  } else if (school === "nam-phai" && isMajorFortuneV04NamPhaiTransformationsEnabled()) {
    // V0.4 Nam Phái Transformation Candidate
    majorMutagens = fortuneStem
      ? resolveMajorFortuneMutagensForStem(school, fortuneStem, chart.palaces)
      : [];
  }

  if (school === "nam-phai" && (chart.majorMutagens?.length ?? 0) > 0 && !isMajorFortuneV04NamPhaiTransformationsEnabled()) {
    diagnostics.namPhaiTransformationBlocked.push(
      "majorMutagens present but Nam Phái transformations not admitted by V0.3 scoring policy",
    );
  }

  const transformations =
    school === "trung-chau" || (school === "nam-phai" && isMajorFortuneV04NamPhaiTransformationsEnabled())
      ? (majorMutagens ?? [])
      : [];

  return {
    context: {
      school,
      cycle: {
        cycleIndex,
        startAge,
        endAge,
        activePalaceIndex: activePalace.index,
      },
      activePalace,
      activePalaceBranch: activePalace.branch,
      fortuneStem,
      menhElement,
      menhPalace,
      menhIndex: chart.menhIndex,
      thanIndex: chart.thanIndex,
      natalStarsInActivePalace,
      transformations,
      natalTransformations: chart.natalMutagens ?? [],
      presentNatalStarNames,
      presentTp4cNatalStarNames,
      palaces: chart.palaces,
      voidMarkers: chart.voidMarkers ?? [],
    },
    diagnostics,
  };
}

export function natalPrincipalsInPalace(stars: readonly ChartStar[]): ChartStar[] {
  return stars.filter((s) => PRINCIPAL.has(s.name) && isDecadeStaticStar(s));
}
