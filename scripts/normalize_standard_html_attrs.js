const fs = require('fs');
const path = require('path');

const STANDARD_TAGS = new Set([
  'a',
  'article',
  'aside',
  'audio',
  'b',
  'blockquote',
  'body',
  'button',
  'canvas',
  'caption',
  'code',
  'col',
  'colgroup',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'em',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'meta',
  'nav',
  'ol',
  'option',
  'p',
  'pre',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'summary',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'ul',
  'video'
]);

function collectHtmlFiles(dirPath, output) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath, output);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.html')) {
      output.push(fullPath);
    }
  }
}

function normalizeStandardTagAttributes(content) {
  return content.replace(/<([a-z][a-z0-9-]*)([^<>]*?)>/gim, (full, rawTag, rawAttrs) => {
    const tag = String(rawTag).toLowerCase();
    if (!STANDARD_TAGS.has(tag)) {
      return full;
    }

    if (!rawAttrs || !rawAttrs.includes('\n')) {
      return full;
    }

    let attrs = rawAttrs.replace(/\r?\n\s*/g, ' ');
    attrs = attrs.replace(/\s+$/, '');
    if (attrs.length > 0 && !attrs.startsWith(' ')) {
      attrs = ` ${attrs}`;
    }

    return `<${rawTag}${attrs}>`;
  });
}

function main() {
  const root = path.resolve(process.cwd(), 'client', 'src');
  const htmlFiles = [];
  collectHtmlFiles(root, htmlFiles);

  let changedCount = 0;
  for (const filePath of htmlFiles) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = normalizeStandardTagAttributes(original);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      changedCount += 1;
    }
  }

  process.stdout.write(`Updated ${changedCount} HTML files.\n`);
}

main();
