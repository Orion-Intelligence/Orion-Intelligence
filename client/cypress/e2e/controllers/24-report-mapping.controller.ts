import { clickOpenExploitReport, openSidebarGroup, typeDashboardSearchSlow } from './04-searching.controller';

export const MAPPING_GRAPH_URL = '**/api/graph*';
export const MAPPING_GRAPH_ALIAS = 'reportMappingGraph';
export const MAPPING_TOGGLE_SELECTOR = '[data-testid="report-mapping-toggle"]';
export const MAPPING_LOADING_SELECTOR = '[data-testid="report-mapping-loading"]';
export const MAPPING_RESULTS_SELECTOR = '[data-testid="report-mapping-results"]';
export const MAPPING_EMPTY_SELECTOR = '[data-testid="report-mapping-empty"]';

const RELATED_DOC_ONE = 'a1'.repeat(32);
const RELATED_DOC_TWO = 'b2'.repeat(32);

export const MAPPING_RESULTS_RESPONSE = {
  limit_reached: false,
  results: [
    {
      vertex: {
        type: 'document',
        doc_id: RELATED_DOC_ONE,
        title: 'Alpha Linked Threat Report',
        summary: 'Shared infrastructure observed across multiple intrusions.',
        cluster_id: 'm_leak',
        source: 'darkweb_forum',
        published: '2026-01-12T00:00:00Z',
        source_reliability: 0.85
      },
      edge: {
        _id: `cti_vertices/m_email:alpha@example.com`,
        _from: `cti_vertices/${RELATED_DOC_ONE}`,
        _to: 'cti_vertices/m_email:alpha@example.com'
      }
    },
    {
      vertex: {
        type: 'document',
        doc_id: RELATED_DOC_TWO,
        title: 'Bravo Correlated Incident',
        summary: 'Overlapping indicators of compromise were correlated.',
        cluster_id: 'm_general',
        source: 'clearnet',
        published: '2026-02-01T00:00:00Z',
        source_reliability: 40
      },
      edge: {
        _id: 'cti_vertices/m_ip:203.0.113.9',
        _from: `cti_vertices/${RELATED_DOC_TWO}`,
        _to: 'cti_vertices/m_ip:203.0.113.9'
      }
    }
  ]
};

export const MAPPING_EMPTY_RESPONSE = {
  limit_reached: false,
  results: []
};

export function interceptMappingGraph(body: unknown, delayMs = 0) {
  void cy.intercept('GET', MAPPING_GRAPH_URL, { statusCode: 200, delay: delayMs, body }).as(MAPPING_GRAPH_ALIAS);
}

export function openExploitReportForMapping() {
  openSidebarGroup('Exploit');
  typeDashboardSearchSlow('exploit');
  void cy.get('[data-testid="result-card"]', { timeout: 60000 }).should('have.length.greaterThan', 0);
  clickOpenExploitReport();
  void cy.get(MAPPING_TOGGLE_SELECTOR, { timeout: 60000 }).should('exist');
}

export function expandMappingPanel() {
  void cy.get(MAPPING_TOGGLE_SELECTOR).scrollIntoView().should('be.visible').click();
}

export function collapseMappingPanel() {
  void cy.get(MAPPING_TOGGLE_SELECTOR).scrollIntoView().should('be.visible').click();
}

export function assertMappingResults() {
  void cy.get(MAPPING_RESULTS_SELECTOR, { timeout: 60000 }).scrollIntoView().should('be.visible');
  void cy.get(`${MAPPING_RESULTS_SELECTOR} [role="button"]`).should('have.length.greaterThan', 0);
  void cy.get(MAPPING_RESULTS_SELECTOR).should('contain.text', 'Alpha Linked Threat Report');
  void cy.get(MAPPING_RESULTS_SELECTOR).should('contain.text', 'Email');
}

export function assertMappingEmpty() {
  void cy.get(MAPPING_EMPTY_SELECTOR, { timeout: 60000 }).scrollIntoView().should('be.visible');
  void cy.get(MAPPING_EMPTY_SELECTOR).should('contain.text', 'No strong related reports found');
}

export function clickFirstMappingResult() {
  void cy.window().then((win) => {
    cy.stub(win, 'open').as('mappingWindowOpen');
  });
  void cy.get(`${MAPPING_RESULTS_SELECTOR} [role="button"]`).first().scrollIntoView().should('be.visible').click();
  void cy.get('@mappingWindowOpen').should('have.been.called');
}
