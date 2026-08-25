/**
 * Palace Overview static V1.3 research CLI.
 *
 *   npm run research:palace-overview-static-v13:case
 *   npm run research:palace-overview-static-v13:corpus
 *   npm run research:palace-overview-static-v13:compare
 *   npm run research:palace-overview-static-v13:audit
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  analyzeStaticV13Birth,
  renderCase1998AttributionMarkdown,
  runStaticV13CorpusAudit,
} from "@/lib/ziwei/analysis/modules/palace-overview/candidate/static-v1.3";

const OUT = join(process.cwd(), ".research-artifacts/palace-overview-static-vnext");

function cmd(): string {
  return process.argv[2] ?? "case";
}

function runCase(): void {
  mkdirSync(OUT, { recursive: true });
  const analysis = analyzeStaticV13Birth();
  const md = renderCase1998AttributionMarkdown(analysis);
  writeFileSync(join(OUT, "case-1998-tp4c-attribution.json"), JSON.stringify(analysis, null, 2));
  writeFileSync(join(OUT, "case-1998-tp4c-attribution.md"), md);
  console.log(md);
  console.log(`Wrote ${OUT}/case-1998-tp4c-attribution.{json,md}`);
}

function runCorpus(): void {
  mkdirSync(OUT, { recursive: true });
  const audit = runStaticV13CorpusAudit({ corpusSize: 100 });
  writeFileSync(join(OUT, "corpus-audit.json"), JSON.stringify(audit, null, 2));
  console.log(JSON.stringify(audit, null, 2));
  console.log(`Wrote ${OUT}/corpus-audit.json`);
}

function decide(): void {
  const analysis = analyzeStaticV13Birth();
  const audit = runStaticV13CorpusAudit({ corpusSize: 100 });
  const high = analysis.palaces.filter((p) =>
    ["Tật Ách", "Huynh Đệ", "Điền Trạch", "Nô Bộc"].includes(
      p.decomposition.palaceName,
    ),
  );
  const controlDom = audit.control.dominanceRate;
  const ids: Array<
    "context-normalized" | "context-diminishing" | "local-context"
  > = ["context-normalized", "context-diminishing", "local-context"];
  ids.sort(
    (a, b) =>
      audit.candidates[a].dominanceRate - audit.candidates[b].dominanceRate ||
      audit.candidates[a].mutualTrineAmpRate -
        audit.candidates[b].mutualTrineAmpRate ||
      audit.candidates[a].ge90 - audit.candidates[b].ge90 ||
      Math.abs(audit.candidates[a].mean - audit.control.mean) -
        Math.abs(audit.candidates[b].mean - audit.control.mean),
  );
  const bestId = ids[0]!;
  const best = audit.candidates[bestId];
  const reducedDom =
    best.dominanceRate <= controlDom * 0.85 || best.dominanceRate === 0;
  const reducedMutual =
    best.mutualTrineAmpRate <= audit.control.mutualTrineAmpRate * 0.9 ||
    best.mutualTrineAmpRate === 0;
  const notCollapsed = best.mean > 40 && best.mean < 70;
  const reducedCeiling = best.ge90 < audit.control.ge90 * 0.5;
  const decision =
    reducedDom && reducedMutual && notCollapsed && reducedCeiling
      ? "STATIC_CONTEXT_MODEL_READY_FOR_REVIEW"
      : reducedDom || reducedMutual
        ? "STATIC_CONTEXT_MODEL_INCONCLUSIVE"
        : "STATIC_CONTEXT_MODEL_REJECTED";

  const report = {
    decision,
    recommendedCandidate: bestId,
    controlDominanceRate: controlDom,
    candidateDominanceRate: best.dominanceRate,
    controlMutualTrineAmpRate: audit.control.mutualTrineAmpRate,
    candidateMutualTrineAmpRate: best.mutualTrineAmpRate,
    highlight: high.map((p) => ({
      palace: p.decomposition.palaceName,
      branch: p.decomposition.palaceBranch,
      control: p.controlScore,
      localNet: p.decomposition.local.net,
      oppositeNet: p.decomposition.opposite.net,
      trineNet: p.decomposition.trine.net,
      contextNet: p.decomposition.context.net,
      remoteShare: p.decomposition.remoteShare,
      flags: p.decomposition.flags,
      candidates: p.candidates,
    })),
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "decision.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

const c = cmd();
if (c === "case") runCase();
else if (c === "corpus" || c === "audit") runCorpus();
else if (c === "compare") {
  runCase();
  runCorpus();
  decide();
} else {
  console.error(`Unknown command ${c}`);
  process.exit(1);
}
