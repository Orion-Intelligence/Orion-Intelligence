import {ensureSystemSettingsEditing, fillSystemMailConfiguration, openSystemSettings} from './controllers/09-system-management.controller';

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

    cy.contains('[role="alert"]', 'File too large! Maximum allowed size is 1 MB.')
      .should('be.visible');

    cy.logout();
  });

  it('updates app name from system settings and signs out', () => {
    cy.loginAsAdmin();

    openSystemSettings();

    cy.get('[data-testid="system-settings-edit"], [data-testid="system-settings-app-name"]').should('be.visible');
    cy.docsScreenshot('system-settings');
    cy.get('[data-testid="system-settings-edit"]').should('be.visible').click();
    cy.get('[data-testid="system-settings-app-name"]').should('be.visible').clear().type('Dark Intelligence');
    cy.get('input[placeholder="Data Sources"]').should('be.visible').clear().type('https://example.com/data-sources');
    cy.get('input[placeholder="Adversaries"]').should('be.visible').clear().type('https://example.com/adversaries');
    cy.get('input[placeholder="Pricing"]').should('be.visible').clear().type('https://example.com/pricing');
    cy.scrollDashboardToTop()
    cy.get('[data-testid="system-settings-save"]').should('be.visible').click();

    cy.logout();
  });

  it('shows log manager filters and entries', () => {
    cy.loginAsAdmin();

    cy.intercept('GET', '**/api/profile/system-logs*', {
      statusCode: 200,
      body: {
        entries: [
          {
            id: 'log-entry-1',
            date: '2026-07-12',
            file: 'orion.log',
            line: 42,
            type: 'INFO',
            timestamp: '2026-07-12 09:15:00',
            message: 'Scheduled scan completed for monitored indicators.',
            caller: 'scan.scheduler',
            raw: '2026-07-12 09:15:00 INFO scan.scheduler Scheduled scan completed for monitored indicators.'
          },
          {
            id: 'log-entry-2',
            date: '2026-07-12',
            file: 'orion.log',
            line: 77,
            type: 'ERROR',
            timestamp: '2026-07-12 09:18:33',
            message: 'Webhook delivery failed after retries.',
            caller: 'notification.dispatcher',
            raw: '2026-07-12 09:18:33 ERROR notification.dispatcher Webhook delivery failed after retries.'
          }
        ],
        total: 2,
        page: 1,
        limit: 100,
        page_count: 1,
        available_dates: ['2026-07-12'],
        files: [
          {
            date: '2026-07-12',
            file: 'orion.log',
            size: 2048,
            modified_at: '2026-07-12T09:19:00Z'
          }
        ],
        generated_at: '2026-07-12T09:20:00Z',
        log_roots: ['/var/log/orion']
      }
    }).as('systemLogs');

    cy.visit('/dashboard/profile/log-manager');
    cy.wait('@systemLogs');
    cy.contains('h1', 'Log Manager').should('be.visible');
    cy.get('[data-testid="log-manager-type-filter"]').should('be.visible');
    cy.get('[data-testid="log-manager-date-filter"]').should('be.visible');
    cy.contains('td', 'Scheduled scan completed for monitored indicators.').should('be.visible');
    cy.contains('td', 'Webhook delivery failed after retries.').should('be.visible');
    cy.docsScreenshot('log-manager');

    cy.logout();
  });

  it('updates network configuration fields from system settings', () => {
    cy.loginAsAdmin();

    openSystemSettings();

    cy.get('[data-testid="system-settings-mail-edit"]').should('be.visible').click();
    cy.contains('div', 'Network Configuration').scrollIntoView().should('be.visible');
    fillSystemMailConfiguration('localhost', '1');

    cy.intercept('POST', '**/api/public/update').as('updateWrongSystemSettings');
    cy.scrollDashboardToTop();
    cy.get('[data-testid="system-settings-mail-save"]').should('be.visible').click();
    cy.wait('@updateWrongSystemSettings', {timeout: 60000})
      .its('response.statusCode')
      .should('eq', 424);
    cy.contains('app-smtp-settings-block', 'Mail configuration is not working').should('be.visible');

    ensureSystemSettingsEditing();
    fillSystemMailConfiguration('mailpit', '1025');

    cy.intercept('POST', '**/api/public/update').as('updateSystemSettings');
    cy.scrollDashboardToTop();
    cy.get('[data-testid="system-settings-mail-save"]').should('be.visible').click();

    cy.wait('@updateSystemSettings', {timeout: 60000}).then(({ request, response }) => {
      expect(response?.statusCode).to.be.oneOf([200, 201]);
      const metaInfo = JSON.parse(request.body.settings.meta_info);
      expect(metaInfo.ACCOUNTS_MAIL).to.eq('cypress-mailer@example.test');
      expect(metaInfo.ACCOUNTS_MAIL_PASSWORD).to.eq('1#VSC&cuad)d');
      expect(metaInfo.ACCOUNTS_SMTP_SERVER).to.eq('mailpit');
      expect(metaInfo.ACCOUNTS_SMTP_PORT).to.eq('1025');
    });

    cy.contains('app-smtp-settings-block button', 'Verify Configuration').scrollIntoView().should('be.visible').click();
    cy.contains('app-smtp-settings-block', 'Mail configuration is working', {timeout: 60000}).should('be.visible');

    cy.logout();
  });
});
