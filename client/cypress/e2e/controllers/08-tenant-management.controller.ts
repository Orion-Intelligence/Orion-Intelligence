function scrollTenantTableToBottomLeft() {
  cy.get('[data-testid="tenant-page-header"]', {timeout: 50000}).should('be.visible');

  cy.get('#dashboard-container, [data-cy="dashboard-sub-container"]', {timeout: 50000})
    .filter(':visible')
    .first()
    .then(($dashboard) => {
      const el = $dashboard.get(0) as HTMLElement;
      el.scrollTop = el.scrollHeight;
      el.scrollLeft = el.scrollWidth;
      el.dispatchEvent(new Event('scroll', {bubbles: true}));
    });

  cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block', {timeout: 50000})
    .filter(':visible')
    .first()
    .as('tenantDesktopScroller')
    .then(($scroller) => {
      const el = $scroller.get(0) as HTMLElement;
      el.scrollTop = el.scrollHeight;
      el.scrollLeft = el.scrollWidth;
      el.dispatchEvent(new Event('scroll', {bubbles: true}));
    });

  cy.get('@tenantDesktopScroller')
    .find('tbody:visible tr:last', {timeout: 50000})
    .scrollIntoView();

  cy.get('@tenantDesktopScroller').then(($scroller) => {
    const cell = $scroller.find('td:contains("No tenants available.")').first();
    if (cell.length) {
      cy.wrap(cell).scrollIntoView();
    }
  });
}

export function approveAllTenants(state: {verifiedCount: number}, tries = 0) {
  if (tries >= 5) return;

  scrollTenantTableToBottomLeft();

  cy.get('tbody:visible tr', {timeout: 30000}).should(($rows) => {
    expect($rows.length, 'tenant rows rendered').to.be.greaterThan(0);
    const hasNotVerified = $rows.toArray().some((row) =>
      Cypress.$(row).find('span:contains("Not Verified")').length > 0
    );
    expect(hasNotVerified, 'at least one "Not Verified" tenant row present').to.equal(true);
  });

  cy.get('tbody tr').then($rows => {
    const rows = $rows.filter((_: number, row: HTMLElement) => {
      return (
        Cypress.$(row).find('span:contains("Not Verified")').length > 0 &&
        !Cypress.$(row).hasClass('!border-t-0')
      );
    });
    if (rows.length === 0) {
      throw new Error('Expected at least one "Not Verified" tenant row, found none');
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
    cy.wrap(rows.eq(0))
      .find('[data-testid="tenant-edit-button"], #edit-tenant, #edit-profile')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click();
    cy.wrap(false).as('changed');
    cy.get('[data-testid="tenant-edit-panel"]', {timeout: 50000}).filter(':visible').first().as('tenantEditPanel').should('be.visible');

    cy.get('[data-testid="tenant-verified-toggle"]', {timeout: 50000}).first().scrollIntoView().should('exist').then(($btn) => {
      if (($btn.text() || '').toLowerCase().includes('not verified')) {
        cy.wrap($btn).scrollIntoView().should('be.visible').click();
        cy.wrap(true).as('changed');
      }
    });

    cy.get('#dashboard-container, [data-cy="dashboard-sub-container"]', {timeout: 50000})
      .filter(':visible')
      .first()
      .scrollTo('bottom', {ensureScrollable: false});
    cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block', {timeout: 50000})
      .filter(':visible')
      .first()
      .scrollTo('bottomRight', {ensureScrollable: false});

    cy.get('[data-testid="tenant-license-enterprise"]', {timeout: 50000}).first().scrollIntoView().should('exist').then(($card) => {
      const $cb = $card.find('input[type="checkbox"], input.license-checkbox').first();
      if (!$cb.prop('checked')) {
        const cardEl = $card.get(0) as HTMLElement;
        cardEl.scrollIntoView();
        cardEl.click();
        cy.wrap(true).as('changed');
      }
    });

    cy.get('@changed').then((changed: any) => {
      if (changed) {
        cy.get('#dashboard-container, [data-cy="dashboard-sub-container"]', {timeout: 50000})
          .filter(':visible')
          .first()
          .scrollTo('bottom', {ensureScrollable: false});

        cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block', {timeout: 50000})
          .filter(':visible')
          .first()
          .scrollTo('bottomRight', {ensureScrollable: false});

        cy.get('[data-testid="tenant-save-changes"]', {timeout: 50000})
          .filter(':visible')
          .first()
          .then(($btn) => {
            const btn = $btn.get(0) as HTMLElement;
            btn.scrollIntoView();
            const parentScroller = btn.closest('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block') as HTMLElement | null;
            if (parentScroller) {
              parentScroller.scrollTop = parentScroller.scrollHeight;
              parentScroller.scrollLeft = parentScroller.scrollWidth;
              parentScroller.dispatchEvent(new Event('scroll', {bubbles: true}));
            }
            cy.wrap($btn).should('be.visible').and('not.be.disabled');
            btn.click();
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
  cy.location('pathname', {timeout: 50000}).then((path) => {
    if (!path.includes('/dashboard/profile/tenant')) {
      cy.visit('/dashboard/profile/tenant');
    }
  });
  cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/profile/tenant');
}

export function openManageIOCs() {
  cy.get('[data-testid="sidebar-subitem-profile-ioc"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
  cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/profile/ioc');
}

export function addIOCForAllTabs() {
  cy.get('[data-testid^="tenant-ioc-tab-"]', {timeout: 30000}).then(($tabs) => {
    const tabs = Cypress._.take($tabs.toArray(), 5);
    tabs.forEach((tab, index) => {
      cy.wrap(tab).scrollIntoView().should('be.visible').click();
      cy.get('[data-testid="tenant-ioc-value-input"]', {timeout: 30000}).should('be.visible').clear().type(`test-${index}`);
      cy.get('[data-testid="tenant-ioc-add-button"]', {timeout: 30000}).should('be.visible').and('not.be.disabled').click();
    });
  });

  cy.get('[data-testid="sidebar-subitem-profile-homepage"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="tenant-home-scan-all"]', {timeout: 40000}).scrollIntoView().should('be.visible').and('not.be.disabled').click();
}

export function waitForBlockingOverlayToClose() {
  cy.get('body').then(($body) => {
    const $messageDismiss = $body.find('[data-testid="tenant-message-dismiss"]:visible').first();
    if ($messageDismiss.length) {
      cy.wrap($messageDismiss).scrollIntoView().click();
    }

    const $scanCancel = $body.find('[data-testid="tenant-scan-cancel"]:visible').first();
    if ($scanCancel.length) {
      cy.wrap($scanCancel).scrollIntoView().click();
    }

    const $overlay = $body.find('div.fixed.inset-0.z-\\[9999\\]');
    if ($overlay.length) {
      cy.wrap($overlay.first()).should('not.be.visible');
    }
  });
}
