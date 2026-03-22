const SIDEBAR_GROUP_ROUTE_PREFIX: Record<string, string> = {
  admin: 'profile',
  'General Intelligence': 'strategic',
  'Data Breach': 'breach',
  Defacement: 'defacement',
  Social: 'social',
  Exploit: 'exploit',
  Feed: 'feed',
  'Stealer logs': 'stealerlogs',
  'Web Scans': 'scanner',
  'Entity API': 'api',
};

function getSidebarGroupTestId(title: string): string {
  const routePrefix = SIDEBAR_GROUP_ROUTE_PREFIX[title];
  expect(routePrefix, `routePrefix mapping for "${title}"`).to.exist;
  return `sidebar-group-${routePrefix}`;
}

export const DIRECTORY_NETWORK_OPTION = {label: 'Onion', value: 'onion'};
export const DIRECTORY_INDEX_OPTION = {label: 'Leak', value: 'leak'};
export const DIRECTORY_CONTENT_OPTION = {label: 'Forums', value: 'forums'};

export function openSidebarGroup(title: string) {
  const groupTestId = getSidebarGroupTestId(title);
  cy.get(`[data-testid="${groupTestId}"]`).then(($group) => {
    cy.wrap($group).scrollIntoView();
    let li = $group.closest('li');
    let sub = li.find('> ul');
    let isClosed = !sub.length || getComputedStyle(sub[0] as HTMLElement).pointerEvents === 'none';
    if (isClosed) {
      cy.wrap($group).find('img[alt="Drop Down"]').click();
    }
  });

  cy.get(`[data-testid="${groupTestId}"]`).closest('li').find('> ul').should(($ul) => {
    expect(getComputedStyle($ul[0] as HTMLElement).pointerEvents).not.to.equal('none');
  });
}

export function clickSidebarSubItem(groupTitle: string, itemTitle: string) {
  const groupTestId = getSidebarGroupTestId(groupTitle);
  cy.get(`[data-testid="${groupTestId}"]`).closest('li').find('> ul').should(($ul) => {
    expect(getComputedStyle($ul[0] as HTMLElement).pointerEvents).not.to.equal('none');
  }).find(`[data-testid^="sidebar-subitem-${SIDEBAR_GROUP_ROUTE_PREFIX[groupTitle]}-"]`).contains('div', new RegExp(`^\\s*${itemTitle}\\s*$`)).scrollIntoView().click();
}

export function getHeatmapComponent() {
  return cy.window().then((win) => {
    let host = win.document.querySelector('app-world-heatmap') as any;
    expect(host, 'app-world-heatmap host').to.exist;
    let ngApi = (win as any).ng;
    if (ngApi?.getComponent) {
      return ngApi.getComponent(host) as any;
    }
    let ctx = host.__ngContext__ as any[] | undefined;
    expect(ctx, 'Angular context fallback').to.exist;
    let comp = (ctx || []).find((x: any) => x && x.constructor?.name === 'WorldHeatmapComponent');
    expect(comp, 'WorldHeatmapComponent in ngContext').to.exist;
    return comp as any;
  });
}

export function openHomepage() {
  cy.loginAsAdmin();
  cy.location('pathname').should('include', '/dashboard/profile/homepage');
  cy.get('app-world-heatmap').should('be.visible');
  cy.get('[data-testid="world-heatmap-map"] svg').should('exist');
  cy.get('[data-testid="world-heatmap-map"] path.country').should('have.length.greaterThan', 0);
}

export function openCountryReportFromMap() {
  cy.get('[data-testid="world-heatmap-map"] path.country').should('have.length.greaterThan', 0);

  cy.get('[data-testid="world-heatmap-map"] path.country.has-data')
    .should('have.length.greaterThan', 0)
    .first()
    .scrollIntoView()
    .as('heatmapCountryWithData')
    .click({force: true});

  cy.get('body').then(($body) => {
    if (!$body.find('[data-testid="heatmap-report"]').length) {
      cy.get('@heatmapCountryWithData').then(($el) => {
        const target = $el[0] as unknown as SVGPathElement;
        const rect = target.getBoundingClientRect();
        target.dispatchEvent(
          new MouseEvent('click', {
            clientX: rect.left + Math.max(1, rect.width / 2),
            clientY: rect.top + Math.max(1, rect.height / 2),
            bubbles: true,
            cancelable: true,
            composed: true
          })
        );
      });
    }
  });

  cy.get('[data-testid="heatmap-report"]').should('be.visible');
}

export function waitForDirectoryRequest() {
  cy.wait('@getDirectory').then((interception) => {
    expect(interception.response?.statusCode).to.eq(200);
  });
}

export function assertDirectoryContentVisible() {
  cy.scrollDashboardToTop();
  cy.get('app-directory').should('be.visible');
  cy.get('body').then(($body) => {
    cy.scrollDashboardToTop();
    const hasTable = $body.find('app-directory-list table tbody tr').length > 0;
    const hasEmptyState = $body.text().includes('No links found!');

    expect(hasTable || hasEmptyState).to.eq(true);
  });
}

export function openDirectoryFilter() {
  cy.scrollDashboardToTop();
  cy.get('app-directory #top').should('exist').scrollIntoView({duration: 300, offset: {top: -20, left: 0}});
  cy.contains('button', 'Filter').should('be.visible').scrollIntoView().click();
  cy.get('[data-testid="side-filter-close"]').filter(':visible').first().should('be.visible');
}

export function resetDirectoryFilters() {
  openDirectoryFilter();
  cy.get('[data-testid="side-filter-reset"]').scrollIntoView().click();
  waitForDirectoryRequest();
  cy.location('search').should('not.include', 'network=');
  cy.location('search').should('not.include', 'index=');
  cy.location('search').should('not.include', 'content_type=');
  cy.location('search').should('not.include', 'daterange=');
  assertDirectoryContentVisible();
}

export function applyDirectoryDropdown(testId: string, option: { label: string; value: string; }, queryKey: string) {
  openDirectoryFilter();
  cy.get(`[data-testid="side-filter-select-${testId}"]`).scrollIntoView().select(option.label);
  cy.get('[data-testid="side-filter-apply"]').scrollIntoView().click();
  waitForDirectoryRequest();
  cy.location('search').should('include', `${queryKey}=${option.value}`);
  assertDirectoryContentVisible();
}

export function applyDateRange(monthsBack: number) {
  openDirectoryFilter();
  cy.get('[data-testid="side-filter-date-toggle"]').scrollIntoView().click();

  for (let i = 0; i < monthsBack; i += 1) {
    cy.get('[data-testid="side-filter-date-prev-month"]').scrollIntoView().click();
  }

  cy.get('[data-testid="side-filter-date-day-1"]').filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="side-filter-date-day-25"]').filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="side-filter-apply"]').scrollIntoView().click();
  waitForDirectoryRequest();
  cy.location('search').should('include', 'daterange=');
}
