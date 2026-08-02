import fs from 'fs';
import path from 'path';
import { runIngest } from '../cli/ingest';
import { runGenerate } from '../cli/generate';
import { runDecision } from '../cli/decision';
import { runReport } from '../cli/report';
import { runDecisionCheck } from '../cli/decision-check';
import { runManifest } from '../cli/manifest';
import { runValidate } from '../cli/validate';

export function createTestPack(id: string) {
  const baseDir = path.resolve(process.cwd(), `.tmp/test-packs/${id}`);
  fs.rmSync(baseDir, { recursive: true, force: true });
  fs.mkdirSync(baseDir, { recursive: true });

  // Copy r1 foundations needed
  const r1Dir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r1-dia-loi');
  fs.mkdirSync(path.join(baseDir, 'foundation'), { recursive: true });
  fs.mkdirSync(path.join(baseDir, 'discovery'), { recursive: true });
  fs.mkdirSync(path.join(baseDir, 'sources'), { recursive: true });

  // Note: generate.ts reads from the actual r1 directory via hardcoded paths or relative?
  // generate.ts uses `process.cwd()` to find R1 reports.
  // We can't change generate.ts to use baseDir for r1, because r1 is fixed.
  // But we need to write our inputs to baseDir.

  return baseDir;
}

export function writeTestInputs(baseDir: string, inputs: {
  discovery?: any[],
  intakes?: any[],
  inspections?: any[],
  locators?: any[],
  extractions?: any[]
}) {
  if (inputs.discovery) {
    fs.mkdirSync(path.join(baseDir, 'discovery'), { recursive: true });
    fs.writeFileSync(path.join(baseDir, 'discovery/discovery-source-registry.json'), JSON.stringify(inputs.discovery));
  }
  if (inputs.intakes) {
    fs.mkdirSync(path.join(baseDir, '.tmp-inputs'), { recursive: true });
    fs.writeFileSync(path.join(baseDir, '.tmp-inputs/normalized-intake.json'), JSON.stringify(inputs.intakes));
    // ingest.ts reads from .tmp/major-fortune-dia-loi-r2b/normalized-intake.json by default.
    // Wait! ingest.ts has hardcoded paths! Let's check ingest.ts.
  }
}
