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

const matrix = families.map(family => {
  return {
    signalFamilyId: family,
    admittedByNamPhai: "unresolved",
    admittedByTrungChau: "unresolved",
    sharedCalculationCoreFacts: [],
    schoolSpecificMapping: false,
    schoolSpecificFrame: false,
    schoolSpecificPolarity: false,
    schoolSpecificExceptions: false,
    unresolvedSchoolContradiction: true,
    crossSchoolFallbackForbidden: true
  };
});

// Explicit overrides for the specific schools
const npIdx = matrix.findIndex(f => f.signalFamilyId === "nam-phai-major-fortune-transformations");
matrix[npIdx].admittedByNamPhai = true;
matrix[npIdx].admittedByTrungChau = false;
matrix[npIdx].schoolSpecificMapping = true;
matrix[npIdx].schoolSpecificFrame = true;

const tcIdx = matrix.findIndex(f => f.signalFamilyId === "trung-chau-major-fortune-transformations");
matrix[tcIdx].admittedByNamPhai = false;
matrix[tcIdx].admittedByTrungChau = true;
matrix[tcIdx].schoolSpecificMapping = true;
matrix[tcIdx].schoolSpecificFrame = true;

fs.writeFileSync(
  path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation/matrices/school-policy-matrix.json'),
  JSON.stringify(matrix, null, 2)
);
console.log('Generated school-policy-matrix.json');
