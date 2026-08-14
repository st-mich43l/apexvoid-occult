#!/usr/bin/env tsx
import { validateExpertReviews } from "../lib/ziwei/analysis/modules/palace-overview/calibration/validate-reviews";

const errors = validateExpertReviews();
if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, errors: [] }));
process.exit(0);
