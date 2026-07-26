import fs from "fs";
import path from "path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { runReconciliation } from "../cli/reconcile-v04-transformation-baseline.js";
import { runCorpusReport } from "../cli/report-corpus.js";
import type { TransformationReconciliationDelta, CorpusGapReport } from "../schema/foundation.js";

const ROOT = process.cwd();
const BASE_PATH = path.join(ROOT, "research/major-fortune/v0.5-evidence-gap-foundation");

describe("Transformation Tuple Baseline Reconciliation", () => {
  it("resolves exact nine-tuple delta via comparison contract mismatch", () => {
    // Run the script to generate the delta report
    runReconciliation();

    const deltaPath = path.join(BASE_PATH, "reports/v04-current-transformation-delta.json");
    expect(fs.existsSync(deltaPath)).toBe(true);

    const delta: TransformationReconciliationDelta = JSON.parse(
      fs.readFileSync(deltaPath, "utf8"),
    );

    expect(delta.frozenCount).toBe(4289);
    expect(delta.currentCount).toBe(4298);
    expect(delta.exactMatches).toBeGreaterThan(4100);

    expect(delta.onlyInFrozen).toHaveLength(105);
    expect(delta.onlyInCurrent).toHaveLength(114);

    expect(delta.resolutionStatus).toBe("comparison-contract-mismatch");
  });

  it("projects compatibility onto the corpus gap report", () => {
    runReconciliation(); // Ensure delta exists
    runCorpusReport(); // Run corpus report to consume delta

    const corpusPath = path.join(BASE_PATH, "reports/corpus-gap-report.json");
    const corpus: CorpusGapReport = JSON.parse(
      fs.readFileSync(corpusPath, "utf8"),
    );

    expect(corpus.reconciliation.status).toBe("matched");
    expect(corpus.reconciliation.reason).toMatch(/compatibility projection/i);
  });
});
