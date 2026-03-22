import {
  CONTENT_TYPES,
  NETWORK_OPTIONS,
  SAFE_SEARCH_OPTIONS,
} from '../support/constants';
import {
  assertAnyResultCardMatchesNetwork,
  openSidebar,
  openAnyMatchingReport,
  selectAndApply,
  selectDateRangeResetAndReopen
} from './controllers/16-sidebarfilter-verification.controller';

describe('SideBar Filter Verification', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  afterEach(() => {
    cy.logout();
  });

  it('applies all filter options in Data Breach', () => {
    cy.intercept('POST', '**/api/search/breach').as('dataBreachSearch');

    cy.get('[data-testid="sidebar-group-breach"]', {timeout: 60000})
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('[data-testid="sidebar-subitem-breach-all"]', {timeout: 60000})
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000})


    cy.scrollDashboardToTop()
    openSidebar();
    selectDateRangeResetAndReopen();
    openSidebar();

    NETWORK_OPTIONS.forEach((option: string) => {
      cy.closeSideFilter()
      cy.scrollDashboardToTop()
      openSidebar();

      cy.get('[data-testid="side-filter-reset"]', {timeout: 60000})
        .filter(':visible')
        .first()
        .should('be.visible')
        .click({ force: true });

      openSidebar();
      cy.get('[data-testid="side-filter-select-network"]', {timeout: 60000})
        .filter(':visible')
        .first()
        .should('be.visible')
        .select(option, { force: true });

      cy.get('[data-testid="side-filter-apply"]', {timeout: 60000})
        .filter(':visible')
        .first()
        .should('be.visible')
        .click({ force: true });

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="result-card"]').length > 0) {
          if (option.trim().toLowerCase() === 'all') {
            cy.get('[data-testid="result-card"]', {timeout: 60000})
              .should('exist')
              .and('be.visible');
          } else {
            assertAnyResultCardMatchesNetwork(option);
          }
        } else if ($body.text().includes('No Results Found')) {
          cy.contains('No Results Found', {matchCase: false})
            .should('be.visible');
        }
      });
    });

    SAFE_SEARCH_OPTIONS.forEach((option: string) => {
      cy.closeSideFilter()
      openSidebar();

      cy.get('[data-testid="side-filter-select-safe"]', {timeout: 60000})
        .filter(':visible')
        .first()
        .should('be.visible')
        .select(option, { force: true });

      cy.get('[data-testid="side-filter-apply"]', {timeout: 60000})
        .filter(':visible')
        .first()
        .should('be.visible')
        .click({ force: true });
    });

    openSidebar();

    cy.get('[data-testid="side-filter-reset"]', {timeout: 60000})
      .filter(':visible')
      .first()
      .should('be.visible')
      .click({ force: true });

    cy.scrollDashboardToTop()
    CONTENT_TYPES.forEach((option: string) => {
      cy.scrollDashboardToTop()
      openSidebar();

      cy.get('[data-testid="side-filter-select-content"]', {timeout: 60000})
        .filter(':visible')
        .first()
        .should('be.visible')
        .select(option, { force: true });

      cy.get('[data-testid="side-filter-apply"]', {timeout: 60000})
        .filter(':visible')
        .first()
        .should('be.visible')
        .click({ force: true });

      cy.wait('@dataBreachSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.scrollDashboardToTop()
      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000})
        .should('be.visible');
    });

    cy.get('[data-testid="dashboard-search-submit"]')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click();
  });

  it('applies all filters in Defacement with auto-apply', () => {
    cy.get('[data-testid="sidebar-group-defacement"]').scrollIntoView().click();
    cy.get('[data-testid="dashboard-general-input"]').should('be.visible');
    openSidebar();
    selectDateRangeResetAndReopen();

    NETWORK_OPTIONS.forEach((option) => {
      cy.closeSideFilter()
      openSidebar();
      selectAndApply('side-filter-select-network', option);
    });

    cy.closeSideFilter();
    cy.get('[data-testid="dashboard-search-submit"]').first().scrollIntoView().click();
  });

  it('applies all filters in Social with auto-apply and verifies selected network in report', () => {
    cy.intercept('POST', '**/api/search/social').as('socialSearch');

    cy.get('[data-testid="sidebar-group-social"]', {timeout: 60000})
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});

    openSidebar();

    selectDateRangeResetAndReopen();

    cy.scrollDashboardToTop()
    openSidebar();
    cy.closeSideFilter()

    NETWORK_OPTIONS.forEach((option: string) => {
      cy.closeSideFilter()
      cy.scrollDashboardToTop()
      openSidebar();

      selectAndApply('side-filter-select-network', option);

      openAnyMatchingReport(option);
      cy.scrollDashboardToTop()
    });

    CONTENT_TYPES.forEach((option: string) => {
      openSidebar();
      cy.closeSideFilter()
      selectAndApply('side-filter-select-content', option);
    });

    cy.scrollDashboardToTop()
  });
  it('applies all filters in Exploit with auto-apply', () => {
    cy.intercept('POST', '**/api/search/exploit').as('exploitSearch');

    cy.get('[data-testid="sidebar-group-exploit"]', {timeout: 60000})
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});

    openSidebar();

    selectDateRangeResetAndReopen();

    openSidebar();

    CONTENT_TYPES.forEach((option: string) => {
      cy.closeSideFilter()
      openSidebar();

      selectAndApply('side-filter-select-content', option);
    });

    NETWORK_OPTIONS.forEach((option: string) => {
      cy.closeSideFilter()
      openSidebar();

      selectAndApply('side-filter-select-network', option);

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="open-report"]').length > 0) {
          openAnyMatchingReport(option);
        } else {
          cy.log(`No results for network: ${option}`);
        }
      });


      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
    });

    cy.get('[data-testid="dashboard-search-submit"]')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click();
  });

  it('applies all filters in Feed News with auto-apply', () => {
    cy.intercept('POST', '**/api/search/breach').as('feedNewsSearch');

    cy.get('[data-testid="sidebar-group-feed"]', {timeout: 60000})
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('[data-testid="sidebar-subitem-feed-news"]', {timeout: 60000})
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});

    openSidebar();
    selectDateRangeResetAndReopen();
    openSidebar();

    CONTENT_TYPES.forEach((option: string) => {
      cy.closeSideFilter()
      openSidebar();

      selectAndApply('side-filter-select-content', option);

    });

    NETWORK_OPTIONS.forEach((option: string) => {
      cy.closeSideFilter()
      openSidebar();

      selectAndApply('side-filter-select-network', option);

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="open-report"]').length > 0) {
          openAnyMatchingReport(option);
          cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
        }
      });
    });

    cy.get('[data-testid="dashboard-search-submit"]')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click();
  });
  it('applies all filters in General Intelligence with auto-apply', () => {
    cy.intercept('POST', '**/api/search/strategic').as('strategicSearch');

    cy.get('[data-testid="sidebar-group-strategic"]', {timeout: 60000})
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('[data-testid="sidebar-subitem-strategic-all"]', {timeout: 60000})


    cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});

    cy.scrollDashboardToTop()
    openSidebar();
    selectDateRangeResetAndReopen();
    cy.scrollDashboardToTop()
    openSidebar();

    CONTENT_TYPES.forEach((option: string) => {
      cy.closeSideFilter()
      cy.scrollDashboardToTop()
      openSidebar();

      selectAndApply('side-filter-select-content', option);
    });

    NETWORK_OPTIONS.forEach((option: string) => {
      cy.closeSideFilter()
      cy.scrollDashboardToTop()
      openSidebar();
      selectDateRangeResetAndReopen();
      cy.closeSideFilter()
      cy.scrollDashboardToTop()
      openSidebar();

      selectAndApply('side-filter-select-network', option);

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="open-report"]').length > 0) {
          openAnyMatchingReport(option);
          cy.scrollDashboardToTop()
        }
      });
    });

    cy.get('[data-testid="dashboard-search-submit"]')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click();
  });

});
