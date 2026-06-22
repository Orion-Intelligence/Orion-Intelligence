import {
  assertDashboardStealerExposure,
  assertManageProfilesForScannedResult,
  assertSocialEmptyStateIfNoResults,
  assertSocialResultNavigation,
  assertSocialSidebarAndBackNavigation,
  fetchSocialProfileTabs,
  openConnectionsFromPlatformCard,
  openProfileOverviewFromPlatformCard,
  scanKnownSocialUsername,
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
    visitSocialIntel();
    assertSocialEmptyStateIfNoResults();
    scanKnownSocialUsername();
    assertSocialResultNavigation();
    assertDashboardStealerExposure();
    assertManageProfilesForScannedResult();
    openConnectionsFromPlatformCard();
    openProfileOverviewFromPlatformCard();
    fetchSocialProfileTabs();
  });

  it('covers social intel sidebar collapse and header back navigation', () => {
    visitSocialIntel();
    assertSocialSidebarAndBackNavigation();
  });
});
