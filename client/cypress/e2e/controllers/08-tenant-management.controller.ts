function scrollTenantTableToBottomLeft() {
  cy.get('[data-testid="tenant-page-header"]', {timeout: 15000}).should('be.visible');

  cy.get('#dashboard-container, [data-cy="dashboard-sub-container"]', {timeout: 15000})
    .filter(':visible')
    .first()
    .then(($dashboard) => {
      const el = $dashboard.get(0) as HTMLElement;
      el.scrollTop = el.scrollHeight;
      el.scrollLeft = 0;
      el.dispatchEvent(new Event('scroll', {bubbles: true}));
    });

  cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block', {timeout: 15000})
    .filter(':visible')
    .first()
    .as('tenantDesktopScroller')
    .then(($scroller) => {
      const el = $scroller.get(0) as HTMLElement;
      el.scrollLeft = 0;
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll', {bubbles: true}));
    });

  cy.get('@tenantDesktopScroller')
    .find('tbody:visible tr:last', {timeout: 15000})
    .scrollIntoView({block: 'end', inline: 'start'});

  cy.get('@tenantDesktopScroller').then(($scroller) => {
    const cell = $scroller.find('td:contains("No tenants available.")').first();
    if (cell.length) {
      cy.wrap(cell).scrollIntoView({block: 'end', inline: 'start'});
    }
  });
}

export function approveAllTenants(state: {verifiedCount: number}, tries = 0) {
  if (tries >= 5) return;

  scrollTenantTableToBottomLeft();

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
    cy.wrap(rows.eq(0)).scrollIntoView();
    cy.wrap(rows.eq(0))
      .parents()
      .filter((_, el) => el.scrollWidth > el.clientWidth)
      .then(($scrollers) => {
        if ($scrollers.length) {
          cy.wrap($scrollers).each(($scroller) => {
            cy.wrap($scroller).scrollTo('right', {ensureScrollable: false, duration: 200});
          });
        }
      });

    cy.wrap(rows.eq(0)).find('td').last().scrollIntoView();
    cy.wrap(rows.eq(0)).find('[data-testid="tenant-edit-button"], #edit-tenant, #edit-profile').first().scrollIntoView().then(($btn) => {
      if (Cypress.dom.isVisible($btn)) {
        cy.wrap($btn).click();
      } else {
        cy.wrap($btn).click({force: true});
      }
    });
    cy.wrap(false).as('changed');
    cy.get('[data-testid="tenant-edit-panel"]', {timeout: 15000}).filter(':visible').first().as('tenantEditPanel').should('be.visible');

    cy.get('[data-testid="tenant-verified-toggle"]', {timeout: 15000}).first().scrollIntoView().should('exist').then(($btn) => {
      if (($btn.text() || '').toLowerCase().includes('not verified')) {
        cy.wrap($btn).scrollIntoView({block: 'center'});
        cy.wrap($btn).then(($el) => {
          if (Cypress.dom.isVisible($el)) {
            cy.wrap($el).click();
          } else {
            cy.wrap($el).click({force: true});
          }
        });
        cy.wrap(true).as('changed');
      }
    });

    cy.get('[data-testid="tenant-license-enterprise"]', {timeout: 15000}).first().scrollIntoView().should('exist').then(($card) => {
      const $cb = $card.find('input[type="checkbox"], input.license-checkbox').first();
      if (!$cb.is(':checked')) {
        cy.wrap($card).scrollIntoView({block: 'center'});
        cy.wrap($card).then(($el) => {
          if (Cypress.dom.isVisible($el)) {
            cy.wrap($el).click();
          } else {
            cy.wrap($el).click({force: true});
          }
        });
        cy.wrap(true).as('changed');
      }
    });

    cy.get('@changed').then((changed: any) => {
      if (changed) {
        cy.get('[data-testid="tenant-save-changes"]', {timeout: 15000}).first().scrollIntoView().then(($btn) => {
          if (Cypress.dom.isVisible($btn)) {
            cy.wrap($btn).click();
          } else {
            cy.wrap($btn).click({force: true});
          }
        });
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
  cy.viewport(1440, 900);
  cy.get('[data-testid="sidebar-subitem-profile-tenant"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
  cy.url().should('include', '/dashboard/profile/tenant');
}

export function openManageIOCs() {
  cy.get('[data-testid="sidebar-subitem-profile-ioc"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
  cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/profile/ioc');
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
