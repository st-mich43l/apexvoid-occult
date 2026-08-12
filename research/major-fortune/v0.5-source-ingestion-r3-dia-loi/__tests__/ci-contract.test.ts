import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../../');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');
const WORKFLOW_PATH = path.join(REPO_ROOT, '.github/workflows/deploy.yml');

describe('CI Contract Test', () => {
  it('all npm run commands used in Major Fortune workflow steps must exist in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    const scripts = Object.keys(pkg.scripts);
    const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf-8');

    // Narrowly scope to Major Fortune steps
    const lines = workflow.split('\n');
    let inMajorFortuneBlock = false;

    const usedCommands = new Set<string>();

    for (const line of lines) {
      if (line.includes('name: Major Fortune')) {
        inMajorFortuneBlock = true;
      }
      
      if (inMajorFortuneBlock && line.includes('run: npm run ')) {
        const match = line.match(/npm run ([\w:-]+)/);
        if (match) {
          usedCommands.add(match[1]);
        }
        // Assuming one run command per step, we can stop tracking this block
        inMajorFortuneBlock = false;
      }
    }

    // Explicitly verify the requested scripts
    const requiredScripts = [
      'research:major-fortune-v05-gap:all',
      'research:major-fortune-v05-acq-dia-loi-r2b:all',
      'research:major-fortune-v05-ingest-dia-loi-r3:all',
      'audit:major-fortune-v05-shadow-full'
    ];

    for (const req of requiredScripts) {
      usedCommands.add(req);
    }

    const missing = Array.from(usedCommands).filter(cmd => !scripts.includes(cmd));
    expect(missing).toEqual([]);
  });
});
