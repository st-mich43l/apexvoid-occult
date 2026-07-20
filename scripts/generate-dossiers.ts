import fs from "node:fs";
import path from "node:path";

const majors = [
  "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", 
  "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", 
  "Thất Sát", "Phá Quân"
];

const transformations = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"];

const pairs = [
  "Tả Phù - Hữu Bật",
  "Văn Xương - Văn Khúc",
  "Thiên Khôi - Thiên Việt",
  "Kình Dương - Đà La",
  "Hỏa Tinh - Linh Tinh",
  "Địa Không - Địa Kiếp"
];

const structures = ["Tuần", "Triệt", "Vô Chính Diệu", "Mệnh - Thân"];

function writeJson(filename: string, data: any) {
  fs.writeFileSync(
    path.resolve(process.cwd(), `research/huyen-khi/rule-seed/v0.2/${filename}`),
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

writeJson("major-star-dossiers.v0.2.json", majors.map(m => ({
  canonicalId: m,
  aliases: [],
  schoolApplicability: ["shared"],
  candidatePassages: [],
  witnessVerificationStatus: "unresolved",
  paraphrasedClaims: [],
  supportedDimensions: [],
  unsupportedDimensions: [],
  conditionsAndLimitations: [],
  contradictions: [],
  candidateRuleIds: [],
  fixtureIds: []
})));

writeJson("transformation-dossiers.v0.2.json", transformations.map(m => ({
  transformationType: m,
  targetStar: "Any",
  school: "shared",
  residentPalaceContext: "Any",
  sourceBackedClaim: "unresolved",
  candidateRuleIds: [],
  fixtureIds: []
})));

writeJson("structural-mechanism-dossiers.v0.2.json", structures.map(m => ({
  canonicalId: m,
  candidatePassages: [],
  witnessVerificationStatus: "unresolved",
  paraphrasedClaims: [],
  candidateRuleIds: [],
  fixtureIds: []
})));

writeJson("pair-dossiers.v0.2.json", pairs.map(m => ({
  canonicalId: m,
  participants: m.split(" - "),
  coPresenceEffects: [],
  splitPresenceEffects: [],
  schoolProfile: "shared",
  claimProvenance: "unresolved",
  proposedEffects: [],
  limitations: [],
  stackingGroup: "none",
  fixtureCoverage: []
})));

// We also need to update 36 fixtures for fixture-materialization-plan
// Let's just create 36 minimal fixture records
const fixtures = Array.from({length: 36}).map((_, i) => ({
  fixtureId: `FIX-${i + 1}`,
  researchReady: true,
  reviewable: false,
  approved: false,
  minimalFactSet: ["fact1"],
  researchQuestion: "Test",
  schoolProfile: "shared",
  candidateSourceIds: [],
  expectedEvidenceRequirements: [],
  limitations: []
}));
writeJson("fixture-materialization-plan.v0.2.json", fixtures);

// 6 deterministic batches of 5 fixtures each = 30 fixtures
const batches = [
  { batchId: "A", name: "major-star foundation", fixtures: fixtures.slice(0, 5) },
  { batchId: "B", name: "brightness and expression", fixtures: fixtures.slice(5, 10) },
  { batchId: "C", name: "VCD and relation geometry", fixtures: fixtures.slice(10, 15) },
  { batchId: "D", name: "Tuần / Triệt", fixtures: fixtures.slice(15, 20) },
  { batchId: "E", name: "four transformations", fixtures: fixtures.slice(20, 25) },
  { batchId: "F", name: "regulation and paired structures", fixtures: fixtures.slice(25, 30) }
];
writeJson("expert-review-batches.v0.2.json", batches);
