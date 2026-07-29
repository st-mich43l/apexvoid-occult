import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { generateAcquisitionPack } from "./generate-pack.js";
import { validateAcquisitionPack } from "./validate-pack.js";
import { getFilesRecursively, copyMaintainedInputs } from "./check-pack.js";

function hashDirectory(dir: string): string {
  const files = getFilesRecursively(dir).sort();
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    const relPath = path.relative(dir, file);
    hash.update(relPath);
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex");
}

export function runPackDeterminism(opts: {
  manifestPath: string;
  packBase: string;
  foundationBase: string;
}): void {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "apexvoid-det-"));
  const runA = path.join(tmpBase, "run-a");
  const runB = path.join(tmpBase, "run-b");

  fs.mkdirSync(runA, { recursive: true });
  fs.mkdirSync(runB, { recursive: true });

  const manifest = JSON.parse(fs.readFileSync(opts.manifestPath, "utf8"));

  const runGeneratedPipeline = (base: string) => {
    generateAcquisitionPack({
      manifestPath: path.join(base, "pack-manifest.json"),
      packBase: base,
      foundationBase: opts.foundationBase
    });
    validateAcquisitionPack({
      manifestPath: path.join(base, "pack-manifest.json"),
      packBase: base,
      foundationBase: opts.foundationBase
    });
  };

  try {
    copyMaintainedInputs(opts.packBase, runA, opts.manifestPath);
    copyMaintainedInputs(opts.packBase, runB, opts.manifestPath);

    runGeneratedPipeline(runA);
    runGeneratedPipeline(runB);

    const hashA = hashDirectory(runA);
    const hashB = hashDirectory(runB);

    if (hashA !== hashB) {
      throw new Error(`Determinism failure for pack ${manifest.packId}: Runs A and B produced different hashes.`);
    }
  } finally {
    fs.rmSync(tmpBase, { recursive: true, force: true });
  }
}
