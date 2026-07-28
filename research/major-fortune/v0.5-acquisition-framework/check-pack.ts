import fs from "fs";
import path from "path";
import os from "os";
import { AcquisitionPackManifest } from "./schema/pack.js";
import { generateAcquisitionPack } from "./generate-pack.js";

function copyMaintainedInputs(srcBase: string, destBase: string, manifestPath: string) {
  const copyDir = (subDir: string) => {
    const srcDir = path.join(srcBase, subDir);
    if (fs.existsSync(srcDir)) {
      const destDir = path.join(destBase, subDir);
      fs.mkdirSync(destDir, { recursive: true });
      const files = fs.readdirSync(srcDir);
      for (const file of files) {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      }
    }
  };
  copyDir("sources");
  copyDir("extractions");
  copyDir("claims");
  fs.copyFileSync(manifestPath, path.join(destBase, "pack-manifest.json"));
}

export function checkAcquisitionPack(opts: {
  manifestPath: string;
  packBase: string;
  foundationBase: string;
}): void {
  const manifest: AcquisitionPackManifest = JSON.parse(fs.readFileSync(opts.manifestPath, "utf8"));

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "apexvoid-check-"));
  try {
    copyMaintainedInputs(opts.packBase, tmpDir, opts.manifestPath);

    generateAcquisitionPack({
      manifestPath: path.join(tmpDir, "pack-manifest.json"),
      packBase: tmpDir,
      foundationBase: opts.foundationBase
    });

    const generatedFiles = [
      manifest.generatedOutputs.evidenceLedger,
      manifest.generatedOutputs.coverageMatrix,
      manifest.generatedOutputs.schoolMatrix,
      manifest.generatedOutputs.handoffQueue,
      manifest.generatedOutputs.summary,
      "queue/missing-source-locator-queue.json",
      "queue/unresolved-school-scope-queue.json"
    ];

    for (const file of generatedFiles) {
      const tmpFile = path.join(tmpDir, file);
      const commitFile = path.join(opts.packBase, file);

      if (fs.existsSync(tmpFile)) {
        if (!fs.existsSync(commitFile)) {
          throw new Error(`Generated file missing in commit: ${file}`);
        }
        const tmpContent = fs.readFileSync(tmpFile);
        const commitContent = fs.readFileSync(commitFile);
        if (!tmpContent.equals(commitContent)) {
          throw new Error(`Generated file stale (byte-for-byte mismatch): ${file}`);
        }
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
