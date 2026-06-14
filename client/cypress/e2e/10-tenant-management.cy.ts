import {
  addIOCForAllTabs,
  applyAuditLogDateRange,
  assertAlertScanCompletedMailPresent,
  closeFilterSidebar,
  closeNotificationSidebar,
  exportFromModal,
  fillTenantNetworkConfiguration,
  loginTenant,
  openFilterSidebar,
  openAuditLogPage,
  openManageIOCs,
  openTenantEditor,
  openTenantSettings,
  openTenantsPage,
  resetAuditLogFilters,
  saveTenantEditor,
  setTenantEditorToggle,
  setTenantLicense,
  submitLogin,
  waitForBlockingOverlayToClose
} from './controllers/10-tenant-management.controller';

describe('Tenant Management - End-to-End Provisioning Flows', () => {
  let tenant: any;
  let tenantSubUser: any;
  const tenantResetNewPassword = '2wsx@WSX2026';

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
    openTenantEditor(tenant);
    setTenantEditorToggle('tenant-verified-toggle', true);
    setTenantEditorToggle('tenant-status-toggle', true);
    setTenantEditorToggle('tenant-password-reset-required-toggle', false);
    setTenantLicense('free', false);
    setTenantLicense('maintainer', true);
    setTenantLicense('enterprise', true);
    saveTenantEditor('saveTenantLicense');
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
    cy.get('#dashboard-container, [data-testid="dashboard-container"]')
      .filter(':visible')
      .first()
      .scrollTo('bottom', {ensureScrollable: false});

    cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block')
      .filter(':visible')
      .first()
      .scrollTo('bottomRight', {ensureScrollable: false});

    cy.scrollDashboardToBottom()
    cy.get('@tenantEditFormPanel')
      .find('[data-testid="tenant-save-changes"]')
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

    cy.get('[data-testid="auditlog-row"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="auditlog-actor"]').first().invoke('text').then((actorText) => {
      const actor = actorText.trim();
      cy.get('[data-testid="auditlog-user-search"]')
        .should('be.visible')
        .clear()
        .type(`${actor}{enter}`);
      cy.location('search').should('contain', `actor_id=${actor}`);
      cy.get('[data-testid="auditlog-actor"]', {timeout: 10000}).should(($actors) => {
        expect($actors.length).to.be.greaterThan(0);
        $actors.each((_, el) => {
          expect(el.innerText.trim()).to.eq(actor);
        });
      });
    });

    cy.get('[data-testid="auditlog-user-search"]').clear().type('{enter}');
    cy.get('[data-testid="auditlog-row"]').should('have.length.greaterThan', 0);

    cy.get('[data-testid="auditlog-delete-button"]')
      .filter(':visible')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click({waitForAnimations: false, animationDistanceThreshold: 0});
    cy.contains('Are you sure you want to delete this audit log record?').should('be.visible');
    cy.contains('button', 'Cancel').click({waitForAnimations: false, animationDistanceThreshold: 0});

    cy.get('[data-testid="auditlog-export-button"]')
      .scrollIntoView()
      .should('be.visible')
      .click({waitForAnimations: false, animationDistanceThreshold: 0});

    applyAuditLogDateRange(14);
    cy.get('[data-testid="auditlog-empty-state"]').should('be.visible');

    resetAuditLogFilters();
    cy.get('[data-testid="auditlog-row"]').should('have.length.greaterThan', 0);
    cy.logout();
  });

  it('logs in tenant and validates homepage navigation', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-user"]').type(tenant.username);
    cy.get('[data-testid="login-pass"]').type(tenant.password, {log: false});
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="dashboard-main"]').should('be.visible');
    cy.get('[data-testid="sidebar-subitem-profile-homepage"]').filter(':visible').first().scrollIntoView().click();
    cy.location('pathname').should('include', '/dashboard/profile/homepage');
  });

  it('saves tenant network configuration after failed SMTP validation', () => {
    loginTenant(tenant);
    openTenantSettings();
    cy.contains('app-smtp-settings-block', 'Network Configuration').should('be.visible');

    cy.contains('button', 'Edit').scrollIntoView().should('be.visible').click();
    fillTenantNetworkConfiguration('localhost', '1');
    cy.intercept('POST', '**/api/update/tenants').as('saveWrongTenantMail');
    cy.contains('button', 'Save').scrollIntoView().should('be.visible').click();
    cy.wait('@saveWrongTenantMail', {timeout: 60000})
      .its('response.statusCode')
      .should('eq', 424);
    cy.contains('app-smtp-settings-block', 'Mail configuration is not working').should('be.visible');

    cy.contains('button', 'Edit').scrollIntoView().should('be.visible').click();
    fillTenantNetworkConfiguration('mailpit', '1025');
    cy.intercept('POST', '**/api/update/tenants').as('saveRightTenantMail');
    cy.contains('button', 'Save').scrollIntoView().should('be.visible').click();
    cy.wait('@saveRightTenantMail', {timeout: 60000})
      .its('response.statusCode')
      .should('be.oneOf', [200, 201]);
    cy.contains('button', 'Edit', {timeout: 30000}).should('be.visible');
    cy.contains('app-smtp-settings-block', 'Mail configuration is not working').should('not.exist');
    cy.logout();
  });

  it('forces tenant account to change password when admin enables reset', () => {
    cy.loginAsAdmin();
    openTenantsPage();
    openTenantEditor(tenant);
    setTenantEditorToggle('tenant-password-reset-required-toggle', true);
    saveTenantEditor('saveTenantPasswordReset');
    cy.logout();

    submitLogin(tenant.username, tenant.password);
    cy.url().should('include', '/reset/');
    cy.get('[data-testid="reset-title"]').should('contain.text', 'Change Password');
    cy.get('[data-testid="reset-password"]').should('be.visible').clear().type(tenantResetNewPassword, {log: false});
    cy.get('[data-testid="reset-confirm-password"]').should('be.visible').clear().type(tenantResetNewPassword, {log: false});
    cy.get('[data-testid="reset-submit"]').should('not.be.disabled').click();
    cy.get('[data-testid="dashboard-main"]').should('be.visible');
    tenant.password = tenantResetNewPassword;
    cy.logout();

    cy.loginAsAdmin();
    openTenantsPage();
    openTenantEditor(tenant);
    cy.get('@tenantEditFormPanel').within(() => {
      cy.get('[data-testid="tenant-password-reset-required-toggle"]')
        .find('input[type="checkbox"]')
        .should('not.be.checked');
    });
    cy.logout();
  });

  it('goes through tenant settings and disables profile visibility', () => {
    const phoneValue = `0300${Date.now().toString().slice(-7)}`;
    const countryValue = 'Pakistan';
    const cityValue = 'Karachi';

    cy.visit('/login');
    cy.get('[data-testid="login-user"]').type(tenant.username);
    cy.get('[data-testid="login-pass"]').type(tenant.password, {log: false});
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="dashboard-main"]').should('be.visible');

    cy.visit('/dashboard/profile/tenant-settings');
    cy.contains('h1', 'Tenant Data').should('be.visible');
    cy.contains('div', 'Profile').should('be.visible');
    cy.contains('div', 'Contacts').should('be.visible');
    cy.contains('div', 'Users').should('be.visible');
    cy.scrollDashboardToBottom()
    cy.contains('div', 'Privacy').should('be.visible');
    cy.contains('div', 'Address').should('be.visible');

    cy.contains('button', 'Edit').scrollIntoView().should('be.visible').click();
    cy.get('input[name="tenant_phone"]').scrollIntoView().should('be.visible').clear().type(phoneValue);
    cy.get('input[name="tenant_country"]').scrollIntoView().should('be.visible').clear().type(countryValue);
    cy.get('input[name="tenant_city"]').scrollIntoView().should('be.visible').clear().type(cityValue);

    cy.contains('label', 'Allow User Profile Visibility')
      .scrollIntoView()
      .parents('div.cursor-pointer')
      .first()
      .then(($toggle) => {
        if (($toggle.text() || '').includes('Users can manage their profile visibility')) {
          cy.wrap($toggle).click();
        }
      });

    cy.scrollDashboardToBottom()
    cy.contains('button', 'Save').scrollIntoView().should('be.visible').click();
    cy.reload();
    cy.scrollDashboardToBottom()

    cy.location('pathname').should('include', '/dashboard/profile/tenant-settings');
    cy.get('input[name="tenant_phone"]').should('have.value', phoneValue);
    cy.get('input[name="tenant_country"]').should('have.value', countryValue);
    cy.get('input[name="tenant_city"]').should('have.value', cityValue);
    cy.contains('label', 'Allow User Profile Visibility')
      .scrollIntoView()
      .parents('div.cursor-pointer')
      .first()
      .should('contain.text', 'User profile visibility is disabled for this tenant');
    cy.logout();
  });

  it('handles tenant alerts and notifications end-to-end', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-user"]').type(tenant.username);
    cy.get('[data-testid="login-pass"]').type(tenant.password, {log: false});
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="dashboard-main"]').should('be.visible');
    cy.get('[data-testid="sidebar-subitem-profile-homepage"]').filter(':visible').first().scrollIntoView().click();

    cy.get('app-alert-scan-loading', { timeout: 40000 }).should('not.exist');
    assertAlertScanCompletedMailPresent();
    cy.get('[data-testid="tenant-home-print-alerts"]').scrollIntoView().should('be.visible').click();
    exportFromModal('home-alert-export-modal', 'home-alert-export-option-report');

    cy.get('[data-testid="profile-notification-bell"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="tenant-notification-see-details"]').first().scrollIntoView().should('be.visible').click();
    exportFromModal('notification-alert-export-modal', 'notification-alert-export-option-report');
    closeNotificationSidebar();

    cy.get('[data-testid="tenant-home-alert-category-card"]').first().scrollIntoView().should('be.visible').click();
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
