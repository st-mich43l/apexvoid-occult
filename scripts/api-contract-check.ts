/**
 * CI / local drift check for OpenAPI + generated TypeScript (PR #251).
 * Does not rewrite committed artifacts.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function pythonBin(): string {
  const venv = path.join(ROOT, "backend", ".venv", "bin", "python");
  try {
    execFileSync(venv, ["-c", "import fastapi"], { stdio: "ignore" });
    return venv;
  } catch {
    return "python3";
  }
}

function assertSame(label: string, expectedPath: string, actual: string) {
  const expected = readFileSync(expectedPath, "utf-8");
  if (expected !== actual) {
    console.error(`api:check FAILED — ${label} is stale.`);
    console.error(`Committed: ${expectedPath}`);
    console.error("Run: npm run api:generate");
    process.exitCode = 1;
  } else {
    console.log(`api:check OK — ${label}`);
  }
}

const py = pythonBin();
const openapiActual = execFileSync(
  py,
  ["-c", `
import json, sys
sys.path.insert(0, ${JSON.stringify(path.join(ROOT, "backend"))})
from pathlib import Path
# Reuse generator logic without writing committed file.
# generate_openapi forces VOIDOCC_DEBUG=0 before app import.
import importlib.util
spec = importlib.util.spec_from_file_location(
  "generate_openapi",
  ${JSON.stringify(path.join(ROOT, "backend", "scripts", "generate_openapi.py"))},
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
from app.main import app
schema = app.openapi()
mod._ensure_models(schema)
print(json.dumps(schema, ensure_ascii=False, indent=2, sort_keys=True) + "\\n", end="")
`],
  {
    encoding: "utf-8",
    cwd: path.join(ROOT, "backend"),
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, VOIDOCC_DEBUG: "0" },
  },
);

assertSame(
  "backend/openapi.json",
  path.join(ROOT, "backend", "openapi.json"),
  openapiActual,
);

const dir = mkdtempSync(path.join(tmpdir(), "api-check-"));
const tmpTs = path.join(dir, "api-schema.ts");
try {
  const tmpOpenapi = path.join(dir, "openapi.json");
  writeFileSync(tmpOpenapi, openapiActual, "utf-8");
  execFileSync(
    path.join(ROOT, "node_modules", ".bin", "openapi-typescript"),
    [tmpOpenapi, "-o", tmpTs],
    { cwd: ROOT, stdio: "pipe" },
  );
  const generated = readFileSync(tmpTs, "utf-8");
  assertSame(
    "src/generated/api-schema.ts",
    path.join(ROOT, "src", "generated", "api-schema.ts"),
    generated,
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}
console.log("api:check complete — contracts fresh");
