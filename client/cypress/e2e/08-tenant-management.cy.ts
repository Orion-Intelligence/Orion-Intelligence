import {
  addIOCForAllTabs,
  applyAuditLogDateRange,
  approveAllTenants,
  closeFilterSidebar,
  closeNotificationSidebar,
  exportFromModal,
  openFilterSidebar,
  openAuditLogPage,
  openManageIOCs,
  openTenantsPage,
  resetAuditLogFilters,
  waitForBlockingOverlayToClose
} from './controllers/08-tenant-management.controller';

describe('Tenant Management - End-to-End Provisioning Flows', () => {
  let tenant: any;
  let tenantSubUser: any;

  before(() => {
    cy.env(['TENANT_ACCOUNT', 'TENANT_SUB_USER']).then(({TENANT_ACCOUNT, TENANT_SUB_USER}) => {
      tenant = TENANT_ACCOUNT;
      tenantSubUser = TENANT_SUB_USER;
      if (!tenant?.username || !tenant?.email || !tenant?.password || !tenantSubUser?.username || !tenantSubUser?.email || !tenantSubUser?.password) {
        throw new Error('Missing TENANT_ACCOUNT or TENANT_SUB_USER in cypress.config.ts');
      }
    });
  });

  after(() => {
    cy.logout();
  });

  it('creates tenant account and completes email verification', () => {
    cy.clearAllEmails();
    cy.visit('/signup');

    cy.get('[data-testid="signup-username"]').type(tenant.username);
    cy.get('[data-testid="signup-companymail"]').type(tenant.email);
    cy.get('[data-testid="signup-password"]').type(tenant.password, {log: false});
    cy.get('[data-testid="signup-submit"]').should('be.visible').click();
    cy.get('[data-testid="welcome-tick"]').should('exist');
    cy.get('[data-testid="welcome-goto-login"]').click();

    cy.openLastMailAndGetUrl().then((url) => {
      cy.visit(url);
    });
  });

  it('verifies tenants and assigns enterprise license as admin', () => {
    cy.loginAsAdmin();
    openTenantsPage();
    cy.get('[data-testid="tenant-page-header"]').should('be.visible');
    cy.get('tbody tr').its('length').should('be.gte', 1);

    const state = {verifiedCount: 0};
    approveAllTenants(state);

    openTenantsPage();
    cy.logout();
  });

  it('completes tenant onboarding and adds tenant user', () => {
    cy.visit('/login');
    cy.reload();
    cy.get('[data-testid="login-user"]').type(tenant.username);
    cy.get('[data-testid="login-pass"]').type(tenant.password, {log: false});
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="tenant-company-input"]').should('be.visible').clear().type('orion intelligence');
    cy.get('[data-testid="tenant-onboarding-next-step1"]').should('be.visible').click();
    cy.get('[data-testid="tenant-onboarding-next-step2"]').should('be.visible').click();
    cy.get('[data-testid="tenant-onboarding-confirm"]').should('be.visible').click();

    openManageIOCs();
    addIOCForAllTabs();

    cy.get('[data-testid="sidebar-subitem-profile-users"]').filter(':visible').first().scrollIntoView().click();
    waitForBlockingOverlayToClose();
    cy.get('[data-testid="tenant-add-user-button"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-add-user-username"]').type(tenantSubUser.username);
    cy.get('[data-testid="tenant-add-user-email"]').type(tenantSubUser.email);
    cy.get('[data-testid="tenant-add-user-password"]').type(tenantSubUser.password, {log: false});
    cy.get('[data-testid="tenant-add-user-confirm-password"]').type(tenantSubUser.password, {log: false});
    cy.get('[data-testid="tenant-add-user-submit"]').scrollIntoView().should('be.visible').and('not.be.disabled').click();
    cy.logout();
  });

  it('updates tenant user quota to one as admin', () => {
    cy.loginAsAdmin();
    openTenantsPage();
    cy.location('pathname').should('include', '/dashboard/profile/tenant');
    cy.get('[data-testid="tenant-edit-button"]').first().scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-edit-form-panel"]')
      .filter(':visible')
      .first()
      .as('tenantEditFormPanel')
      .within(() => {
        cy.get('[data-testid="tenant-user-quota-input"]')
          .first()
          .scrollIntoView()
          .clear()
          .type('1');
      });
    cy.get('#dashboard-container, [data-cy="dashboard-sub-container"]', {timeout: 35000})
      .filter(':visible')
      .first()
      .scrollTo('bottom', {ensureScrollable: false});

    cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block', {timeout: 35000})
      .filter(':visible')
      .first()
      .scrollTo('bottomRight', {ensureScrollable: false});

    cy.get('@tenantEditFormPanel', {timeout: 35000})
      .find('[data-testid="tenant-save-changes"]', {timeout: 35000})
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
        cy.wrap($btn).should('exist').and('not.be.disabled').click();
      });
    cy.logout();
  });

  it('opens admin audit log and triggers export plus date filters', () => {
    cy.loginAsAdmin();
    openAuditLogPage();

    cy.get('app-auditlog-list table tbody tr, app-auditlog-list .rounded-xl').should('have.length.greaterThan', 0);
    cy.contains('button', 'Export')
      .filter(':visible')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click({waitForAnimations: false, animationDistanceThreshold: 0});

    applyAuditLogDateRange(14);
    cy.contains('No audit logs found for the selected filters.').should('be.visible');

    resetAuditLogFilters();
    cy.get('app-auditlog-list table tbody tr, app-auditlog-list .rounded-xl').should('have.length.greaterThan', 0);
    cy.logout();
  });

  it('logs in tenant and validates homepage navigation', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-user"]').type(tenant.username);
    cy.get('[data-testid="login-pass"]').type(tenant.password, {log: false});
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="dashboard-main"]').should('be.visible');
    cy.get('[data-testid="sidebar-subitem-profile-homepage"]').filter(':visible').first().scrollIntoView().click();
    cy.location('pathname', {timeout: 20000}).should('include', '/dashboard/profile/homepage');
  });

  it('handles tenant alerts and notifications end-to-end', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-user"]').type(tenant.username);
    cy.get('[data-testid="login-pass"]').type(tenant.password, {log: false});
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="dashboard-main"]').should('be.visible');
    cy.get('[data-testid="sidebar-subitem-profile-homepage"]').filter(':visible').first().scrollIntoView().click();

    cy.get('app-alert-scan-loading', {timeout: 10000}).should('not.exist');
    cy.get('[data-testid="tenant-home-print-alerts"]').scrollIntoView().should('be.visible').click();
    exportFromModal('home-alert-export-modal', 'home-alert-export-option-report');

    cy.get('[data-testid="profile-notification-bell"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-notification-see-details"]', {timeout: 40000}).first().scrollIntoView().should('be.visible').click();
    exportFromModal('notification-alert-export-modal', 'notification-alert-export-option-report');
    closeNotificationSidebar();

    cy.get('[data-testid="tenant-home-alert-category-card"]', {timeout: 40000}).first().scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-alert-report-see-details"]').first().scrollIntoView().should('be.visible').click();
    exportFromModal('category-alert-export-modal', 'category-alert-export-option-report');

    cy.get('[data-testid="tenant-alert-add-button"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-alert-modal"]').should('be.visible');
    cy.get('[data-testid="tenant-alert-title"]').should('be.visible').clear().type('Test Alert');
    cy.get('[data-testid="tenant-alert-description"]').clear().type('Test description');
    cy.get('[data-testid="tenant-alert-ioc-type-toggle"]').click();
    cy.get('[data-testid="tenant-alert-ioc-type-option"]').contains('Domains').click();
    cy.get('[data-testid="tenant-alert-source"]').clear().type('Automation');
    cy.get('[data-testid="tenant-alert-url"]').clear().type('https://example.com');
    cy.get('[data-testid="tenant-alert-ioc-value"]').clear().type('example.com');
    cy.get('[data-testid="tenant-alert-save"]').scrollIntoView().should('be.visible').click();

    openFilterSidebar();
    cy.get('[data-testid="side-filter-date-toggle"]').scrollIntoView().should('be.visible').click();
    Cypress._.times(12, () => {
      cy.get('[data-testid="side-filter-date-prev-month"]').first().click();
    });
    cy.get('[data-testid="side-filter-date-day-15"]')
      .not('.text-slate-400')
      .first()
      .scrollIntoView()
      .click();
    Cypress._.times(12, () => {
      cy.get('[data-testid="side-filter-date-next-month"]').first().click();
    });
    cy.get('[data-testid="side-filter-date-day-15"]')
      .not('.text-slate-400')
      .first()
      .scrollIntoView()
      .click();
    cy.get('[data-testid="side-filter-apply"]').scrollIntoView().should('be.visible').click();
    closeFilterSidebar();

    cy.get('[data-testid="tenant-alert-flush-all"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="confirmation-yes-button"]').should('be.visible').click();
  });
});
