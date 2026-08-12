#!/usr/bin/env tsx
/**
 * R3 Decision CLI
 * Reads lane authorizations and derives the R3 decision, writing reports/decision.json
 */
import fs from 'fs';
import path from 'path';
import { deriveDecision } from '../src/derive-decision';
import { writePack } from '../src/write-pack';
import type { LaneAuthorization } from '../src/types';

const BASE_DIR = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-ingestion-r3-dia-loi');

const authPath = path.join(BASE_DIR, 'authorization/dia-loi-admission-authorization.json');
if (!fs.existsSync(authPath)) {
  console.error('dia-loi-admission-authorization.json not found. Run generate first.');
  process.exit(1);
}

const laneAuthorizations = JSON.parse(
  fs.readFileSync(authPath, 'utf8')
) as LaneAuthorization[];

const decision = deriveDecision(laneAuthorizations);
writePack(path.join(BASE_DIR, 'reports/decision.json'), decision);
console.log(`Decision: ${decision.decision}`);
console.log(`Promoted lanes: ${decision.promotedLanes.length}`);
console.log(`Blocked lanes: ${decision.blockedLanes.length}`);
