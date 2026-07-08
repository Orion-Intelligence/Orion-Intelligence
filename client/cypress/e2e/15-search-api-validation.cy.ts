import {
  ADVANCED_ENTITY_FILTER_CASES,
  DIRECT_SEARCH_CASES,
  SIDEBAR_FILTER_GROUPS,
  assertAdvancedEntityFilterResult16,
  assertDirectSearchResult16,
  assertSidebarFilterResult16,
} from './controllers/15-search-api-validation.controller';

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

  SIDEBAR_FILTER_GROUPS.forEach((filterGroup) => {
    it(`validates sidebar filter results in ${filterGroup.section}`, () => {
      filterGroup.cases.forEach((filterCase) => {
        cy.log(`Sidebar filter: ${filterCase.section} ${filterCase.requestField}`);
        assertSidebarFilterResult16(filterCase);
      });
    });
  });

  it('validates advanced entity filter results', () => {
    ADVANCED_ENTITY_FILTER_CASES.forEach((filterCase) => {
      cy.log(`Advanced filter: ${filterCase.category} ${filterCase.value}`);
      assertAdvancedEntityFilterResult16(filterCase);
    });
  });
});
