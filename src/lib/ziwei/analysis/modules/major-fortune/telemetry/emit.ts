/**
 * Major Fortune telemetry emission.
 *
 * Default production sink: no-op.
 * Application bootstrap may inject a configured sink via setMajorFortuneTelemetrySink.
 * Audit and tests should prefer withMajorFortuneTelemetrySink for scoped, restored injection.
 *
 * Sink failure must never affect score generation.
 * Global state is always restored via try/finally in withMajorFortuneTelemetrySink.
 */
import type { MajorFortuneScoredTelemetryEvent, MajorFortuneTelemetrySink } from "./types";

/**
 * No-op sink. Default production sink — no transport unless application bootstrap
 * injects one explicitly. Do not assume console output exists in browser production.
 */
export const noopMajorFortuneTelemetrySink: MajorFortuneTelemetrySink = {
  emit() {},
};
/**
 * Active sink. Defaults to no-op — safe for browser production.
 * Use withMajorFortuneTelemetrySink for audit/test injection (scoped, restored).
 * Use setMajorFortuneTelemetrySink for application-level bootstrap only.
 */
let activeSink: MajorFortuneTelemetrySink = noopMajorFortuneTelemetrySink;

/**
 * Scoped sink injection with guaranteed restoration via try/finally.
 * Preferred for audit scripts and tests.
 *
 * @example
 * const events: MajorFortuneScoredTelemetryEvent[] = [];
 * const result = withMajorFortuneTelemetrySink(
 *   { emit: (e) => events.push(e) },
 *   () => analyzeMajorFortuneOrdinalV03(chart, options),
 * );
 */
export function withMajorFortuneTelemetrySink<T>(
  sink: MajorFortuneTelemetrySink,
  operation: () => T,
): T {
  const previous = activeSink;
  activeSink = sink;
  try {
    return operation();
  } finally {
    activeSink = previous;
  }
}

/**
 * Application-level bootstrap setter.
 * Prefer withMajorFortuneTelemetrySink for audit and test contexts.
 */
export function setMajorFortuneTelemetrySink(sink: MajorFortuneTelemetrySink): void {
  activeSink = sink;
}

export function emitMajorFortuneScoredTelemetry(event: MajorFortuneScoredTelemetryEvent): void {
  try {
    activeSink.emit(event);
  } catch (error) {
    // Telemetry sink failures must never affect the returned score.
    // Only surface in explicit development environments.
    if (typeof process !== "undefined" && process.env["NODE_ENV"] === "development") {
      console.error("[Major Fortune Telemetry] Sink error (score unaffected)", error);
    }
  }
}
