import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMajorFortuneKnowledgeV02 } from "../../../../../knowledge/major-fortune-scoring/v0.2";
import { validateMajorFortuneKnowledgeV02 } from "../../../../../knowledge/major-fortune-scoring/v0.2/validate";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../../../../..");
const FOUNDATION = path.join(ROOT, "research/major-fortune/v0.2-foundation");

function readJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(FOUNDATION, rel), "utf8"));
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function main(): void {
  const sources = readJson("sources/source-registry.json") as { sources: Array<{ sourceId: string }> };
  const claims = readJson("claims/claim-registry.json") as {
    claims: Array<{ claimId: string; sourceIds: string[] }>;
  };
  const sourceIds = new Set(sources.sources.map((s) => s.sourceId));
  assert(sources.sources.length >= 1, "sources empty");
  assert(claims.claims.length >= 1, "claims empty");
  for (const claim of claims.claims) {
    for (const sid of claim.sourceIds) {
      assert(sourceIds.has(sid), `claim ${claim.claimId} refs missing source ${sid}`);
    }
  }

  const policyFiles = fs.readdirSync(path.join(FOUNDATION, "policies")).filter((f) => f.endsWith(".json"));
  assert(policyFiles.length >= 9, `expected >=9 policies, got ${policyFiles.length}`);

  const loaded = loadMajorFortuneKnowledgeV02();
  assert(loaded.ok, `knowledge invalid: ${JSON.stringify(loaded)}`);
  if (!loaded.ok) return;
  const v = validateMajorFortuneKnowledgeV02(loaded.knowledge as never);
  assert(v.ok, `validate failed: ${JSON.stringify(v.issues)}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        sourceCount: sources.sources.length,
        claimCount: claims.claims.length,
        policyCount: policyFiles.length,
        ruleCount: loaded.knowledge.rules.rules.length,
        knowledgeVersion: loaded.knowledge.manifest.knowledgeVersion,
      },
      null,
      2,
    ),
  );
}

main();
