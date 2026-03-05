export function approveAllTenants(state: {verifiedCount: number}, tries = 0) {
  if (tries >= 5) return;

  cy.get('tbody tr').then($rows => {
    const rows = $rows.filter((_: number, row: HTMLElement) => {
      return (
        Cypress.$(row).find('span:contains("Not Verified")').length > 0 &&
        !Cypress.$(row).hasClass('!border-t-0')
      );
    });
    if (rows.length === 0) {
      return;
    }
    if (rows.length !== 1) {
      throw new Error(`Expected exactly 1 row, found ${rows.length}`);
    }
    state.verifiedCount++;
    cy.wrap(rows.eq(0)).scrollIntoView().parents('div').filter((_, el) => el.scrollWidth > el.clientWidth).first().scrollTo('right', {ensureScrollable: false});

    cy.wrap(rows.eq(0)).within(() => {
      cy.get('#edit-tenant, #edit-profile').first().scrollIntoView().should('be.visible').click();
    });
    cy.wrap(false).as('changed');
    cy.contains('tr', 'Edit Tenant', {timeout: 15000}).should('be.visible');

    cy.contains('tr', 'Edit Tenant').find('button, .ui-button, [role="button"]').contains(/Not Verified/i).then($el => {
      const $btn = Cypress.$($el).first();
      if ($btn.text().toLowerCase().includes('not verified')) {
        cy.wrap($btn).scrollIntoView().should('be.visible').click();
        cy.wrap(true).as('changed');
      }
    });

    cy.contains('tr', 'Edit Tenant').contains('.license-card, .license-btn, .license-label', /Enterprise/i).closest('.license-card, .license-btn').then($card => {
      const $cb = $card.find('input[type="checkbox"], input.license-checkbox').first();
      if (!$cb.is(':checked')) {
        cy.wrap($card).scrollIntoView().should('be.visible').click();
        cy.wrap(true).as('changed');
      }
    });

    cy.get('@changed').then((changed: any) => {
      if (changed) {
        cy.contains('button', 'Save changes', {timeout: 15000}).filter(':visible').first().scrollIntoView().should('be.visible').click();
      }
    });
    openTenantsPage();

    cy.get('body').then($b => {
      if ($b.find('.badge-false, span:contains("Not Verified")').length) {
        approveAllTenants(state, tries + 1);
      }
    });
  });
}

export function openTenantsPage() {
  cy.contains('app-dashboard-sidebar-items div', 'Tenant').should('be.visible').click();
  cy.url().should('include', '/dashboard/profile/tenant');
}

export function openManageIOCs() {
  cy.contains('app-dashboard-sidebar-items div', 'IOC').should('be.visible').click();
  cy.get('input[placeholder="Search IOCs..."]').should('exist');
}

export function addIOCForAllTabs() {
  cy.contains('button', 'Add').should('exist');
}

export function waitForBlockingOverlayToClose() {
  cy.get('body').then(($body) => {
    const $overlay = $body.find('div.fixed.inset-0.z-\\[9999\\]');
    if ($overlay.length) {
      cy.wrap($overlay.first()).should('not.be.visible');
    }
  });
}
