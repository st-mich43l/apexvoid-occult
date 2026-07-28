import fs from "fs";
import path from "path";
import crypto from "crypto";
import { AcquisitionPackManifest } from "./schema/pack.js";

export function checkAcquisitionPack(opts: {
  manifestPath: string;
  packBase: string;
}): void {
  const manifest: AcquisitionPackManifest = JSON.parse(fs.readFileSync(opts.manifestPath, "utf8"));

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
    const fullPath = path.join(opts.packBase, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Generated file missing: ${file}`);
    }
    const hashPath = fullPath.replace(".json", ".hash");
    if (!fs.existsSync(hashPath)) {
      throw new Error(`Generated hash missing for: ${file}`);
    }
    const content = fs.readFileSync(fullPath, "utf8");
    const actualHash = crypto.createHash("sha256").update(content).digest("hex");
    const storedHash = fs.readFileSync(hashPath, "utf8").trim();
    if (actualHash !== storedHash) {
      throw new Error(`Generated file stale (hash mismatch): ${file}`);
    }
  }

  const ledgerContent = fs.readFileSync(path.join(opts.packBase, manifest.generatedOutputs.evidenceLedger), "utf8");
  if (JSON.parse(ledgerContent).length === 0) {
    throw new Error(`Empty evidence ledger generated.`);
  }
}
