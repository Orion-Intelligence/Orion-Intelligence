function scrollTenantTableToBottomLeft() {
  cy.get('[data-testid="tenant-page-header"]').should('be.visible');

  cy.get('#dashboard-container, [data-testid="dashboard-container"]')
    .filter(':visible')
    .first()
    .then(($dashboard) => {
      const el = $dashboard.get(0) as HTMLElement;
      el.scrollTop = el.scrollHeight;
      el.scrollLeft = el.scrollWidth;
      el.dispatchEvent(new Event('scroll', {bubbles: true}));
    });

  cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block')
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
    .find('tbody:visible tr:last')
    .scrollIntoView();

  cy.get('@tenantDesktopScroller').then(($scroller) => {
    const cell = $scroller.find('td:contains("No tenants available.")').first();
    if (cell.length) {
      cy.wrap(cell).scrollIntoView();
    }
  });
}

export function clickWhenVisible(selector: string, timeout: number = 30000) {
  cy.get(selector, {timeout}).scrollIntoView();
  cy.get(selector, {timeout}).should('be.visible');
  cy.get(selector, {timeout}).click({waitForAnimations: false, animationDistanceThreshold: 0});
}

export function exportFromModal(modalTestId: string, optionTestId: string) {
  cy.get(`[data-testid="${modalTestId}"]`).should('be.visible');
  cy.get('body').then($body => {
    if ($body.find(`[data-testid="${optionTestId}"]`).length > 0) {
      clickWhenVisible(`[data-testid="${optionTestId}"]`);
    }
    else {
      cy.contains(`[data-testid="${modalTestId}"] button`, 'Export Report (PDF)')
        .scrollIntoView();
      cy.contains(`[data-testid="${modalTestId}"] button`, 'Export Report (PDF)')
        .should('be.visible');
      cy.contains(`[data-testid="${modalTestId}"] button`, 'Export Report (PDF)')
        .click({waitForAnimations: false, animationDistanceThreshold: 0});
    }
  });
  cy.get(`[data-testid="${modalTestId}"]`).should('not.exist');
}

export function closeNotificationSidebar() {
  cy.get('body').then($body => {
    if ($body.find('[data-testid="tenant-notification-sidebar"]').length > 0) {
      if ($body.find('[data-testid="tenant-notification-close"]:visible').length > 0) {
        clickWhenVisible('[data-testid="tenant-notification-close"]');
      }
      else {
        cy.contains('[data-testid="tenant-notification-sidebar"] button', 'Close')
          .scrollIntoView()
          .should('be.visible')
          .click({waitForAnimations: false, animationDistanceThreshold: 0});
      }
    }
  });
  cy.get('[data-testid="tenant-notification-sidebar"]').should('not.exist');
}

export function closeFilterSidebar() {
  cy.get('body').then($body => {
    if ($body.find('[data-testid="side-filter-close"]:visible').length > 0) {
      cy.get('[data-testid="side-filter-close"]')
        .filter(':visible')
        .first()
        .scrollIntoView();
      cy.get('[data-testid="side-filter-close"]')
        .filter(':visible')
        .first()
        .should('be.visible');
      cy.get('[data-testid="side-filter-close"]')
        .filter(':visible')
        .first()
        .click({waitForAnimations: false, animationDistanceThreshold: 0});
    }
  });
  cy.get('body').should($body => {
    expect($body.find('.ui-filter-sidebar-overlay:visible').length).to.eq(0);
    expect($body.find('[data-testid="side-filter-close"]:visible').length).to.eq(0);
  });
}

export function openFilterSidebar() {
  cy.get('body').then($body => {
    if ($body.find('[data-testid="side-filter-close"]:visible').length === 0) {
      clickWhenVisible('[data-testid="tenant-alert-open-sidebar"]');
    }
  });
  cy.get('[data-testid="side-filter-close"]')
    .filter(':visible')
    .first()
    .should('be.visible');
}

export function approveAllTenants(state: {verifiedCount: number}, tries = 0) {
  if (tries >= 5) return;

  scrollTenantTableToBottomLeft();

  cy.get('tbody:visible tr').should(($rows) => {
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
    cy.get('[data-testid="tenant-edit-panel"]').filter(':visible').first().as('tenantEditPanel').should('be.visible');

    cy.get('[data-testid="tenant-verified-toggle"]').first().scrollIntoView().should('exist').then(($btn) => {
      if (($btn.text() || '').toLowerCase().includes('not verified')) {
        cy.wrap($btn).scrollIntoView().should('be.visible').click();
        cy.wrap(true).as('changed');
      }
    });

    cy.get('#dashboard-container, [data-testid="dashboard-container"]')
      .filter(':visible')
      .first()
      .scrollTo('bottom', {ensureScrollable: false});
    cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block')
      .filter(':visible')
      .first()
      .scrollTo('bottomRight', {ensureScrollable: false});

    cy.get('[data-testid="tenant-license-enterprise"]').first().scrollIntoView().should('exist').then(($card) => {
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
        cy.get('#dashboard-container, [data-testid="dashboard-container"]')
          .filter(':visible')
          .first()
          .scrollTo('bottom', {ensureScrollable: false});

        cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block')
          .filter(':visible')
          .first()
          .scrollTo('bottomRight', {ensureScrollable: false});

        cy.get('[data-testid="tenant-save-changes"]')
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
  cy.get('[data-testid="sidebar-subitem-profile-tenant"]').filter(':visible').first().scrollIntoView().click();
  cy.location('pathname').then((path) => {
    if (!path.includes('/dashboard/profile/tenant')) {
      cy.visit('/dashboard/profile/tenant');
    }
  });
  cy.location('pathname').should('include', '/dashboard/profile/tenant');
}

export function openAuditLogPage() {
  cy.viewport(1440, 900);
  cy.visit('/dashboard/profile/auditlog');
  cy.location('pathname').should('include', '/dashboard/profile/auditlog');
  cy.get('app-auditlog .ui-page-title').should('contain.text', 'Audit Logs');
}

export function openAuditLogFilter() {
  cy.get('app-auditlog #top').scrollIntoView();
  cy.contains('button', 'Filter').filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="side-filter-close"]').filter(':visible').first().should('be.visible');
}

export function applyAuditLogDateRange(monthsBack: number) {
  openAuditLogFilter();
  cy.get('[data-testid="side-filter-date-toggle"]').filter(':visible').first().scrollIntoView().click();

  for (let i = 0; i < monthsBack; i += 1) {
    cy.get('[data-testid="side-filter-date-prev-month"]').filter(':visible').first().scrollIntoView().click();
  }

  cy.get('[data-testid="side-filter-date-day-1"]').filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="side-filter-date-day-25"]').filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="side-filter-date-day-11"]').filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().scrollIntoView().click();
}

export function resetAuditLogFilters() {
  openAuditLogFilter();
  cy.get('[data-testid="side-filter-reset"]').filter(':visible').first().scrollIntoView().click();
}

export function openManageIOCs() {
  cy.get('[data-testid="sidebar-subitem-profile-ioc"]').filter(':visible').first().scrollIntoView().click();
  cy.location('pathname').should('include', '/dashboard/profile/ioc');
}

export function addIOCForAllTabs() {
  cy.get('[data-testid^="tenant-ioc-tab-"]').then(($tabs) => {
    const tabs = Cypress._.take($tabs.toArray(), 5);
    tabs.forEach((tab, index) => {
      cy.wrap(tab).scrollIntoView().should('be.visible').click();
      cy.get('[data-testid="tenant-ioc-value-input"]').should('be.visible').clear().type(`test-${index}`);
      cy.get('[data-testid="tenant-ioc-add-button"]').should('be.visible').and('not.be.disabled').click();

      if ((tab.textContent || '').trim() === 'Emails') {
        cy.get('[data-testid="tenant-ioc-value-input"]')
          .should('be.visible')
          .clear()
          .type('laverdure700@mail.com');
        cy.get('[data-testid="tenant-ioc-add-button"]')
          .should('be.visible')
          .and('not.be.disabled')
          .click();
      }
    });
  });

  cy.get('[data-testid="sidebar-subitem-profile-homepage"]').filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="tenant-home-scan-all"]').scrollIntoView().should('be.visible').and('not.be.disabled').click();
}

export function waitForBlockingOverlayToClose() {
  cy.get('body').then(($body) => {
    const $messageDismiss = $body.find('[data-testid="tenant-message-dismiss"]:visible').first();
    if ($messageDismiss.length) {
      cy.wrap($messageDismiss).scrollIntoView().click();
    }

    const $scanCancel = $body.find('[data-testid="tenant-scan-cancel"]:visible').first();
    if ($scanCancel.length) {
      cy.wrap($scanCancel).scrollIntoView().then(($btn) => {
        ($btn.get(0) as HTMLElement).click();
      });
    }

    const $overlay = $body.find('div.fixed.inset-0.z-\\[9999\\]');
    if ($overlay.length) {
      cy.wrap($overlay.first()).should('not.be.visible');
    }
  });
}
