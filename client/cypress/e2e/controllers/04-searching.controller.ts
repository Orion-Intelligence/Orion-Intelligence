const SIDEBAR_GROUP_ROUTE_PREFIX: Record<string, string> = {
  Profile: 'profile',
  'General Intelligence': 'strategic',
  Defacement: 'defacement',
  Social: 'social',
  Exploit: 'exploit',
  'Actors & Malware': 'apt-intel',
  Feed: 'feed',
  'Stealer logs': 'stealerlogs',
  'Web Scans': 'scanner',
  'Entity Lookup': 'api',
  Dump: 'dump',
};

function getSidebarGroupTestId(title: string): string {
  const routePrefix = SIDEBAR_GROUP_ROUTE_PREFIX[title];
  assert.exists(routePrefix, `routePrefix mapping for "${title}"`);
  return `sidebar-group-${routePrefix}`;
}

function ensureSidebarExpanded() {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="sidebar-expand-button"]:visible').length) {
      void cy.get('[data-testid="sidebar-expand-button"]').click();
    }
  });
  void cy.get('[data-testid="sidebar-collapse-button"]').should('be.visible');
}

export function openSidebarGroup(title: string) {
  ensureSidebarExpanded();
  const groupTestId = getSidebarGroupTestId(title);
  cy.get(`[data-testid="${groupTestId}"]`).scrollIntoView().should('be.visible').then(($group) => {
    const sub = $group.parent('div').find('> ul');
    void cy.wrap($group).click({ force: true });
    if (!sub.length) {
      return;
    }
    void cy.wrap(sub).should(($ul) => {
      expect(getComputedStyle($ul[0] as HTMLElement).pointerEvents).not.to.equal('none');
    });
  });
}

export function waitForSearchReady() {
  void cy.get('app-loading-form').should('not.exist');
}

export function typeDashboardSearchSlow(value: string) {
  const selector = 'input[data-testid="dashboard-general-input"][name="q"]';
  void cy.scrollDashboardToTop();
  waitForSearchReady();
  void cy.scrollDashboardToTop();
  void cy.typeSlow(selector, value, { submit: true });
}

export function typeInputSlow(selector: string, value: string, submit = true) {
  void cy.typeSlow(selector, value, { submit });
}

export function clickOpenReport() {
  void cy.get('[data-testid="open-report"]').filter(':visible').filter(':has(img[src*="redirect.svg"])').first().should('be.visible').invoke('removeAttr', 'target').click();
}

export function clickOpenExploitReport() {
  void cy.get('[data-testid="open-report"]').filter(':visible').first().scrollIntoView().should('be.visible').invoke('removeAttr', 'target').click({ force: true });
}

export function clickOpenDefacementReport() {
  void cy.get('[data-testid="defacement-group-card"]').first().find('button').scrollIntoView().should('be.visible').click({ force: true });
  void cy.get('[data-testid="defacement-record-sidebar"] a').first().invoke('removeAttr', 'target').click({ force: true });
}

export function openDefacementReportAndValidate() {
  clickOpenDefacementReport();
  void cy.get('body', {timeout: 60000}).should(($body) => {
    const hasJsonViewer = $body.find('app-json-api-viewer').length > 0;
    const hasDefacementReport = $body.find('app-report-defacement').length > 0;
    expect(hasJsonViewer || hasDefacementReport, 'defacement report opened').to.eq(true);
  });
}

export function exerciseJsonViewerOnce() {
  cy.window().then((win) => {
    win.scrollTo(0, win.document.documentElement.scrollHeight);
    const dashboardBody = win.document.querySelector('[data-testid="dashboard-body"]') as HTMLElement | null;
    if (dashboardBody) {
      dashboardBody.scrollTop = dashboardBody.scrollHeight;
    }
  });

  void cy.get('app-json-api-viewer').should('exist').and('be.visible');
  void cy.contains('app-json-api-viewer span', 'Json Response').should('be.visible').click();
  void cy.get('app-json-api-viewer app-json-viewer').should('exist');

  const expandableRowSelector = 'app-json-api-viewer app-json-viewer li:has(> div.group + div.ml-5)';

  void cy.get(expandableRowSelector).first().scrollIntoView().should('be.visible').find('> div.ml-5').should('exist');
  cy.get(expandableRowSelector).first().find('> div.group .text-\\[14px\\]').invoke('text').then((keyText) => {
    const normalizedKey = keyText.trim();

    void cy.contains('app-json-api-viewer app-json-viewer li > div.group .text-\\[14px\\]', normalizedKey)
      .closest('li')
      .as('jsonExpandableRow');

    void cy.get('@jsonExpandableRow').scrollIntoView().find('> div.group').should('be.visible').click();
    void cy.contains('app-json-api-viewer app-json-viewer li > div.group .text-\\[14px\\]', normalizedKey)
      .closest('li')
      .find('> div.ml-5')
      .should('not.exist');

    void cy.contains('app-json-api-viewer app-json-viewer li > div.group .text-\\[14px\\]', normalizedKey)
      .closest('li')
      .scrollIntoView()
      .find('> div.group')
      .should('be.visible')
      .click();

    void cy.contains('app-json-api-viewer app-json-viewer li > div.group .text-\\[14px\\]', normalizedKey)
      .closest('li')
      .find('> div.ml-5')
      .should('exist');
  });
}

export function openFirstReportAndValidateNavigationOrModal() {
  cy.location('pathname').then((pathBefore) => {
    clickOpenReport();

    cy.get('body').then(($body) => {
      if ($body.find('app-json-api-viewer').length) {
        void cy.get('app-json-api-viewer').should('be.visible');
        void cy.get('body').type('{esc}');
        return;
      }

      void cy.location('pathname').should('not.eq', pathBefore);
    });
  });
}

export const STEALERLOGS_ROUTE = '/dashboard/stealerlogs';
export const CONSOLIDATED_IOCS_ROUTE = '/dashboard/profile/consolidated/all?page=1&tab=IOCs&q=data';
export const CREDENTIAL_SEARCH_QUERY = 'uwe.dippold@web.de';
export const CREDENTIAL_BROAD_QUERY = 'data';

const IOC_SEARCH_INPUT = '[data-testid="ioc-basic-search-input"]';
const STEALER_ROW = '[data-testid="ioc-stealer-row"]';
const STEALER_ROW_TOGGLE = '[data-testid="ioc-stealer-row-toggle"]';
const STEALER_DISMISS = '[data-testid="ioc-stealer-dismiss"]';
const STEALER_DISMISSED = '[data-testid="ioc-stealer-dismissed"]';
const THREAT_ROW = '[data-testid="ioc-threat-row"]';
const THREAT_ROW_TOGGLE = '[data-testid="ioc-threat-row-toggle"]';
const HIDE_DISMISSED_TOGGLE = '[data-testid="ioc-hide-dismissed-toggle"]';
const LOAD_MORE_BUTTON = '[data-testid="ioc-load-more"]';
const SORT_TOGGLE = '[data-testid="result-tools-sort"]';
const DISMISS_ENDPOINT = '**/api/search/result/dismiss';
const RESTORE_ENDPOINT = '**/api/search/result/restore';
export const CREDENTIAL_DISMISS_ALIAS = 'credentialDismiss';
export const CREDENTIAL_RESTORE_ALIAS = 'credentialRestore';

export function visitStealerlogs() {
  void cy.visit(STEALERLOGS_ROUTE);
  waitForSearchReady();
}

export function searchCredentials(query: string) {
  void cy.get(IOC_SEARCH_INPUT, { timeout: 60000 }).filter(':visible').first().should('be.visible').and('not.be.disabled');
  typeInputSlow(IOC_SEARCH_INPUT, query);
  waitForSearchReady();
}

export function expandAndCollapseFirstStealerRow() {
  cy.get('body').then(($body) => {
    if (!$body.find(`${STEALER_ROW}:visible`).length) {
      return;
    }
    void cy.get(STEALER_ROW).filter(':visible').first().scrollIntoView().find(STEALER_ROW_TOGGLE).first().click({ force: true });
    void cy.get(STEALER_ROW).filter(':visible').first().should('have.attr', 'aria-expanded', 'true');
    void cy.get('app-expanded-row').filter(':visible').should('have.length.greaterThan', 0);
    void cy.get(STEALER_ROW).filter(':visible').first().scrollIntoView().find(STEALER_ROW_TOGGLE).first().click({ force: true });
    void cy.get(STEALER_ROW).filter(':visible').first().should('have.attr', 'aria-expanded', 'false');
  });
}

export function driveStealerSort() {
  cy.get('body').then(($body) => {
    if (!$body.find(`${SORT_TOGGLE}:visible`).length) {
      return;
    }
    void cy.get(SORT_TOGGLE).filter(':visible').first().scrollIntoView().click();
    void cy.get('[data-testid="result-tools-sort-newest"]').filter(':visible').first().click();
    void cy.get(SORT_TOGGLE).filter(':visible').first().scrollIntoView().click();
    void cy.get('[data-testid="result-tools-sort-oldest"]').filter(':visible').first().click();
  });
}

export function driveLoadMore() {
  cy.get('body').then(($body) => {
    const $button = $body.find(`${LOAD_MORE_BUTTON}:visible`);
    if (!$button.length || $button.is(':disabled')) {
      return;
    }
    void cy.get(LOAD_MORE_BUTTON).filter(':visible').first().scrollIntoView().click();
    waitForSearchReady();
  });
}

export function drivePasswordScheme() {
  void cy.get('[data-testid="ioc-open-password-scheme"]').filter(':visible').first().scrollIntoView().click();
  void cy.get('[data-testid="password-scheme-modal"]').should('be.visible');
  void cy.get('[data-testid="password-scheme-title"]').should('contain.text', 'Password Scheme Filter');
  void cy.get('[data-testid="password-scheme-min-length"]').scrollIntoView().clear().type('6');
  void cy.get('[data-testid="password-scheme-max-length"]').scrollIntoView().clear().type('32');
  void cy.get('[data-testid="password-scheme-has-alphabets"]').scrollIntoView().check();
  void cy.get('[data-testid="password-scheme-has-numbers"]').scrollIntoView().check();
  void cy.get('[data-testid="password-scheme-search"]').scrollIntoView().click();
  void cy.get('[data-testid="password-scheme-modal"]').should('not.exist');
  waitForSearchReady();
}

export function toggleHideDismissedAndAssert() {
  cy.get('body').then(($body) => {
    const $toggle = $body.find(`${HIDE_DISMISSED_TOGGLE}:visible`);
    if (!$toggle.length) {
      return;
    }
    const before = $toggle.attr('aria-pressed');
    void cy.get(HIDE_DISMISSED_TOGGLE).filter(':visible').first().scrollIntoView().click();
    waitForSearchReady();
    void cy.get(HIDE_DISMISSED_TOGGLE).filter(':visible').first().should('not.have.attr', 'aria-pressed', before);
  });
}

function ensureDismissedResultsVisible() {
  cy.get('body').then(($body) => {
    const $toggle = $body.find(`${HIDE_DISMISSED_TOGGLE}:visible`);
    if (!$toggle.length) {
      return;
    }
    if ($toggle.attr('aria-pressed') !== 'true') {
      void cy.get(HIDE_DISMISSED_TOGGLE).filter(':visible').first().scrollIntoView().click();
      waitForSearchReady();
    }
  });
}

export function interceptDismissRestore() {
  void cy.intercept('POST', DISMISS_ENDPOINT, { statusCode: 200, body: { success: true } }).as(CREDENTIAL_DISMISS_ALIAS);
  void cy.intercept('POST', RESTORE_ENDPOINT, { statusCode: 200, body: { success: true } }).as(CREDENTIAL_RESTORE_ALIAS);
}

export function dismissAndRestoreFirstStealerRow() {
  ensureDismissedResultsVisible();
  cy.get('body').then(($body) => {
    if (!$body.find(`${STEALER_ROW}:visible`).length) {
      return;
    }
    void cy.get(STEALER_ROW).filter(':visible').first().scrollIntoView().find(STEALER_ROW_TOGGLE).first().click({ force: true });
    cy.get('body').then(($expanded) => {
      if (!$expanded.find(`${STEALER_DISMISS}:visible`).length) {
        return;
      }
      void cy.get(STEALER_DISMISS).filter(':visible').first().scrollIntoView().click();
      void cy.get('[data-testid="confirmation-popup"]').should('be.visible');
      void cy.get('[data-testid="confirmation-yes-button"]').scrollIntoView().click();
      void cy.wait(`@${CREDENTIAL_DISMISS_ALIAS}`, { timeout: 60000 });
      void cy.get(STEALER_DISMISSED, { timeout: 60000 }).filter(':visible').should('have.length.greaterThan', 0);
      void cy.get(STEALER_DISMISSED).filter(':visible').first().scrollIntoView().click();
      void cy.wait(`@${CREDENTIAL_RESTORE_ALIAS}`, { timeout: 60000 });
    });
  });
}

export function driveCredentialExport(optionTestId: string) {
  void cy.get('[data-testid="ioc-download-results"]').filter(':visible').first().scrollIntoView().click();
  void cy.get('[data-testid="graph-report-export-overlay"]').should('be.visible');
  void cy.get(`[data-testid="${optionTestId}"]`).filter(':visible').first().scrollIntoView().click();
  void cy.get('[data-testid="graph-report-export-overlay"]').should('not.exist');
}

export function driveConsolidatedIocTabs() {
  void cy.visit(CONSOLIDATED_IOCS_ROUTE);
  waitForSearchReady();
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="ioc-tab-stealers"]:visible').length) {
      void cy.get('[data-testid="ioc-tab-stealers"]').filter(':visible').first().scrollIntoView().click({ force: true });
      void cy.get('[data-testid="ioc-tab-stealers-count"]').should('be.visible');
      void cy.get('[data-testid="ioc-stealer-table"]').scrollIntoView().should('be.visible');
    }
  });
  cy.get('body').then(($body) => {
    if (!$body.find('[data-testid="ioc-tab-threats"]:visible').length) {
      return;
    }
    void cy.get('[data-testid="ioc-tab-threats"]').filter(':visible').first().scrollIntoView().click({ force: true });
    void cy.get('[data-testid="ioc-threat-table"]').scrollIntoView().should('be.visible');
    cy.get('body').then(($threats) => {
      if (!$threats.find(`${THREAT_ROW}:visible`).length) {
        return;
      }
      void cy.get(THREAT_ROW).filter(':visible').first().scrollIntoView().find(THREAT_ROW_TOGGLE).first().click({ force: true });
      void cy.get('app-expanded-row').filter(':visible').should('have.length.greaterThan', 0);
    });
  });
}
