const SOCIAL_ROOT = '[data-testid="social-graph-root"]';
const SOCIAL_LIST_EMPTY = '[data-testid="social-list-empty"]';
const SOCIAL_PLATFORM_CARD = '[data-testid="social-platform-card"]';
const SOCIAL_SCAN_TIMEOUT = 180000;
const SOCIAL_FETCH_TIMEOUT = 120000;

export const SOCIAL_STEALER_USERNAME = 'superman0011';
export const SOCIAL_STEALER_PLATFORM = /twitter/i;
const SOCIAL_STEALER_DOMAIN = 'twitter.com';

export function visitSocialIntel() {
  cy.viewport(1440, 900);
  cy.visit('/dashboard/social-intel');
  cy.location('pathname').should('include', '/dashboard/social-intel');
  cy.get(SOCIAL_ROOT).should('be.visible');
  cy.get('[data-testid="social-header-breadcrumb"]').should('contain.text', 'Social').and('contain.text', 'Intel');
  cy.get('[data-testid="social-scan-control"]').should('be.visible');
  cy.get('[data-testid="social-list-view"]').should('be.visible');
}

export function scanKnownSocialUsername(username = SOCIAL_STEALER_USERNAME) {
  cy.get('[data-testid="social-scan-input"]').clear().type(username).should('have.value', username);
  cy.get('[data-testid="social-scan-submit"]').should('not.be.disabled').click();
  cy.contains('[data-testid="social-history-job"]', username, { timeout: SOCIAL_SCAN_TIMEOUT })
    .should('contain.text', 'Completed')
    .and('contain.text', 'Results Ready')
    .click();
  cy.contains(SOCIAL_PLATFORM_CARD, SOCIAL_STEALER_PLATFORM, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .should('be.visible');
}

export function assertSocialResultNavigation() {
  cy.get('[data-testid="social-sidebar-platform-row"]').should('have.length.greaterThan', 0);
  cy.contains('[data-testid="social-sidebar-platform-row"]', SOCIAL_STEALER_PLATFORM, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .click();
  cy.contains(SOCIAL_PLATFORM_CARD, SOCIAL_STEALER_PLATFORM, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .should('be.visible');
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="social-list-platform-open-link"]').length > 0) {
      cy.get('[data-testid="social-list-platform-open-link"]')
        .first()
        .should('have.attr', 'target', '_blank')
        .and('have.attr', 'rel')
        .and('include', 'noopener');
    }
  });
}

export function assertDashboardStealerExposure() {
  cy.get('[data-testid="social-stealerlog-section"]').should('be.visible');
  cy.get('[data-testid="social-dashboard-stealer-exposure"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('be.visible')
    .and('contain.text', 'Exposure found');
  cy.get('[data-testid="social-dashboard-stealer-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .first()
    .should('contain.text', SOCIAL_STEALER_USERNAME)
    .and('contain.text', SOCIAL_STEALER_DOMAIN);
}

export function openConnectionsFromPlatformCard() {
  cy.contains(SOCIAL_PLATFORM_CARD, SOCIAL_STEALER_PLATFORM, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .within(() => {
      cy.get('[data-testid="social-list-followers-following"]').click();
    });
  assertTabPanelSettled('social-tab-panel-connections', 'Loading post mentions');
  cy.get('[data-testid="social-connection-chip"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .and('contain.text', '@dailyplanet');
  cy.get('[data-testid="social-profile-overview-back"]').click();
}

export function openProfileOverviewFromPlatformCard() {
  cy.contains(SOCIAL_PLATFORM_CARD, SOCIAL_STEALER_PLATFORM, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .within(() => {
      cy.get('[data-testid="social-profile-overview-button"]').click();
    });
  cy.get('[data-testid="social-profile-overview-back"]').should('be.visible');
  cy.get('[data-testid="social-fetch-tab"][data-tab-key="details"]').should('exist');
  cy.get('[data-testid="social-fetch-tab"][data-tab-key="posts"]').should('exist');
  cy.get('[data-testid="social-fetch-tab"][data-tab-key="followers"]').should('exist');
  cy.get('[data-testid="social-fetch-tab"][data-tab-key="following"]').should('exist');
  cy.get('[data-testid="social-fetch-tab"][data-tab-key="stealerLogs"]').should('exist');
  assertTabPanelSettled('social-tab-panel-details', 'Loading profile details');
  cy.get('[data-testid="social-tab-panel-details"]').should('contain.text', 'Clark Kent');
}

export function fetchSocialProfileTabs() {
  clickFetchTab('posts');
  assertTabPanelSettled('social-tab-panel-posts', 'Loading posts');
  cy.get('[data-testid="social-post-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .first()
    .should('contain.text', 'Metropolis skyline');

  clickFetchTab('followers');
  assertTabPanelSettled('social-tab-panel-followers', 'Loading followers');
  cy.get('[data-testid="social-follower-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .first()
    .should('contain.text', '@loislane');

  clickFetchTab('following');
  assertTabPanelSettled('social-tab-panel-following', 'Loading following');
  cy.get('[data-testid="social-following-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .first()
    .should('contain.text', '@loislane');

  clickFetchTab('stealerLogs');
  cy.get('[data-testid="social-tab-panel-stealer-logs"]', { timeout: SOCIAL_FETCH_TIMEOUT }).should('be.visible');
  cy.get('[data-testid="social-stealerlog-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .first()
    .should('contain.text', SOCIAL_STEALER_DOMAIN)
    .and('contain.text', SOCIAL_STEALER_USERNAME);
}

export function assertManageProfilesForScannedResult() {
  cy.get('[data-testid="social-list-manage-profiles"]').first().click();
  cy.get('[data-testid="social-manage-profiles-modal"]').should('be.visible');
  cy.get('[data-testid="social-manage-profiles-filter"]').clear().type('twitter');
  cy.get('[data-testid="social-manage-profile-card"]').should('have.length.greaterThan', 0);
  cy.get('[data-testid="social-manage-profile-switch"]').first().should('have.attr', 'role', 'switch');
  cy.get('[data-testid="social-manage-profiles-close"]').click();
  cy.get('[data-testid="social-manage-profiles-modal"]').should('not.exist');
}

export function assertSocialSidebarAndBackNavigation() {
  cy.get('[data-testid="graph-sidebar-collapse"]').should('be.visible').click();
  cy.get('[data-testid="graph-sidebar-expand"]').should('be.visible');
  cy.get('[data-testid="graph-sidebar-expand"]').click();
  cy.get('[data-testid="social-scan-control"]').should('be.visible');
  cy.get('[data-testid="social-header-back"]').click();
  cy.location('pathname').should('match', /^\/dashboard\/(home|profile\/homepage)/);
}

export function assertSocialEmptyStateIfNoResults() {
  cy.get('body').then(($body) => {
    if ($body.find(SOCIAL_PLATFORM_CARD).length === 0) {
      cy.get(SOCIAL_LIST_EMPTY).should('exist');
    }
  });
}

function clickFetchTab(tabKey: string) {
  cy.get(`[data-testid="social-fetch-tab"][data-tab-key="${tabKey}"]`, { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('be.visible')
    .click();
}

function assertTabPanelSettled(panelTestId: string, loadingText: string) {
  cy.get(`[data-testid="${panelTestId}"]`, { timeout: SOCIAL_FETCH_TIMEOUT }).should('be.visible');
  cy.get(`[data-testid="${panelTestId}"]`, { timeout: SOCIAL_FETCH_TIMEOUT }).should(($panel) => {
    const text = ($panel.text() || '').replace(/\s+/g, ' ').trim();
    expect(text).not.to.include(loadingText);
    expect(text.length).to.be.greaterThan(0);
  });
}
