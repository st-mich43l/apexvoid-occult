import type { StaticV13ChartAnalysis } from "./analyze";

const HIGHLIGHT = new Set(["Tật Ách", "Huynh Đệ", "Điền Trạch", "Nô Bộc"]);

function bucketTable(
  name: string,
  bucket: {
    support: number;
    pressure: number;
    net: number;
    evidenceCount: number;
    contributors: Array<{ label: string; net: number }>;
  },
): string[] {
  const lines = [
    `#### ${name}`,
    "",
    `| metric | value |`,
    `|---|---:|`,
    `| support | ${bucket.support.toFixed(2)} |`,
    `| pressure | ${bucket.pressure.toFixed(2)} |`,
    `| net | ${bucket.net.toFixed(2)} |`,
    `| evidence | ${bucket.evidenceCount} |`,
    "",
  ];
  if (bucket.contributors.length) {
    lines.push("Stars / contributors used:");
    for (const c of bucket.contributors.slice(0, 6)) {
      lines.push(`- ${c.label} (net ${c.net.toFixed(2)})`);
    }
    lines.push("");
  }
  return lines;
}

export function renderCase1998AttributionMarkdown(
  analysis: StaticV13ChartAnalysis,
): string {
  const lines: string[] = [
    "# Palace Overview static V1.3 — 1998 TP4C attribution",
    "",
    `Control: ${analysis.controlId}`,
    `Candidate pack: ${analysis.candidatePackId}`,
    `annualYear: ${analysis.annualYear}`,
    "",
    "## Why Dần / Ngọ / Tuất are high (control V1.2)",
    "",
    "Production adds geometry-weighted evidence from focus + opposite + both trines,",
    "then maps support−pressure through logistic quality. Strong majors in one",
    "tam-hợp frame therefore donate remote support into each sibling palace,",
    "pushing multiple members toward the ceiling without recursive palace scores.",
    "",
    "## 12-palace control vs candidates",
    "",
    "| Palace | Branch | Control V1.2 | Ctx-Norm | Ctx-Dim | Local-Blend | Local net | Context net | Remote share | Flags |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---|",
  ];

  for (const p of analysis.palaces) {
    const d = p.decomposition;
    const mark = HIGHLIGHT.has(d.palaceName) ? " **" : "";
    lines.push(
      `| ${d.palaceName}${mark} | ${d.palaceBranch} | ${d.controlScore.toFixed(1)} | ${p.candidates["context-normalized"].score.toFixed(1)} | ${p.candidates["context-diminishing"].score.toFixed(1)} | ${p.candidates["local-context"].score.toFixed(1)} | ${d.local.net.toFixed(2)} | ${d.context.net.toFixed(2)} | ${d.remoteShare == null ? "—" : (d.remoteShare * 100).toFixed(0) + "%"} | ${d.flags.join(", ") || "—"} |`,
    );
  }

  lines.push(
    "",
    "## Note on Dần–Ngọ–Tuất vs palace names",
    "",
    "For this natal chart the tam-hợp branches map to:",
    "",
    "- Dần → Tật Ách",
    "- Ngọ → Huynh Đệ",
    "- Tuất → Điền Trạch (not Nô Bộc)",
    "",
    "Nô Bộc sits at Tý on a different tam-hợp (Thân–Tý–Thìn).",
    "",
  );
  lines.push("## Highlighted palaces", "");

  for (const p of analysis.palaces) {
    if (!HIGHLIGHT.has(p.decomposition.palaceName)) continue;
    const d = p.decomposition;
    lines.push(`### ${d.palaceName} @ ${d.palaceBranch}`, "");
    lines.push(`Control score: **${d.controlScore.toFixed(1)}**`, "");
    lines.push(...bucketTable(`LOCAL ${d.palaceBranch}`, d.local));
    for (const t of d.trineByBranch) {
      lines.push(...bucketTable(`TRINE ${t.branch}`, t.bucket));
    }
    lines.push(
      ...bucketTable(
        `OPPOSITE ${d.oppositeBranch ?? "?"}`,
        d.opposite,
      ),
    );
    lines.push(...bucketTable("FORMATIONS (interaction-delta)", d.formations));
    lines.push(...bucketTable("TỨ HÓA (all roles)", d.transformations));
    lines.push(...bucketTable("MINOR", d.minor));
    lines.push(...bucketTable("TRÀNG SINH", d.changSheng));
    lines.push(...bucketTable("TUẦN / TRIỆT", d.voidEnv));
    lines.push(...bucketTable("CONTEXT TOTAL (opp+trine)", d.context));
    lines.push(...bucketTable("TOTAL additive (control)", d.combinedAdditive));
    lines.push(
      `localNetShare=${d.localNetShare == null ? "—" : d.localNetShare.toFixed(3)} remoteShare=${d.remoteShare == null ? "—" : d.remoteShare.toFixed(3)}`,
      "",
      `Flags: ${d.flags.join(", ") || "—"}`,
      "",
    );
  }

  lines.push("## Candidate notes", "");
  lines.push(
    "- **context-normalized**: local + soft-bounded context net",
    "- **context-diminishing**: local + rank-diminished remote evidence",
    "- **local-context**: local-primary blend with magnitude-aware context cap",
    "- Production remains CONTROL-V12 until explicit promotion.",
    "- DEV preview: `?palaceStaticCandidate=control|context-normalized|context-diminishing|local-context`",
    "",
  );
  return lines.join("\n");
}
