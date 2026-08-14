# Expert review collection

1. Register a real reviewer in `reviewer-registry.v2.json` (pseudonymous id, schools, status, addedAt). No unnecessary PII.
2. Add assignments in `review-assignments.v1.json` (`pilot` / `primary` / `overlap`). Do not invent reviewers.
3. Generate a blind pack: `npm run research:palace-overview:review-pack`
4. Generate a research-only form: `npm run research:palace-overview:review-form -- <reviewerId>` (gitignored HTML).
5. Expert rates palaces and compact pairwise slots. No engine scores.
6. Export Benchmark V2 JSON (`rubricVersion` `2.1.0`, `blindedToEngine: true`).
7. `npm run research:palace-overview:ingest-review -- <file>` validates and writes a merged artifact. Append to `expert-reviews.v2.json` only after validation. Do not rewrite unrelated raw reviews.
8. `npm run research:palace-overview:validate-reviews`
9. `npm run research:palace-overview:status`

Raw reviews are immutable evidence. Corrections need an explicit audit trail, not silent edits.

Usability comments go in `pilot-feedback.v1.json`, never into labels.
