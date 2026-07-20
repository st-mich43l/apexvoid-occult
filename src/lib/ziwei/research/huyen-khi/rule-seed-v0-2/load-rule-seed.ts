import fs from "node:fs";
import path from "node:path";
import { RULE_SEED_DIR } from "./paths";

export function loadRuleSeed() {
  const read = (file: string) => JSON.parse(fs.readFileSync(path.join(RULE_SEED_DIR, file), "utf8"));
  return {
    manifest: read("manifest.v0.2.json"),
    topics: read("topic-coverage-matrix.v0.2.json"),
    extractions: read("source-extraction-records.v0.2.json"),
    majorStars: read("major-star-dossiers.v0.2.json"),
    transformations: read("transformation-dossiers.v0.2.json"),
    structures: read("structural-mechanism-dossiers.v0.2.json"),
    pairs: read("pair-dossiers.v0.2.json"),
    rules: read("candidate-rules.NON-EFFECTIVE.v0.2.json"),
    fixtures: read("fixture-materialization-plan.v0.2.json"),
    batches: read("expert-review-batches.v0.2.json"),
  };
}