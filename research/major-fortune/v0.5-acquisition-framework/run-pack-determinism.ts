import fs from "fs";
import path from "path";
import crypto from "crypto";
import { generateAcquisitionPack } from "./generate-pack.js";
import { validateAcquisitionPack } from "./validate-pack.js";

function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
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

function hashDirectory(dir: string): string {
  const files = getFilesRecursively(dir).sort();
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    if (!file.endsWith(".hash")) {
      hash.update(fs.readFileSync(file));
    }
  }
  return hash.digest("hex");
}

export function runPackDeterminism(opts: {
  manifestPath: string;
  packBase: string;
  foundationBase: string;
}): void {
  const runA = path.join(opts.packBase, ".determinism-run-a");
  const runB = path.join(opts.packBase, ".determinism-run-b");

  fs.rmSync(runA, { recursive: true, force: true });
  fs.rmSync(runB, { recursive: true, force: true });

  fs.mkdirSync(runA, { recursive: true });
  fs.mkdirSync(runB, { recursive: true });

  const manifest = JSON.parse(fs.readFileSync(opts.manifestPath, "utf8"));

  const copyMaintainedInputs = (srcBase: string, destBase: string) => {
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
    fs.copyFileSync(opts.manifestPath, path.join(destBase, "pack-manifest.json"));
  };

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
    copyMaintainedInputs(opts.packBase, runA);
    copyMaintainedInputs(opts.packBase, runB);

    runGeneratedPipeline(runA);
    runGeneratedPipeline(runB);

    const hashA = hashDirectory(runA);
    const hashB = hashDirectory(runB);

    if (hashA !== hashB) {
      throw new Error(`Determinism failure for pack ${manifest.packId}: Runs A and B produced different hashes.`);
    }
  } finally {
    fs.rmSync(runA, { recursive: true, force: true });
    fs.rmSync(runB, { recursive: true, force: true });
  }
}
