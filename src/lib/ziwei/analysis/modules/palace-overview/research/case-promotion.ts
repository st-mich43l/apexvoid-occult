import type { ExpertBenchmarkCase } from "../calibration/benchmark-v2-types";
import { assignCaseSplit } from "../calibration/split-v2";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { normalizeNatalFacts } from "../../../facts";
import type { DiscoveredCandidate } from "./case-discovery";
import { toBirthInput } from "./natal-input";

const HOURS = new Set([
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
]);

export function validateCandidate(candidate: DiscoveredCandidate): string[] {
  const errors: string[] = [];
  const { solarDate, birthHour, gender, timezone } = candidate.input;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(solarDate)) errors.push("invalid solarDate");
  if (!HOURS.has(birthHour)) errors.push("invalid birthHour");
  if (gender !== "male" && gender !== "female") errors.push("invalid gender");
  if (!timezone) errors.push("invalid timezone");
  try {
    const chart = calculateNamPhai(toBirthInput(candidate.input));
    if (chart.palaces.length !== 12) errors.push("chart must have 12 palaces");
    const { facts } = normalizeNatalFacts(chart, { school: "nam-phai" });
    if (facts.length === 0) errors.push("natal facts empty");
  } catch (err) {
    errors.push(`calculation failed: ${String(err)}`);
  }
  return errors;
}

export function promoteCandidate(
  candidate: DiscoveredCandidate,
  createdAt: string,
): ExpertBenchmarkCase {
  const errors = validateCandidate(candidate);
  if (errors.length) {
    throw new Error(`cannot promote ${candidate.candidateId}: ${errors.join("; ")}`);
  }
  const caseId = candidate.candidateId;
  return {
    caseId,
    input: toBirthInput(candidate.input),
    eligibleSchools: candidate.eligibleSchools.length
      ? candidate.eligibleSchools
      : ["trung-chau"],
    cohortTags: candidate.cohortTags,
    createdAt,
    splitAssignment: assignCaseSplit(caseId),
    splitVersion: "v2",
  };
}
