# Nam Phái Annual Axes V0.8 — frozen kernel / research control

**Classification:** `REQUIRED_FROZEN_KERNEL` + `RESEARCH_CONTROL`

This folder is **not** the public Nam Phái runtime.

Public runtime is V0.10 via:

  `modules/annual-axes` → `released-router.ts` → `v0.10-layered`

## Why it remains

V0.10 reuses:

1. `scoreV08Domain` / star matching as the **annual-trigger kernel**
2. V0.8 tanh / raw-clamp / band knowledge for **score normalization freeze**
3. `analyzeAnnualAxesNamPhaiV08` when research tooling sets `includeControl: true`

## Do not

- Route public `analyzeAnnualAxes({ school: "nam-phai" })` here
- Treat engine `0.8.2` as current chart runtime
- Retune point classes / tanhScale in a cleanup PR
