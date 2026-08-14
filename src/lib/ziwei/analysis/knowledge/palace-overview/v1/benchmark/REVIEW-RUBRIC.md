# Palace Overview expert review rubric

Version **2.1.0**. Do not invent 0–100 scores. Do not copy the engine output.

New submissions use rubricVersion `2.1.0`. Immutable older reviews keep their original version.

## Axis values

`low | medium | high | unable-to-judge`

Do not use `unknown`.

## Net quality

`guarded | neutral | supportive | strong | unable-to-judge`

## Pairwise

`LEFT | RIGHT | TIE | UNABLE_TO_JUDGE`

`UNABLE_TO_JUDGE` is missing data. It does not count toward usable pairwise readiness. Do not submit the same unordered palace pair twice in one review/axis. Do not compare a palace to itself. Do not compare palaces across charts.

## Confidence

`low | medium | high`

If any palace axis is usable, confidence for that palace is required. If every axis is `unable-to-judge`, omit confidence. Never default confidence to medium.

Overall `reviewerConfidence` is optional and must be explicit if set.

## Meanings

- **support** — beneficial / supportive structural potential
- **pressure** — adverse / demanding / constraining structural pressure
- **stability** — structural consistency / steadiness
- **activation** — movement / change / activation potential
- **netQuality** — overall qualitative balance of supportive versus pressuring evidence

Disagreement is derived from independent reviews; do not add a disagreement flag on the raw review.

Also record: reviewer, `reviewedAt`, school, `assignmentId`, `blindedToEngine: true`.
