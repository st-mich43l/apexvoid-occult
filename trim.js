const fs = require('fs');
const files = [
  'src/components/ziwei/major-fortune/MajorFortuneSection.tsx',
  'src/lib/ziwei/analysis/modules/major-fortune/audit/v0.5-production-shadow/run-audit.ts',
  'src/lib/ziwei/analysis/modules/major-fortune/audit/v0.5-production-shadow/write-pack.ts',
  'src/lib/ziwei/analysis/modules/major-fortune/v0.5-candidate/candidate.ts',
  'src/lib/ziwei/analysis/modules/major-fortune/shadow-comparison.ts',
  'src/lib/ziwei/analysis/modules/major-fortune/shadow.ts',
  'src/lib/ziwei/analysis/knowledge/major-fortune-scoring/v0.5-production/evaluate-admission.ts'
];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const fixed = content.split('\n').map(line => line.replace(/[ \t]+$/, '')).join('\n');
  fs.writeFileSync(file, fixed);
}
