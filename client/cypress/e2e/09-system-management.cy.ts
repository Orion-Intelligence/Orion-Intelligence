import {openSystemSettings} from './controllers/09-system-management.controller';

describe('System Settings - Admin Update Flow', () => {
  after(() => {
    cy.logout();
  });

  it('shows an error when auth dashboard icon exceeds 1 MB', () => {
    cy.loginAsAdmin();

    openSystemSettings();

    cy.intercept('PUT', '**/api/system/image?key=auth_dashboard_icon', {
      statusCode: 400,
      body: {detail: 'File too large! Maximum allowed size is 1 MB.'}
    }).as('uploadAuthDashboardIcon');

    cy.contains('div', 'Auth Dashboard Icon')
      .parent()
      .find('input[type="file"]')
      .selectFile({
        contents: Cypress.Buffer.alloc(1024 * 1024 + 1, 1),
        fileName: 'auth-dashboard-icon-too-large.png',
        mimeType: 'image/png',
        lastModified: Date.now()
      }, {force: true});

    cy.wait('@uploadAuthDashboardIcon');
    cy.contains('[role="alert"]', 'File too large! Maximum allowed size is 1 MB.')
      .should('be.visible');

    cy.logout();
  });

  it('updates app name from system settings and signs out', () => {
    cy.loginAsAdmin();

    openSystemSettings();

    cy.get('[data-testid="system-settings-edit"]').should('be.visible').click();
    cy.get('[data-testid="system-settings-app-name"]').should('be.visible').clear().type('Dark Intelligence');
    cy.get('input[placeholder="Data Sources"]').should('be.visible').clear().type('https://example.com/data-sources');
    cy.get('input[placeholder="Adversaries"]').should('be.visible').clear().type('https://example.com/adversaries');
    cy.get('input[placeholder="Pricing"]').should('be.visible').clear().type('https://example.com/pricing');
    cy.scrollDashboardToTop()
    cy.get('[data-testid="system-settings-save"]').should('be.visible').click();

    cy.logout();
  });

  it('updates network configuration fields from system settings', () => {
    cy.loginAsAdmin();

    openSystemSettings();

    cy.intercept('POST', '**/api/public/update').as('updateSystemSettings');

    cy.get('[data-testid="system-settings-edit"]').should('be.visible').click();
    cy.contains('div', 'Network Configuration').scrollIntoView().should('be.visible');

    cy.get('[data-testid="system-settings-account-mail"]')
      .scrollIntoView()
      .should('be.visible')
      .clear()
      .type('infra@example.com');
    cy.get('[data-testid="system-settings-account-mail-password"]')
      .scrollIntoView()
      .should('be.visible')
      .clear()
      .type('StrongPass123!');
    cy.get('[data-testid="system-settings-account-smtp-server"]')
      .scrollIntoView()
      .should('be.visible')
      .clear()
      .type('smtp.example.com');
    cy.get('[data-testid="system-settings-account-smtp-port"]')
      .scrollIntoView()
      .should('be.visible')
      .clear()
      .type('587');

    cy.scrollDashboardToTop();
    cy.get('[data-testid="system-settings-save"]').should('be.visible').click();

    cy.wait('@updateSystemSettings').then(({ request }) => {
      const metaInfo = JSON.parse(request.body.settings.meta_info);
      expect(metaInfo.ACCOUNTS_MAIL).to.eq('infra@example.com');
      expect(metaInfo.ACCOUNTS_MAIL_PASSWORD).to.eq('StrongPass123!');
      expect(metaInfo.ACCOUNTS_SMTP_SERVER).to.eq('smtp.example.com');
      expect(metaInfo.ACCOUNTS_SMTP_PORT).to.eq('587');
    });

    cy.logout();
  });
});
