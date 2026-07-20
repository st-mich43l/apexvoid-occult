import fs from "node:fs";
import path from "node:path";
import { RULE_SEED_DIR } from "../paths";

const content = "# Reviewer Workbook\nGenerated exported content.";
fs.writeFileSync(path.join(RULE_SEED_DIR, "reviewer-workbook.md"), content);
console.log("Workbook exported");