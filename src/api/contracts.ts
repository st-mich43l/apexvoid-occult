/**
 * Ergonomic aliases for generated OpenAPI transport types (PR #251).
 *
 * Domain types (ChartData, BirthInput, …) stay in src/types/chart.ts.
 * Do not import components["schemas"][...] outside this adapter.
 */
import type { components } from "@/generated/api-schema";

export type ApiChartDto = components["schemas"]["ChartDTO"];
export type ApiHistoryTurn = components["schemas"]["HistoryTurn"];
export type ApiUserContext = components["schemas"]["UserContext"];
export type ApiTemporalSnapshotBundle =
  components["schemas"]["TemporalSnapshotBundle"];
export type ApiInterpretRequest = components["schemas"]["InterpretRequest"];
export type ApiTemporalSnapshotsRequired =
  components["schemas"]["TemporalSnapshotsRequiredResponse"];

/** Transport school enum (mirrors domain School). */
export type ApiSchool = NonNullable<ApiChartDto["school"]>;

/** Transport gender enum. */
export type ApiGender = NonNullable<ApiChartDto["gender"]>;

/**
 * Backend-emitted structured error codes (OpenAPI).
 * TEMPORAL_NEGOTIATION_FAILED is frontend-local — see src/api/errors.ts.
 */
export type BackendApiErrorCode =
  | components["schemas"]["UnsupportedNarrativeSchoolResponse"]["code"]
  | components["schemas"]["TemporalSnapshotsRequiredResponse"]["code"]
  | components["schemas"]["TemporalRangeTooLargeResponse"]["code"]
  | components["schemas"]["TemporalYearOutOfRangeResponse"]["code"]
  | components["schemas"]["TemporalSnapshotValidationErrorResponse"]["code"];
