import {
  addIOCForAllTabs,
  applyAuditLogDateRange,
  approveAllTenants,
  openAuditLogPage,
  openManageIOCs,
  openTenantsPage,
  resetAuditLogFilters,
  waitForBlockingOverlayToClose
} from './controllers/08-tenant-management.controller';

describe('Tenant Management - End-to-End Provisioning Flow', () => {
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

    cy.get('[data-testid="signup-username"]', {timeout: 30000}).type(tenant.username);
    cy.get('[data-testid="signup-companymail"]', {timeout: 30000}).type(tenant.email);
    cy.get('[data-testid="signup-password"]', {timeout: 30000}).type(tenant.password, {log: false});
    cy.get('[data-testid="signup-submit"]', {timeout: 30000}).should('be.visible').click();
    cy.get('[data-testid="welcome-tick"]', {timeout: 30000}).should('exist');
    cy.get('[data-testid="welcome-goto-login"]', {timeout: 30000}).click();

    cy.openLastMailAndGetUrl().then((url) => {
      cy.visit(url);
    });
  });

  it('verifies tenants and assigns enterprise license as admin', () => {
    cy.loginAsAdmin();
    openTenantsPage();
    cy.get('[data-testid="tenant-page-header"]', {timeout: 30000}).should('be.visible');
    cy.get('tbody tr', {timeout: 30000}).its('length').should('be.gte', 1);

    const state = {verifiedCount: 0};
    approveAllTenants(state);

    openTenantsPage();
    cy.logout();
  });

  it('completes tenant onboarding and adds tenant user', () => {
    cy.visit('/login');
    cy.reload();
    cy.get('[data-testid="login-user"]', {timeout: 30000}).type(tenant.username);
    cy.get('[data-testid="login-pass"]', {timeout: 30000}).type(tenant.password, {log: false});
    cy.get('[data-testid="login-button"]', {timeout: 30000}).click();

    cy.get('[data-testid="tenant-company-input"]', {timeout: 30000}).should('be.visible').clear().type('orion intelligence');
    cy.get('[data-testid="tenant-onboarding-next-step1"]', {timeout: 30000}).should('be.visible').click();
    cy.get('[data-testid="tenant-onboarding-next-step2"]', {timeout: 30000}).should('be.visible').click();
    cy.get('[data-testid="tenant-onboarding-confirm"]', {timeout: 30000}).should('be.visible').click();

    openManageIOCs();
    addIOCForAllTabs();

    cy.get('[data-testid="sidebar-subitem-profile-users"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
    waitForBlockingOverlayToClose();
    cy.get('[data-testid="tenant-add-user-button"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-add-user-username"]', {timeout: 30000}).type(tenantSubUser.username);
    cy.get('[data-testid="tenant-add-user-email"]', {timeout: 30000}).type(tenantSubUser.email);
    cy.get('[data-testid="tenant-add-user-password"]', {timeout: 30000}).type(tenantSubUser.password, {log: false});
    cy.get('[data-testid="tenant-add-user-submit"]', {timeout: 30000}).scrollIntoView().should('be.visible').and('not.be.disabled').click();
    cy.logout();
    cy.url().should('include', '/login');
  });

  it('updates tenant user quota to one as admin', () => {
    cy.loginAsAdmin();
    openTenantsPage();
    cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/profile/tenant');
    cy.get('[data-testid="tenant-edit-button"]', {timeout: 30000}).first().scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-edit-form-panel"]', {timeout: 30000})
      .filter(':visible')
      .first()
      .as('tenantEditFormPanel')
      .within(() => {
        cy.get('[data-testid="tenant-user-quota-input"]', {timeout: 30000})
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

    cy.get('app-auditlog-list table tbody tr, app-auditlog-list .rounded-xl', {timeout: 30000}).should('have.length.greaterThan', 0);
    cy.contains('button', 'Export', {timeout: 30000})
      .filter(':visible')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click({waitForAnimations: false, animationDistanceThreshold: 0});

    applyAuditLogDateRange(14);
    cy.contains('No audit logs found for the selected filters.', {timeout: 30000}).should('be.visible');

    resetAuditLogFilters();
    cy.get('app-auditlog-list table tbody tr, app-auditlog-list .rounded-xl', {timeout: 30000}).should('have.length.greaterThan', 0);
    cy.logout();
  });

  it('logs in tenant and validates homepage navigation', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-user"]', {timeout: 30000}).type(tenant.username);
    cy.get('[data-testid="login-pass"]', {timeout: 30000}).type(tenant.password, {log: false});
    cy.get('[data-testid="login-button"]', {timeout: 30000}).click();
    cy.get('[data-testid="dashboard-main"]', {timeout: 30000}).should('be.visible');
    cy.get('[data-testid="sidebar-subitem-profile-homepage"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
    cy.location('pathname', {timeout: 20000}).should('include', '/dashboard/profile/homepage');
  });

  it('handles tenant alerts and notifications end-to-end', () => {
    const exportFromModal = (modalTestId: string, optionTestId: string) => {
      cy.get(`[data-testid="${modalTestId}"]`, {timeout: 30000}).should('be.visible');
      cy.get('body').then($body => {
        if ($body.find(`[data-testid="${optionTestId}"]`).length > 0) {
          cy.get(`[data-testid="${optionTestId}"]`, {timeout: 30000})
            .scrollIntoView()
            .should('be.visible')
            .click({waitForAnimations: false, animationDistanceThreshold: 0});
        }
        else {
          cy.contains(`[data-testid="${modalTestId}"] button`, 'Export Report (PDF)', {timeout: 30000})
            .scrollIntoView()
            .should('be.visible')
            .click({waitForAnimations: false, animationDistanceThreshold: 0});
        }
      });
      cy.get(`[data-testid="${modalTestId}"]`, {timeout: 60000}).should('not.exist');
    };
    const closeNotificationSidebar = () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="tenant-notification-sidebar"]').length > 0) {
          cy.get('[data-testid="tenant-notification-close"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
        }
      });
      cy.get('[data-testid="tenant-notification-sidebar"]', {timeout: 30000}).should('not.exist');
    };
    const closeFilterSidebar = () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="side-filter-close"]:visible').length > 0) {
          cy.get('[data-testid="side-filter-close"]', {timeout: 30000})
            .filter(':visible')
            .first()
            .scrollIntoView()
            .should('be.visible')
            .click({waitForAnimations: false, animationDistanceThreshold: 0});
        }
      });
      cy.get('body', {timeout: 60000}).should($body => {
        expect($body.find('.ui-filter-sidebar-overlay:visible').length).to.eq(0);
        expect($body.find('[data-testid="side-filter-close"]:visible').length).to.eq(0);
      });
    };
    const openFilterSidebar = () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="side-filter-close"]:visible').length === 0) {
          cy.get('[data-testid="tenant-alert-open-sidebar"]', {timeout: 30000})
            .scrollIntoView()
            .should('be.visible')
            .click();
        }
      });
      cy.get('[data-testid="side-filter-close"]', {timeout: 30000})
        .filter(':visible')
        .first()
        .should('be.visible');
    };
    cy.visit('/login');
    cy.get('[data-testid="login-user"]', {timeout: 30000}).type(tenant.username);
    cy.get('[data-testid="login-pass"]', {timeout: 30000}).type(tenant.password, {log: false});
    cy.get('[data-testid="login-button"]', {timeout: 30000}).click();

    cy.get('[data-testid="dashboard-main"]', {timeout: 30000}).should('be.visible');
    cy.get('[data-testid="sidebar-subitem-profile-homepage"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();

    cy.get('app-alert-scan-loading', {timeout: 10000}).should('not.exist');
    cy.get('[data-testid="tenant-home-print-alerts"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    exportFromModal('home-alert-export-modal', 'home-alert-export-option-report');

    cy.get('[data-testid="profile-notification-bell"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-notification-see-details"]', {timeout: 40000}).first().scrollIntoView().should('be.visible').click();
    exportFromModal('notification-alert-export-modal', 'notification-alert-export-option-report');
    closeNotificationSidebar();

    cy.get('[data-testid="profile-notification-bell"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-notification-clear-all"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    closeNotificationSidebar();

    cy.get('[data-testid="tenant-home-alert-category-card"]', {timeout: 40000}).first().scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-alert-report-see-details"]', {timeout: 30000}).first().scrollIntoView().should('be.visible').click();
    exportFromModal('category-alert-export-modal', 'category-alert-export-option-report');

    cy.get('[data-testid="tenant-alert-add-button"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-alert-modal"]', {timeout: 30000}).should('be.visible');
    cy.get('[data-testid="tenant-alert-title"]', {timeout: 30000}).should('be.visible').clear().type('Test Alert');
    cy.get('[data-testid="tenant-alert-description"]').clear().type('Test description');
    cy.get('[data-testid="tenant-alert-ioc-type-toggle"]').click();
    cy.get('[data-testid="tenant-alert-ioc-type-option"]').contains('Domains').click();
    cy.get('[data-testid="tenant-alert-source"]').clear().type('Automation');
    cy.get('[data-testid="tenant-alert-url"]').clear().type('https://example.com');
    cy.get('[data-testid="tenant-alert-ioc-value"]').clear().type('example.com');
    cy.get('[data-testid="tenant-alert-save"]').scrollIntoView().should('be.visible').click();

    openFilterSidebar();
    cy.get('[data-testid="side-filter-date-toggle"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    Cypress._.times(12, () => {
      cy.get('[data-testid="side-filter-date-prev-month"]', {timeout: 30000}).first().click();
    });
    cy.get('[data-testid="side-filter-date-day-15"]', {timeout: 30000})
      .not('.text-slate-400')
      .first()
      .scrollIntoView()
      .click();
    Cypress._.times(12, () => {
      cy.get('[data-testid="side-filter-date-next-month"]', {timeout: 30000}).first().click();
    });
    cy.get('[data-testid="side-filter-date-day-15"]', {timeout: 30000})
      .not('.text-slate-400')
      .first()
      .scrollIntoView()
      .click();
    cy.get('[data-testid="side-filter-apply"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    closeFilterSidebar();

    cy.get('[data-testid="tenant-alert-flush-all"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="confirmation-yes-button"]', {timeout: 30000}).should('be.visible').click();
  });
});
