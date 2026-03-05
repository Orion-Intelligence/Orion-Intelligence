export function fillPrimaryScanInput(value: string) {
  cy.get('[data-testid="scan-primary-input"]', {timeout: 20000}).filter(':visible').first().should('be.visible').clear().type(value);
}

export function fillSecondaryScanInput(value: string) {
  cy.get('[data-testid="scan-secondary-input"]', {timeout: 20000}).filter(':visible').first().should('be.visible').clear().type(value);
}

export function clickSearch() {
  cy.get('[data-testid="scan-search-button"]', {timeout: 20000}).filter(':visible').first().should('be.enabled').click();
}

export function makeFileInputInteractable() {
  cy.get('[data-testid="scan-file-input"]', {timeout: 20000}).first().should('exist').invoke('removeClass', 'hidden').invoke('attr', 'style', 'display:block;position:fixed;left:8px;top:8px;opacity:1;z-index:9999;');
}
