export function applyEntityFilter(name: string, value: string) {
  cy.contains('app-search-filters div', name, {timeout: 20000}).should('exist').scrollIntoView().click();
  cy.get('app-search-filters input[placeholder="Enter entity"]', {timeout: 20000}).scrollIntoView().clear().type(value);
  cy.get('app-search-filters input[placeholder="Enter entity"] + span', {timeout: 20000}).should('be.visible').scrollIntoView().click();
}

export function selectDateRangeAndReopen() {
  cy.contains('button', 'Select date range').scrollIntoView().click();
  cy.contains('button', '1').scrollIntoView().click();
  cy.contains('button', '25').scrollIntoView().click();
  cy.contains('button', 'Apply').scrollIntoView().click();
  cy.openSideFilter();
}

export function selectDateRangeResetAndReopen() {
  cy.contains('button', 'Select date range').scrollIntoView().click();
  cy.contains('button', '1').scrollIntoView().click();
  cy.contains('button', '25').scrollIntoView().click();
  cy.contains('button', 'Apply').scrollIntoView().click();
  cy.contains('button', 'Reset').scrollIntoView().click();
  cy.openSideFilter();
}
