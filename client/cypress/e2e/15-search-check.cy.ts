// import {assertFirstDefacementRow, assertFirstResultCard, clickSidebarSubItem15, openSidebarGroup15, SEARCH_FIXTURES, typeDashboardSearch15, waitForSearchReady15,} from './controllers/15-search-check.controller';
//
// export interface SearchResultData { search_query: string;link_address: string;date: string;description: string | null;}
//
// describe('Orion Intelligence – Search Result Validation', () => {
//
//   before(() => {
//     cy.loginAsAdmin();
//   });
//
//   beforeEach(() => {
//     cy.viewport(2560, 3000);
//   });
//
//   after(() => {
//     cy.logout();
//   });
//
//   it('General Intelligence → All: first result matches fixture', () => {
//     openSidebarGroup15('General Intelligence');
//     clickSidebarSubItem15('General Intelligence', 'All');
//     typeDashboardSearch15(SEARCH_FIXTURES.general_intelligence_data.search_query);
//     assertFirstResultCard(SEARCH_FIXTURES.general_intelligence_data);
//   });
//
//   it('Data Breach → All: first result matches fixture', () => {
//     cy.loginAsAdmin();
//     openSidebarGroup15('Data Breach');
//     clickSidebarSubItem15('Data Breach', 'All');
//     typeDashboardSearch15(SEARCH_FIXTURES.data_breach.search_query);
//     assertFirstResultCard(SEARCH_FIXTURES.data_breach);
//   });
//
//   it('Defacement → All: first row matches fixture searched by team', () => {
//     cy.loginAsAdmin();
//     openSidebarGroup15('Defacement');
//     clickSidebarSubItem15('Defacement', 'All');
//     typeDashboardSearch15(SEARCH_FIXTURES.defacement_by_team.search_query);
//     assertFirstDefacementRow(SEARCH_FIXTURES.defacement_by_team);
//   });
//
//   it('Defacement → All: first row matches fixture searched by base url', () => {
//     cy.loginAsAdmin();
//     openSidebarGroup15('Defacement');
//     clickSidebarSubItem15('Defacement', 'All');
//     typeDashboardSearch15(SEARCH_FIXTURES.defacement_by_base_url.search_query);
//     assertFirstDefacementRow(SEARCH_FIXTURES.defacement_by_base_url);
//   });
//
//   it('Social → All: first result matches fixture', () => {
//     cy.loginAsAdmin();
//     openSidebarGroup15('Social');
//     clickSidebarSubItem15('Social', 'All');
//     typeDashboardSearch15(SEARCH_FIXTURES.social.search_query);
//     assertFirstResultCard(SEARCH_FIXTURES.social);
//   });
//
//   it('Exploit → All: first result matches fixture', () => {
//     cy.loginAsAdmin();
//     openSidebarGroup15('Exploit');
//     clickSidebarSubItem15('Exploit', 'All');
//
//     cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000})
//       .first()
//       .scrollIntoView()
//       .should('be.visible')
//       .should('be.enabled');
//
//     typeDashboardSearch15(SEARCH_FIXTURES.exploit.search_query);
//     assertFirstResultCard(SEARCH_FIXTURES.exploit);
//   });
//
//   it('Feed → All: first result matches fixture', () => {
//     cy.loginAsAdmin();
//     openSidebarGroup15('Feed');
//     waitForSearchReady15();
//
//     cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000})
//       .first()
//       .scrollIntoView()
//       .should('be.visible')
//       .should('not.be.disabled')
//       .clear()
//       .type(`${SEARCH_FIXTURES.feed.search_query}{enter}`);
//
//     assertFirstResultCard(SEARCH_FIXTURES.feed);
//   });
//
// });
