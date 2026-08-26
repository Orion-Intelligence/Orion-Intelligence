import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';
import { parseTemplate } from '@angular/compiler';

const clientRoot = process.cwd();
const syncRequested = process.argv.includes('--sync');
const appRoot = path.join(clientRoot, 'src/app');
const localeRoot = path.join(clientRoot, 'src/assets/translate');
const languageConfigPath = path.join(appRoot, 'shared/constants/shared-enums.ts');
const demoTourPath = path.join(clientRoot, 'src/assets/data/demo_tour/demo_tour.json');
const entitiesPath = path.join(clientRoot, 'src/assets/data/entities_data/entities.json');
const uiMetadataProperties = new Set([
  'actionLabel',
  'ariaLabel',
  'description',
  'emptyText',
  'label',
  'loadingText',
  'message',
  'subtitle',
  'title',
  'tooltip'
]);
const translatedEnumNames = new Set(['AiWorkspacePrompt', 'SortType']);
const visibleAttributes = new Set(['alt', 'aria-label', 'label', 'placeholder', 'title']);
const ignoredVisibleText = new Set(['|', '-', '—', '–', '/', ':', '•', '·', '+', '×']);
const technicalUiLiterals = new Set([
  'ASN',
  'CDN',
  'CTI',
  'Ctrl / ⌘',
  'Enter',
  'HSTS',
  'HTTP',
  'ID',
  'IP',
  'ISP',
  'MW',
  'RESULT|',
  'SHA-256',
  'TX',
  'TXID',
  'URL',
  'URL:',
  'WAF',
  'WHERE',
  'x',
]);

function walkFiles(root, extension, output = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, extension, output);
    }
    else if (entry.name.endsWith(extension)) {
      output.push(fullPath);
    }
  }
  return output;
}

function normalizeKey(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isTranslationKeyCandidate(value) {
  const key = normalizeKey(value);
  return !!key
    && /[\p{L}]/u.test(key)
    && !/^#(?:[\da-f]{3,8}|[\w-]+)$/i.test(key)
    && !/^(?:rgba?|hsla?)\(/i.test(key)
    && !/^(?:https?:\/\/|\/|[a-z]:\\)/i.test(key)
    && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)
    && !/^[a-z][a-z\d]*(?:_[a-z\d]+)+$/.test(key);
}

function isVisibleText(value) {
  const text = normalizeKey(value);
  return !!text && !ignoredVisibleText.has(text) && /[\p{L}]/u.test(text);
}

function isAllowedTechnicalText(value) {
  const text = normalizeKey(value);
  return technicalUiLiterals.has(text)
    || /^(?:https?:\/\/|\/)/i.test(text)
    || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

function lineForOffset(source, offset) {
  return source.slice(0, Math.max(0, offset)).split('\n').length;
}

function hasTranslatePipe(ast, seen = new WeakSet()) {
  if (!ast || typeof ast !== 'object' || seen.has(ast)) {
    return false;
  }
  seen.add(ast);
  if (ast.constructor?.name === 'BindingPipe' && ast.name === 'translate') {
    return true;
  }
  for (const [property, value] of Object.entries(ast)) {
    if (['sourceSpan', 'span', 'nameSpan', 'keySpan', 'valueSpan', 'handlerSpan'].includes(property)) {
      continue;
    }
    if (Array.isArray(value) && value.some(entry => hasTranslatePipe(entry, seen))) {
      return true;
    }
    if (!Array.isArray(value) && hasTranslatePipe(value, seen)) {
      return true;
    }
  }
  return false;
}

function collectLiteralKeys(ast, output = new Set()) {
  if (!ast || typeof ast !== 'object') {
    return output;
  }
  const kind = ast.constructor?.name;
  if (kind === 'LiteralPrimitive' && typeof ast.value === 'string') {
    output.add(normalizeKey(ast.value));
  }
  else if (kind === 'ParenthesizedExpression') {
    collectLiteralKeys(ast.expression, output);
  }
  else if (kind === 'Conditional') {
    collectLiteralKeys(ast.trueExp, output);
    collectLiteralKeys(ast.falseExp, output);
  }
  else if (kind === 'Binary' && ['??', '||'].includes(ast.operation)) {
    collectLiteralKeys(ast.left, output);
    collectLiteralKeys(ast.right, output);
  }
  return output;
}

function collectTemplateKeys(source, sourceName, output, errors) {
  const parsed = parseTemplate(source, sourceName, { preserveWhitespaces: false });
  if (parsed.errors?.length) {
    errors.push(...parsed.errors.map(error => `${sourceName}: ${error}`));
    return;
  }

  const seen = new WeakSet();
  const addHardcodedError = (node, kind, value) => {
    const text = normalizeKey(value);
    if (!isVisibleText(text) || isAllowedTechnicalText(text)) {
      return;
    }
    const offset = node.sourceSpan?.start?.offset ?? node.value?.sourceSpan?.start ?? 0;
    errors.push(`${sourceName}:${lineForOffset(source, offset)} has untranslated ${kind}: ${JSON.stringify(text)}`);
  };
  const visit = node => {
    if (!node || typeof node !== 'object' || seen.has(node)) {
      return;
    }
    seen.add(node);
    if (node.constructor?.name === 'BindingPipe' && node.name === 'translate') {
      for (const key of collectLiteralKeys(node.exp)) {
        if (key) {
          output.add(key);
        }
      }
    }
    else if (node.constructor?.name === 'Text') {
      addHardcodedError(node, 'text', node.value);
    }
    else if (node.constructor?.name === 'BoundText') {
      const ast = node.value?.ast;
      if (ast?.constructor?.name === 'Interpolation' && !hasTranslatePipe(ast)) {
        for (const value of ast.strings ?? []) {
          addHardcodedError(node, 'interpolation text', value);
        }
      }
    }
    else if (node.constructor?.name === 'TextAttribute' && visibleAttributes.has(node.name)) {
      addHardcodedError(node, `${node.name} attribute`, node.value);
    }
    else if (node.constructor?.name === 'BoundAttribute' && visibleAttributes.has(node.name) && !hasTranslatePipe(node.value)) {
      for (const value of collectLiteralKeys(node.value)) {
        addHardcodedError(node, `${node.name} binding`, value);
      }
    }
    for (const [property, value] of Object.entries(node)) {
      if (['sourceSpan', 'span', 'nameSpan', 'keySpan', 'valueSpan', 'handlerSpan'].includes(property)) {
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach(visit);
      }
      else {
        visit(value);
      }
    }
  };
  parsed.nodes.forEach(visit);
}

function collectConfiguredLanguages() {
  const source = fs.readFileSync(languageConfigPath, 'utf8');
  const entries = [...source.matchAll(/\w+:\s*{\s*iso1:\s*['"]([a-z-]+)['"],\s*name:\s*['"]([^'"]+)['"]\s*}/g)];
  return {
    locales: new Set(entries.map(match => match[1])),
    names: new Set(entries.map(match => normalizeKey(match[2])))
  };
}

function collectDemoTourKeys(output) {
  const config = JSON.parse(fs.readFileSync(demoTourPath, 'utf8'));
  for (const steps of Object.values(config)) {
    if (!Array.isArray(steps)) {
      continue;
    }
    for (const step of steps) {
      for (const property of ['title', 'description']) {
        const key = normalizeKey(step?.[property]);
        if (key) {
          output.add(key);
        }
      }
    }
  }
}

function collectEntityKeys(output) {
  const entities = JSON.parse(fs.readFileSync(entitiesPath, 'utf8'));
  for (const entity of entities) {
    const title = normalizeKey(entity?.title);
    if (title) {
      output.add(title);
    }
  }
}

const errors = [];
const referencedKeys = new Set();

for (const file of walkFiles(appRoot, '.html')) {
  collectTemplateKeys(fs.readFileSync(file, 'utf8'), path.relative(clientRoot, file), referencedKeys, errors);
}

for (const file of walkFiles(appRoot, '.ts')) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'translate') {
      const argument = node.arguments[0];
      if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) {
        referencedKeys.add(normalizeKey(argument.text));
      }
    }
    if (ts.isPropertyAssignment(node) && node.name.getText(sourceFile) === 'template') {
      const template = node.initializer;
      if (ts.isStringLiteral(template) || ts.isNoSubstitutionTemplateLiteral(template)) {
        collectTemplateKeys(template.text, `${path.relative(clientRoot, file)}#inline-template`, referencedKeys, errors);
      }
    }
    if (ts.isPropertyAssignment(node)) {
      const propertyName = node.name.getText(sourceFile).replace(/^['"]|['"]$/g, '');
      const value = node.initializer;
      if (uiMetadataProperties.has(propertyName) && (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value))) {
        const key = normalizeKey(value.text);
        if (isTranslationKeyCandidate(key)) {
          referencedKeys.add(key);
        }
      }
    }
    if (ts.isEnumMember(node)) {
      const value = node.initializer;
      const enumName = ts.isEnumDeclaration(node.parent) ? node.parent.name.text : '';
      if (translatedEnumNames.has(enumName) && value && (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value))) {
        const key = normalizeKey(value.text);
        if (isTranslationKeyCandidate(key)) {
          referencedKeys.add(key);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

collectDemoTourKeys(referencedKeys);
collectEntityKeys(referencedKeys);

const configuredLanguages = collectConfiguredLanguages();
const configuredLocales = configuredLanguages.locales;
configuredLanguages.names.forEach(name => referencedKeys.add(name));
const localeFiles = walkFiles(localeRoot, '.json').sort();
const translationsByLocale = new Map(localeFiles.map(file => {
  const locale = path.basename(file, '.json');
  try {
    return [locale, JSON.parse(fs.readFileSync(file, 'utf8'))];
  }
  catch (error) {
    errors.push(`${path.relative(clientRoot, file)} is not valid JSON: ${error.message}`);
    return [locale, {}];
  }
}));

const localeFileCodes = new Set(translationsByLocale.keys());
for (const locale of configuredLocales) {
  if (!localeFileCodes.has(locale)) {
    errors.push(`Missing locale file: src/assets/translate/${locale}.json`);
  }
}
for (const locale of localeFileCodes) {
  if (!configuredLocales.has(locale)) {
    errors.push(`Locale file is not configured in LANGUAGE_MAP: ${locale}.json`);
  }
}

const english = translationsByLocale.get('en') ?? {};

if (syncRequested) {
  for (const key of referencedKeys) {
    if (!(key in english)) {
      english[key] = key;
    }
  }

  const canonicalKeys = Object.keys(english).sort((left, right) => left.localeCompare(right));
  for (const [locale, translations] of translationsByLocale) {
    const synchronized = {};
    for (const key of canonicalKeys) {
      synchronized[key] = locale === 'en'
        ? english[key]
        : translations[key] ?? english[key];
    }
    for (const key of Object.keys(translations).filter(key => !(key in english)).sort((left, right) => left.localeCompare(right))) {
      synchronized[key] = translations[key];
    }
    const file = path.join(localeRoot, `${locale}.json`);
    fs.writeFileSync(file, `${JSON.stringify(synchronized, null, 2)}\n`);
  }
  console.log(`Translation catalogs synchronized: ${translationsByLocale.size} locales, ${canonicalKeys.length} English keys, ${referencedKeys.size} statically referenced keys.`);
  process.exit(0);
}

const englishKeys = Object.keys(english).sort();
for (const key of [...referencedKeys].sort()) {
  if (!(key in english)) {
    errors.push(`English locale is missing referenced key: ${JSON.stringify(key)}`);
  }
}

for (const [locale, translations] of translationsByLocale) {
  const keys = Object.keys(translations).sort();
  const missing = englishKeys.filter(key => !(key in translations));
  const extra = keys.filter(key => !(key in english));
  if (missing.length) {
    errors.push(`${locale}.json is missing ${missing.length} key(s): ${missing.join(' | ')}`);
  }
  if (extra.length) {
    errors.push(`${locale}.json has ${extra.length} key(s) absent from en.json: ${extra.join(' | ')}`);
  }
  for (const [key, value] of Object.entries(translations)) {
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${locale}.json has an empty or non-string translation for: ${JSON.stringify(key)}`);
    }
  }
}

if (errors.length) {
  console.error(`Translation audit failed with ${errors.length} issue(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
}
else {
  console.log(`Translation audit passed: ${translationsByLocale.size} locales, ${englishKeys.length} keys, ${referencedKeys.size} statically referenced keys.`);
}
