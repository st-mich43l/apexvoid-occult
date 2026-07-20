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

const topics: any[] = [];

majors.forEach(s => {
  topics.push({
    topicId: `HK-TOPIC-MAJOR-${s.toUpperCase().replace(/\s/g, "-")}`,
    kind: "major-star",
    canonicalSubjectId: s,
    schoolProfiles: ["shared"],
    sourceIds: [],
    claimIds: [],
    candidateRuleIds: [],
    fixtureIds: [],
    sourceReviewStatus: "unresolved",
    expertReviewStatus: "not-started",
    limitations: []
  });
});

transformations.forEach(s => {
  topics.push({
    topicId: `HK-TOPIC-TRANSFORMATION-${s.toUpperCase().replace(/\s/g, "-")}`,
    kind: "transformation",
    canonicalSubjectId: s,
    schoolProfiles: ["shared"],
    sourceIds: [],
    claimIds: [],
    candidateRuleIds: [],
    fixtureIds: [],
    sourceReviewStatus: "unresolved",
    expertReviewStatus: "not-started",
    limitations: []
  });
});

structures.forEach(s => {
  topics.push({
    topicId: `HK-TOPIC-STRUCTURAL-${s.toUpperCase().replace(/\s/g, "-")}`,
    kind: "structural-mechanism",
    canonicalSubjectId: s,
    schoolProfiles: ["shared"],
    sourceIds: [],
    claimIds: [],
    candidateRuleIds: [],
    fixtureIds: [],
    sourceReviewStatus: "unresolved",
    expertReviewStatus: "not-started",
    limitations: []
  });
});

pairs.forEach(s => {
  topics.push({
    topicId: `HK-TOPIC-PAIR-${s.toUpperCase().replace(/\s/g, "-")}`,
    kind: "paired-structure",
    canonicalSubjectId: s,
    schoolProfiles: ["shared"],
    sourceIds: [],
    claimIds: [],
    candidateRuleIds: [],
    fixtureIds: [],
    sourceReviewStatus: "unresolved",
    expertReviewStatus: "not-started",
    limitations: []
  });
});

fs.writeFileSync(
  path.resolve(process.cwd(), "research/huyen-khi/rule-seed/v0.2/topic-coverage-matrix.v0.2.json"),
  JSON.stringify(topics, null, 2),
  "utf8"
);
