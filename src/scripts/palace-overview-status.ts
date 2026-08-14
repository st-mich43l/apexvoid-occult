#!/usr/bin/env tsx
import { collectionStatusJson } from "../lib/ziwei/analysis/modules/palace-overview/calibration/readiness";

console.log(JSON.stringify(collectionStatusJson(), null, 2));
