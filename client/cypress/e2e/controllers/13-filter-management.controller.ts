export function applyEntityFilter(name: string, value: string) {
  const categoryKey = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  cy.get(`[data-testid="entity-filter-category-${categoryKey}"]`).should('exist').scrollIntoView().click({ force: true });
  cy.get('[data-testid="entity-filter-value-input"]').scrollIntoView().clear().type(value);
  cy.get('[data-testid="entity-filter-add-value"]').should('be.visible').scrollIntoView().click();
}

export function ensureDashboardSidebarExpanded12() {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="sidebar-expand-button"]:visible').length) {
      cy.get('[data-testid="sidebar-expand-button"]').click();
    }
  });
  cy.get('[data-testid="sidebar-collapse-button"]').should('be.visible');
}

export function selectSidebarFilterOption12(selectTestId: string, option: string) {
  cy.get(`[data-testid="${selectTestId}"]`)
    .filter(':visible')
    .first()
    .scrollIntoView()
    .should('be.visible')
    .then(($select) => {
      if ($select.is('select')) {
        cy.wrap($select).select(option);
        return;
      }
      const menuId = $select.attr('aria-controls');
      cy.wrap($select).click();
      cy.contains(`#${menuId} [role="option"]`, option).click({ force: true });
    });
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
