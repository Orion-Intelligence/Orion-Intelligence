export {applyEntityFilter, selectDateRangeAndReopen, selectDateRangeResetAndReopen} from './12-filter-management.controller';

export function waitForSidebar() {
  cy.get('.ui-filter-sidebar-panel.right-0', {timeout: 20000})
    .should('be.visible')
    .should('have.css', 'right', '0px');
}

export function openSidebar() {
  cy.get('body').then(($body) => {
    const isOpen =
      $body.find('.ui-filter-sidebar-panel.right-0').length > 0 &&
      $body.find('.ui-filter-sidebar-panel.right-0').is(':visible');

    if (!isOpen) {
      cy.get('[data-testid="side-filter-open"]', {timeout: 60000})
        .click();
    }
  });

  waitForSidebar();
}

export function selectAndApply(selectTestId: string, option: string) {
  waitForSidebar();

  cy.get('.ui-filter-sidebar-panel.right-0')
    .scrollTo('top', {ensureScrollable: false});

  cy.get(`[data-testid="${selectTestId}"]`, {timeout: 60000})
    .scrollIntoView({offset: {top: -120, left: 0}})
    .should('be.visible')
    .should('not.be.disabled')
    .select(option);

  cy.get('.ui-filter-sidebar-panel.right-0')
    .scrollTo('bottom', {ensureScrollable: false});

  cy.get('[data-testid="side-filter-apply"]', {timeout: 60000})
    .scrollIntoView({offset: {top: -140, left: 0}})
    .should('be.visible')
    .should('not.be.disabled')
    .click({force: true});
}
