# Krippendorff measurement scale (Palace Overview Benchmark V2)

## Decision

The implemented statistic is **Krippendorff α — fixed quadratic rank distance**, not Krippendorff’s coincidence-table ordinal metric that re-spaces categories from sample frequencies.

Expert labels `low | medium | high` (and `guarded | neutral | supportive | strong` for netQuality) are treated as **equally spaced ordered categories**.

They are **not** claimed to be an interval scale with sourced unequal gaps. No primary source assigns numeric distances between those ranks. Therefore the distance is:

```
δ²(i, j) = (rank(i) − rank(j))²
```

where `rank` is the 0-based index in the ordered list for that axis.

This is **not** Krippendorff’s coincidence-table ordinal metric that spaces categories by observed cumulative frequencies. That metric would change δ when the sample’s category histogram changes. We keep δ fixed given the rank indices so the reliability statistic is a function of rater disagreement on a declared scale, not of the sample mix.

`unable-to-judge` is missing data (`null`), not a rank.

## Alpha

Reliability unit identity is `JSON.stringify([caseId, school, palaceName, axis])` so IDs may contain colons without colliding. Semantic unit remains `caseId + school + palaceName + axis`.

For units with at least two non-missing ratings:

- Observed disagreement `Do` = mean of within-unit pairwise `δ²`.
- Expected disagreement `De` = mean of `δ²` over all pairs of observed values in the coincidence sense used here: pairwise products of global category counts.

`α = 1 − Do/De`.

If fewer than two overlapping units exist, return `{ alpha: null, status: "NOT_COMPUTABLE" }`.

Do not fabricate α.
