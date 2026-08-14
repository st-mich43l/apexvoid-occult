import { writeCandidateComparisonArtifact } from "../lib/ziwei/analysis/modules/palace-overview/candidate/compare";
import { writeCandidateV2Artifacts } from "../lib/ziwei/analysis/modules/palace-overview/candidate/v2/compare";

const v1 = writeCandidateComparisonArtifact();
process.stdout.write(`wrote ${v1}\n`);
const v2 = writeCandidateV2Artifacts();
process.stdout.write(`wrote ${v2}\n`);
