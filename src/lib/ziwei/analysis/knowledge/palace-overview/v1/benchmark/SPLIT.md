# Benchmark Split V2

## Unit

Split **whole cases** (`caseId`), never individual palaces, and never `caseId+school` separately. The same birth chart must not leak structure from a Nam Phái review into a Trung Châu holdout cell.

## Rule

```
splitSeed = "palace-overview-benchmark-split-v2"
digest    = SHA-256( UTF-8( splitSeed || "\0" || caseId ) )
u         = UINT32_BE(digest[0..3]) / 2^32
assignment = u < 0.80 ? "calibration" : "holdout"
```

Target: ~80% calibration / ~20% holdout.

The assignment is stored on each case as `splitAssignment` / `splitVersion: "v2"`. Recomputing the hash must match the stored field. Do not move hard examples after seeing engine output.

With a single seed case the holdout set may be empty. That is an honest non-usable split, not a reason to invent cases.
