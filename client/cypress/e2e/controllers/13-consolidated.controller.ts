export function deleteAllEnabledIocAdvancedFilters() {
  cy.get('[data-testid="ioc-adv-delete-filter"]').then(($allButtons) => {
    const $enabledButtons = $allButtons.filter(':enabled');

    if ($enabledButtons.length === 0) {
      return;
    }

    cy.wrap($enabledButtons[0]).scrollIntoView().should('be.visible').click();
    deleteAllEnabledIocAdvancedFilters();
  });
}
