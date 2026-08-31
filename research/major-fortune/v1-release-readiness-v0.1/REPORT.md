# Major Fortune V1 Release Readiness Requalification

## Executive summary

Decision: **MFV1_REQUIRES_PROVENANCE_REBUILD**

Primary recommended next PR (A):
`research(major-fortune): rebuild V1 source, claim, and evidence-admission authority`

Emitted DOMAIN_VERIFIED evidence IDs resolve only to deleted historical packs, not current registries.

Base SHA: `61ce1ec4d903fbeab96c2cb0af70058cc5f8b67e`
Candidate: `major-fortune-engine-v1@1.0.0-rc.1`
Baseline: `major-fortune-v0.5-production`

## Base and candidate identity

- Schema: `pr267-major-fortune-v1-readiness.v1`
- Generation: `major-fortune/v1-release-readiness-v0.1`
- Current MF V1 release gate: **ABSENT**
- Historical GO_SHADOW: **INVALIDATED_AS_CURRENT_AUTHORITY**

## Historical lineage

| Asset | State | Notes |
| --- | --- | --- |
| source-registry | DELETED_PROVENANCE_ONLY | Deleted in 0e6c88e; held SRC-TVDS-01 / SRC-TT-01 / SRC-ENG-01. Not current authority. |
| claim-registry | DELETED_PROVENANCE_ONLY | Deleted in 0e6c88e; held CLM-DIALOI-01 / CLM-NHANHOA-01 / CLM-TUHOA-01. |
| school-policy-matrix | DELETED_PROVENANCE_ONLY | Deleted with V1 research pack. |
| signal-family-registry | DELETED_PROVENANCE_ONLY | Deleted with V1 research pack. |
| golden-dataset | DELETED_PROVENANCE_ONLY | Deleted; not the Calculation Core tuvi golden corpus. |
| holdout-dataset | DELETED_PROVENANCE_ONLY | Deleted; no current holdout authority for V1. |
| adversarial-dataset | DELETED_PROVENANCE_ONLY | Deleted. |
| calibration-dataset | DELETED_PROVENANCE_ONLY | Deleted. |
| baseline-snapshot | DELETED_PROVENANCE_ONLY | Deleted (~4800 V0.3 snapshots historically). |
| release-decision | INVALIDATED | Historical GO_SHADOW (#195) invalidated as current authority after pack deletion and #266 production isolation. |
| release-gate | DELETED_PROVENANCE_ONLY | CURRENT_MAJOR_FORTUNE_V1_RELEASE_GATE = ABSENT |
| independence-checker | DELETED_PROVENANCE_ONLY | Deleted in 0e6c88e. |
| engine-v1 | STILL_CURRENT | Executable candidate remains; version literal 1.0.0-rc.1 does not prove lifecycle. |

## Current architecture boundary

```text
analyzeMajorFortune() → V0.5 only
analyzeMajorFortuneTimeline() → V0.5 only
compareMajorFortuneV1Shadow() → explicit V0.5 + V1
```

Isolation check: {"productionImportsEngineV1":false,"timelineImportsEngineV1":false,"runtimeImportsResearchHarness":false}

## Current lifecycle assessment

Executable RESEARCH_CANDIDATE code remains (engine-v1). Candidate binaries present. Historical DECISION_RECORDED (GO_SHADOW) is INVALIDATED as current authority. No current release gate → not RELEASE_CANDIDATE under current contracts. No current CORPUS_AUDITED / DECISION_RECORDED artifacts under an active research pack until this generation. Lifecycle slot after this audit is decided by readiness.decision, not by the rc.1 string.

## Evidence family inventory

- **principal-star**: consumed=true; authorityLabel=DOMAIN_VERIFIED; supported=false; class=HISTORICAL_PROVENANCE_ONLY
- **auxiliary-support**: consumed=true; authorityLabel=DOMAIN_VERIFIED; supported=false; class=HISTORICAL_PROVENANCE_ONLY
- **malefic-pressure**: consumed=true; authorityLabel=DOMAIN_VERIFIED; supported=false; class=HISTORICAL_PROVENANCE_ONLY
- **major-transformation**: consumed=false; authorityLabel=NONE_EMITTED; supported=false; class=IMPLEMENTED_BUT_UNSCORED
- **structural-interaction**: consumed=false; authorityLabel=NONE_EMITTED; supported=false; class=SCHEMA_ONLY

## Source / claim provenance audit

- Unresolved source IDs: SRC-TVDS-01
- Unresolved claim IDs: CLM-DIALOI-01, CLM-NHANHOA-01
- DOMAIN_VERIFIED labels: 11880
- Resolved: 0
- Unresolved: 11880
- Truthfulness: **FAIL**

## Numeric authority inventory

Placeholder surfaces: 134
Engineering-policy surfaces: 15
Research-hypothesis surfaces: 1

## Physical-fact coverage

| School | Observations | Physical facts | Recognized | Silent drops | Principal cov | Aux cov | Tứ Hóa cov |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| nam-phai | 660 | 27940 | 5940 | 22000 | 1 | 0.115044 | null |
| trung-chau | 660 | 30076 | 5940 | 24136 | 1 | 0.117194 | 0 |

Overall silent-drop rate: 0.795229

## Unsupported / silently dropped stars

- Unique unsupported stars: 116
- Unsupported occurrences: 43544
- Top: Triệt(880), Tuần(880), Bác Sĩ(440), Bát Tọa(440), Bạch Hổ(440), Bệnh Phù(440), Cô Thần(440), Hoa Cái(440), Hóa Khoa(440), Hóa Kỵ(440), Hóa Lộc(440), Hóa Quyền(440), Hồng Loan(440), Hỷ Thần(440), Kiếp Sát(440), Long Trì(440), Long Đức(440), Lưu Hà(440), Lưu Hóa Khoa(440), Lưu Hóa Kỵ(440)

## Major Fortune Tứ Hóa coverage

- Physical majorMutagens: 2592
- In V1 frame: 2592
- Transformation evidence admitted: 0
- Transformation scored (trace): 0
- Classification: TRANSFORMATION_COVERAGE_GAP

## VCD behavior

VCD cohort comparison is under modelComparison.byVcd. Coverage deduction remains a hardcoded mock (−5).

## Reported quality vs measured quality

| Metric | Reported model behavior | Independently measurable? | Audit verdict |
| --- | --- | --- | --- |
| coverage | Defaults to 100; subtracts 5 when focus is VCD (comment: mock metric). | yes | MOCK |
| confidence | hardcoded 90 | no meaningful derivation | MOCK |
| engineering share | constant 50 | no | SYNTHETIC_CONSTANT |
| verified-domain share | constant 50 | no | SYNTHETIC_CONSTANT |
| experimental share | constant 0 | no | SYNTHETIC_CONSTANT |

Mean reported coverage%: 99.181818
Mean measured physical coverage%: 20.546593

## V0.5 vs V1 corpus

| Cohort | Comparable | Mean Δ | Median \|Δ\| | P95 \|Δ\| | Max \|Δ\| | Band agreement |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| global | 1320 | 3.892324 | 11.624731 | 34.792001 | 51.943319569798376 | 0 |
| nam-phai | 660 | 3.95445 | 12.012871 | 34.792001 | 51.943319569798376 | 0 |
| trung-chau | 660 | 3.830199 | 11.082746 | 34.792001 | 51.943319569798376 | 0 |
| vcd | 216 | 11.142292 | 15.784828 | 34.792001 | 41.04707764751229 | 0 |
| non-vcd | 1104 | 2.473852 | 10.854783 | 35.670889 | 51.943319569798376 | 0 |
| mutagens-present | 648 | 3.761284 | 11.082746 | 34.792001 | 51.943319569798376 | 0 |
| mutagens-absent | 672 | 4.018684 | 12.012871 | 34.792001 | 51.943319569798376 | 0 |

## Distribution comparison

V0.5: {"count":1320,"min":10,"p10":30,"median":57.5,"mean":54.629848,"p90":75,"max":93.8,"standardDeviation":17.430554,"scoreAt0Rate":0,"scoreAt100Rate":0,"nearCenterRate":0.208333}
V1: {"count":1320,"min":40.683426330891045,"p10":49.792001,"median":59.372094,"mean":58.522173,"p90":66.483899,"max":73.59325651169235,"standardDeviation":6.600477,"scoreAt0Rate":0,"scoreAt100Rate":0,"nearCenterRate":0.317424}

## Band comparison

Changed bands: 1320
Transition matrix: {"mixed->bình-hòa":170,"mixed->khá":265,"mixed->kém":7,"mixed->tốt":67,"pressure->bình-hòa":79,"pressure->khá":70,"pressure->kém":5,"pressure->tốt":8,"strong-pressure->bình-hòa":42,"strong-pressure->khá":49,"strong-support->bình-hòa":21,"strong-support->khá":109,"strong-support->tốt":46,"support->bình-hòa":107,"support->khá":174,"support->kém":6,"support->tốt":95}

## Timeline behavior

Charts=110; flatV05=0; flatV1=0;
medianRangeV05=57.5; medianRangeV1=17.963378

## School breakdown

See coverage and model-comparison tables above. Schools are not normalized together.

## Structural outliers

Model score deltas are classified as EXPECTED_MODEL_DIFFERENCE unless structural defect evidence exists.
No MODEL_INSTABILITY claim is asserted from magnitude alone.

## Classification summary

- HISTORICAL_LINEAGE_GAP: 2
- CURRENT_PROVENANCE_GAP: 2
- NUMERIC_AUTHORITY_GAP: 1
- PHYSICAL_FACT_COVERAGE_GAP: 1
- TRANSFORMATION_COVERAGE_GAP: 1
- QUALITY_REPORTING_GAP: 3
- EXPECTED_MODEL_DIFFERENCE: 2
- MODEL_INSTABILITY: 0
- ARCHITECTURE_VIOLATION: 0
- UNEXPECTED_DELTA: 0

## Readiness matrix

| Dimension | Status | Evidence / Finding |
| --- | --- | --- |
| deterministic execution | PASS | candidateErrors=0 |
| production isolation | PASS | {"productionImportsEngineV1":false,"timelineImportsEngineV1":false,"runtimeImportsResearchHarness":false} |
| current lineage clarity | GAP | Executable RESEARCH_CANDIDATE code remains (engine-v1). Candidate binaries present. Historical DECISION_RECORDED (GO_SHADOW) is INVALIDATED as current authority. No current release gate → not RELEASE_CANDIDATE under current contracts. No current CORPUS_AUDITED / DECISION_RECORDED artifacts under an active research pack until this generation. Lifecycle slot after this audit is decided by readiness.decision, not by the rc.1 string. |
| source provenance | FAIL | unresolved=SRC-TVDS-01 |
| claim provenance | FAIL | unresolved=CLM-DIALOI-01,CLM-NHANHOA-01 |
| numeric authority labeling | GAP | placeholderSurfaces=134 |
| school policy authority | PARTIAL | School field propagated; no school-specific V1 policy pack on current master. |
| principal-star coverage | PASS | recognized=6160/6160 |
| auxiliary-star coverage | GAP | recognized=5720/49264 |
| Tứ Hóa coverage | FAIL | scored=0 physical=2592 frame=2592 |
| unknown fact diagnostics | FAIL | unsupportedOccurrences=43544 |
| coverage truthfulness | FAIL | meanReported=99.181818 meanMeasured=20.546593 |
| confidence truthfulness | FAIL | confidencePercent hardcoded mock=90 |
| model distribution characterization | PASS | comparable=1320 |
| timeline characterization | PASS | charts=110 |
| holdout/adversarial current authority | FAIL | Historical datasets deleted; no current holdout/adversarial authority. |
| current release gate | FAIL | CURRENT_MAJOR_FORTUNE_V1_RELEASE_GATE = ABSENT |
| current decision artifact | FAIL | Historical GO_SHADOW invalidated; this report records a research requalification decision only. |

## Final decision

**MFV1_REQUIRES_PROVENANCE_REBUILD**

### Blockers

- DOMAIN_VERIFIED labels do not resolve through current provenance registries.
- Physical-fact silent-drop rate is 0.795229 (unsupported stars / unscored mutagens).
- majorMutagens are carried in the V1 frame but transformation scoring coverage is zero.
- Reported coverage/confidence/contribution percentages are mock or synthetic constants.

## Limitations

- Research artifacts are not runtime authority.
- Historical #194/#195 packs were inspected via Git history only; not restored.
- V0.5 is the released control, not a ground-truth score oracle.
- No arbitrary instability threshold was applied to V0.5↔V1 deltas.
- Confidence cannot be reconstructed from current provenance → derivedConfidence=null.
- Timeline sample lists first 12 charts only; aggregate rates cover the full corpus.
- High/low physical-coverage cohorts use continuous rates; no invented threshold authority.
- V0.5 and V1 use incompatible band vocabularies (e.g. support/pressure/mixed vs tốt/khá/bình-hòa), so bandAgreementRate≈0 is an ontology mismatch, not by itself MODEL_INSTABILITY.
- Palace.stars may include void markers (Tuần/Triệt) counted as physical star facts in this audit.

## Recommended next PR

- Outcome A: `research(major-fortune): rebuild V1 source, claim, and evidence-admission authority`
- Emitted DOMAIN_VERIFIED evidence IDs resolve only to deleted historical packs, not current registries.

