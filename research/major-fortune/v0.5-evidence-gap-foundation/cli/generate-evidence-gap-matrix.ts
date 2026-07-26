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
  "natal-to-van-star-pattern-compatibility",
  "natal-palace-groups",
  "out-of-frame-transformation-influence",
  "natal-transit-transformation-stacking"
];

const dimensions = [
  "existence",
  "school scope",
  "Major Fortune temporal scope",
  "palace frame",
  "target frame",
  "polarity",
  "strength",
  "pillar ownership",
  "stacking",
  "deduplication",
  "exception policy",
  "Calculation Core readiness",
  "source locator quality",
  "cross-source agreement",
  "corpus measurability",
  "candidate eligibility"
];

function createDefaultDimension(dimName: string, isProduction: boolean) {
  // If production, we assume some engineering-only status for existence/polarity, otherwise missing
  const isEng = isProduction && ["existence", "school scope", "polarity", "palace frame", "pillar ownership"].includes(dimName);
  const status = dimName === "candidate eligibility" ? "missing" 
                 : dimName === "Calculation Core readiness" ? (isProduction ? "verified" : "partial")
                 : dimName === "corpus measurability" ? (isProduction ? "verified" : "partial")
                 : (isEng ? "engineering-only" : "missing");

  return {
    status,
    sourceIds: [],
    claimIds: [],
    gapIds: [`GAP-V05-${dimName.replace(/ /g, '-').toUpperCase()}`],
    notes: `No classical evidence available for ${dimName}.`
  };
}

const matrix = families.map(family => {
  const isProduction = [
    "element-relation",
    "principal-star-dignity",
    "support-auxiliary-sets",
    "pressure-auxiliary-sets",
    "nam-phai-major-fortune-transformations",
    "trung-chau-major-fortune-transformations"
  ].includes(family);

  const familyDimensions: Record<string, any> = {};
  for (const dim of dimensions) {
    familyDimensions[dim] = createDefaultDimension(dim, isProduction);
  }

  return {
    signalFamilyId: family,
    dimensions: familyDimensions
  };
});

fs.writeFileSync(
  path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation/matrices/evidence-gap-matrix.json'),
  JSON.stringify(matrix, null, 2)
);
console.log('Generated evidence-gap-matrix.json');
