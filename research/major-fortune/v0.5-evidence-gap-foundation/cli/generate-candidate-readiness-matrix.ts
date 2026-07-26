import fs from 'fs';
import path from 'path';

const families = [
  "element-relation",
  "principal-star-dignity",
  "support-auxiliary-sets",
  "pressure-auxiliary-sets",
  "nam-phai-major-fortune-transformations",
  "trung-chau-major-fortune-transformations",
  "vcd-opposite-palace-borrowing",
  "partial-auxiliary-pair-semantics",
  "hinh-ho",
  "severe-pressure-evidence",
  "tuan-triet",
  "tam-khong",
  "natal-palace-groups",
  "out-of-frame-transformation-influence",
  "natal-transit-transformation-stacking"
];

const matrix = families.map(family => ({
  signalFamilyId: family,
  readinessStatus: "research-blocked",
  unresolvedDimensions: ["existence", "school scope", "polarity", "stacking"],
  notes: "Blocked pending classical source adjudication."
}));

// Add the calculation-core blocked one
matrix.push({
  signalFamilyId: "natal-to-van-star-pattern-compatibility",
  readinessStatus: "blocked-by-calculation-core",
  unresolvedDimensions: ["Calculation Core readiness", "existence", "school scope"],
  notes: "Blocked because calculation core cannot measure cross-temporal patterns yet."
});

fs.writeFileSync(
  path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation/matrices/candidate-readiness-matrix.json'),
  JSON.stringify(matrix, null, 2)
);
console.log('Generated candidate-readiness-matrix.json');
