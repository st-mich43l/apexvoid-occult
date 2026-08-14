import {
  AXIS_ORDINAL_VALUES,
  CONFIDENCE_VALUES,
  NET_QUALITY_VALUES,
  PAIRWISE_RESULT_VALUES,
  palaceRatingIsUsable,
  type ExpertReview,
  type PalaceExpertRating,
} from "../calibration/benchmark-v2-types";
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

export function derivedReviewId(assignmentId: string): string {
  return `${assignmentId}-review-v1`;
}

export function assembleExportedReview(input: {
  pack: ExpertReviewNatalPack;
  assignment: ExpertReviewAssignment;
  pairwise: AssignedPair[];
  palaceSelections: Record<string, Partial<PalaceExpertRating>>;
  pairwiseResults: Array<string | undefined>;
  reviewerConfidence?: string;
  reviewedAt: string;
}): { review: ExpertReview; errors: string[] } {
  const errors: string[] = [];
  const palaceRatings: PalaceExpertRating[] = input.pack.palaces.map((p) => {
    const sel = input.palaceSelections[p.name] ?? {};
    const rating: PalaceExpertRating = {
      palaceName: p.name,
      support: sel.support ?? "unable-to-judge",
      pressure: sel.pressure ?? "unable-to-judge",
      stability: sel.stability ?? "unable-to-judge",
      activation: sel.activation ?? "unable-to-judge",
      netQuality: sel.netQuality ?? "unable-to-judge",
    };
    if (sel.confidence) rating.confidence = sel.confidence;
    if (palaceRatingIsUsable(rating) && !rating.confidence) {
      errors.push(`${p.name} usable rating requires explicit confidence`);
    }
    return rating;
  });
  const pairwiseComparisons = input.pairwise.map((pair, i) => ({
    reviewerId: input.assignment.reviewerId,
    school: input.assignment.school,
    caseId: input.assignment.caseId,
    axis: pair.axis,
    leftPalace: pair.leftPalace,
    rightPalace: pair.rightPalace,
    result: (input.pairwiseResults[i] ?? "UNABLE_TO_JUDGE") as ExpertReview["pairwiseComparisons"][number]["result"],
  }));
  const review: ExpertReview = {
    reviewId: derivedReviewId(input.assignment.assignmentId),
    assignmentId: input.assignment.assignmentId,
    caseId: input.assignment.caseId,
    reviewerId: input.assignment.reviewerId,
    school: input.assignment.school,
    reviewedAt: input.reviewedAt,
    blindedToEngine: true,
    rubricVersion: CURRENT_RUBRIC_VERSION,
    palaceRatings,
    pairwiseComparisons,
  };
  if (input.reviewerConfidence === "low" || input.reviewerConfidence === "medium" || input.reviewerConfidence === "high") {
    review.reviewerConfidence = input.reviewerConfidence;
  }
  return { review, errors };
}

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
  <p class="warn">RESEARCH ONLY. Unanswered palace axes export as unable-to-judge. Confidence is never defaulted. Usability comments belong in pilot-feedback, not this JSON.</p>
  <p>Reviewer: ${escapeHtml(input.assignment.reviewerId)} · Case: ${escapeHtml(input.assignment.caseId)} · School: ${escapeHtml(input.assignment.school)} · Assignment: ${escapeHtml(input.assignment.assignmentId)} · Rubric: ${CURRENT_RUBRIC_VERSION}</p>
  <p>support = beneficial structural potential · pressure = constraining pressure · stability = steadiness · activation = movement potential · netQuality = overall supportive-vs-pressure balance</p>
  <div id="chart"></div>
  <fieldset><legend>Overall reviewer confidence (optional; must be explicit if set)</legend>
    ${CONFIDENCE_VALUES.map((c) => `<label><input type=radio name="reviewerConfidence" value="${c}">${c}</label>`).join(" ")}
  </fieldset>
  <div id="form"></div>
  <p id="counts"></p>
  <button id="export" type="button">Export review JSON</button>
  <pre id="out"></pre>
  <script>
    const PACK = ${packJson};
    const ASSIGNMENT = ${assignmentJson};
    const PAIRS = ${pairwiseJson};
    const RUBRIC = ${JSON.stringify(CURRENT_RUBRIC_VERSION)};
    const AXIS = ${JSON.stringify(AXIS_ORDINAL_VALUES)};
    const NET = ${JSON.stringify(NET_QUALITY_VALUES)};
    const CONF = ${JSON.stringify(CONFIDENCE_VALUES)};
    const PAIR = ${JSON.stringify(PAIRWISE_RESULT_VALUES)};
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
    const row = (label, opts, name) => label + " " + opts.map(o =>
      "<label><input type=radio name='" + name + "' value='" + o + "'>" + o + "</label>"
    ).join(" ");
    form.innerHTML = PACK.palaces.map(p => {
      return "<fieldset><legend>" + p.name + "</legend>" +
        row("support", AXIS, p.name + ":support") + "<br>" +
        row("pressure", AXIS, p.name + ":pressure") + "<br>" +
        row("stability", AXIS, p.name + ":stability") + "<br>" +
        row("activation", AXIS, p.name + ":activation") + "<br>" +
        row("netQuality", NET, p.name + ":netQuality") + "<br>" +
        row("confidence (required if any axis is usable)", CONF, p.name + ":confidence") +
        "</fieldset>";
    }).join("") + PAIRS.map((pair, i) =>
      "<fieldset><legend>Pairwise " + pair.axis + " " + pair.leftPalace + " vs " + pair.rightPalace + "</legend>" +
      PAIR.map(r =>
        "<label><input type=radio name='pair-" + i + "' value='" + r + "'>" + r + "</label>"
      ).join(" ") + "</fieldset>"
    ).join("");
    document.getElementById("export").onclick = () => {
      const selected = (name) => {
        const el = document.querySelector("input[name='" + name + "']:checked");
        return el ? el.value : undefined;
      };
      const usable = (r) => [r.support, r.pressure, r.stability, r.activation, r.netQuality].some(v => v !== "unable-to-judge");
      const palaceRatings = PACK.palaces.map(p => {
        const rating = {
          palaceName: p.name,
          support: selected(p.name + ":support") || "unable-to-judge",
          pressure: selected(p.name + ":pressure") || "unable-to-judge",
          stability: selected(p.name + ":stability") || "unable-to-judge",
          activation: selected(p.name + ":activation") || "unable-to-judge",
          netQuality: selected(p.name + ":netQuality") || "unable-to-judge",
        };
        const conf = selected(p.name + ":confidence");
        if (conf) rating.confidence = conf;
        return rating;
      });
      const pairwiseComparisons = PAIRS.map((pair, i) => ({
        reviewerId: ASSIGNMENT.reviewerId,
        school: ASSIGNMENT.school,
        caseId: ASSIGNMENT.caseId,
        axis: pair.axis,
        leftPalace: pair.leftPalace,
        rightPalace: pair.rightPalace,
        result: selected("pair-" + i) || "UNABLE_TO_JUDGE",
      }));
      const missingConf = palaceRatings.filter(r => usable(r) && !r.confidence);
      if (missingConf.length) {
        document.getElementById("out").textContent = "Export blocked: usable palaces need explicit confidence: " + missingConf.map(r => r.palaceName).join(", ");
        return;
      }
      const usableCount = palaceRatings.filter(usable).length;
      const unableCount = palaceRatings.length - usableCount;
      const pairDone = pairwiseComparisons.filter(p => p.result !== "UNABLE_TO_JUDGE").length;
      document.getElementById("counts").textContent = "usable palaces " + usableCount + " · unable palaces " + unableCount + " · pairwise completed " + pairDone;
      const review = {
        reviewId: ASSIGNMENT.assignmentId + "-review-v1",
        assignmentId: ASSIGNMENT.assignmentId,
        caseId: ASSIGNMENT.caseId,
        reviewerId: ASSIGNMENT.reviewerId,
        school: ASSIGNMENT.school,
        reviewedAt: new Date().toISOString(),
        blindedToEngine: true,
        rubricVersion: RUBRIC,
        palaceRatings,
        pairwiseComparisons,
      };
      const overall = selected("reviewerConfidence");
      if (overall) review.reviewerConfidence = overall;
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

export function reviewFormMustNotFabricateConfidence(html: string): string[] {
  const errors: string[] = [];
  if (html.includes('? "medium"') || html.includes("? 'medium'") || html.includes('reviewerConfidence: "medium"')) {
    errors.push("form fabricates medium confidence");
  }
  return errors;
}
