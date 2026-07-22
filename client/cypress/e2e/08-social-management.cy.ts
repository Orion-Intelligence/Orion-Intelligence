import {
  assertDashboardStealerExposure,
  assertManageProfilesForScannedResult,
  assertSocialEmptyStateIfNoResults,
  assertSocialExtensionExecutorTab,
  assertSocialResultNavigation,
  assertSocialSidebarAndBackNavigation,
  assertWantedListJsonData,
  fetchSocialProfileTabs,
  openConnectionsFromPlatformCard,
  openProfileOverviewFromPlatformCard,
  scanKnownSocialUsername,
  setupSocialExtensionExecutorStubs,
  setupSocialManagementJsonStubs,
  visitSocialIntel
} from './controllers/08-social-management.controller';

describe('Orion Intelligence - Social Intel Management Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('scans superman0011 and covers list navigation, stealer exposure, profile overview, connections, and fetch tabs', () => {
    setupSocialManagementJsonStubs();
    setupSocialExtensionExecutorStubs();
    visitSocialIntel();
    assertSocialEmptyStateIfNoResults();
    scanKnownSocialUsername();
    assertSocialResultNavigation();
    assertDashboardStealerExposure();
    assertWantedListJsonData();
    assertManageProfilesForScannedResult();
    cy.get('[data-testid="social-list-view"]').should('be.visible');
    cy.docsScreenshot('social-intel-list-view');
    openConnectionsFromPlatformCard();
    openProfileOverviewFromPlatformCard();
    assertSocialExtensionExecutorTab();
    fetchSocialProfileTabs();
  });

  it('covers social intel sidebar collapse and header back navigation', () => {
    visitSocialIntel();
    assertSocialSidebarAndBackNavigation();
  });
});
