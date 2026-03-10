import {
  applyDateRange,
  applyDirectoryDropdown,
  assertDirectoryContentVisible,
  DIRECTORY_CONTENT_OPTION,
  DIRECTORY_INDEX_OPTION,
  DIRECTORY_NETWORK_OPTION,
  resetDirectoryFilters,
  waitForDirectoryRequest
} from './controllers/16-directory.controller';

describe('Directory Component - Filters, Load More, and Pagination', () => {
  let testData: any = {};

  before(() => {
    cy.env(['TEST_DATA']).then(({TEST_DATA}) => {
      testData = TEST_DATA || {};
    });
  });

  beforeEach(() => {
    void testData;
    cy.intercept('GET', '**/api/directory*').as('getDirectory');
    cy.loginAsAdmin();
    cy.visit('/dashboard/directory');
    waitForDirectoryRequest();
    cy.get('app-directory .ui-page-title', {timeout: 30000}).should('contain.text', 'Directory');
    assertDirectoryContentVisible();
  });

  after(() => {
    cy.logout();
  });

  it('applies directory filters one by one, triggers load more, and paginates', () => {
    cy.get('app-directory-list tbody tr', {timeout: 30000}).then(($rows) => {
      const initialCount = $rows.length;

      if (initialCount > 50) {
        expect(initialCount).to.be.greaterThan(50);
        return;
      }

      cy.get('#bottom', {timeout: 20000}).scrollIntoView();
      cy.wait(1000);
      cy.get('app-directory-list tbody tr', {timeout: 30000}).its('length').should('be.greaterThan', initialCount);
    });

    cy.get('[data-testid="pagination-next"]', {timeout: 20000}).should('exist').scrollIntoView().click();
    waitForDirectoryRequest();
    cy.get('[data-testid="pagination-page-2"]', {timeout: 20000}).should('exist');
    cy.location('search').should('include', 'page=2');

    cy.get('[data-testid="pagination-page-1"]', {timeout: 20000}).scrollIntoView().click();
    waitForDirectoryRequest();

    applyDirectoryDropdown('network', DIRECTORY_NETWORK_OPTION, 'network');
    resetDirectoryFilters();

    applyDirectoryDropdown('index', DIRECTORY_INDEX_OPTION, 'index');
    resetDirectoryFilters();

    applyDirectoryDropdown('content_type', DIRECTORY_CONTENT_OPTION, 'content_type');
    resetDirectoryFilters();

    applyDateRange(14);
    cy.contains('No links found!', {timeout: 30000}).should('be.visible');

    resetDirectoryFilters();
  });
});
