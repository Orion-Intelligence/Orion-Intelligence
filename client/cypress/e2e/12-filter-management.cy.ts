import {CONTENT_TYPES, ENTITY_FILTERS, NETWORK_OPTIONS, SAFE_SEARCH_OPTIONS, SEARCH_BY_OPTIONS, SORT_OPTIONS} from '../support/constants';
import {applyEntityFilter, selectDateRangeAndReopen, selectDateRangeResetAndReopen} from './controllers/12-filter-management.controller';

describe('Filter Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
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
    cy.get('app-search-filters', {timeout: 20000}).should('be.visible');

    ENTITY_FILTERS.forEach(([name, value]) => applyEntityFilter(name, value));

    cy.get('[data-testid="entity-filter-clear-selection"]', {timeout: 20000}).scrollIntoView().click();
    cy.get('body').click(0, 0);
    cy.scrollDashboardToTop();
    cy.get('[data-testid="dashboard-tools-toggle"]', {timeout: 20000}).click();
    cy.get('[data-testid="result-tools-sort"]', {timeout: 20000}).should('exist');

    SORT_OPTIONS.forEach((option) => {
      cy.scrollDashboardToTop();
      cy.get('[data-testid="result-tools-sort"]', {timeout: 20000}).click();
      cy.get(option === 'Newest first' ? '[data-testid="result-tools-sort-newest"]' : '[data-testid="result-tools-sort-oldest"]', {timeout: 20000}).click();
      cy.get('[data-testid="dashboard-general-input"]', {timeout: 20000}).type('{enter}');
    });

    SEARCH_BY_OPTIONS.forEach((option) => {
      cy.scrollDashboardToTop();
      cy.get('[data-testid="result-tools-searchby"]', {timeout: 20000}).click();
      cy.get(option === 'Match Semantic' ? '[data-testid="result-tools-searchby-semantic"]' : option === 'Match any term (OR)' ? '[data-testid="result-tools-searchby-or"]' : option === 'Match indivisual terms (AND)' ? '[data-testid="result-tools-searchby-and"]' : '[data-testid="result-tools-searchby-full"]', {timeout: 20000}).click();
      cy.scrollDashboardToTop()
      cy.get('[data-testid="dashboard-general-input"]', {timeout: 20000}).filter(':visible').first().should('be.visible').clear().type('test query{enter}');
    });

    cy.openSideFilter();

    SAFE_SEARCH_OPTIONS.forEach((option) => {
      cy.get('[data-testid="side-filter-select-safe"]').select(option, {force: true});
      cy.get('[data-testid="side-filter-apply"]').click({force: true});
      cy.openSideFilter();
    });

    cy.scrollDashboardToTop();
    cy.get('[data-testid="side-filter-date-toggle"]').should('be.visible').click();
    cy.get('[data-testid="side-filter-date-day-1"]', {timeout: 20000}).filter(':visible').first().click();
    cy.get('[data-testid="side-filter-date-day-25"]', {timeout: 20000}).filter(':visible').first().click();
    cy.get('[data-testid="side-filter-apply"]').click({force: true});
    cy.openSideFilter();

    CONTENT_TYPES.forEach((option) => {
      cy.get('[data-testid="side-filter-select-content"]').select(option, {force: true});
      cy.get('[data-testid="side-filter-apply"]').click({force: true});
      cy.openSideFilter();
    });

    cy.closeSideFilter();
    cy.scrollDashboardToTop();
    cy.get('[data-testid="dashboard-search-submit"]', {timeout: 20000}).first().should('be.visible').click();
  });
  it('applies all filter options in Data Breach', () => {
    cy.scrollDashboardToTop()
    cy.get('[data-testid="sidebar-group-breach"]').scrollIntoView().click();
    cy.get('[data-testid="dashboard-general-input"]').should('be.visible');
    cy.scrollDashboardToTop();
    cy.get('[data-testid="dashboard-advance-toggle"]').should('exist').then(($toggle) => {
      cy.wrap($toggle).closest('label').click();
      cy.wrap($toggle).closest('label').click();
    });
    cy.openSideFilter();

    NETWORK_OPTIONS.forEach((option) => {
      cy.get('[data-testid="side-filter-select-network"]').select(option, {force: true});
      cy.get('[data-testid="side-filter-apply"]').click({force: true});
      cy.openSideFilter();
    });

    SAFE_SEARCH_OPTIONS.forEach((option) => {
      cy.get('[data-testid="side-filter-select-safe"]').select(option, {force: true});
      cy.get('[data-testid="side-filter-apply"]').click({force: true});
      cy.openSideFilter();
    });

    selectDateRangeAndReopen();
    cy.openSideFilter();
    cy.get('[data-testid="side-filter-reset"]').click({force: true});
    cy.openSideFilter();

    CONTENT_TYPES.forEach((option) => {
      cy.get('[data-testid="side-filter-select-content"]').select(option, {force: true});
      cy.get('[data-testid="side-filter-apply"]').click({force: true});
      cy.openSideFilter();
    });

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
      cy.get('[data-testid="side-filter-select-network"]').select(option, {force: true});
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
      cy.get('[data-testid="side-filter-select-network"]').select(option, {force: true});
      cy.get('[data-testid="side-filter-apply"]').click({force: true});
      cy.openSideFilter();
    });

    CONTENT_TYPES.forEach((option) => {
      cy.get('[data-testid="side-filter-select-content"]').select(option, {force: true});
      cy.get('[data-testid="side-filter-apply"]').click({force: true});
      cy.openSideFilter();
    });

    cy.closeSideFilter();
    cy.get('[data-testid="dashboard-search-submit"]').first().scrollIntoView().click();
  });
  it('applies all filters in Exploit with auto-apply', () => {
    cy.scrollDashboardToTop()
    cy.get('[data-testid="sidebar-group-exploit"]').scrollIntoView().click();
    cy.get('[data-testid="dashboard-general-input"]').should('be.visible');
    cy.openSideFilter();
    selectDateRangeResetAndReopen();
    cy.openSideFilter();

    CONTENT_TYPES.forEach((option) => {
      cy.get('[data-testid="side-filter-select-content"]').select(option, {force: true});
      cy.get('[data-testid="side-filter-apply"]').click({force: true});
      cy.openSideFilter();
    });

    NETWORK_OPTIONS.forEach((option) => {
      cy.get('[data-testid="side-filter-select-network"]').select(option, {force: true});
      cy.get('[data-testid="side-filter-apply"]').click({force: true});
      cy.openSideFilter();
    });

    cy.closeSideFilter();
    cy.get('[data-testid="dashboard-search-submit"]').first().scrollIntoView().click();
  });
});
