/** Shared contracts for Zi Wei analysis modules. */

import {
  isAnnualAxesEnabled,
  isMajorFortuneV03OrdinalEnabled,
  isPalaceOverviewV1Enabled,
} from "../feature-flags";
import { loadAnnualAxesKnowledgeV0 } from "../knowledge/annual-axes";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../knowledge/annual-axes/v0.8";
import { loadAnnualAxesKnowledgeV10 } from "../knowledge/annual-axes/v0.10";
import { loadPalaceOverviewKnowledgeV1 } from "../knowledge";
import { loadMajorFortuneOrdinalKnowledge } from "../knowledge/major-fortune-scoring/v0.3-ordinal";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../knowledge/monthly-flow";
import { createMonthlyCalculationProvider } from "../modules/monthly-flow/create-monthly-calculation-provider";
import { resolveMonthlyFlowProductionRoute } from "../modules/monthly-flow/release-policy";
import { MAJOR_FORTUNE_VERSION } from "../modules/major-fortune/version";
import type { ZiweiSchool } from "../facts";

export type ZiweiAnalysisModule =
  | "palace-overview"
  | "annual-axes"
  | "major-fortune"
  | "monthly-flow";

export type ZiweiAnalysisStatus =
  | {
      status: "unavailable";
      module: ZiweiAnalysisModule;
      reason: "rebuilding" | "invalid-knowledge";
    }
  | {
      status: "available";
      module: ZiweiAnalysisModule;
      version: string;
    };

export interface GetAnalysisStatusOptions {
  school?: ZiweiSchool;
}

function annualAxesStatusForTrungChau(): ZiweiAnalysisStatus {
  const annualKnowledge = loadAnnualAxesKnowledgeV0();
  if (!annualKnowledge.ok) {
    if (import.meta.env?.DEV) {
      console.warn("[annual-axes] invalid Trung Châu knowledge", annualKnowledge.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const numericKnowledge = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledge.ok) {
    if (import.meta.env?.DEV) {
      console.warn("[annual-axes] invalid palace-overview numeric knowledge", numericKnowledge.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  return { status: "available", module: "annual-axes", version: "0.2.0" };
}

function annualAxesStatusForNamPhaiV11(): ZiweiAnalysisStatus {
  const knowledge10 = loadAnnualAxesKnowledgeV10();
  // V0.11 annual-trigger kernel still requires frozen V0.8 knowledge.
  const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
  if (!knowledge08.ok) {
    if (import.meta.env?.DEV) {
      console.warn("[annual-axes] invalid V0.8 kernel knowledge", knowledge08.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }
  void knowledge10;
  return { status: "available", module: "annual-axes", version: "0.11.0" };
}

export function getAnalysisStatus(
  module: ZiweiAnalysisModule,
  options?: GetAnalysisStatusOptions,
): ZiweiAnalysisStatus {
  if (module === "palace-overview") {
    if (!isPalaceOverviewV1Enabled()) {
      return { status: "unavailable", module, reason: "rebuilding" };
    }
    const loaded = loadPalaceOverviewKnowledgeV1();
    if (!loaded.ok) {
      if (import.meta.env?.DEV) {
        console.warn("[palace-overview] invalid knowledge", loaded.issues);
      }
      return { status: "unavailable", module, reason: "invalid-knowledge" };
    }
    return { status: "available", module, version: loaded.knowledge.profile.version };
  }

  if (module === "annual-axes") {
    if (!isAnnualAxesEnabled()) {
      return { status: "unavailable", module, reason: "rebuilding" };
    }
    const school = options?.school ?? "nam-phai";
    if (school === "trung-chau") {
      return annualAxesStatusForTrungChau();
    }
    return annualAxesStatusForNamPhaiV11();
  }

  if (module === "major-fortune") {
    if (!isMajorFortuneV03OrdinalEnabled()) {
      return { status: "unavailable", module, reason: "rebuilding" };
    }
    const loaded = loadMajorFortuneOrdinalKnowledge();
    if (!loaded.ok) {
      if (import.meta.env?.DEV) {
        console.warn("[major-fortune] invalid V0.3 knowledge", loaded.issues);
      }
      return { status: "unavailable", module, reason: "invalid-knowledge" };
    }
    return { status: "available", module, version: MAJOR_FORTUNE_VERSION.integrationVersion };
  }

  if (module === "monthly-flow") {
    const school = options?.school ?? "nam-phai";
    const route = resolveMonthlyFlowProductionRoute(school);
    if (!route.available) {
      return { status: "unavailable", module, reason: "rebuilding" };
    }

    const monthlyKnowledge = loadMonthlyFlowScoringKnowledgeV0();
    if (!monthlyKnowledge.ok) {
      if (import.meta.env?.DEV) {
        console.warn("[monthly-flow] invalid knowledge", monthlyKnowledge.issues);
      }
      return { status: "unavailable", module, reason: "invalid-knowledge" };
    }

    const annualKnowledge = loadAnnualAxesKnowledgeV0();
    if (!annualKnowledge.ok) {
      if (import.meta.env?.DEV) {
        console.warn("[monthly-flow] invalid annual-axes knowledge", annualKnowledge.issues);
      }
      return { status: "unavailable", module, reason: "invalid-knowledge" };
    }

    const provider = createMonthlyCalculationProvider(route.school);
    if (!provider || provider.school !== route.school) {
      return { status: "unavailable", module, reason: "invalid-knowledge" };
    }

    return { status: "available", module, version: route.version };
  }

  return { status: "unavailable", module, reason: "rebuilding" };
}
