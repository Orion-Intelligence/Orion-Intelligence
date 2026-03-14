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
      cy.scrollDashboardToTop()
      openSidebar();

      cy.get('[data-testid="side-filter-reset"]', {timeout: 60000})
        .scrollIntoView()
        .should('be.visible')
        .click();

      openSidebar();

      cy.get('[data-testid="side-filter-select-network"]', {timeout: 60000})
        .scrollIntoView()
        .should('be.visible')
        .select(option);

      cy.get('[data-testid="side-filter-apply"]', {timeout: 60000})
        .scrollIntoView()
        .should('be.visible')
        .click();

      cy.wait('@dataBreachSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.scrollDashboardToTop()
      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000})
        .should('be.visible');

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
          cy.contains('No Results Found', {timeout: 30000, matchCase: false})
            .should('be.visible');
        }
      });
    });

    SAFE_SEARCH_OPTIONS.forEach((option: string) => {
      openSidebar();

      cy.get('[data-testid="side-filter-select-safe"]', {timeout: 60000})
        .scrollIntoView()
        .should('be.visible')
        .select(option);

      cy.get('[data-testid="side-filter-apply"]', {timeout: 60000})
        .scrollIntoView()
        .should('be.visible')
        .click();

      cy.wait('@dataBreachSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('.ui-filter-sidebar-panel.right-0', {timeout: 60000})
        .should('not.exist');
      cy.get('.ui-filter-sidebar-overlay:visible', {timeout: 60000})
        .should('not.exist');

      cy.scrollDashboardToTop()
      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000})
        .should('be.visible');
    });

    openSidebar();

    cy.get('[data-testid="side-filter-reset"]', {timeout: 60000})
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.scrollDashboardToTop()
    CONTENT_TYPES.forEach((option: string) => {
      cy.scrollDashboardToTop()
      openSidebar();

      cy.get('[data-testid="side-filter-select-content"]', {timeout: 60000})
        .scrollIntoView()
        .should('be.visible')
        .select(option);

      cy.get('[data-testid="side-filter-apply"]', {timeout: 60000})
        .scrollIntoView()
        .should('be.visible')
        .click();

      cy.wait('@dataBreachSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000})
        .should('be.visible');
    });

    cy.get('[data-testid="dashboard-search-submit"]', {timeout: 30000})
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

    openSidebar();

    NETWORK_OPTIONS.forEach((option: string) => {
      openSidebar();

      selectAndApply('side-filter-select-network', option);

      cy.wait('@socialSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});

      openAnyMatchingReport(option);

      cy.go('back');

      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
    });

    CONTENT_TYPES.forEach((option: string) => {
      openSidebar();

      selectAndApply('side-filter-select-content', option);

      cy.wait('@socialSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
    });

    cy.get('[data-testid="dashboard-search-submit"]', {timeout: 30000})
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click();
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
      openSidebar();

      selectAndApply('side-filter-select-content', option);

      cy.wait('@exploitSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
    });

    NETWORK_OPTIONS.forEach((option: string) => {
      openSidebar();

      selectAndApply('side-filter-select-network', option);

      cy.wait('@exploitSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="open-report"]').length > 0) {
          openAnyMatchingReport(option);

          cy.go('back');
          cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
        } else {
          cy.log(`No results for network: ${option}`);
        }
      });


      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
    });

    cy.get('[data-testid="dashboard-search-submit"]', {timeout: 30000})
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
      openSidebar();

      selectAndApply('side-filter-select-content', option);

      cy.wait('@feedNewsSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
    });

    NETWORK_OPTIONS.forEach((option: string) => {
      openSidebar();

      selectAndApply('side-filter-select-network', option);

      cy.wait('@feedNewsSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="open-report"]').length > 0) {
          openAnyMatchingReport(option);

          cy.go('back');

          cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
        }
      });
    });

    cy.get('[data-testid="dashboard-search-submit"]', {timeout: 30000})
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

    openSidebar();
    selectDateRangeResetAndReopen();
    openSidebar();

    CONTENT_TYPES.forEach((option: string) => {
      openSidebar();

      selectAndApply('side-filter-select-content', option);

      cy.wait('@strategicSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
    });

    NETWORK_OPTIONS.forEach((option: string) => {
      openSidebar();
      selectDateRangeResetAndReopen();
      openSidebar();

      selectAndApply('side-filter-select-network', option);

      cy.wait('@strategicSearch')
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="open-report"]').length > 0) {
          openAnyMatchingReport(option);

          cy.go('back');
          cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
        }
      });
    });

    cy.get('[data-testid="dashboard-search-submit"]', {timeout: 30000})
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click();
  });

});
