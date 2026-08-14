# Palace Overview expert corpus

Structural natal benchmark. The scorer must never select the cases that judge it.

## Selection

Discovery iterates deterministic dates/hours/genders (`discovery-config.v1.json`). Fingerprints come from `normalizeNatalFacts` only. Greedy coverage ranking uses unmet cohort tags plus hour/gender/date diversity. It is not astrology ranking.

New synthetic IDs: `case-` + first 12 hex chars of SHA-256 of natal identity `(solarDate, birthHour, gender, timezone)`. The historical seed `female-1991-09-21-dau` is kept.

`annualYear` / `flowBase` are Calculation Core sentinels (`2000` / `luu-nien`). They are not natal identity.

## Fingerprint

Version `1.0.0`. Hash is SHA-256 of canonical fingerprint JSON. Research metadata only — scoring modules must not import the corpus planner.

## Cohorts

Descriptive tags: vcd/non-vcd, tuan/triet/no-void, named principal-star systems, brightness, transformation density, minor density. Never high-score / low-score.

## Promotion

`npm run research:palace-overview:discover-cases` writes gitignored candidates.

`npm run research:palace-overview:promote-cases -- <ids>` prints Benchmark V2 case JSON. Canonical files are updated only by explicit commit.

## Split

Whole-case SHA-256 v2. Do not move cases after seeing engine output or review difficulty.

## Privacy

Synthetic structural birth inputs. No names, biographies, outcomes, or celebrity shortcuts in this corpus.
