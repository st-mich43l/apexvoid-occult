import { readFileSync, rmSync, mkdtempSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { writeMajorFortuneV05ShadowPack } from "../write-pack";

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  for (const file of files) {
    const stat = statSync(join(dir, file));
    if (stat.isDirectory()) {
      getAllFiles(join(dir, file), fileList);
    } else {
      fileList.push(join(dir, file));
    }
  }
  return fileList;
}

function checkDeterminism(): void {
  const tmp1 = mkdtempSync(join(tmpdir(), "mf-v05-det1-"));
  const tmp2 = mkdtempSync(join(tmpdir(), "mf-v05-det2-"));

  try {
    writeMajorFortuneV05ShadowPack(tmp1);
    writeMajorFortuneV05ShadowPack(tmp2);

    const files1 = getAllFiles(tmp1);
    const files2 = getAllFiles(tmp2);

    if (files1.length !== files2.length) {
      throw new Error("File count mismatch between two runs");
    }

    const relFiles1 = files1.map(f => relative(tmp1, f)).sort();
    const relFiles2 = files2.map(f => relative(tmp2, f)).sort();

    for (let i = 0; i < relFiles1.length; i++) {
      if (relFiles1[i] !== relFiles2[i]) {
        throw new Error(`File structure mismatch: ${relFiles1[i]} vs ${relFiles2[i]}`);
      }
      const c1 = readFileSync(join(tmp1, relFiles1[i]!));
      const c2 = readFileSync(join(tmp2, relFiles2[i]!));
      if (!c1.equals(c2)) {
        throw new Error(`Determinism mismatch in file: ${relFiles1[i]}`);
      }
    }

    console.log("Determinism check passed. Both artifacts are byte-identical.");
  } finally {
    rmSync(tmp1, { recursive: true, force: true });
    rmSync(tmp2, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkDeterminism();
}
