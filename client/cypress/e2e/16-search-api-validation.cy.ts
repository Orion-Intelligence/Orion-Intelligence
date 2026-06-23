import {
  ADVANCED_EMAIL_FILTER_CASE,
  DIRECT_SEARCH_CASES,
  SIDEBAR_FILTER_CASES,
  assertAdvancedEmailFilterResult16,
  assertDirectSearchResult16,
  assertSidebarFilterResult16,
} from './controllers/16-search-api-validation.controller';

describe('Orion Intelligence - Search API Validation', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  afterEach(() => {
    cy.logout();
  });

  it('validates direct search results in all sections', () => {
    DIRECT_SEARCH_CASES.forEach((searchCase) => {
      cy.log(`Direct search: ${searchCase.section}`);
      assertDirectSearchResult16(searchCase);
    });
  });

  it('validates sidebar filter results in all sections', () => {
    SIDEBAR_FILTER_CASES.forEach((filterCase) => {
      cy.log(`Sidebar filter: ${filterCase.section}`);
      assertSidebarFilterResult16(filterCase);
    });
  });

  it('validates advanced email filter result', () => {
    assertAdvancedEmailFilterResult16(ADVANCED_EMAIL_FILTER_CASE);
  });
});
