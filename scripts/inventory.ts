import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIRS = ['research', 'src/lib', 'src/lib/ziwei'].map(d => path.join(ROOT_DIR, d));

interface FileRecord {
  path: string;
  extension: string;
  size: number;
  imports: string[];
  importedBy: string[];
  exports: string[];
  packageJsonRefs: string[];
  testRefs: string[];
  ciWorkflowRefs: string[];
  versionFamily: string;
  likelyStatus: string;
}

const inventory: Record<string, FileRecord> = {};
const allFiles: string[] = [];

function walkDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (['node_modules', '.git', 'dist'].includes(file)) continue;
      walkDir(fullPath);
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.json')) {
        allFiles.push(fullPath);
      }
    }
  }
}

// 1. Gather all files
for (const dir of ['research', 'src/lib', 'src/components']) {
  walkDir(path.join(ROOT_DIR, dir));
}

// Read package.json and github workflows for refs
const packageJsonRaw = fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8');
const packageJson = JSON.parse(packageJsonRaw);
const scripts = packageJson.scripts || {};
const deployYml = fs.readFileSync(path.join(ROOT_DIR, '.github/workflows/deploy.yml'), 'utf8');

function getVersionFamily(filePath: string): string {
  const match = filePath.match(/v\d+\.\d+(\.\d+)?/);
  if (match) return match[0];
  if (filePath.includes('round-2')) return 'v0.9-round-2';
  return 'core';
}

function classifyStatus(record: FileRecord): string {
    const pathStr = record.path;
    if (pathStr.includes('research/') || pathStr.includes('/research/')) {
        if (record.testRefs.length > 0) return 'ACTIVE_RESEARCH';
        if (pathStr.includes('audit')) return 'ACTIVE_RESEARCH';
        return 'HISTORICAL_ONLY';
    }
    if (pathStr.includes('fixtures/') || pathStr.includes('gold/')) return 'CANONICAL_DATA';
    return 'ACTIVE_RUNTIME'; // Default fallback before deep analysis
}

console.log("Analyzing " + allFiles.length + " files...");

for (const file of allFiles) {
  const relativePath = path.relative(ROOT_DIR, file);
  const content = fs.readFileSync(file, 'utf8');
  const stat = fs.statSync(file);
  
  // Naive import parsing
  const imports = Array.from(content.matchAll(/import.*?from\s+['"](.*?)['"]/g)).map(m => m[1]);
  const exports = Array.from(content.matchAll(/export\s+(const|let|var|function|class|interface|type)\s+(\w+)/g)).map(m => m[2]);
  
  // Package JSON script references
  const packageJsonRefs = Object.entries(scripts)
    .filter(([name, cmd]) => typeof cmd === 'string' && (cmd.includes(relativePath) || cmd.includes(path.basename(file))))
    .map(([name]) => name);

  const ciRefs = deployYml.includes(relativePath) ? ['deploy.yml'] : [];
  
  inventory[relativePath] = {
    path: relativePath,
    extension: path.extname(file),
    size: stat.size,
    imports,
    importedBy: [],
    exports,
    packageJsonRefs,
    testRefs: [],
    ciWorkflowRefs: ciRefs,
    versionFamily: getVersionFamily(relativePath),
    likelyStatus: 'UNKNOWN'
  };
}

// Cross reference importedBy
for (const [filePath, record] of Object.entries(inventory)) {
    for (const imp of record.imports) {
        if (imp.startsWith('.')) {
            const resolvedPath = path.join(path.dirname(filePath), imp);
            // find exact match
            const targetPath = Object.keys(inventory).find(p => p.startsWith(resolvedPath) && (p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.json')));
            if (targetPath) {
                inventory[targetPath].importedBy.push(filePath);
                if (filePath.includes('__tests__') || filePath.endsWith('.test.ts')) {
                    inventory[targetPath].testRefs.push(filePath);
                }
            }
        }
    }
}

// Initial classification
for (const record of Object.values(inventory)) {
    record.likelyStatus = classifyStatus(record);
}

fs.writeFileSync(path.join(ROOT_DIR, 'inventory.json'), JSON.stringify(inventory, null, 2));
console.log("Inventory built: inventory.json");
