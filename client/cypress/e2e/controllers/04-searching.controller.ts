const SIDEBAR_GROUP_ROUTE_PREFIX: Record<string, string> = {
  'General Intelligence': 'strategic',
  Defacement: 'defacement',
  Social: 'social',
  Exploit: 'exploit',
  Feed: 'feed',
  'Stealer logs': 'stealerlogs',
  'Web Scans': 'scanner',
  'Entity API': 'api',
  Dump: 'dump',
};

function getSidebarGroupTestId(title: string): string {
  const routePrefix = SIDEBAR_GROUP_ROUTE_PREFIX[title];
  expect(routePrefix, `routePrefix mapping for "${title}"`).to.exist;
  return `sidebar-group-${routePrefix}`;
}

export function openSidebarGroup(title: string) {
  const groupTestId = getSidebarGroupTestId(title);
  cy.get(`[data-testid="${groupTestId}"]`, {timeout: 30000}).scrollIntoView().should('be.visible').click();
  cy.get(`[data-testid="${groupTestId}"]`, {timeout: 30000}).closest('li').find('> ul', {timeout: 30000}).should(($ul) => {
    expect(getComputedStyle($ul[0] as HTMLElement).pointerEvents).not.to.equal('none');
  });
}

export function clickSidebarSubItem(groupTitle: string, itemTitle: string) {
  const routePrefix = SIDEBAR_GROUP_ROUTE_PREFIX[groupTitle];
  const groupTestId = getSidebarGroupTestId(groupTitle);
  cy.get(`[data-testid="${groupTestId}"]`, {timeout: 30000}).closest('li').find('> ul', {timeout: 30000}).should(($ul) => {
    expect(getComputedStyle($ul[0] as HTMLElement).pointerEvents).not.to.equal('none');
  }).find(`[data-testid^="sidebar-subitem-${routePrefix}-"]`).contains('div', new RegExp(`^\\s*${itemTitle}\\s*$`)).scrollIntoView().click();
}

export function waitForSearchReady() {
  cy.get('app-loading-form', {timeout: 30000}).should('not.exist');

  cy.get('body').then(($body) => {
    if ($body.find('app-filters:visible, app-search-filters:visible').length) {
      cy.scrollTo('top', {ensureScrollable: false});
    }
  });
}

export function typeDashboardSearch(value: string) {
  waitForSearchReady();

  cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000}).first().scrollIntoView().should('be.visible').and('be.enabled').then(($input) => {
    const currentValue = String($input.val() ?? '').trim();
    if (currentValue.length > 0) {
      cy.wrap($input).clear();
    }
  }).type(`${value}{enter}`);
}

export function openExploitSubmenu(submenu: string) {
  clickSidebarSubItem('Exploit', submenu);
}

export function typeExploitSearch(value: string) {
  typeDashboardSearch(value);
}

export function clickOpenReport() {
  cy.get('[data-testid="open-report"]', {timeout: 30000}).filter(':visible').filter(':has(img[src*="redirect.svg"])').first().scrollIntoView().should('be.visible').click();
}

export function openFirstReportAndValidateNavigationOrModal() {
  cy.location('pathname').then((pathBefore) => {
    clickOpenReport();

    cy.get('body', {timeout: 10000}).then(($body) => {
      if ($body.find('app-json-api-viewer').length) {
        cy.get('app-json-api-viewer').should('be.visible');
        cy.get('body').type('{esc}');
        return;
      }

      cy.location('pathname', {timeout: 10000}).should('not.eq', pathBefore);
    });
  });
}
