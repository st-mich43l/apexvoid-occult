import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENGINE_DIR = path.resolve(__dirname, "../src/lib/ziwei/analysis/modules/major-fortune/engine-v1");

function getFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, fileList);
    } else if (fullPath.endsWith(".ts")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const FORBIDDEN_STRINGS = [
  "v0.3-ordinal/evaluate",
  "v0.3-ordinal/aggregate",
  "v0.3-ordinal/types",
  "v0.5-candidate",
];

const files = getFiles(ENGINE_DIR);
let errors = 0;

for (const file of files) {
  const content = fs.readFileSync(file, "utf-8");
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (content.includes(forbidden)) {
      console.error(`FORBIDDEN IMPORT IN ${file}: contains '${forbidden}'`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error("V1 Independence Check Failed: Found forbidden dependencies on legacy scoring implementations.");
  process.exit(1);
} else {
  console.log("V1 Independence Check Passed.");
}
