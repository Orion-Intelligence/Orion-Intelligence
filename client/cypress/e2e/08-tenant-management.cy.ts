import {addIOCForAllTabs, approveAllTenants, openManageIOCs, openTenantsPage, waitForBlockingOverlayToClose} from './controllers/08-tenant-management.controller';

describe('Tenant Complete Flow – Correct Order', () => {

  after(() => {
    cy.logout();
  });
  const tenant = Cypress.env('TENANT_ACCOUNT');
  const tenantSubUser = Cypress.env('TENANT_SUB_USER');
  if (!tenant?.username || !tenant?.email || !tenant?.password || !tenantSubUser?.username || !tenantSubUser?.email || !tenantSubUser?.password) {
    throw new Error('Missing TENANT_ACCOUNT or TENANT_SUB_USER in cypress.config.ts');
  }

  it('Tenant signs up', () => {
    cy.clearAllEmails()
    cy.visit('/login');
    cy.contains('Sign Up').click();
    cy.get('input[name="username"]').type(tenant.username);
    cy.get('input[name="companymail"]').type(tenant.email);
    cy.get('input[name="password"]').type(tenant.password);
    cy.contains('input[type="submit"]', 'Sign Up').should('be.visible').click();
    cy.get('img[alt="Tick"]').should('exist');
    cy.contains('Go to login').click();

    cy.openLastMailAndGetUrl().then(url => {
      cy.visit(url);
    });
  });

  it('Admin verifies all tenants and assigns Enterprise license', () => {
  cy.loginAsAdmin();
  openTenantsPage();
  cy.contains("Not Verified", {timeout: 10000}).should("exist");
  cy.contains('h1.ui-page-title', 'Tenants').should('be.visible');
  cy.get('tbody tr').its('length').should('be.gte', 1);
  const state = {verifiedCount: 0};
  approveAllTenants(state);

  cy.then(() => {
    expect(state.verifiedCount).to.be.greaterThan(0);
  });
  openTenantsPage();
  cy.logout();
});
it('Tenant adds user, IOCs, scans and logs out', () => {
  cy.visit('/login');
  cy.reload();
  cy.get('input[name="username"]').type(tenant.username);
  cy.get('input[name="password"]').type(tenant.password, {log: false});
  cy.contains('Sign In').click();
  cy.get('input#company[placeholder="Enter company name"]').should('be.visible').clear().type('orion intelligence');
  cy.contains('button', 'Next').should('be.visible').click();
  cy.contains('button', 'Skip').should('be.visible').click();
  cy.contains('button', 'Confirm').should('be.visible').click();
  openManageIOCs();
  addIOCForAllTabs();
  cy.contains('Users').click();
  waitForBlockingOverlayToClose();
  cy.contains('button', 'Add User').scrollIntoView().should('be.visible').click();
  cy.get('input[name="username"]').type(tenantSubUser.username);
  cy.get('input[name="email"]').type(tenantSubUser.email);
  cy.get('input[name="password"]').type(tenantSubUser.password, {log: false});

  cy.get('div.fixed.inset-0.z-\\[9999\\]:visible', {timeout: 15000}).first().within(() => {
      cy.contains('button.ui-popup-btn-primary', 'Add User', {timeout: 15000}).scrollIntoView().should('not.be.disabled').should('be.visible').click();
    });
  cy.logout();
  cy.url().should('include', '/login');
});

  it('Admin logs in again and sets quota to 1', () => {
    cy.loginAsAdmin();
    cy.visit('/dashboard/profile/homepage');
    openTenantsPage();
    cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/profile/tenant');
    cy.contains('table tbody tr', /orion\s*intelligence/i, {timeout: 30000}).as('tenantRow');
    cy.get('@tenantRow').scrollIntoView().parents('div').filter((_, el) => el.scrollWidth > el.clientWidth).first().scrollTo('right', {ensureScrollable: false});
    cy.get('@tenantRow').find('button#edit-tenant').scrollIntoView().should('be.visible').click();
    cy.contains('label', 'User Quota').parent().find('input[type="number"]').clear().type('1');
    cy.contains('Save changes').click();
    cy.logout();
  });

  it('Tenant logs in again and sees homepage / paywall behavior', () => {
    cy.visit('/login');
    cy.get('input[name="username"]').type(tenant.username);
    cy.get('input[name="password"]').type(tenant.password, {log: false});
    cy.contains('Sign In').click();
    cy.get('[data-cy="dashboard-main"], [data-cy="dashboard-container"], .dashboard_container').should('be.visible');
    cy.contains('app-dashboard-sidebar-items div', 'Homepage').click();
    cy.contains('app-dashboard-sidebar-items div', 'Homepage', {timeout: 20000}).scrollIntoView().should('be.visible').click();
    cy.location('pathname', {timeout: 20000}).should('include', '/dashboard/profile/homepage');
  });
});
