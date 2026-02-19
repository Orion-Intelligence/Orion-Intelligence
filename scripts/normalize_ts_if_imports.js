const fs = require('fs');
const path = require('path');

function collectTsFiles(dirPath, output) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectTsFiles(fullPath, output);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      output.push(fullPath);
    }
  }
}

function normalizeImports(content) {
  return content.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*(['"][^'"]+['"])\s*;?/g,
    (full, specifiers, source) => {
      if (!specifiers.includes('\n')) {
        return full.endsWith(';') ? full : `${full};`;
      }

      const normalizedSpecifiers = specifiers
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .trim()
        .replace(/^,\s*/, '')
        .replace(/,\s*$/, '');

      return `import { ${normalizedSpecifiers} } from ${source};`;
    }
  );
}

function normalizeSingleLineIf(content) {
  let next = content;

  next = next.replace(
    /(^[ \t]*)else[ \t]+if\s*\(([^)\n]+)\)\s*\{\s*([^{}\n]+?)\s*\}\s*$/gm,
    (_full, indent, cond, body) => {
      const statement = body.trim();
      return `${indent}else if (${cond.trim()})\n${indent}{\n${indent}  ${statement}\n${indent}}`;
    }
  );

  next = next.replace(
    /(^[ \t]*)if\s*\(([^)\n]+)\)\s*\{\s*([^{}\n]+?)\s*\}\s*$/gm,
    (_full, indent, cond, body) => {
      const statement = body.trim();
      return `${indent}if (${cond.trim()})\n${indent}{\n${indent}  ${statement}\n${indent}}`;
    }
  );

  next = next.replace(
    /(^[ \t]*)else[ \t]+if\s*\(([^)\n]+)\)\s*([^\s{][^;\n]*;)\s*$/gm,
    (_full, indent, cond, statement) => {
      return `${indent}else if (${cond.trim()})\n${indent}${statement.trim()}`;
    }
  );

  next = next.replace(
    /(^[ \t]*)if\s*\(([^)\n]+)\)\s*([^\s{][^;\n]*;)\s*$/gm,
    (_full, indent, cond, statement) => {
      return `${indent}if (${cond.trim()})\n${indent}${statement.trim()}`;
    }
  );

  return next;
}

function main() {
  const root = path.resolve(process.cwd(), 'client', 'src');
  const files = [];
  collectTsFiles(root, files);

  let changed = 0;
  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8');
    let updated = original;
    updated = normalizeImports(updated);
    updated = normalizeSingleLineIf(updated);

    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      changed += 1;
    }
  }

  process.stdout.write(`Updated ${changed} TypeScript files.\n`);
}

main();
