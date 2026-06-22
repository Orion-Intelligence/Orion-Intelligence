import {CONTENT_TYPES, ENTITY_FILTERS, NETWORK_OPTIONS, SEARCH_BY_OPTIONS, SORT_OPTIONS} from '../support/constants';
import {applyEntityFilter, ensureDashboardSidebarExpanded12, selectDateRangeAndReopen, selectDateRangeResetAndReopen, selectSidebarFilterOption12} from './controllers/12-filter-management.controller';

const THREAT_CONTENT_TYPES = ['All', 'Leak', 'Credential', 'Ransomware'];

interface ExploitFilterCase {
  selectTestId: string;
  label: string;
  requestField: string;
  requestValue: string;
  resultFields: string[];
  expectedValue: string;
  search?: string;
}

const EXPLOIT_FILTER_CASES: ExploitFilterCase[] = [
  { selectTestId: 'side-filter-select-content', label: 'CVE', requestField: 'content', requestValue: 'cve', resultFields: ['m_content_type'], expectedValue: 'cve' },
  { selectTestId: 'side-filter-select-m_severity', label: 'Critical', requestField: 'm_severity', requestValue: 'critical', resultFields: ['m_severity'], expectedValue: 'critical' },
  { selectTestId: 'side-filter-select-m_risk', label: 'Critical', requestField: 'm_risk', requestValue: 'critical', resultFields: ['m_risk'], expectedValue: 'critical' },
  { selectTestId: 'side-filter-select-m_remote_type', label: 'Remote', requestField: 'm_remote_type', requestValue: 'remote', resultFields: ['m_remote_type'], expectedValue: 'remote' },
  { selectTestId: 'side-filter-select-m_platform', label: 'Windows', requestField: 'm_platform', requestValue: 'windows', resultFields: ['m_platform'], expectedValue: 'windows' },
  { selectTestId: 'side-filter-select-m_cve', label: 'CVE-2017-0120', requestField: 'm_cve', requestValue: 'cve-2017-0120', resultFields: ['m_cve'], expectedValue: 'cve-2017-0120' },
  { selectTestId: 'side-filter-select-m_cwe', label: 'CWE-78', requestField: 'm_cwe', requestValue: 'cwe-78', resultFields: ['m_cwe'], expectedValue: 'cwe-78' },
  { selectTestId: 'side-filter-select-m_product', label: 'Windows', requestField: 'm_product', requestValue: 'windows', resultFields: ['m_product'], expectedValue: 'windows' },
  { selectTestId: 'side-filter-select-m_tags', label: 'pip', requestField: 'm_tags', requestValue: 'pip', resultFields: ['m_tags'], expectedValue: 'pip' },
];
const EXPLOIT_FILTER_URL = `/dashboard/exploit/all?q=${encodeURIComponent('*')}&page=1&platform_result_count=100&matchtype=or&must=true`;

function fieldValues(item: any, fields: string[]): string[] {
  return fields
    .flatMap((field) => Array.isArray(item?.[field]) ? item[field] : [item?.[field]])
    .map((value: any) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
}

function selectExploitFilterOption(selectTestId: string, option: string, search = option) {
  cy.get(`[data-testid="${selectTestId}"]`)
    .filter(':visible')
    .first()
    .scrollIntoView()
    .should('be.visible')
    .then(($select) => {
      const menuId = $select.attr('aria-controls');
      cy.wrap($select).click();
      cy.get(`#${menuId}`).parent().find('input').clear({ force: true }).type(search, { force: true });
      cy.contains(`#${menuId} [role="option"]`, option, { timeout: 15000 }).click({ force: true });
    });
}

function expectExploitResponseFields(interception: any, fields: string[], expected: string): void {
  const results = interception.response?.body?.Result || [];
  expect(results.length, `${expected} filtered results`).to.be.greaterThan(0);
  results.forEach((item: any) => {
    expect(fieldValues(item, fields), fields.join(',')).to.include(expected);
  });
}

function applyExploitFilterCase(filterCase: ExploitFilterCase) {
  cy.openSideFilter();
  selectExploitFilterOption(filterCase.selectTestId, filterCase.label, filterCase.search || filterCase.label);
  cy.get('[data-testid="side-filter-apply"]').click();
  cy.wait('@exploitSearch').then((filterSearch) => {
    expect(String(filterSearch.request.body?.[filterCase.requestField] || '').toLowerCase()).to.eq(filterCase.requestValue);
    expectExploitResponseFields(filterSearch, filterCase.resultFields, filterCase.expectedValue);
  });

  cy.openSideFilter();
  cy.get('[data-testid="side-filter-reset"]').click();
  cy.wait('@exploitSearch').then((resetSearch) => {
    expect(String(resetSearch.request.body?.[filterCase.requestField] || '').toLowerCase()).to.not.eq(filterCase.requestValue);
  });
}

describe('Filter Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    ensureDashboardSidebarExpanded12();
  });

  afterEach(() => {
    cy.logout();
  });

  it('applies all filters, tools, and auto-apply options in General Intelligence', () => {
    cy.get('[data-testid="sidebar-group-strategic"]').should('be.visible').scrollIntoView().click();
    cy.scrollDashboardToTop();
    cy.get('[data-testid="dashboard-general-input"]').should('be.visible').click();
    cy.get('[data-testid="dashboard-advance-toggle"]').should('exist').then(($toggle) => {
      cy.wrap($toggle).closest('label').click();
      cy.wrap($toggle).closest('label').click();
    });
    cy.get('app-search-filters').should('be.visible');

    ENTITY_FILTERS.forEach(([name, value]) => applyEntityFilter(name, value));

    cy.get('[data-testid="entity-filter-clear-selection"]').scrollIntoView().click();
    cy.get('body').click(0, 0);
    cy.scrollDashboardToTop();
    cy.get('[data-testid="dashboard-tools-toggle"]').click();
    cy.get('[data-testid="result-tools-sort"]').should('exist');

    SORT_OPTIONS.forEach((option) => {
      cy.scrollDashboardToTop();
      cy.get('[data-testid="result-tools-sort"]').click();
      cy.get(option === 'Newest first' ? '[data-testid="result-tools-sort-newest"]' : '[data-testid="result-tools-sort-oldest"]').click();
      cy.get('[data-testid="dashboard-general-input"]').type('{enter}');
    });

    SEARCH_BY_OPTIONS.forEach((option) => {
      cy.scrollDashboardToTop();
      cy.get('[data-testid="result-tools-searchby"]').click();
      cy.get(option === 'Match Semantic' ? '[data-testid="result-tools-searchby-semantic"]' : option === 'Match any term (OR)' ? '[data-testid="result-tools-searchby-or"]' : option === 'Match indivisual terms (AND)' ? '[data-testid="result-tools-searchby-and"]' : '[data-testid="result-tools-searchby-full"]').click();
      cy.scrollDashboardToTop()
      cy.get('[data-testid="dashboard-general-input"]').filter(':visible').first().should('be.visible').clear().type('test query{enter}');
    });

    cy.openSideFilter();

    cy.scrollDashboardToTop();
    cy.get('[data-testid="side-filter-date-toggle"]').should('be.visible').click();
    cy.get('[data-testid="side-filter-date-day-1"]').filter(':visible').first().click();
    cy.get('[data-testid="side-filter-date-day-25"]').filter(':visible').first().click();
    cy.get('[data-testid="side-filter-apply"]').click();
    cy.openSideFilter();

    CONTENT_TYPES.forEach((option) => {
      selectSidebarFilterOption12('side-filter-select-content', option);
      cy.get('[data-testid="side-filter-apply"]').click();
      cy.openSideFilter();
    });

    cy.closeSideFilter();
    cy.scrollDashboardToTop();
    cy.get('[data-testid="dashboard-search-submit"]').first().should('be.visible').click();
  });
  it('applies all filter options in Data Breach', () => {
    cy.scrollDashboardToTop()
    cy.get('[data-testid="sidebar-group-breach"]').scrollIntoView().click();
    cy.get('[data-testid="dashboard-general-input"]').should('be.visible').clear().type('leak{enter}');
    cy.scrollDashboardToTop();
    cy.get('[data-testid="dashboard-advance-toggle"]').should('exist').then(($toggle) => {
      cy.wrap($toggle).closest('label').click();
      cy.wrap($toggle).closest('label').click();
    });
    cy.openSideFilter();

    NETWORK_OPTIONS.forEach((option) => {
      selectSidebarFilterOption12('side-filter-select-network', option);
      cy.get('[data-testid="side-filter-apply"]').click();
      cy.openSideFilter();
    });

    selectDateRangeAndReopen();
    cy.openSideFilter();
    cy.get('[data-testid="side-filter-reset"]').click();
    cy.openSideFilter();

    cy.closeSideFilter();
    cy.scrollDashboardToTop();
    cy.get('[data-testid="dashboard-search-submit"]').first().click();
  });
  it('applies all filters in Defacement with auto-apply', () => {
    cy.scrollDashboardToTop()
    cy.get('[data-testid="sidebar-group-defacement"]').scrollIntoView().click();
    cy.get('[data-testid="dashboard-general-input"]').should('be.visible');
    cy.openSideFilter();
    selectDateRangeResetAndReopen();

    cy.openSideFilter();
    NETWORK_OPTIONS.forEach((option) => {
      selectSidebarFilterOption12('side-filter-select-network', option);
      cy.applySideFilter();
      cy.openSideFilter();
    });

    cy.closeSideFilter();
    cy.scrollDashboardToTop();
    cy.get('[data-testid="dashboard-search-submit"]').first().click();
  });
  it('applies all filters in Social with auto-apply', () => {
    cy.scrollDashboardToTop()
    cy.get('[data-testid="sidebar-group-social"]').scrollIntoView().click();
    cy.get('[data-testid="dashboard-general-input"]').should('be.visible');
    cy.openSideFilter();
    selectDateRangeResetAndReopen();

    cy.openSideFilter();
    NETWORK_OPTIONS.forEach((option) => {
      selectSidebarFilterOption12('side-filter-select-network', option);
      cy.get('[data-testid="side-filter-apply"]').click();
      cy.openSideFilter();
    });

    THREAT_CONTENT_TYPES.forEach((option) => {
      selectSidebarFilterOption12('side-filter-select-content', option);
      cy.get('[data-testid="side-filter-apply"]').click();
      cy.openSideFilter();
    });

    cy.closeSideFilter();
    cy.get('[data-testid="dashboard-search-submit"]').first().scrollIntoView().click();
  });
  it('applies all filters in Exploit with auto-apply', () => {
    cy.intercept('POST', '**/api/search/exploit').as('exploitSearch');
    cy.scrollDashboardToTop()
    cy.get('[data-testid="sidebar-group-exploit"]').scrollIntoView().click();
    cy.get('[data-testid="dashboard-general-input"]').should('be.visible');
    cy.wait('@exploitSearch');
    cy.visit(EXPLOIT_FILTER_URL);
    cy.wait('@exploitSearch');

    EXPLOIT_FILTER_CASES.forEach((filterCase) => applyExploitFilterCase(filterCase));

    cy.closeSideFilter();
    cy.get('[data-testid="dashboard-search-submit"]').first().scrollIntoView().click();
  });
});
