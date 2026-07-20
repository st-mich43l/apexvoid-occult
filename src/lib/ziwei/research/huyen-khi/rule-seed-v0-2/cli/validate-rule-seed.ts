import { loadRuleSeed } from "../load-rule-seed";
import { validateTopicCoverage } from "../validate-topic-coverage";
import { validateCandidateRules } from "../validate-candidate-rules";

const data = loadRuleSeed();
validateTopicCoverage(data);
validateCandidateRules(data);
console.log("Validation passed");