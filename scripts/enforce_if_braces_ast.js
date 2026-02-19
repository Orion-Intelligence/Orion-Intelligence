const fs = require('fs');
const path = require('path');
const ts = require(path.resolve(process.cwd(), 'client/node_modules/typescript'));

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

function ensureBlock(statement) {
  if (ts.isBlock(statement)) {
    return statement;
  }
  return ts.factory.createBlock([statement], true);
}

function transformSource(sourceFile) {
  const visitor = (node) => {
    if (ts.isIfStatement(node)) {
      const thenStatement = ts.visitNode(node.thenStatement, visitor);
      let elseStatement = node.elseStatement ? ts.visitNode(node.elseStatement, visitor) : undefined;

      const wrappedThen = ensureBlock(thenStatement);
      if (elseStatement && !ts.isIfStatement(elseStatement) && !ts.isBlock(elseStatement)) {
        elseStatement = ensureBlock(elseStatement);
      }

      return ts.factory.updateIfStatement(
        node,
        ts.visitNode(node.expression, visitor),
        wrappedThen,
        elseStatement
      );
    }
    return ts.visitEachChild(node, visitor, context);
  };

  let context = null;
  const transformer = (ctx) => {
    context = ctx;
    return (rootNode) => ts.visitNode(rootNode, visitor);
  };

  const result = ts.transform(sourceFile, [transformer]);
  const transformed = result.transformed[0];
  result.dispose();
  return transformed;
}

function main() {
  const root = path.resolve(process.cwd(), 'client');
  const files = [];
  collectTsFiles(root, files);

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  let changed = 0;
  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8');
    const source = ts.createSourceFile(filePath, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const transformed = transformSource(source);
    const printed = printer.printFile(transformed);

    if (printed !== original) {
      fs.writeFileSync(filePath, printed, 'utf8');
      changed += 1;
    }
  }

  process.stdout.write(`Updated ${changed} TypeScript files.\n`);
}

main();
