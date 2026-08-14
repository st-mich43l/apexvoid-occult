# Palace Overview Benchmark V2

Separate **CASE**, **REVIEW**, and **ADJUDICATION**.

- Cases have no expert labels.
- Reviews are immutable, school-specific, `blindedToEngine: true`.
- Pairwise judgments always include `reviewerId`, `school`, `caseId`.
- Reliability unit: `caseId + school + palaceName + axis`.
- Do not mix Nam Phái and Trung Châu into one reliability row.
- Do not infer pairwise from ordinals.

Blind protocol: experts see natal chart, palace layout, stars, brightness, natal Tứ Hóa, Tuần/Triệt, Mệnh/Thân, school. They must not see engine scores, bands, axes, drivers, parameters, or other reviewers' labels.

Generate packs: `npm run research:palace-overview:review-pack` (writes `.research-artifacts/`, gitignored).

Validate: `npm run research:palace-overview:validate-reviews`.
