const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const angularPlugin = require('@angular-eslint/eslint-plugin');
const angularTemplatePlugin = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');

const localRules = {
    rules: {
        'template-attr-single-line': {
            meta: {
                type: 'layout',
                docs: {
                    description: 'Require native HTML element opening tags to be on a single line.',
                },
                schema: [],
                messages: {
                    singleLine: 'Native HTML element opening tags must be on a single line.',
                },
                fixable: 'whitespace',
            },
            create(context) {
                const sourceCode = context.getSourceCode();
                function normalizeSingleLine(text) {
                    return text
                        .replace(/\s+/g, ' ')
                        .replace(/\s*>$/, '>')
                        .replace(/<\s+/g, '<');
                }
                return {
                    Element$1(node) {
                        if (!node || !node.name || !node.startSourceSpan) {
                            return;
                        }
                        const name = node.name;
                        if (name.includes('-')) {
                            return;
                        }
                        const startSpan = node.startSourceSpan;
                        const startLine = startSpan.start.line;
                        const endLine = startSpan.end.line;
                        if (startLine !== endLine) {
                            const startOffset = node.startSourceSpan.start.offset;
                            const endOffset = node.startSourceSpan.end.offset;
                            context.report({
                                messageId: 'singleLine',
                                loc: {
                                    start: { line: startLine + 1, column: startSpan.start.col },
                                    end: { line: endLine + 1, column: startSpan.end.col },
                                },
                                fix(fixer) {
                                    const original = sourceCode.text.slice(startOffset, endOffset);
                                    const fixed = normalizeSingleLine(original);
                                    return fixer.replaceTextRange([startOffset, endOffset], fixed);
                                },
                            });
                        }
                    },
                };
            },
        },
        'template-asset-src-root': {
            meta: {
                type: 'layout',
                docs: {
                    description: 'Require img src paths that reference assets to start with assets/ (no ../ prefixes).',
                },
                schema: [],
                messages: {
                    assetsRoot: 'Asset paths in img src should start with "assets/".',
                },
                fixable: 'code',
            },
            create(context) {
                const sourceCode = context.getSourceCode();
                function normalizeAssetPath(value) {
                    const assetsIndex = value.indexOf('assets/');
                    if (assetsIndex === -1) {
                        return null;
                    }
                    const normalized = value.slice(assetsIndex);
                    if (normalized === value) {
                        return null;
                    }
                    return normalized;
                }
                return {
                    Element$1(node) {
                        if (!node || !node.name || !node.attrs || !node.startSourceSpan) {
                            return;
                        }
                        const tagName = node.name;
                        if (tagName.includes('-')) {
                            return;
                        }
                        if (tagName !== 'img') {
                            return;
                        }
                        for (const attr of node.attrs) {
                            if (!attr || attr.name !== 'src' || attr.value == null || !attr.sourceSpan) {
                                continue;
                            }
                            const normalized = normalizeAssetPath(attr.value);
                            if (!normalized) {
                                continue;
                            }
                            const startOffset = attr.sourceSpan.start.offset;
                            const endOffset = attr.sourceSpan.end.offset;
                            context.report({
                                messageId: 'assetsRoot',
                                loc: {
                                    start: { line: attr.sourceSpan.start.line + 1, column: attr.sourceSpan.start.col },
                                    end: { line: attr.sourceSpan.end.line + 1, column: attr.sourceSpan.end.col },
                                },
                                fix(fixer) {
                                    const original = sourceCode.text.slice(startOffset, endOffset);
                                    const quoteMatch = original.match(/=\s*(['"])/);
                                    const quote = quoteMatch ? quoteMatch[1] : '"';
                                    const fixed = `${attr.name}=${quote}${normalized}${quote}`;
                                    return fixer.replaceTextRange([startOffset, endOffset], fixed);
                                },
                            });
                        }
                    },
                };
            },
        },
        'decorator-single-line': {
            meta: {
                type: 'layout',
                docs: {
                    description: 'Require @Input/@Output/@ViewChild property declarations to be on a single line.',
                },
                schema: [],
                messages: {
                    singleLine: '@Input/@Output/@ViewChild declarations must be on a single line.',
                },
                fixable: 'whitespace',
            },
            create(context) {
                const sourceCode = context.getSourceCode();
                function normalizeSingleLine(text) {
                    return text.replace(/\s+/g, ' ').trim();
                }
                function isInputOutputDecorator(dec) {
                    const expr = dec.expression;
                    if (!expr) {
                        return false;
                    }
                    if (expr.type === 'Identifier') {
                        return expr.name === 'Input' || expr.name === 'Output' || expr.name === 'ViewChild';
                    }
                    if (expr.type === 'CallExpression' && expr.callee.type === 'Identifier') {
                        return expr.callee.name === 'Input' || expr.callee.name === 'Output' || expr.callee.name === 'ViewChild';
                    }
                    return false;
                }
                return {
                    PropertyDefinition(node) {
                        if (!node.decorators || node.decorators.length === 0) {
                            return;
                        }
                        const hasInputOutput = node.decorators.some(isInputOutputDecorator);
                        if (!hasInputOutput || !node.loc) {
                            return;
                        }
                        if (node.loc.start.line !== node.loc.end.line) {
                            context.report({
                                messageId: 'singleLine',
                                node,
                                fix(fixer) {
                                    const original = sourceCode.getText(node);
                                    const fixed = normalizeSingleLine(original);
                                    return fixer.replaceText(node, fixed);
                                },
                            });
                        }
                    },
                };
            },
        },
        'decorator-first-in-class': {
            meta: {
                type: 'layout',
                docs: {
                    description: 'Require @Input/@Output/@ViewChild properties to appear before other class members.',
                },
                schema: [],
                messages: {
                    order: '@Input/@Output/@ViewChild properties must appear before other class members.',
                },
                fixable: 'code',
            },
            create(context) {
                const sourceCode = context.getSourceCode();
                function isTargetDecorator(dec) {
                    const expr = dec.expression;
                    if (!expr) {
                        return false;
                    }
                    if (expr.type === 'Identifier') {
                        return expr.name === 'Input' || expr.name === 'Output' || expr.name === 'ViewChild';
                    }
                    if (expr.type === 'CallExpression' && expr.callee.type === 'Identifier') {
                        return expr.callee.name === 'Input' || expr.callee.name === 'Output' || expr.callee.name === 'ViewChild';
                    }
                    return false;
                }
                function isDecoratedProperty(node) {
                    if (!node || node.type !== 'PropertyDefinition' || !node.decorators) {
                        return false;
                    }
                    return node.decorators.some(isTargetDecorator);
                }
                return {
                    ClassBody(node) {
                        let seenNonDecorated = false;
                        const decorated = [];
                        const nonDecorated = [];
                        let hasViolation = false;
                        for (const member of node.body || []) {
                            if (isDecoratedProperty(member)) {
                                decorated.push(member);
                                if (seenNonDecorated) {
                                    hasViolation = true;
                                }
                            }
                            else {
                                seenNonDecorated = true;
                                nonDecorated.push(member);
                            }
                        }
                        if (!hasViolation || decorated.length === 0) {
                            return;
                        }
                        context.report({
                            messageId: 'order',
                            node,
                            fix(fixer) {
                                const members = [...decorated, ...nonDecorated];
                                const first = members[0];
                                const last = members[members.length - 1];
                                if (!first || !last || first.range == null || last.range == null) {
                                    return null;
                                }
                                const replacement = members.map(m => sourceCode.getText(m)).join('\n\n');
                                return fixer.replaceTextRange([first.range[0], last.range[1]], replacement);
                            },
                        });
                    },
                };
            },
        },
        'class-field-group-spacing': {
            meta: {
                type: 'layout',
                docs: {
                    description: 'Require blank lines between class field access modifier groups and no blanks within groups.',
                },
                schema: [],
                messages: {
                    noBlankLine: 'Class fields must not have blank lines within a group.',
                    group: 'Class field access modifier groups must be contiguous.',
                    requireBlankLine: 'Expected a blank line between access modifier groups.',
                },
                fixable: 'whitespace',
            },
            create(context) {
                const sourceCode = context.getSourceCode();
                const accessOrder = ['private', 'protected', 'public', 'default'];
                function getAccess(node) {
                    return node.accessibility || 'default';
                }
                return {
                    ClassBody(node) {
                        const body = node.body || [];
                        const fields = body.filter(m => m.type === 'PropertyDefinition');
                        let seenGroups = new Set();
                        let seenOrder = [];
                        const fixes = [];
                        let hasReport = false;
                        let shouldFix = true;
                        for (let i = 0; i < fields.length - 1; i++) {
                            const current = fields[i];
                            const next = fields[i + 1];
                            const currentIndex = body.indexOf(current);
                            const nextIndex = body.indexOf(next);
                            for (let j = currentIndex + 1; j < nextIndex; j++) {
                                if (body[j].type !== 'PropertyDefinition') {
                                    shouldFix = false;
                                    break;
                                }
                            }
                            if (!shouldFix) {
                                break;
                            }
                        }
                        for (let i = 0; i < fields.length; i++) {
                            const current = fields[i];
                            const access = getAccess(current);
                            const accessIndex = accessOrder.indexOf(access);
                            if (accessIndex === -1) {
                                continue;
                            }
                            const lastSeen = seenOrder[seenOrder.length - 1];
                            if (lastSeen && accessOrder.indexOf(lastSeen) > accessIndex) {
                                hasReport = true;
                            }
                            if (!seenGroups.has(access)) {
                                seenGroups.add(access);
                                seenOrder.push(access);
                            }
                            else {
                                const lastAccess = seenOrder[seenOrder.length - 1];
                                if (access !== lastAccess) {
                                    hasReport = true;
                                }
                            }
                            if (i > 0) {
                                const prev = fields[i - 1];
                                if (!prev.range || !current.range) {
                                    continue;
                                }
                                const between = sourceCode.text.slice(prev.range[1], current.range[0]);
                                const lineStart = sourceCode.text.lastIndexOf('\n', current.range[0] - 1) + 1;
                                const linePrefix = sourceCode.text.slice(lineStart, current.range[0]);
                                const indentMatch = linePrefix.match(/^\s*/);
                                const indent = indentMatch ? indentMatch[0] : '';
                                const sameAccess = getAccess(prev) === access;
                                const hasBlankLine = /\n\s*\n/.test(between);
                                if (sameAccess && hasBlankLine) {
                                    hasReport = true;
                                    fixes.push(fixer => fixer.replaceTextRange([prev.range[1], current.range[0]], `\n${indent}`));
                                }
                                if (!sameAccess && !hasBlankLine) {
                                    hasReport = true;
                                    fixes.push(fixer => fixer.replaceTextRange([prev.range[1], current.range[0]], `\n\n${indent}`));
                                }
                            }
                        }
                        if (hasReport) {
                            context.report({
                                messageId: 'noBlankLine',
                                node,
                                fix(fixer) {
                                    if (!shouldFix || fields.length === 0) {
                                        return fixes.map(fn => fn(fixer));
                                    }
                                    const groups = accessOrder.map(access => fields.filter(field => getAccess(field) === access)).filter(group => group.length > 0);
                                    const first = fields[0];
                                    const last = fields[fields.length - 1];
                                    if (!first.range || !last.range) {
                                        return fixes.map(fn => fn(fixer));
                                    }
                                    const replacement = groups.map(group => group.map(field => sourceCode.getText(field)).join('\n')).join('\n\n');
                                    return fixer.replaceTextRange([first.range[0], last.range[1]], replacement);
                                },
                            });
                        }
                    },
                };
            },
        },
        'method-blank-line': {
            meta: {
                type: 'layout',
                docs: {
                    description: 'Require a blank line before each method.',
                },
                schema: [],
                messages: {
                    blankLine: 'Expected a blank line before method.',
                },
                fixable: 'whitespace',
            },
            create(context) {
                const sourceCode = context.getSourceCode();
                function isMethod(node) {
                    return node.type === 'MethodDefinition';
                }
                return {
                    ClassBody(node) {
                        const body = node.body || [];
                        const fixes = [];
                        let hasReport = false;
                        for (let i = 1; i < body.length; i++) {
                            const current = body[i];
                            if (!isMethod(current) || !current.range) {
                                continue;
                            }
                            const prev = body[i - 1];
                            if (!prev.range) {
                                continue;
                            }
                            const between = sourceCode.text.slice(prev.range[1], current.range[0]);
                            if (!/\n\s*\n/.test(between)) {
                                hasReport = true;
                                fixes.push(fixer => {
                                    const lineStart = sourceCode.text.lastIndexOf('\n', current.range[0] - 1) + 1;
                                    const linePrefix = sourceCode.text.slice(lineStart, current.range[0]);
                                    const indentMatch = linePrefix.match(/^\s*/);
                                    const indent = indentMatch ? indentMatch[0] : '';
                                    return fixer.replaceTextRange([prev.range[1], current.range[0]], `\n\n${indent}`);
                                });
                            }
                        }
                        if (hasReport) {
                            context.report({
                                messageId: 'blankLine',
                                node,
                                fix(fixer) {
                                    return fixes.map(fn => fn(fixer));
                                },
                            });
                        }
                    },
                };
            },
        },
        'no-style-url-in-component': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Disallow styleUrl in Angular component metadata.',
                },
                schema: [],
                messages: {
                    noStyleUrl: 'Use styleUrls instead of styleUrl.',
                },
            },
            create(context) {
                function isComponentDecorator(dec) {
                    const expr = dec.expression;
                    return expr
                        && expr.type === 'CallExpression'
                        && expr.callee.type === 'Identifier'
                        && expr.callee.name === 'Component';
                }
                function hasStyleUrlProperty(arg) {
                    return arg
                        && arg.type === 'ObjectExpression'
                        && arg.properties.some(prop => {
                            if (prop.type !== 'Property') {
                                return false;
                            }
                            const key = prop.key;
                            return key && ((key.type === 'Identifier' && key.name === 'styleUrl') || (key.type === 'Literal' && key.value === 'styleUrl'));
                        });
                }
                return {
                    Decorator(node) {
                        if (!isComponentDecorator(node)) {
                            return;
                        }
                        const arg = node.expression.arguments && node.expression.arguments[0];
                        if (!arg || !hasStyleUrlProperty(arg)) {
                            return;
                        }
                        context.report({ messageId: 'noStyleUrl', node });
                    },
                };
            },
        },
        'class-field-single-line': {
            meta: {
                type: 'layout',
                docs: {
                    description: 'Require class field declarations to be on a single line.',
                },
                schema: [],
                messages: {
                    singleLine: 'Class field declarations must be on a single line.',
                },
                fixable: 'whitespace',
            },
            create(context) {
                const sourceCode = context.getSourceCode();
                function normalizeSingleLine(text) {
                    return text.replace(/\s+/g, ' ').trim();
                }
                function allowMultiline(node) {
                    if (!node || !node.value) {
                        return false;
                    }
                    const v = node.value;
                    return v.type === 'CallExpression' || v.type === 'ArrowFunctionExpression' || v.type === 'FunctionExpression';
                }
                return {
                    PropertyDefinition(node) {
                        if (!node.loc) {
                            return;
                        }
                        if (allowMultiline(node)) {
                            return;
                        }
                        if (node.loc.start.line !== node.loc.end.line) {
                            context.report({
                                messageId: 'singleLine',
                                node,
                                fix(fixer) {
                                    const original = sourceCode.getText(node);
                                    const fixed = normalizeSingleLine(original);
                                    return fixer.replaceText(node, fixed);
                                },
                            });
                        }
                    },
                };
            },
        },
        'import-single-line': {
            meta: {
                type: 'layout',
                docs: {
                    description: 'Require import statements to be on a single line.',
                },
                schema: [],
                messages: {
                    singleLine: 'Import statements must be on a single line.',
                    spacing: 'Import spacing must be normalized.',
                },
                fixable: 'whitespace',
            },
            create(context) {
                const sourceCode = context.getSourceCode();
                function normalizeImport(text) {
                    let fixed = text.replace(/\s+/g, ' ').trim();
                    fixed = fixed.replace(/\{\s*/g, '{ ');
                    fixed = fixed.replace(/\s*\}/g, ' }');
                    fixed = fixed.replace(/\s*,\s*/g, ', ');
                    fixed = fixed.replace(/\s+from\s+/g, ' from ');
                    fixed = fixed.replace(/\s{2,}/g, ' ');
                    return fixed;
                }
                return {
                    ImportDeclaration(node) {
                        if (!node.loc) {
                            return;
                        }
                        const original = sourceCode.getText(node);
                        const normalized = normalizeImport(original);
                        if (node.loc.start.line !== node.loc.end.line) {
                            context.report({
                                messageId: 'singleLine',
                                node,
                                fix(fixer) {
                                    return fixer.replaceText(node, normalized);
                                },
                            });
                            return;
                        }
                        if (original !== normalized) {
                            context.report({
                                messageId: 'spacing',
                                node,
                                fix(fixer) {
                                    return fixer.replaceText(node, normalized);
                                },
                            });
                        }
                    },
                };
            },
        },
        'function-params-single-line': {
            meta: {
                type: 'layout',
                docs: {
                    description: 'Require function parameter lists to be on a single line.',
                },
                schema: [],
                messages: {
                    singleLine: 'Function parameters must be on a single line.',
                },
                fixable: 'whitespace',
            },
            create(context) {
                const sourceCode = context.getSourceCode();
                function check(node) {
                    const tokens = sourceCode.getTokens(node);
                    const openIndex = tokens.findIndex(t => t.value === '(');
                    if (openIndex === -1) {
                        return;
                    }
                    const closeIndex = tokens.findIndex((t, i) => i > openIndex && t.value === ')');
                    if (closeIndex === -1) {
                        return;
                    }
                    const open = tokens[openIndex];
                    const close = tokens[closeIndex];
                    if (open.loc.start.line !== close.loc.end.line) {
                        context.report({
                            messageId: 'singleLine',
                            loc: {
                                start: open.loc.start,
                                end: close.loc.end,
                            },
                            fix(fixer) {
                                const rangeStart = open.range[1];
                                const rangeEnd = close.range[0];
                                const original = sourceCode.text.slice(rangeStart, rangeEnd);
                                const fixed = original.replace(/\s+/g, ' ').trim();
                                return fixer.replaceTextRange([rangeStart, rangeEnd], fixed.length ? ` ${fixed} ` : '');
                            },
                        });
                    }
                }
                return {
                    FunctionDeclaration: check,
                    FunctionExpression: check,
                    ArrowFunctionExpression: check,
                    MethodDefinition: check,
                };
            },
        },
        'no-unused-imports': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Remove unused imports.',
                },
                schema: [],
                messages: {
                    unused: 'Unused import.',
                },
            },
            create(context) {
                return {
                    ImportDeclaration(node) {
                        if (!node.specifiers || node.specifiers.length === 0) {
                            return;
                        }
                        const sourceCode = context.getSourceCode();
                        const variables = sourceCode.getDeclaredVariables(node);
                        const usedNames = new Set();
                        for (const variable of variables) {
                            if (variable.references.length > 0 || variable.eslintUsed) {
                                usedNames.add(variable.name);
                            }
                        }
                        const usedSpecifiers = node.specifiers.filter(spec => usedNames.has(spec.local.name));
                        if (usedSpecifiers.length === node.specifiers.length) {
                            return;
                        }
                        context.report({ messageId: 'unused', node });
                    },
                };
            },
        },
    },
};

module.exports = [
    {
        ignores: ['node_modules/**', 'build/**', 'coverage/**'],
    },
    {
        files: ['src/app/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: ['./tsconfig.json', './tsconfig.app.json'],
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            '@angular-eslint': angularPlugin,
            local: localRules,
        },
        rules: {
            curly: ['error', 'all'],
            'brace-style': ['error', 'stroustrup', { allowSingleLine: false }],
            'nonblock-statement-body-position': ['error', 'below'],
            'lines-between-class-members': 'off',
            'function-paren-newline': ['error', 'never'],
            indent: [
                'error',
                2,
                {
                    SwitchCase: 1,
                    ignoredNodes: [
                        'TSTypeParameterInstantiation',
                        'TSTypeParameterDeclaration',
                        'TSUnionType',
                        'TSIntersectionType',
                        'TSMappedType'
                    ]
                }
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
            ],
            'no-unused-private-class-members': 'error',
            'local/no-unused-imports': 'error',
            'local/decorator-single-line': 'error',
            'local/decorator-first-in-class': 'error',
            'local/class-field-group-spacing': 'error',
            'local/method-blank-line': 'error',
            'local/class-field-single-line': 'error',
            'local/import-single-line': 'error',
            'local/function-params-single-line': 'error',
            'local/no-style-url-in-component': 'error',
        },
    },
    {
        files: ['src/app/**/*.html'],
        languageOptions: {
            parser: angularTemplateParser,
        },
        plugins: {
            '@angular-eslint/template': angularTemplatePlugin,
            local: localRules,
        },
        rules: {
            'local/template-attr-single-line': 'error',
            'local/template-asset-src-root': 'error',
        },
    },
];
