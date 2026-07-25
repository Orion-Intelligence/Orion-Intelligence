import {ensureSystemSettingsEditing, fillSystemMailConfiguration, openSystemSettings, openTenantBrandingSettings} from './controllers/09-system-management.controller';
import {
  createTenantAccount,
  openTenantEditor,
  openTenantsPage,
  saveTenantEditor,
  setTenantEditorToggle,
} from './controllers/10-tenant-management.controller';
import {TEST_DATA} from '../support/constants';

const WHITE_LABEL_TENANT = {
  username: 'wltenant1',
  email: 'wltenant1@whitelabelorion.org',
  password: '1qaz!QAZ',
  companyName: 'White Label Orion',
  slug: 'whitelabelorion',
};

function tenantUrl(path: string): string {
  const baseUrl = new URL(Cypress.config('baseUrl') || 'http://localhost:4200');
  return `${baseUrl.protocol}//${WHITE_LABEL_TENANT.slug}.localhost:${baseUrl.port || '4200'}${path}`;
}

describe('System Settings - Admin Update Flow', () => {
  const alertSlackClientId = TEST_DATA.alert_slack_client_id;

  after(() => {
    cy.logout();
  });

  it('shows an error when auth dashboard icon exceeds 1 MB', () => {
    cy.loginAsAdmin();

    openSystemSettings();
    openTenantBrandingSettings();

    cy.intercept('PUT', '**/api/system/image?key=auth_dashboard_icon', {
      statusCode: 400,
      body: {detail: 'File too large! Maximum allowed size is 1 MB.'}
    }).as('uploadAuthDashboardIcon');

    cy.contains('div', 'Login Image')
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

  it('enforces tenant white-label URL login isolation', () => {
    createTenantAccount(WHITE_LABEL_TENANT);

    cy.loginAsAdmin();
    openTenantsPage();
    openTenantEditor(WHITE_LABEL_TENANT);
    setTenantEditorToggle('tenant-verified-toggle', true);
    setTenantEditorToggle('tenant-status-toggle', true);
    setTenantEditorToggle('tenant-password-reset-required-toggle', false);
    saveTenantEditor('saveWhiteLabelTenant');
    cy.logout();

    cy.intercept('POST', '**/api/token').as('mainDomainTenantLogin');
    cy.visit('/login');
    cy.get('[data-testid="login-user"]').should('be.visible').clear().type(WHITE_LABEL_TENANT.username);
    cy.get('[data-testid="login-pass"]').should('be.visible').clear().type(WHITE_LABEL_TENANT.password, {log: false});
    cy.get('[data-testid="login-button"]').should('be.visible').click();
    cy.wait('@mainDomainTenantLogin', {timeout: 60000})
      .its('response.statusCode')
      .should('be.oneOf', [401, 403]);

    const subdomainOrigin = new URL(tenantUrl('/login')).origin;
    cy.intercept('POST', '**/api/token').as('tenantSubdomainLogin');
    cy.visit(tenantUrl('/login'));
    cy.origin(subdomainOrigin, {args: WHITE_LABEL_TENANT}, (tenant) => {
      cy.contains('Sign Up').should('not.exist');
      cy.get('[data-testid="login-user"]').should('be.visible').clear().type(tenant.username);
      cy.get('[data-testid="login-pass"]').should('be.visible').clear().type(tenant.password, {log: false});
      cy.get('[data-testid="login-button"]').should('be.visible').click();
      cy.get('[data-testid="dashboard-main"], [data-testid="tenant-company-input"]')
        .filter(':visible')
        .should('have.length.greaterThan', 0);
      cy.clearCookies({log: false});
      cy.clearLocalStorage({log: false});
    });
    cy.wait('@tenantSubdomainLogin', {timeout: 60000})
      .its('response.statusCode')
      .should('be.oneOf', [200, 201]);

    cy.visit(tenantUrl('/signup'));
    cy.origin(subdomainOrigin, () => {
      cy.location('pathname').should('eq', '/login');
    });
  });

  it('configures only Slack alert integration from system settings', () => {
    cy.loginAsAdmin();

    cy.intercept('GET', '**/api/alert-connectors/settings', {
      statusCode: 200,
      body: {
        app: {
          slack_client_id: '',
          slack_configured: false,
          jira_client_id: '',
          jira_configured: false
        },
        tenant: {
          slack_connected: false,
          slack_channel: '',
          slack_team: '',
          jira_connected: false,
          jira_site_url: '',
          jira_site_name: ''
        }
      }
    }).as('loadAlertConnectors');

    cy.intercept('POST', '**/api/alert-connectors/settings', {
      statusCode: 200,
      body: {
        app: {
          slack_client_id: alertSlackClientId,
          slack_configured: true,
          jira_client_id: '',
          jira_configured: false
        },
        tenant: {
          slack_connected: false,
          slack_channel: '',
          slack_team: '',
          jira_connected: false,
          jira_site_url: '',
          jira_site_name: ''
        }
      }
    }).as('saveAlertConnectors');

    openSystemSettings();
    cy.get('[data-testid="tenant-settings-connect-slack"]').should('not.exist');
    cy.get('[data-testid="tenant-settings-connect-jira"]').should('not.exist');

    cy.get('[data-testid="system-settings-alert-integrations-edit"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="system-settings-slack-client-id"]').should('be.visible').clear().type(alertSlackClientId);
    cy.get('[data-testid="system-settings-slack-client-secret"]').should('be.visible').clear().type('slack-secret-for-cypress', {log: false});
    cy.docsScreenshot('alert-integrations-system-slack-config');
    cy.get('[data-testid="system-settings-alert-integrations-save"]').should('be.visible').click();

    cy.wait('@saveAlertConnectors').then(({request}) => {
      expect(request.body.slack_client_id).to.eq(alertSlackClientId);
      expect(request.body.slack_client_secret).to.eq('slack-secret-for-cypress');
      expect(request.body.jira_client_id).to.eq('');
      expect(request.body.jira_client_secret).to.eq('');
    });

    cy.logout();
  });
});
