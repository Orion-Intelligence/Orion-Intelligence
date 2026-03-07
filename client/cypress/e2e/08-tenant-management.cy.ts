import {addIOCForAllTabs, approveAllTenants, openManageIOCs, openTenantsPage, waitForBlockingOverlayToClose} from './controllers/08-tenant-management.controller';

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

    cy.then(() => {
      expect(state.verifiedCount).to.be.greaterThan(0);
    });

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
    cy.visit('/dashboard/profile/homepage');
    openTenantsPage();
    cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/profile/tenant');
    cy.get('[data-testid="tenant-edit-button"]', {timeout: 30000}).first().scrollIntoView().then(($btn) => {
      if (Cypress.dom.isVisible($btn)) {
        cy.wrap($btn).click();
      } else {
        cy.wrap($btn).click({force: true});
      }
    });
    cy.get('[data-testid="tenant-user-quota-input"]', {timeout: 30000}).first().scrollIntoView().then(($input) => {
      if (Cypress.dom.isVisible($input)) {
        cy.wrap($input).clear().type('1');
      } else {
        cy.wrap($input).clear({force: true}).type('1', {force: true});
      }
    });
    cy.get('[data-testid="tenant-save-changes"]', {timeout: 30000}).first().scrollIntoView().then(($btn) => {
      if (Cypress.dom.isVisible($btn)) {
        cy.wrap($btn).click();
      } else {
        cy.wrap($btn).click({force: true});
      }
    });
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
});
