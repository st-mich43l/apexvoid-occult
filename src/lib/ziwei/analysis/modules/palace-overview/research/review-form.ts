import type { ExpertReviewNatalPack } from "../calibration/review-pack";
import { assertReviewPackContainsStaticNatalFactsOnly } from "../calibration/review-pack";
import type { ExpertReviewAssignment } from "./review-assignment";
import type { AssignedPair } from "./pairwise-assignment";
import { CURRENT_RUBRIC_VERSION } from "./natal-input";

const FORBIDDEN_UI = [
  "score",
  "band",
  "rawAxes",
  "normalizedAxes",
  "intensity",
  "conflict",
  "topSupportDrivers",
  "topPressureDrivers",
];

export function renderReviewFormHtml(input: {
  pack: ExpertReviewNatalPack;
  assignment: ExpertReviewAssignment;
  pairwise: AssignedPair[];
}): string {
  const leaks = assertReviewPackContainsStaticNatalFactsOnly(input.pack);
  if (leaks.length) throw new Error(leaks.join("\n"));
  const packJson = JSON.stringify(input.pack);
  const assignmentJson = JSON.stringify(input.assignment);
  const pairwiseJson = JSON.stringify(input.pairwise);
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Palace Overview research review</title>
  <style>
    body { font-family: sans-serif; max-width: 960px; margin: 1rem auto; }
    .warn { background: #fff3cd; padding: 0.5rem; }
    palace { display: block; border: 1px solid #ccc; margin: 0.5rem 0; padding: 0.5rem; }
  </style>
</head>
<body>
  <p class="warn">RESEARCH ONLY. Do not show Palace Overview scores, bands, axes, drivers, or other reviewers.</p>
  <p>Reviewer: ${escapeHtml(input.assignment.reviewerId)} · Case: ${escapeHtml(input.assignment.caseId)} · School: ${escapeHtml(input.assignment.school)} · Rubric: ${CURRENT_RUBRIC_VERSION}</p>
  <div id="chart"></div>
  <div id="form"></div>
  <button id="export" type="button">Export review JSON</button>
  <pre id="out"></pre>
  <script>
    const PACK = ${packJson};
    const ASSIGNMENT = ${assignmentJson};
    const PAIRS = ${pairwiseJson};
    const RUBRIC = ${JSON.stringify(CURRENT_RUBRIC_VERSION)};
    const AXIS = ["low","medium","high","unable-to-judge"];
    const NET = ["guarded","neutral","supportive","strong","unable-to-judge"];
    const CONF = ["low","medium","high"];
    const chart = document.getElementById("chart");
    chart.innerHTML = PACK.palaces.map(p => {
      const stars = p.stars.map(s => s.name + (s.brightness ? " (" + s.brightness + ")" : "")).join(", ");
      const tf = p.transformations.map(t => t.transformation + "→" + t.targetStar).join(", ");
      const voids = p.voidMarkers.map(v => v.voidType).join(", ");
      return "<palace><strong>" + p.name + " / " + p.branch + "</strong>" +
        (p.isMenh ? " · Mệnh" : "") + (p.isThan ? " · Thân" : "") +
        "<div>" + stars + "</div>" +
        (tf ? "<div>Tứ Hóa: " + tf + "</div>" : "") +
        (voids ? "<div>Void: " + voids + "</div>" : "") +
        (p.changSheng ? "<div>Chang Sinh: " + p.changSheng + "</div>" : "") +
        "</palace>";
    }).join("");
    const form = document.getElementById("form");
    form.innerHTML = PACK.palaces.map(p => {
      const row = (label, opts, name) => label + " " + opts.map(o =>
        "<label><input type=radio name='" + name + "' value='" + o + "'>" + o + "</label>"
      ).join(" ");
      return "<fieldset><legend>" + p.name + "</legend>" +
        row("support", AXIS, p.name + ":support") + "<br>" +
        row("pressure", AXIS, p.name + ":pressure") + "<br>" +
        row("stability", AXIS, p.name + ":stability") + "<br>" +
        row("activation", AXIS, p.name + ":activation") + "<br>" +
        row("netQuality", NET, p.name + ":netQuality") + "<br>" +
        row("confidence", CONF, p.name + ":confidence") +
        "</fieldset>";
    }).join("") + PAIRS.map((pair, i) =>
      "<fieldset><legend>Pairwise " + pair.axis + " " + pair.leftPalace + " vs " + pair.rightPalace + "</legend>" +
      ["LEFT","RIGHT","TIE","UNABLE_TO_JUDGE"].map(r =>
        "<label><input type=radio name='pair-" + i + "' value='" + r + "'>" + r + "</label>"
      ).join(" ") + "</fieldset>"
    ).join("");
    document.getElementById("export").onclick = () => {
      const val = (name) => {
        const el = document.querySelector("input[name='" + name + "']:checked");
        return el ? el.value : "unable-to-judge";
      };
      const palaceRatings = PACK.palaces.map(p => ({
        palaceName: p.name,
        support: val(p.name + ":support"),
        pressure: val(p.name + ":pressure"),
        stability: val(p.name + ":stability"),
        activation: val(p.name + ":activation"),
        netQuality: val(p.name + ":netQuality"),
        confidence: val(p.name + ":confidence") === "unable-to-judge" ? "medium" : val(p.name + ":confidence"),
      }));
      const pairwiseComparisons = PAIRS.map((pair, i) => ({
        reviewerId: ASSIGNMENT.reviewerId,
        school: ASSIGNMENT.school,
        caseId: ASSIGNMENT.caseId,
        axis: pair.axis,
        leftPalace: pair.leftPalace,
        rightPalace: pair.rightPalace,
        result: val("pair-" + i) === "unable-to-judge" ? "UNABLE_TO_JUDGE" : val("pair-" + i),
      }));
      const review = {
        reviewId: ASSIGNMENT.assignmentId + "-review",
        caseId: ASSIGNMENT.caseId,
        reviewerId: ASSIGNMENT.reviewerId,
        school: ASSIGNMENT.school,
        reviewedAt: new Date().toISOString(),
        blindedToEngine: true,
        rubricVersion: RUBRIC,
        palaceRatings,
        pairwiseComparisons,
        reviewerConfidence: "medium",
      };
      document.getElementById("out").textContent = JSON.stringify(review, null, 2);
    };
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function reviewFormMustNotContainEngineOutput(html: string): string[] {
  const errors: string[] = [];
  for (const key of FORBIDDEN_UI) {
    if (html.includes(`"${key}"`) && key !== "conflict") {
      errors.push(`review form leaked ${key}`);
    }
  }
  return errors;
}
