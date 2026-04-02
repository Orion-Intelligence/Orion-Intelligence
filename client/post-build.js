import fs from 'fs';
import path from 'path';

const sourceDir = path.resolve(__dirname, 'build');
const targetDir = path.resolve(__dirname, '../backend/build');

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Build output not found: ${sourceDir}`);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });
