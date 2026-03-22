export function applyEntityFilter(name: string, value: string) {
  const categoryKey = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  cy.get(`[data-testid="entity-filter-category-${categoryKey}"]`).should('exist').scrollIntoView().click();
  cy.get('[data-testid="entity-filter-value-input"]').scrollIntoView().clear().type(value);
  cy.get('[data-testid="entity-filter-add-value"]').should('be.visible').scrollIntoView().click();
}

export function selectDateRangeAndReopen() {
  cy.get('[data-testid="side-filter-date-toggle"]').filter(':visible').first().click();
  cy.get('[data-testid="side-filter-date-day-1"]').filter(':visible').first().click();
  cy.get('[data-testid="side-filter-date-day-25"]').filter(':visible').first().click();
  cy.get('[data-testid="side-filter-apply"]').click();
}

export function selectDateRangeResetAndReopen() {
  cy.get('[data-testid="side-filter-date-toggle"]').filter(':visible').first().click();
  cy.get('[data-testid="side-filter-date-day-1"]').filter(':visible').first().click();
  cy.get('[data-testid="side-filter-date-day-25"]').filter(':visible').first().click();
  cy.get('[data-testid="side-filter-reset"]').click();
}
