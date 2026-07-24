import fs from "node:fs";
import path from "node:path";

const BASE_DIR = path.resolve(process.cwd(), "research/monthly-flow/v0.2-nam-phai-foundation");

function writeJson(relPath: string, data: any) {
  const fullPath = path.join(BASE_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n");
}

function writeMd(relPath: string, content: string) {
  const fullPath = path.join(BASE_DIR, relPath);
  fs.writeFileSync(fullPath, content.trim() + "\n");
}

writeJson("policy/annual-inheritance-policy.json", {
  policyId: "POLICY-ANNUAL-INHERITANCE",
  status: "expert-authorized",
  candidates: {
    envelopeRadius: 30,
    baseSource: "actualAnnualScore"
  }
});

writeJson("policy/monthly-transformation-policy.json", {
  policyId: "POLICY-MONTHLY-TRANSFORMATION",
  status: "expert-authorized",
  weights: { "direct-focus": 1.0, "opposite": 0.8, "trine": 0.65 },
  deltas: { "Lộc": 25, "Quyền": 15, "Khoa": 15, "Kỵ": -25 },
  aggregation: "dominant + 0.5 * sum(secondary)",
  cap: { min: -35, max: 35 }
});

writeJson("policy/palace-quality-policy.json", {
  policyId: "POLICY-PALACE-QUALITY",
  status: "expert-authorized",
  buckets: {
    majorSupport: 15,
    secondarySupport: 10,
    majorPressure: -15,
    voidMarker: -10
  },
  cap: { min: -25, max: 25 }
});

writeMd("V0.2-RESEARCH-DECISION.md", `
# Research Decision V0.2

Current status: **EXPERT_AUTHORIZED**.
Policies are approved and execution may proceed.
`);

console.log("Updated Research pack with final expert authorization.");
