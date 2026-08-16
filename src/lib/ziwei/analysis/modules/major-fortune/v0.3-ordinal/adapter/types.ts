import type { ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import type { ZiweiSchool } from "../../../../facts";
import type {
  MajorFortuneOrdinalEvidence,
  MajorFortuneOrdinalEvaluationInput,
  MajorFortuneOrdinalPillarContext,
  MajorFortuneOrdinalResult,
} from "../types";
import type { MajorFortuneOrdinalPillarId } from "../../../../knowledge/major-fortune-scoring/v0.3-ordinal";

type MajorFortuneAdapterSchool = ZiweiSchool;

interface MajorFortuneAdapterCycle {
  cycleIndex: number;
  startAge: number;
  endAge: number;
  activePalaceIndex: number;
}

/** Explicit cycle focus for timeline / multi-cycle analysis — never mutates ChartData. */
export interface MajorFortuneCycleOverride {
  cycleIndex: number;
  startAge: number;
  endAge: number;
  activePalaceIndex: number;
}

export interface MajorFortuneAdapterResolvedContext {
  school: MajorFortuneAdapterSchool;
  cycle: MajorFortuneAdapterCycle;
  activePalace: ChartPalace;
  activePalaceBranch: string;
  fortuneStem: string | null;
  yearStem: string | null;
  menhElement: string | null;
  menhPalace: ChartPalace | null;
  menhIndex: number;
  thanIndex: number;
  natalStarsInActivePalace: ChartStar[];
  transformations: readonly MutagenRecord[];
  natalTransformations: readonly MutagenRecord[];
  presentNatalStarNames: Set<string>;
  /** Natal star names on the decade TP4C (bản cung + đối + hai tam hợp). */
  presentTp4cNatalStarNames: Set<string>;
  palaces: readonly ChartPalace[];
  voidMarkers: readonly { type: string; branches: string[] }[];
}

export interface MajorFortuneAdapterDiagnostics {
  forbiddenAnnualMonthlyFieldsPresent: string[];
  noActiveMajorFortune: string[];
  missingMenhElement: string[];
  unsupportedBrightness: string[];
  incompleteTransformationTuples: string[];
  namPhaiTransformationBlocked: string[];
  partialPairSets: string[];
  disabledFamilies: string[];
  evidenceValidationErrors: string[];
  notes: string[];
  /** Count of Major Fortune transformations that did not target the active palace. */
  outOfFrameTransformationCount: number;
  /** Diagnostic messages for Mệnh palace index resolution (V0.3.3+). */
  menhIndexDiagnostics: string[];
}

export interface MajorFortuneOrdinalAdapterBuildResult {
  cycle: MajorFortuneAdapterCycle | null;
  evaluationInput: MajorFortuneOrdinalEvaluationInput | null;
  emittedEvidence: MajorFortuneOrdinalEvidence[];
  pillarContexts: Record<MajorFortuneOrdinalPillarId, MajorFortuneOrdinalPillarContext> | null;
  adapterDiagnostics: MajorFortuneAdapterDiagnostics;
}

export interface MajorFortuneOrdinalAdapterAnalysisResult {
  module: "major-fortune";
  model: "v0.3-ordinal-adapter";
  school: MajorFortuneAdapterSchool;
  build: MajorFortuneOrdinalAdapterBuildResult;
  evaluation: MajorFortuneOrdinalResult | null;
}

export interface AdapterEvidenceDraft extends MajorFortuneOrdinalEvidence {
  physicalFactKind: string;
}
