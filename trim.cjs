const fs = require('fs');
const files = [
  'src/lib/ziwei/analysis/modules/major-fortune/audit/v0.5-production-shadow/cli/decision-check-production-shadow.ts'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/[ \t]+$/gm, '');
  fs.writeFileSync(file, content, 'utf8');
}
