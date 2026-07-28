import path from "path";
import { checkAcquisitionPack } from "../../v0.5-acquisition-framework/check-pack.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(ROOT, "research/major-fortune/v0.5-source-acquisition-r1-dia-loi");
const MANIFEST_PATH = path.join(CANONICAL_BASE, "pack-manifest.json");

if (import.meta.url === `file://${process.argv[1]}`) {
  checkAcquisitionPack({
    manifestPath: MANIFEST_PATH,
    packBase: CANONICAL_BASE
  });
}
