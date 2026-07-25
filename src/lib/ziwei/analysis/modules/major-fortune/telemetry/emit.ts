import type { MajorFortuneScoredTelemetryEvent, MajorFortuneTelemetrySink } from "./types";

export const noopMajorFortuneTelemetrySink: MajorFortuneTelemetrySink = {
  emit() {},
};

export const consoleMajorFortuneTelemetrySink: MajorFortuneTelemetrySink = {
  emit(event: MajorFortuneScoredTelemetryEvent) {
    if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
      console.log(JSON.stringify(event));
    }
  },
};

let defaultSink: MajorFortuneTelemetrySink = typeof process !== "undefined" && process.env.NODE_ENV === "test" 
  ? noopMajorFortuneTelemetrySink 
  : consoleMajorFortuneTelemetrySink;

export function setMajorFortuneTelemetrySink(sink: MajorFortuneTelemetrySink): void {
  defaultSink = sink;
}

export function emitMajorFortuneScoredTelemetry(event: MajorFortuneScoredTelemetryEvent): void {
  try {
    defaultSink.emit(event);
  } catch (error) {
    // Catch sink failures at the telemetry boundary, not in the evaluator.
    // Do not let telemetry failure affect the returned score.
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      console.error("[Major Fortune Telemetry] Failed to emit telemetry", error);
    }
  }
}
