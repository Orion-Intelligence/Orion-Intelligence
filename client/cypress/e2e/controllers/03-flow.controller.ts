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

export function openSidebarGroup(title: string) {
  const groupTestId = getSidebarGroupTestId(title);
  cy.get(`[data-testid="${groupTestId}"]`, {timeout: 20000}).then(($group) => {
    cy.wrap($group).scrollIntoView();
    let li = $group.closest('li');
    let sub = li.find('> ul');
    let isClosed = !sub.length || getComputedStyle(sub[0] as HTMLElement).pointerEvents === 'none';
    if (isClosed) {
      cy.wrap($group).find('img[alt="Drop Down"]').click();
    }
  });

  cy.get(`[data-testid="${groupTestId}"]`, {timeout: 20000}).closest('li').find('> ul', {timeout: 20000}).should(($ul) => {
    expect(getComputedStyle($ul[0] as HTMLElement).pointerEvents).not.to.equal('none');
  });
}

export function clickSidebarSubItem(groupTitle: string, itemTitle: string) {
  const groupTestId = getSidebarGroupTestId(groupTitle);
  cy.get(`[data-testid="${groupTestId}"]`, {timeout: 20000}).closest('li').find('> ul').should(($ul) => {
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
  cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/profile/homepage');
  cy.get('app-world-heatmap', {timeout: 30000}).should('be.visible');
  cy.get('[data-testid="world-heatmap-map"] svg', {timeout: 30000}).should('exist');
  cy.get('[data-testid="world-heatmap-map"] path.country', {timeout: 30000}).should('have.length.greaterThan', 0);
}

export function openCountryReportFromMap() {
  cy.get('[data-testid="world-heatmap-map"] path.country', {timeout: 30000}).should('have.length.greaterThan', 0);

  cy.document().then((doc) => {
    let target =
      doc.querySelector('[data-testid="world-heatmap-map"] path.country.has-data') ||
      doc.querySelector('[data-testid="world-heatmap-map"] path.country');
    expect(target, 'clickable map country').to.exist;
    (target as Element).dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true
      })
    );
  });
  cy.get('[data-testid="heatmap-report"]', {timeout: 15000}).should('exist');
}
