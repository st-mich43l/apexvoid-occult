import { writeCandidateComparisonArtifact } from "../lib/ziwei/analysis/modules/palace-overview/candidate/compare";

const dir = writeCandidateComparisonArtifact();
process.stdout.write(`wrote ${dir}\n`);
