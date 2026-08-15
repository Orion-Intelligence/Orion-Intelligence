import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { parseTemplate } from '@angular/compiler';

const clientRoot = process.cwd();
const appRoot = path.join(clientRoot, 'src/app');
const shellRoot = path.join(appRoot, 'shared/partials/sidebar-shell');

function walkFiles(root, extension, output = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(file, extension, output);
    }
    else if (entry.name.endsWith(extension)) {
      output.push(file);
    }
  }
  return output;
}

function visitNodes(nodes, visitor) {
  for (const node of nodes ?? []) {
    visitor(node);
    visitNodes(node.children, visitor);
  }
}

function templateNodes(file) {
  const source = fs.readFileSync(file, 'utf8');
  const parsed = parseTemplate(source, path.relative(clientRoot, file), { preserveWhitespaces: false });
  assert.deepEqual(parsed.errors ?? [], [], `${path.relative(clientRoot, file)} must parse without template errors`);
  return parsed.nodes;
}

function nodeNames(nodes, property) {
  const names = new Set();
  visitNodes(nodes, node => {
    for (const entry of node[property] ?? []) {
      names.add(entry.name);
    }
  });
  return names;
}

test('SidebarShell exposes the shared projection, toggle, branding, and accessibility contract', () => {
  const component = fs.readFileSync(path.join(shellRoot, 'sidebar-shell.component.ts'), 'utf8');
  const template = fs.readFileSync(path.join(shellRoot, 'sidebar-shell.component.html'), 'utf8');

  assert.match(component, /selector:\s*['"]app-graph-sidebar-shell['"]/);
  assert.match(component, /isCollapsed\s*=\s*input\.required<boolean>\(\)/);
  assert.match(component, /forceDarkLogo\s*=\s*input\(false\)/);
  assert.match(component, /expandTestId\s*=\s*input\(['"]graph-sidebar-expand['"]\)/);
  assert.match(component, /collapseTestId\s*=\s*input\(['"]graph-sidebar-collapse['"]\)/);
  assert.match(component, /toggleClicked\s*=\s*output<undefined>\(\)/);
  assert.match(template, /<ng-content\s+select=['"]\[data-sidebar-expanded\]['"]>/);
  assert.match(template, /<ng-content\s+select=['"]\[data-sidebar-collapsed\]['"]>/);
  assert.match(template, /\[attr\.aria-label\]=['"]'Expand sidebar'\s*\|\s*translate['"]/);
  assert.match(template, /\[attr\.aria-label\]=['"]'Collapse sidebar'\s*\|\s*translate['"]/);
  assert.match(template, /\[attr\.aria-label\]=['"]'Go to homepage'\s*\|\s*translate['"]/);
});

test('Every persistent sidebar consumer uses both shared projection slots and the toggle contract', () => {
  const consumers = [];
  for (const file of walkFiles(appRoot, '.html')) {
    const source = fs.readFileSync(file, 'utf8');
    if (!source.includes('<app-graph-sidebar-shell')) {
      continue;
    }
    const nodes = templateNodes(file);
    visitNodes(nodes, node => {
      if (node.name === 'app-graph-sidebar-shell') {
        consumers.push({ file, node });
      }
    });
  }

  const expectedConsumers = [
    'src/app/pages/cti-graph/sidebar/sidebar.component.html',
    'src/app/pages/dashboard/dashboard-sidebar/dashboard-sidebar.component.html',
    'src/app/pages/root-searches/ai-workspace/ai-chat-sidebar/ai-chat-sidebar.component.html',
    'src/app/pages/social-cti/home-menu/home-menu.component.html',
  ];
  assert.deepEqual(
    consumers.map(({ file }) => path.relative(clientRoot, file)).sort(),
    expectedConsumers,
    'all persistent sidebar owners must use the shared shell',
  );

  for (const { file, node } of consumers) {
    const relative = path.relative(clientRoot, file);
    const inputNames = new Set((node.inputs ?? []).map(input => input.name));
    const outputNames = new Set((node.outputs ?? []).map(output => output.name));
    const attributeNames = nodeNames(node.children, 'attributes');
    assert(inputNames.has('isCollapsed'), `${relative} must bind isCollapsed`);
    assert(outputNames.has('toggleClicked'), `${relative} must handle toggleClicked`);
    assert(attributeNames.has('data-sidebar-expanded'), `${relative} must provide the expanded projection slot`);
    assert(attributeNames.has('data-sidebar-collapsed'), `${relative} must provide the collapsed projection slot`);
  }
});

test('Sidebar consumers have focused E2E coverage and no stale pre-shell dashboard selector remains', () => {
  const coverage = [
    ['cypress/e2e/03-flow.cy.ts', 'app-dashboard-sidebar [data-sidebar-expanded]', 'app-dashboard-sidebar [data-sidebar-collapsed]'],
    ['cypress/e2e/07-cti-management.cy.ts', 'graph-sidebar [data-sidebar-expanded]', 'graph-sidebar [data-sidebar-collapsed]'],
    ['cypress/e2e/controllers/08-social-management.controller.ts', 'app-home-menu [data-sidebar-expanded]', 'app-home-menu [data-sidebar-collapsed]'],
    ['cypress/e2e/21-ai-chat.cy.ts', 'app-ai-chat-sidebar [data-sidebar-expanded]', 'app-ai-chat-sidebar [data-sidebar-collapsed]'],
  ];

  for (const [relative, expandedSelector, collapsedSelector] of coverage) {
    const source = fs.readFileSync(path.join(clientRoot, relative), 'utf8');
    assert(source.includes(expandedSelector), `${relative} must cover expanded shell projection`);
    assert(source.includes(collapsedSelector), `${relative} must cover collapsed shell projection`);
    assert(source.includes("aria-label', 'Expand sidebar'"), `${relative} must cover the expand control label`);
    assert(source.includes("aria-label', 'Collapse sidebar'"), `${relative} must cover the collapse control label`);
  }

  const cypressSource = walkFiles(path.join(clientRoot, 'cypress'), '.ts')
    .map(file => fs.readFileSync(file, 'utf8'))
    .join('\n');
  assert(!cypressSource.includes('app-dashboard-sidebar > nav'), 'Cypress must not depend on the pre-shell direct nav structure');

  const dashboardSidebar = fs.readFileSync(
    path.join(appRoot, 'pages/dashboard/dashboard-sidebar/dashboard-sidebar.component.ts'),
    'utf8',
  );
  assert.match(dashboardSidebar, /addEventListener\(['"]resize['"],\s*this\.resizeHandler\)/);
  assert.match(dashboardSidebar, /removeEventListener\(['"]resize['"],\s*this\.resizeHandler\)/);
  assert(!dashboardSidebar.includes("checkScreenWidth.bind(this)"), 'dashboard resize cleanup must use the registered listener reference');
});
