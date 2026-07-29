import fs from "fs";
import path from "path";
import os from "os";
import { AcquisitionPackManifest } from "./schema/pack.js";
import { generateAcquisitionPack } from "./generate-pack.js";

export function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFilesRecursively(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function copyMaintainedInputs(srcBase: string, destBase: string, manifestPath: string) {
  const copyDir = (subDir: string) => {
    const srcDir = path.join(srcBase, subDir);
    if (fs.existsSync(srcDir)) {
      const destDir = path.join(destBase, subDir);
      fs.mkdirSync(destDir, { recursive: true });
      const files = getFilesRecursively(srcDir);
      for (const srcFile of files) {
         const relPath = path.relative(srcDir, srcFile);
         const destFile = path.join(destDir, relPath);
         fs.mkdirSync(path.dirname(destFile), { recursive: true });
         fs.copyFileSync(srcFile, destFile);
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
      manifest.generatedOutputs.evidenceLedger.replace(".json", ".hash"),
      manifest.generatedOutputs.coverageMatrix,
      manifest.generatedOutputs.coverageMatrix.replace(".json", ".hash"),
      manifest.generatedOutputs.schoolMatrix,
      manifest.generatedOutputs.schoolMatrix.replace(".json", ".hash"),
      manifest.generatedOutputs.handoffQueue,
      manifest.generatedOutputs.handoffQueue.replace(".json", ".hash"),
      manifest.generatedOutputs.summary,
      manifest.generatedOutputs.summary.replace(".json", ".hash"),
      "queue/missing-source-locator-queue.json",
      "queue/missing-source-locator-queue.hash",
      "queue/unresolved-school-scope-queue.json",
      "queue/unresolved-school-scope-queue.hash"
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
      } else {
        if (fs.existsSync(commitFile)) {
           throw new Error(`Committed file should not exist (generator did not produce it): ${file}`);
        }
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
