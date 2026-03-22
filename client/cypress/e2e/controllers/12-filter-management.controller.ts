export function applyEntityFilter(name: string, value: string) {
  const categoryKey = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  cy.get(`[data-testid="entity-filter-category-${categoryKey}"]`, {timeout: 20000}).should('exist').scrollIntoView().click();
  cy.get('[data-testid="entity-filter-value-input"]', {timeout: 20000}).scrollIntoView().clear().type(value);
  cy.get('[data-testid="entity-filter-add-value"]', {timeout: 20000}).should('be.visible').scrollIntoView().click();
}

export function selectDateRangeAndReopen() {
  cy.get('[data-testid="side-filter-date-toggle"]').click({force: true});
  cy.get('[data-testid="side-filter-date-day-1"]').filter(':visible').first().click({force: true});
  cy.get('[data-testid="side-filter-date-day-25"]').filter(':visible').first().click({force: true});
  cy.get('[data-testid="side-filter-apply"]').click({force: true});
}

export function selectDateRangeResetAndReopen() {
  cy.get('[data-testid="side-filter-date-toggle"]').click({force: true});
  cy.get('[data-testid="side-filter-date-day-1"]').filter(':visible').first().click({force: true});
  cy.get('[data-testid="side-filter-date-day-25"]').filter(':visible').first().click({force: true});
  cy.get('[data-testid="side-filter-reset"]').click({force: true});
}
