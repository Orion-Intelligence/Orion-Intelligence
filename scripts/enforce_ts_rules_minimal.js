const fs = require('fs');
const path = require('path');
const ts = require(path.resolve(process.cwd(), 'client/node_modules/typescript'));

function collectTsFiles(dirPath, output) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.angular' || entry.name === 'dist' || entry.name === 'build' || entry.name === 'coverage') {
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

function getIndentAt(content, pos) {
  const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
  const linePrefix = content.slice(lineStart, pos);
  const match = linePrefix.match(/^[ \t]*/);
  return match ? match[0] : '';
}

function dedentLines(text) {
  const lines = text.split('\n');
  let minIndent = null;

  for (const line of lines) {
    if (line.trim() === '') {
      continue;
    }

    const indentLen = (line.match(/^[ \t]*/) || [''])[0].length;
    if (minIndent === null || indentLen < minIndent) {
      minIndent = indentLen;
    }
  }

  if (minIndent === null || minIndent === 0) {
    return lines;
  }

  return lines.map((line) => {
    if (line.trim() === '') {
      return '';
    }
    return line.slice(minIndent);
  });
}

function wrapStatement(content, statementNode, parentIfPos) {
  const start = statementNode.getStart();
  const end = statementNode.end;
  const indent = getIndentAt(content, parentIfPos);
  const childIndent = `${indent}  `;
  const raw = content.slice(start, end).trim();

  const dedented = dedentLines(raw);
  const body = dedented.map((line) => {
    if (line.trim() === '') {
      return '';
    }
    return `${childIndent}${line}`;
  }).join('\n');

  const replacement = `\n${indent}{\n${body}\n${indent}}`;
  return { start, end, replacement };
}

function buildBraceEdits(content, sourceFile) {
  const edits = [];

  function visit(node) {
    if (ts.isIfStatement(node)) {
      if (!ts.isBlock(node.thenStatement)) {
        edits.push(wrapStatement(content, node.thenStatement, node.getStart()));
      }

      if (node.elseStatement && !ts.isIfStatement(node.elseStatement) && !ts.isBlock(node.elseStatement)) {
        edits.push(wrapStatement(content, node.elseStatement, node.getStart()));
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return edits;
}

function applyEdits(content, edits) {
  if (edits.length === 0) {
    return content;
  }

  const sorted = edits.sort((a, b) => b.start - a.start);
  let next = content;

  for (const edit of sorted) {
    next = next.slice(0, edit.start) + edit.replacement + next.slice(edit.end);
  }

  return next;
}

function flattenNamedImports(content) {
  return content.replace(/(^|\n)([ \t]*)import\s+(type\s+)?\{([\s\S]*?)\}\s+from\s+(['"][^'"]+['"])\s*;?/g, (full, lead, indent, typeKw, inner, source) => {
    if (!full.includes('\n', 1)) {
      return full.endsWith(';') ? full : `${full};`;
    }

    const normalized = inner
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .trim()
      .replace(/^,\s*/, '')
      .replace(/,\s*$/, '');

    const typePrefix = typeKw ? 'type ' : '';
    return `${lead}${indent}import ${typePrefix}{ ${normalized} } from ${source};`;
  });
}

function main() {
  const root = path.resolve(process.cwd(), 'client');
  const files = [];
  collectTsFiles(path.join(root, 'src'), files);
  collectTsFiles(path.join(root, 'cypress'), files);

  const rootTs = fs.readdirSync(root).filter((name) => name.endsWith('.ts')).map((name) => path.join(root, name));
  files.push(...rootTs);

  let changed = 0;
  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(filePath, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

    const braceEdits = buildBraceEdits(original, sourceFile);
    let updated = applyEdits(original, braceEdits);
    updated = flattenNamedImports(updated);

    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      changed += 1;
    }
  }

  process.stdout.write(`Updated ${changed} TypeScript files.\n`);
}

main();
