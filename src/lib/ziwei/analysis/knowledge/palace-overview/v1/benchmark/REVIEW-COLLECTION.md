# Expert review collection

1. Enroll a real reviewer in `reviewer-registry.v2.json` (pseudonymous id, schools, `active`, addedAt). No unnecessary PII. Do not invent reviewers.
2. Preview `planPilotAssignments(...)`. Commit only real assignments to `review-assignments.v1.json`. Nam Phái VCD assignments must be `authority: research-only`.
3. `npm run research:palace-overview:validate-reviews`
4. Generate forms for that reviewer only: `npm run research:palace-overview:review-form -- <reviewerId>`
   - unknown/inactive → error
   - zero assignments → `NO_ASSIGNMENTS` (does not dump the whole corpus)
5. Expert reviews blinded natal facts. Unanswered axes export as `unable-to-judge`. Confidence is never fabricated.
6. Export JSON with `rubricVersion` `2.1.0`, `assignmentId`, `blindedToEngine: true`.
7. `npm run research:palace-overview:ingest-review -- <file>`
   - rejects unassigned / withdrawn / completed duplicates / school mismatch
   - writes `.research-artifacts/palace-overview-ingest/merged-reviews.json` and `updated-assignments.json`
8. Inspect artifacts. Commit the new raw review and the completed assignment. Do not rewrite unrelated reviews.
9. `npm run research:palace-overview:status`
10. Usability comments go in `pilot-feedback.v1.json`, never into labels.
11. After the five-case pilot, set `pilot-state.v1.json` `accepted` only by explicit human decision (`PILOT_ACCEPTED` or rubric revision). Never auto-accept.

Raw reviews are immutable. Corrections need an explicit later audit trail.
