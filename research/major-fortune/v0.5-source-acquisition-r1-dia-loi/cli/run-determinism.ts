import fs from "fs";
import os from "os";
import path from "path";
import {
  copyMaintainedInputs,
  runGeneratedPipeline,
  GENERATED_FILES
} from "./check-acquisition-pack.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(ROOT, "research/major-fortune/v0.5-source-acquisition-r1-dia-loi");

function listFiles(base: string): string[] {
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(path.relative(base, fullPath));
      }
    }
  };
  walk(base);
  return files.sort();
}

function compareBytes(leftBase: string, rightBase: string, files: readonly string[], label: string): void {
  for (const relativePath of files) {
    const leftPath = path.join(leftBase, relativePath);
    const rightPath = path.join(rightBase, relativePath);
    if (!fs.existsSync(leftPath) || !fs.existsSync(rightPath)) {
      throw new Error(`${label}: missing ${relativePath}`);
    }
    if (!fs.readFileSync(leftPath).equals(fs.readFileSync(rightPath))) {
      throw new Error(`${label}: byte mismatch for ${relativePath}`);
    }
  }
}

export function runDeterminism(): void {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "mf-v05-acq-det-"));
  const runA = path.join(parent, "run-a");
  const runB = path.join(parent, "run-b");
  fs.mkdirSync(runA, { recursive: true });
  fs.mkdirSync(runB, { recursive: true });

  try {
    copyMaintainedInputs(CANONICAL_BASE, runA);
    copyMaintainedInputs(CANONICAL_BASE, runB);
    
    runGeneratedPipeline(runA);
    runGeneratedPipeline(runB);

    const expectedGenerated = [...GENERATED_FILES].sort();
    const generatedSetA = listFiles(runA).filter((file) => expectedGenerated.includes(file as any));
    const generatedSetB = listFiles(runB).filter((file) => expectedGenerated.includes(file as any));

    if (
      JSON.stringify(generatedSetA) !== JSON.stringify(expectedGenerated) ||
      JSON.stringify(generatedSetB) !== JSON.stringify(expectedGenerated)
    ) {
      throw new Error("Deterministic runs did not produce the exact generated file set.");
    }

    compareBytes(runA, runB, expectedGenerated, "Run A versus Run B");
    compareBytes(runA, CANONICAL_BASE, expectedGenerated, "Run A versus committed artifacts");
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeterminism();
}
