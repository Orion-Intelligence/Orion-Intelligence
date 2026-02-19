const fs = require('fs');
const path = require('path');

function collectTsFiles(dirPath, output) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.angular' ||
        entry.name === 'build' ||
        entry.name === 'coverage' ||
        entry.name === 'dist'
      ) {
        continue;
      }
      collectTsFiles(fullPath, output);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      output.push(fullPath);
    }
  }
}

function wrapIfBodies(content) {
  let next = content;

  next = next.replace(
    /^([ \t]*)if\s*\(([^)\n]+)\)\s*([^\s{][^\n;]*;)\s*$/gm,
    (_full, indent, cond, stmt) => {
      return `${indent}if (${cond})\n${indent}{\n${indent}  ${stmt.trim()}\n${indent}}`;
    }
  );

  next = next.replace(
    /^([ \t]*)else\s+if\s*\(([^)\n]+)\)\s*([^\s{][^\n;]*;)\s*$/gm,
    (_full, indent, cond, stmt) => {
      return `${indent}else if (${cond})\n${indent}{\n${indent}  ${stmt.trim()}\n${indent}}`;
    }
  );

  next = next.replace(
    /^([ \t]*)else(?!\s+if)\s+([^\s{][^\n;]*;)\s*$/gm,
    (_full, indent, stmt) => {
      return `${indent}else\n${indent}{\n${indent}  ${stmt.trim()}\n${indent}}`;
    }
  );

  next = next.replace(
    /^([ \t]*)if\s*\(([^)\n]+)\)\s*\n([ \t]*)(?!\{)([^\n;][^\n]*;)\s*$/gm,
    (_full, indent, cond, _stmtIndent, stmt) => {
      return `${indent}if (${cond})\n${indent}{\n${indent}  ${stmt.trim()}\n${indent}}`;
    }
  );

  next = next.replace(
    /^([ \t]*)else\s+if\s*\(([^)\n]+)\)\s*\n([ \t]*)(?!\{)([^\n;][^\n]*;)\s*$/gm,
    (_full, indent, cond, _stmtIndent, stmt) => {
      return `${indent}else if (${cond})\n${indent}{\n${indent}  ${stmt.trim()}\n${indent}}`;
    }
  );

  next = next.replace(
    /^([ \t]*)else(?!\s+if)\s*\n([ \t]*)(?!\{)([^\n;][^\n]*;)\s*$/gm,
    (_full, indent, _stmtIndent, stmt) => {
      return `${indent}else\n${indent}{\n${indent}  ${stmt.trim()}\n${indent}}`;
    }
  );

  return next;
}

function runFixpoint(content, maxRounds = 6) {
  let current = content;
  for (let i = 0; i < maxRounds; i += 1) {
    const updated = wrapIfBodies(current);
    if (updated === current) {
      return updated;
    }
    current = updated;
  }
  return current;
}

function main() {
  const root = path.resolve(process.cwd(), 'client');
  const files = [];
  collectTsFiles(root, files);

  let changed = 0;
  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = runFixpoint(original);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      changed += 1;
    }
  }

  process.stdout.write(`Updated ${changed} TypeScript files.\n`);
}

main();
