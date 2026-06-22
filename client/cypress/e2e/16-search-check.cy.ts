import {clickSidebarSubItem15, openSidebarGroup15, SEARCH_FIXTURES, searchAndAssertMatchingDefacementResult, searchAndAssertMatchingResult, searchAndAssertMatchingResultWithAdvancedFilters} from './controllers/16-search-check.controller';

describe('Orion Intelligence – Search Result Validation', () => {

  before(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('General Intelligence → All: first result matches fixture', () => {
    openSidebarGroup15('General Intelligence');
    clickSidebarSubItem15('General Intelligence', 'All');
    searchAndAssertMatchingResult(SEARCH_FIXTURES.general_intelligence_data);
  });

  it('Data Breach → All: first result matches fixture', () => {
    cy.loginAsAdmin();
    openSidebarGroup15('Data Breach');
    clickSidebarSubItem15('Data Breach', 'All');
    searchAndAssertMatchingResult(SEARCH_FIXTURES.data_breach);
  });

  it('Defacement → All: first row matches fixture searched by team', () => {
    cy.loginAsAdmin();
    openSidebarGroup15('Defacement');
    clickSidebarSubItem15('Defacement', 'All');
    searchAndAssertMatchingDefacementResult(SEARCH_FIXTURES.defacement_by_team);
  });

  it('Defacement → All: first row matches fixture searched by base url', () => {
    cy.loginAsAdmin();
    openSidebarGroup15('Defacement');
    clickSidebarSubItem15('Defacement', 'All');
    searchAndAssertMatchingDefacementResult(SEARCH_FIXTURES.defacement_by_base_url);
  });

  it('Social → All: first result matches fixture', () => {
    cy.loginAsAdmin();
    openSidebarGroup15('Social');
    clickSidebarSubItem15('Social', 'All');
    searchAndAssertMatchingResult(SEARCH_FIXTURES.social);
  });

  it('Exploit → All: first result matches fixture', () => {
    cy.loginAsAdmin();
    openSidebarGroup15('Exploit');
    clickSidebarSubItem15('Exploit', 'All');

    cy.get('input[data-testid="dashboard-general-input"][name="q"]')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .should('be.enabled');

    searchAndAssertMatchingResult(SEARCH_FIXTURES.exploit);
  });

  it('Exploit → All: advanced filter is submitted and result matches fixture', () => {
    cy.loginAsAdmin();
    openSidebarGroup15('Exploit');
    clickSidebarSubItem15('Exploit', 'All');
    searchAndAssertMatchingResultWithAdvancedFilters(SEARCH_FIXTURES.exploit);
  });

  it('Feed → News: first result matches fixture', () => {
    cy.loginAsAdmin();
    openSidebarGroup15('Feed');
    searchAndAssertMatchingResult(SEARCH_FIXTURES.feed);
  });

});
