import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backend = path.join(root, "backend");
const venvPy = path.join(backend, ".venv", "bin", "python");
const py = existsSync(venvPy) ? venvPy : "python3";
const script = path.join(backend, "scripts", "generate_openapi.py");
const result = spawnSync(py, [script], {
  cwd: backend,
  stdio: "inherit",
  env: { ...process.env, VOIDOCC_DEBUG: "0" },
});
process.exit(result.status ?? 1);
