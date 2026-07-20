import { loadRuleSeed } from "../load-rule-seed";
import { generateReports } from "../generate-reports";

const data = loadRuleSeed();
generateReports(data);
console.log("Reports generated");