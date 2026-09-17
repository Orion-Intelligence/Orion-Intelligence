import {
  MAPPING_EMPTY_RESPONSE,
  MAPPING_GRAPH_ALIAS,
  MAPPING_LOADING_SELECTOR,
  MAPPING_RESULTS_RESPONSE,
  MAPPING_RESULTS_SELECTOR,
  assertMappingEmpty,
  assertMappingResults,
  clickFirstMappingResult,
  collapseMappingPanel,
  expandMappingPanel,
  interceptMappingGraph,
  openExploitReportForMapping
} from './controllers/24-report-mapping.controller';

describe('Orion Intelligence - Report Related Mapping Panel', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('loads, renders, and navigates related mapping results', () => {
    interceptMappingGraph(MAPPING_RESULTS_RESPONSE, 800);
    openExploitReportForMapping();

    expandMappingPanel();
    cy.get(MAPPING_LOADING_SELECTOR).scrollIntoView().should('be.visible');
    cy.wait(`@${MAPPING_GRAPH_ALIAS}`, { timeout: 60000 });

    assertMappingResults();
    cy.docsScreenshot('report-mapping-results');

    clickFirstMappingResult();

    collapseMappingPanel();
    cy.get(MAPPING_RESULTS_SELECTOR).should('not.exist');

    expandMappingPanel();
    cy.get(MAPPING_RESULTS_SELECTOR).should('be.visible');
  });

  it('shows the empty state when no strong related reports exist', () => {
    interceptMappingGraph(MAPPING_EMPTY_RESPONSE);
    openExploitReportForMapping();

    expandMappingPanel();
    cy.wait(`@${MAPPING_GRAPH_ALIAS}`, { timeout: 60000 });

    assertMappingEmpty();
  });
});
