/**
 * Post-PO-restore six-axis diagnostic for #236 handoff.
 * Does NOT retune Annual Axes weights.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS } from "@/lib/ziwei/analysis/contracts/annual-axes";
import { analyzeAnnualAxesNamPhaiV10 } from "@/lib/ziwei/analysis/modules/annual-axes/v0.10-layered/analyze";
import { runFastAudit } from "@/lib/ziwei/analysis/modules/annual-axes/v0.10-layered/corpus";

const input = {
  solarDate: "1998-10-01",
  birthHour: "Dần" as const,
  gender: "male" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien" as const,
};

const chart = calculateNamPhai(input);
const v10 = analyzeAnnualAxesNamPhaiV10(chart, {
  profileId: "layered-balanced",
  includeControl: true,
});

const axes = Object.fromEntries(
  ANNUAL_AXIS_DOMAINS.map((domain) => {
    const a = v10.axes[domain];
    return [
      domain,
      {
        finalScore: a.finalScore,
        band: a.band,
        natalSignedNet: a.natal.signedNet,
        decadeSignedNet: a.decade.signedNet,
        annualSignedNet: a.annual.signedNet,
        resonanceSignedNet: a.resonance.signedNet,
        compositeNet: a.compositeNet,
        compositeRaw: a.compositeRaw,
        controlV08Score: v10.controlScores?.[domain] ?? null,
      },
    ];
  }),
);

const out = {
  caseId: "CASE-AA10-M1998-DAN-2026",
  note: "Post Palace Overview V1.2 historical runtime restore. AA config untouched — handoff for #236.",
  profileId: "layered-balanced",
  weights: { natal: 0.3, major: 0.25, annual: 0.35, resonance: 0.1 },
  axes,
};

const dir = join(process.cwd(), ".research-artifacts/annual-axes-v10");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "post-po-restore-1998.json"), JSON.stringify(out, null, 2) + "\n");

const corpus = runFastAudit({ profileId: "layered-balanced", chartCount: 24 });
writeFileSync(
  join(dir, "post-po-restore-corpus-24.json"),
  JSON.stringify(corpus, null, 2) + "\n",
);

console.log(JSON.stringify(out.axes, null, 2));
console.log("wrote", join(dir, "post-po-restore-1998.json"));
