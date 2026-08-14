import type { School } from "@/types/chart";
import type { NatalBenchmarkInput } from "./natal-input";
import { fingerprintHash, fingerprintNatalCase, syntheticCaseId } from "./case-fingerprint";
import { classifyCohorts } from "./cohort-classifier";
import {
  reviewableSchools,
  schoolEligibilityForFingerprint,
  type SchoolEligibility,
} from "./school-eligibility";

export const DISCOVERY_VERSION = "1.0.0";

export interface DiscoveryConfig {
  discoveryVersion: string;
  fromDate: string;
  toDate: string;
  stepDays: number;
  hours: string[];
  genders: Array<"male" | "female">;
  timezone: string;
  fingerprintSchool: School;
  maxCandidates: number;
}

export interface DiscoveredCandidate {
  candidateId: string;
  input: NatalBenchmarkInput;
  fingerprintHash: string;
  cohortTags: string[];
  schoolEligibility: SchoolEligibility[];
  eligibleSchools: School[];
  whyCandidateSelected: string[];
}

function parseDate(iso: string): Date {
  const parts = iso.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function iterateDiscoveryInputs(config: DiscoveryConfig): NatalBenchmarkInput[] {
  const out: NatalBenchmarkInput[] = [];
  const start = parseDate(config.fromDate);
  const end = parseDate(config.toDate);
  for (let t = start.getTime(); t <= end.getTime(); t += config.stepDays * 86400000) {
    const solarDate = formatDate(new Date(t));
    for (const birthHour of config.hours) {
      for (const gender of config.genders) {
        out.push({
          solarDate,
          birthHour,
          gender,
          timezone: config.timezone,
        });
        if (out.length >= config.maxCandidates * 20) return out;
      }
    }
  }
  return out;
}

export function discoverCandidates(config: DiscoveryConfig): DiscoveredCandidate[] {
  const seen = new Set<string>();
  const candidates: DiscoveredCandidate[] = [];
  for (const input of iterateDiscoveryInputs(config)) {
    if (candidates.length >= config.maxCandidates) break;
    const fp = fingerprintNatalCase(input, config.fingerprintSchool);
    const hash = fingerprintHash(fp);
    if (seen.has(hash)) continue;
    seen.add(hash);
    const schoolEligibility = schoolEligibilityForFingerprint(fp);
    candidates.push({
      candidateId: syntheticCaseId(input),
      input,
      fingerprintHash: hash,
      cohortTags: classifyCohorts(fp),
      schoolEligibility,
      eligibleSchools: reviewableSchools(schoolEligibility),
      whyCandidateSelected: [],
    });
  }
  return candidates;
}

const COVERAGE_FEATURES = [
  "vcd",
  "non-vcd",
  "tuan",
  "triet",
  "no-void",
  "structural-system",
  "system-tu-phu-vu-tuong",
  "system-co-nguyet-dong-luong",
  "system-sat-pha-tham",
  "brightness-strong",
  "brightness-ham-heavy",
  "brightness-mixed",
];

export function greedySelect(
  candidates: DiscoveredCandidate[],
  count: number,
): DiscoveredCandidate[] {
  const selected: DiscoveredCandidate[] = [];
  const covered = new Set<string>();
  const remaining = [...candidates];

  const diversityGain = (c: DiscoveredCandidate): number => {
    const hours = new Set(selected.map((s) => s.input.birthHour));
    const genders = new Set(selected.map((s) => s.input.gender));
    const dates = new Set(selected.map((s) => s.input.solarDate));
    let gain = 0;
    if (!hours.has(c.input.birthHour)) gain += 3;
    if (!genders.has(c.input.gender)) gain += 3;
    if (!dates.has(c.input.solarDate)) gain += 2;
    const selectedTags = new Set(selected.flatMap((s) => s.cohortTags));
    const novel = c.cohortTags.filter((t) => !selectedTags.has(t)).length;
    gain += novel;
    return gain;
  };

  while (selected.length < count && remaining.length) {
    let bestIdx = 0;
    let bestGain = -1;
    for (let i = 0; i < remaining.length; i++) {
      const tags = remaining[i]!.cohortTags;
      const coverage = tags.filter((t) => COVERAGE_FEATURES.includes(t) && !covered.has(t)).length;
      const gain = coverage * 10 + diversityGain(remaining[i]!);
      if (gain > bestGain) {
        bestGain = gain;
        bestIdx = i;
      }
    }
    const pick = remaining.splice(bestIdx, 1)[0]!;
    const added = pick.cohortTags.filter((t) => COVERAGE_FEATURES.includes(t) && !covered.has(t));
    const reasons = added.map((t) => `adds ${t}`);
    if (!reasons.length) {
      if (!selected.some((s) => s.input.gender === pick.input.gender)) {
        reasons.push(`adds gender ${pick.input.gender}`);
      }
      if (!selected.some((s) => s.input.birthHour === pick.input.birthHour)) {
        reasons.push(`adds hour ${pick.input.birthHour}`);
      }
      if (!reasons.length) reasons.push("improves fingerprint diversity");
    }
    pick.whyCandidateSelected = reasons;
    for (const t of pick.cohortTags) {
      if (COVERAGE_FEATURES.includes(t)) covered.add(t);
    }
    selected.push(pick);
  }
  return selected;
}

export function duplicateFingerprintGroups(
  candidates: DiscoveredCandidate[],
): string[][] {
  const map = new Map<string, string[]>();
  for (const c of candidates) {
    const list = map.get(c.fingerprintHash) ?? [];
    list.push(c.candidateId);
    map.set(c.fingerprintHash, list);
  }
  return [...map.values()].filter((ids) => ids.length > 1);
}
