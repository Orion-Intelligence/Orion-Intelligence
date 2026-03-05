export function fillVisibleInputByPlaceholder(placeholder: string, value: string) {
  cy.get(`form:visible input[placeholder="${placeholder}"]`, {timeout: 20000}).should('be.visible').clear().type(value);
}

export function clickSearch() {
  cy.contains('button', /Search/i, {timeout: 20000}).filter(':visible').first().should('be.enabled').click();
}

export function makeFileInputInteractable() {
  cy.get('input#fileInput[type="file"]', {timeout: 20000}).should('exist').invoke('removeClass', 'hidden').invoke('attr', 'style', 'display:block;position:fixed;left:8px;top:8px;opacity:1;z-index:9999;');
}
