# palace-overview

Khí vận tổng thể 12 cung — static natal analysis.

Numeric scoring knowledge: **1.2.0-experimental** (heuristic seeds).
Engine: **1.3.0** (trace, confidence metadata, calibration tooling).
Release stage: **experimental**. Decision: **NO_GO_FOR_CALIBRATION**.

Feature flag `ziweiPalaceOverviewV1`.

The 0–100 score is **net quality** (support minus pressure, logistic). It is
not probability, certainty, or destiny strength.

Pipeline: natal facts → static frame → evidence → structural interaction
deltas → aggregation → normalization.

Calibration and sensitivity tools live under `calibration/` and
`src/scripts/palace-overview-release-gate.ts`. They are not run in the UI.
