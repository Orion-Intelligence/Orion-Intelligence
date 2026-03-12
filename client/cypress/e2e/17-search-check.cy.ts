import {assertFirstDefacementRow, assertFirstResultCard, clickSidebarSubItem17, openSidebarGroup17, SEARCH_FIXTURES, typeDashboardSearch17, waitForSearchReady17,} from './controllers/17-search-check.controller';

export interface SearchResultData { search_query: string;link_address: string;date: string;description: string | null;}

describe('Orion Intelligence – Search Result Validation', () => {

  before(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('General Intelligence → All: first result matches fixture', () => {
    openSidebarGroup17('General Intelligence');
    clickSidebarSubItem17('General Intelligence', 'All');
    typeDashboardSearch17(SEARCH_FIXTURES.general_intelligence_data.search_query);
    assertFirstResultCard(SEARCH_FIXTURES.general_intelligence_data);
  });

  it('Data Breach → All: first result matches fixture', () => {
    cy.loginAsAdmin();
    openSidebarGroup17('Data Breach');
    clickSidebarSubItem17('Data Breach', 'All');
    typeDashboardSearch17(SEARCH_FIXTURES.data_breach.search_query);
    assertFirstResultCard(SEARCH_FIXTURES.data_breach);
  });

  it('Defacement → All: first row matches fixture searched by team', () => {
    cy.loginAsAdmin();
    openSidebarGroup17('Defacement');
    clickSidebarSubItem17('Defacement', 'All');
    typeDashboardSearch17(SEARCH_FIXTURES.defacement_by_team.search_query);
    assertFirstDefacementRow(SEARCH_FIXTURES.defacement_by_team);
  });

  it('Defacement → All: first row matches fixture searched by base url', () => {
    cy.loginAsAdmin();
    openSidebarGroup17('Defacement');
    clickSidebarSubItem17('Defacement', 'All');
    typeDashboardSearch17(SEARCH_FIXTURES.defacement_by_base_url.search_query);
    assertFirstDefacementRow(SEARCH_FIXTURES.defacement_by_base_url);
  });

  it('Social → All: first result matches fixture', () => {
    cy.loginAsAdmin();
    openSidebarGroup17('Social');
    clickSidebarSubItem17('Social', 'All');
    typeDashboardSearch17(SEARCH_FIXTURES.social.search_query);
    assertFirstResultCard(SEARCH_FIXTURES.social);
  });

  it('Exploit → All: first result matches fixture', () => {
    cy.loginAsAdmin();
    openSidebarGroup17('Exploit');
    clickSidebarSubItem17('Exploit', 'All');

    cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000})
      .first()
      .scrollIntoView()
      .should('be.visible')
      .should('be.enabled');

    typeDashboardSearch17(SEARCH_FIXTURES.exploit.search_query);
    assertFirstResultCard(SEARCH_FIXTURES.exploit);
  });

  it('Feed → All: first result matches fixture', () => {
    cy.loginAsAdmin();
    openSidebarGroup17('Feed');
    waitForSearchReady17();

    cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000})
      .first()
      .scrollIntoView()
      .should('be.visible')
      .should('not.be.disabled')
      .clear()
      .type(`${SEARCH_FIXTURES.feed.search_query}{enter}`);

    assertFirstResultCard(SEARCH_FIXTURES.feed);
  });

});
