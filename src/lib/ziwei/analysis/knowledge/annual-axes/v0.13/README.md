# Annual Axes V0.13 knowledge

**STATUS: ACTIVE RESEARCH**
Architecture: [`docs/architecture/annual-axes.md`](../../../../../../../docs/architecture/annual-axes.md)

This directory is **research-only** knowledge for `CANDIDATE-AAV13-DOCTRINE-AUGMENTED-STATIC`.

V0.13 is the **only doctrine-augmented static-domain candidate**. V0.12 is an immutable registry-only scale control and must not acquire doctrine fallback behavior.

The source qualitative claims are copied from the existing Palace Overview doctrine catalog only to avoid a runtime/numeric dependency on Palace Overview. The copied fields keep their source IDs, exact locators, adjudication, conditions, tendency, ordinal, and `numericDelta: null`.

Doctrine conditions resolve from natal/static facts only:

- natal/static stars physically present in the mapped palace;
- the physical natal palace branch;
- natal Tứ Hóa from `chart.natalMutagens` scoped to that palace.

Annual/Lưu stars, annual mutagens, Major Fortune mutagens, and monthly/daily facts cannot satisfy V0.13 doctrine conditions.

The ordinal-to-point mapping in `profile.nam-phai.v0.13.json` is an explicit engineering research bridge. It must never be represented as a classical numeric rule.

Production Annual Axes remains V0.11. V0.13 does not modify the Palace Overview runtime, Annual Trigger, Major Fortune, resonance, domain projection, or production router.
