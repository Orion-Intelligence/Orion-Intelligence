const fs = module['require']('fs');
const path = module['require']('path');

const sourceDir = path.resolve(__dirname, 'build');
const targetDirs = [
  path.resolve(__dirname, '../backend/build'),
  path.resolve(__dirname, '../backend/workspace/build'),
];

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Build output not found: ${sourceDir}`);
}

for (const targetDir of targetDirs) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}
