const MANAGER = '[data-testid="social-extension-manager"]';
const TIMEOUT = 30000;
const PLATFORM = 'Twitter';
const SESSION_ID = 'session-1';

export function visitWithoutExtension(path: string) {
  cy.intercept('GET', '**/api/extension/session', { statusCode: 401, body: { detail: 'Missing token' } });
  cy.visit(path);
  cy.location('pathname').should('include', path);
}

export function assertInstallPrompt() {
  cy.get(MANAGER, { timeout: TIMEOUT })
    .should('be.visible')
    .and('contain.text', 'Orion extension required')
    .and('contain.text', 'Install the signed Firefox or Chromium package');
  cy.get('[data-testid="social-extension-open"]').should('not.exist');
  cy.get('[data-testid="social-extension-download-firefox"]')
    .should('contain.text', 'Install for Firefox')
    .and('have.attr', 'href', '/extensions/orion-extension-firefox.xpi');
  cy.get('[data-testid="social-extension-download-chrome"]')
    .should('contain.text', 'Install for Chromium')
    .and('have.attr', 'href', '/extensions/orion-extension-chromium.crx');
  cy.get(MANAGER).find('a[data-testid^="social-extension-download-"]').first()
    .should('have.attr', 'data-testid', 'social-extension-download-firefox');
  cy.get(MANAGER).find('ol li').should('have.length', 3);
}

export function setupManageProfilesStubs() {
  cy.intercept('GET', '**/api/extension/session', { statusCode: 200, body: { extension_connected: true } });
  cy.intercept('POST', '**/api/manage-profiles/platforms', {
    statusCode: 200,
    body: { status: 'done', result: { items: [{ platform: PLATFORM, base: 'https://twitter.com' }, { platform: 'Github', base: 'https://github.com' }] } },
  });
  cy.intercept('POST', '**/api/manage-profiles/sessions', {
    statusCode: 200,
    body: { status: 'done', result: { platforms: { [PLATFORM.toLowerCase()]: [{ id: SESSION_ID, capturedAt: '2026-06-14T10:00:00Z', username: 'superman0011', verified: true, verifiedAt: '2026-06-14T10:05:00Z' }] } } },
  });
  cy.intercept('POST', '**/api/manage-profiles/session', { statusCode: 200, body: { status: 'done', result: { platform: PLATFORM, saved: true } } }).as('sessionFetch');
  cy.intercept('POST', '**/api/manage-profiles/session/verify', { statusCode: 200, body: { status: 'done', result: { verified: true, username: 'superman0011' } } }).as('sessionVerify');
  cy.intercept('DELETE', '**/api/manage-profiles/session/**', { statusCode: 200, body: {} }).as('sessionDelete');
}

export function assertSessionProfiles() {
  cy.get('[data-testid="manage-profiles-page"]', { timeout: TIMEOUT }).should('contain.text', 'Manage Profiles');
  cy.get('[data-testid="manage-profiles-platform"]').should('have.length.greaterThan', 0);
  cy.docsScreenshot('social-manage-profiles-page');

  cy.contains('[data-testid="manage-profiles-platform"]', PLATFORM).within(() => {
    cy.get('[data-testid="manage-profiles-session-count"]').should('contain.text', '1/10').and('contain.text', 'saved');
    cy.get('[data-testid="manage-profiles-session-fetch"]').should('contain.text', 'Fetch session').click();
  });
  cy.wait('@sessionFetch', { timeout: TIMEOUT }).then(({ request }) => {
    expect(request.body.platform).to.eq(PLATFORM);
    expect(request.body.url).to.eq('https://twitter.com');
  });

  cy.contains('[data-testid="manage-profiles-platform"]', PLATFORM).click();
  cy.get('[data-testid="manage-profiles-session-list"]', { timeout: TIMEOUT }).should('contain.text', 'superman0011');

  cy.get('[data-testid="manage-profiles-session-verify"]').first().click({ force: true });
  cy.wait('@sessionVerify', { timeout: TIMEOUT }).then(({ request }) => {
    expect(request.body.session_id).to.eq(SESSION_ID);
  });

  cy.get('[data-testid="manage-profiles-session-edit"]').first().click({ force: true });
  cy.wait('@sessionFetch', { timeout: TIMEOUT }).then(({ request }) => {
    expect(request.body.session_id).to.eq(SESSION_ID);
  });

  cy.get('[data-testid="manage-profiles-session-delete"]').first().click({ force: true });
  cy.get('[data-testid="confirmation-popup"]', { timeout: TIMEOUT }).should('be.visible');
  cy.get('[data-testid="confirmation-warning-icon"]').should('be.visible');
  cy.get('[data-testid="confirmation-yes-button"]').should('contain.text', 'Delete').click();
  cy.wait('@sessionDelete', { timeout: TIMEOUT }).then(({ request }) => {
    expect(request.url).to.contain(SESSION_ID);
  });
}
