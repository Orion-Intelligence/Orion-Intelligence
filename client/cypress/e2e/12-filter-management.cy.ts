import {CONTENT_TYPES, ENTITY_FILTERS, NETWORK_OPTIONS, SAFE_SEARCH_OPTIONS, SEARCH_BY_OPTIONS, SORT_OPTIONS} from '../support/constants';
import {applyEntityFilter, selectDateRangeAndReopen, selectDateRangeResetAndReopen} from './controllers/12-filter-management.controller';

describe('General Intelligence – Full Filters + Tools + Auto-Apply Flow', () => {

  it('Apply ALL filters, auto-apply network, safe search, date, content type', () => {
    cy.logout();
    cy.loginAsAdmin();
    cy.visit('/dashboard');
    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence', {timeout: 30000}).should('be.visible').scrollIntoView().click();
    cy.get('[data-cy="dashboard-general-input"]', {timeout: 30000}).should('be.visible').scrollIntoView().click();
    cy.contains('span', 'Advance', {timeout: 30000}).parent().find('input[type="checkbox"]').should('exist').scrollIntoView().check();
    cy.get('app-search-filters', {timeout: 20000}).should('be.visible');
    ENTITY_FILTERS.forEach(([name, value]) => applyEntityFilter(name, value));
    cy.contains('app-search-filters button', 'Clear Selection', {timeout: 20000}).scrollIntoView().click();
    cy.get('body').click(0, 0);
    cy.contains('button', 'Tools', {timeout: 20000}).scrollIntoView().click();
    cy.contains('button', 'sort by', {timeout: 20000}).scrollIntoView().should('exist');
    SORT_OPTIONS.forEach((option) => {
      cy.contains('button', 'sort by', {timeout: 20000}).scrollIntoView().click();
      cy.get('.ui-result-dropdown-panel', {timeout: 20000}).should('exist');
      cy.contains('.ui-result-dropdown-panel button', option, {timeout: 20000}).scrollIntoView().click();
      cy.get('[data-cy="dashboard-general-input"]', {timeout: 20000}).type('{enter}');
    });
    SEARCH_BY_OPTIONS.forEach((option) => {
      cy.contains('button', 'search by', {timeout: 20000}).scrollIntoView().click();
      cy.get('.ui-result-dropdown-panel', {timeout: 20000}).should('exist');
      cy.contains('.ui-result-dropdown-panel button', option, {timeout: 20000}).scrollIntoView().click();
      cy.get('[data-cy="dashboard-general-input"]', {timeout: 20000}).should('be.visible').clear().type('test query{enter}');
    });
    cy.openSideFilter();
    SAFE_SEARCH_OPTIONS.forEach((option) => {
      cy.contains('app-filters label', 'Safe Search', {timeout: 30000}).parent().find('select').scrollIntoView().select(option);
      cy.contains('button', 'Apply', {matchCase: false}).scrollIntoView().click();
      cy.openSideFilter();
    });
    cy.contains('app-filters button', 'Select date range', {timeout: 30000}).should('be.visible').scrollIntoView().click();
    cy.contains('button', '1', {timeout: 20000}).scrollIntoView().click();
    cy.contains('button', '25', {timeout: 20000}).scrollIntoView().click();
    cy.contains('button', 'Apply', {matchCase: false}).scrollIntoView().click();
    cy.openSideFilter();
    CONTENT_TYPES.forEach((option) => {
      cy.contains('app-filters label', 'Content Type', {timeout: 30000}).parent().find('select').scrollIntoView().select(option);
      cy.contains('button', 'Apply', {matchCase: false}).scrollIntoView().click();
      cy.openSideFilter();
    });
    cy.closeSideFilter();
    cy.get('form button[type="submit"]', {timeout: 20000}).first().should('be.visible').scrollIntoView().click();
    cy.logout();
  });
});

describe('Data Breach – Full Filters + Auto-Apply Flow', () => {

    it('Apply ALL filters, network, safe search, date, content type in Data Breach tab', () => {
      cy.logout();
      cy.loginAsAdmin();
      cy.visit('/dashboard');
      cy.contains('app-dashboard-sidebar-items div', 'Data Breach').scrollIntoView().click();
      cy.get('[data-cy="dashboard-general-input"]').should('be.visible');
      cy.contains('span', 'Advance').parent().find('input[type="checkbox"]').should('exist').scrollIntoView().check();
      cy.openSideFilter();
      NETWORK_OPTIONS.forEach(option => {
      cy.contains('app-filters label', 'Network Type').parent().find('select').scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });
      SAFE_SEARCH_OPTIONS.forEach(option => {
        cy.contains('app-filters label', 'Safe Search').parent().find('select').scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });
      selectDateRangeAndReopen();
      cy.contains('button', 'Reset').scrollIntoView().click();
      CONTENT_TYPES.forEach(option => {
        cy.contains('app-filters label', 'Content Type').parent().find('select').scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });
      cy.closeSideFilter();
      cy.get('form button[type="submit"]').first().scrollIntoView().click();
      cy.logout();
    });
  });

describe('Defacement – Full Filters Flow', () => {

    it('Apply all filters in Defacement with auto-apply', () => {
      cy.logout();
      cy.loginAsAdmin();
      cy.visit('/dashboard');
      cy.contains('app-dashboard-sidebar-items div', 'Defacement').scrollIntoView().click();
      cy.get('[data-cy="dashboard-general-input"]').should('be.visible');
      cy.openSideFilter();
      selectDateRangeResetAndReopen();
      NETWORK_OPTIONS.forEach(option => {
      cy.contains('app-filters label', 'Network Type').parent().find('select').scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });
      cy.closeSideFilter();
      cy.get('form button[type="submit"]').first().scrollIntoView().click();
      cy.logout();
    });
  });

describe('Social – Full Filters Flow', () => {

    it('Apply all filters in Social with auto-apply', () => {
      cy.logout();
      cy.loginAsAdmin();
      cy.visit('/dashboard');
      cy.contains('app-dashboard-sidebar-items div', 'Social').scrollIntoView().click();
      cy.get('[data-cy="dashboard-general-input"]').should('be.visible');
      cy.openSideFilter();
      selectDateRangeResetAndReopen();
      NETWORK_OPTIONS.forEach(option => {
      cy.contains('app-filters label', 'Network Type').parent().find('select').scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });
      CONTENT_TYPES.forEach(option => {
        cy.contains('app-filters label', 'Content Type').parent().find('select').scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });
      cy.closeSideFilter();
      cy.get('form button[type="submit"]').first().scrollIntoView().click();
      cy.logout();
    });
  });

describe('Exploit – Full Filters Flow', () => {

    it('Apply all filters in Exploit with auto-apply', () => {
      cy.logout();
      cy.loginAsAdmin();
      cy.visit('/dashboard');
      cy.contains('app-dashboard-sidebar-items div', 'Exploit').scrollIntoView().click();
      cy.get('[data-cy="dashboard-general-input"]').should('be.visible');
      cy.openSideFilter();
      selectDateRangeResetAndReopen();
      CONTENT_TYPES.forEach(option => {
        cy.contains('app-filters label', 'Content Type').parent().find('select').scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });
      NETWORK_OPTIONS.forEach(option => {
      cy.contains('app-filters label', 'Network Type').parent().find('select').scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });
      cy.closeSideFilter();
      cy.get('form button[type="submit"]').first().scrollIntoView().click();
    });
  });
