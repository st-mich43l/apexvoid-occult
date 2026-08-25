# Annual Axes V0.10 research notes

Historical **V0.9** evaluated incremental Thiên Mã / star-shape candidates and
retained V0.8 at that time. **V0.10 layered fortune** is now the current Nam
Phái runtime, using Natal + Đại Vận + Lưu Niên + Resonance.

This directory contains research/evaluation notes around that engine. Runtime
code lives under `src/lib/ziwei/analysis/modules/annual-axes/v0.10-layered`.
V0.10 remains experimental and uncalibrated; research profiles and projection
variants must not silently replace the released `layered-balanced` + `legacy`
route.

## Major Fortune projection hardening

PR #230 follows the diagnostic left by the original V0.10 research: sparse
Major Fortune evidence could project `signedNet = +/-1` into a domain because
directional balance normalized by its own mass while activation remained trace
metadata. The adapter also consumed production-admitted evidence before the
ordinal evaluator's duplicate/conflict/ownership rejection stage.

The hardening keeps the released profile, domain anchors and V0.8 tanh mapping
unchanged:

- decade projection consumes only `acceptedEvidenceIds` from the upstream Major
  Fortune ordinal result;
- domain support/pressure masses and contributor provenance remain visible;
- directional balance is activation-gated using the existing V0.10 Major
  Fortune activation reference mass (`4`), so sparse one-sided evidence cannot
  saturate a domain to `+/-1`;
- diagnostics report filtered upstream rejections and sparse-evidence damping.

This is an integrity correction, not calibration. It does not assert that a
lower or higher domain score is astrologically correct.

Do not revive deleted V0.9 runtime packages here.
