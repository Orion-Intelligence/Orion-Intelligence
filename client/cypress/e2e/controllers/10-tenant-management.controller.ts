export const ALERT_SCANNER_CATEGORIES = [
  'general',
  'defacement',
  'breach',
  'exploit',
  'social',
  'discussion',
  'stealerlogs',
  'feed',
  'advanced scanning',
  'playstore-scanning',
  'social-scanner',
  'email-breach',
  'software-scanning',
  'vulnerability-scanning',
  'repo scanning',
  'seo scanning',
] as const;

const GENERAL_ALERT_DOMAIN_IOC = 'bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion';
const HOME_ALERT_CARD_SELECTOR = '[data-testid="tenant-home-alert-category-card"]';

type AlertScannerCategory = typeof ALERT_SCANNER_CATEGORIES[number];

export interface CaseAlertTenant {
  username: string;
  email: string;
  password: string;
  companyName: string;
  slug: string;
}

function setConfiguredViewport() {
  cy.viewport(
    Number(Cypress.config('viewportWidth')) || 1920,
    Number(Cypress.config('viewportHeight')) || 1080
  );
}

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

function tenantLoginUrl(slug: string): string {
  const url = new URL(Cypress.config('baseUrl') || 'http://localhost:4200');
  url.hostname = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    ? `${slug}.localhost`
    : `${slug}.${url.hostname}`;
  url.pathname = '/login';
  return url.toString();
}

export function submitLogin(username: string, password: string, tenant?: {slug: string}) {
  cy.intercept({ method: 'POST', pathname: '**/api/token' }).as('loginRequest');
  if (tenant) {
    const loginUrl = tenantLoginUrl(tenant.slug);
    cy.clearCookies({log: false});
    cy.clearLocalStorage();
    cy.visit(loginUrl);
    cy.location('hostname').should('eq', new URL(loginUrl).hostname);
  } else {
    cy.visitLoginWithCleanAuthState();
  }
  cy.get('[data-testid="login-user"]').should('be.visible').clear().type(username);
  cy.get('[data-testid="login-pass"]').should('be.visible').clear().type(password, {log: false});
  cy.get('[data-testid="login-button"]').first().should('be.visible').click();
  cy.waitForLoginRequest();
}

export function loginTenant(tenant: any) {
  submitLogin(tenant.username, tenant.password, tenant);
  cy.get('[data-testid="dashboard-main"]').should('be.visible');
}

export function createTenantAccount(tenant: CaseAlertTenant) {
  cy.clearAllEmails();
  cy.visit('/signup');
  cy.get('[data-testid="signup-username"]').should('be.visible').clear().type(tenant.username);
  cy.get('[data-testid="signup-companymail"]').should('be.visible').clear().type(tenant.email);
  cy.get('[data-testid="signup-password"]').should('be.visible').clear().type(tenant.password, {log: false});
  cy.get('[data-testid="signup-submit"]').should('be.visible').and('not.be.disabled').click();
  cy.get('[data-testid="welcome-tick"]').should('exist');

  cy.openLastMailAndGetUrl().then((url) => {
    cy.visit(url);
  });
}

export function completeTenantOnboardingIfNeeded(tenant: CaseAlertTenant) {
  cy.get('body').then(($body) => {
    if (!$body.find('[data-testid="tenant-company-input"]').length) {
      return;
    }

    cy.get('[data-testid="tenant-company-input"]').should('be.visible').clear().type(tenant.companyName);
    cy.get('[data-testid="tenant-onboarding-next-step1"]').should('be.visible').click();
    cy.get('[data-testid="tenant-onboarding-next-step2"]').should('be.visible').click();
    cy.get('[data-testid="tenant-onboarding-confirm"]').should('be.visible').click();
  });
}

export function setCurrentTenantAlertVisibility(tenant: CaseAlertTenant, visible: boolean) {
  cy.location('origin').then((origin) => {
    cy.visit(`${origin}/dashboard/profile/tenant-settings`);
  });
  cy.contains('h1', 'Tenant Data').should('be.visible');
  cy.scrollDashboardToBottom();
  cy.contains('label', 'Allow Admin Alert Visibility')
    .scrollIntoView()
    .closest('div.rounded-lg')
    .then(($toggle) => {
      const isVisible = ($toggle.text() || '').includes('Tenant alerts are visible to admin');
      if (isVisible !== visible) {
        cy.wrap($toggle).click({force: true});
      }

      if (isVisible !== visible) {
        cy.intercept('POST', '**/api/update/tenants').as(`saveAlertVisibility${tenant.username}`);
        cy.get('[data-testid="tenant-privacy-save"]').scrollIntoView().should('be.visible').click({force: true});
        cy.wait(`@saveAlertVisibility${tenant.username}`, {timeout: 60000})
          .its('response.statusCode')
          .should('be.oneOf', [200, 201]);
      }
    });
}

export function setTenantAlertVisibility(tenant: CaseAlertTenant, visible: boolean) {
  runCaseAlertTenantSession(tenant, visible, false);
}

export function loginCaseAlertUser(username: string, password: string) {
  submitLogin(username, password);
  cy.get('[data-testid="dashboard-main"], [data-testid="dashboard-container"]', {timeout: 60000})
    .filter(':visible')
    .should('have.length.greaterThan', 0);
}

export function onboardTenantForCaseAlerts(tenant: CaseAlertTenant) {
  runCaseAlertTenantSession(tenant, true, true);
}

function runCaseAlertTenantSession(tenant: CaseAlertTenant, visible: boolean, onboard: boolean) {
  const loginUrl = tenantLoginUrl(tenant.slug);
  const origin = new URL(loginUrl).origin;

  cy.clearCookies({domain: new URL(loginUrl).hostname, log: false});
  cy.origin(origin, {args: {tenant, visible, onboard}}, ({tenant, visible, onboard}) => {
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.sessionStorage.clear();
      },
    });
    cy.get('[data-testid="login-user"]').should('be.visible').clear().type(tenant.username);
    cy.get('[data-testid="login-pass"]').should('be.visible').clear().type(tenant.password, {log: false});
    cy.get('[data-testid="login-button"]').first().should('be.visible').click();
    cy.get('[data-testid="dashboard-main"], [data-testid="tenant-company-input"]', {timeout: 60000})
      .filter(':visible')
      .should('have.length.greaterThan', 0);

    if (onboard) {
      cy.get('body').then(($body) => {
        if (!$body.find('[data-testid="tenant-company-input"]').length) {
          return;
        }

        cy.get('[data-testid="tenant-company-input"]').should('be.visible').clear().type(tenant.companyName);
        cy.get('[data-testid="tenant-onboarding-next-step1"]').should('be.visible').click();
        cy.get('[data-testid="tenant-onboarding-next-step2"]').should('be.visible').click();
        cy.get('[data-testid="tenant-onboarding-confirm"]').should('be.visible').click();
      });
      cy.get('[data-testid="dashboard-main"]').should('be.visible');
    }

    cy.visit('/dashboard/profile/tenant-settings');
    cy.contains('h1', 'Tenant Data').should('be.visible');
    cy.contains('label', 'Allow Admin Alert Visibility')
      .scrollIntoView()
      .closest('div.rounded-lg')
      .then(($toggle) => {
        const isVisible = ($toggle.text() || '').includes('Tenant alerts are visible to admin');
        if (isVisible !== visible) {
          cy.wrap($toggle).click({force: true});
          cy.get('[data-testid="tenant-privacy-save"]').scrollIntoView().should('be.visible').click({force: true});
        }
      });
    cy.get('[data-testid="tenant-privacy-save"]', {timeout: 60000}).should('be.disabled');

    cy.get('[data-testid="profile-menu"]').filter(':visible').first().scrollIntoView().click({force: true});
    cy.get('[data-testid="signout-btn"]').first().scrollIntoView().click({force: true});
  });
  cy.visit(new URL('/login', Cypress.config('baseUrl') || 'http://localhost:4200').toString());
}

export function deleteTenant(tenant: any) {
  cy.intercept('DELETE', '**/api/tenants/*').as('deleteTenant');
  cy.contains('tbody tr[data-testid="tenant-row"]', tenant.email)
    .scrollIntoView()
    .should('be.visible')
    .as('tenantRow')
    .click();
  cy.get('@tenantRow').next().find('[data-testid="tenant-delete-button"]').click({force: true});
  cy.contains('Are you sure you want to delete this tenant and its associated users and keys?').should('be.visible');
  cy.get('[data-testid="confirmation-yes-button"]').click();
  cy.wait('@deleteTenant').its('response.statusCode').should('eq', 200);
  cy.contains('tbody tr', tenant.email).should('not.exist');
}

export function openTenantEditor(tenant: any) {
  cy.contains('tbody tr[data-testid="tenant-row"]', tenant.email)
    .scrollIntoView()
    .should('be.visible')
    .as('tenantRow');
  cy.get('@tenantRow').click({force: true});
  cy.get('@tenantRow')
    .next()
    .as('tenantEditor')
    .find('[data-testid="tenant-edit-form-panel"]')
    .first()
    .should('exist')
    .as('tenantEditFormPanel');
}

export function setTenantEditorToggle(testId: string, checked: boolean) {
  cy.get('@tenantEditFormPanel').within(() => {
    cy.get(`[data-testid="${testId}"]`)
      .scrollIntoView()
      .find('input[type="checkbox"]')
      .then(($checkbox) => {
        if ($checkbox.is(':checked') !== checked) {
          cy.wrap($checkbox).click({force: true});
        }
      });
  });
}

function setTenantLicenseSelection(license: string, checked: boolean, changedAlias?: string) {
  const triggerSelector = 'button[aria-controls^="tenant-license-menu-"]';
  cy.get('@tenantEditFormPanel')
    .find(triggerSelector)
    .first()
    .scrollIntoView()
    .should('be.visible')
    .then(($trigger) => {
      const menuId = $trigger.attr('aria-controls');
      expect(menuId, 'tenant license menu id').to.exist;
      cy.wrap($trigger).click({force: true});
      cy.wrap($trigger).should('have.attr', 'aria-expanded', 'true');

      cy.get(`#${menuId} [data-testid="tenant-license-${license}"]`, {timeout: 10000})
        .should('exist')
        .then(($option) => {
          const isSelected = $option.attr('aria-selected') === 'true';
          if (isSelected !== checked) {
            cy.wrap($option).click({force: true});
            if (changedAlias) {
              cy.wrap(true).as(changedAlias);
            }
          }
        })
        .then(() => {
          cy.wrap($trigger).click({force: true});
        });
    });
}

export function setTenantLicense(license: string, checked: boolean) {
  setTenantLicenseSelection(license, checked);
}

export function setTenantLicenses(licenses: string[]) {
  const selected = new Set(licenses);
  ['free', 'osint_basic', 'osint_advanced', 'social_mapper', 'pentester', 'enterprise'].forEach((license) => {
    setTenantLicenseSelection(license, selected.has(license));
  });
}

export function saveTenantEditor(alias: string) {
  cy.intercept('POST', '**/api/update/tenants', (req) => {
    if (req.body && typeof req.body === 'object') {
      delete req.body.accounts_mail_password;
      delete req.body.accounts_mail;
      delete req.body.accounts_smtp_server;
      delete req.body.accounts_smtp_port;
    }
  }).as(alias);
  cy.scrollDashboardToBottom()
  cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block')
    .filter(':visible')
    .first()
    .scrollTo('bottomRight', {ensureScrollable: false});

  cy.get('@tenantEditFormPanel')
    .find('[data-testid="tenant-save-changes"]')
    .should('be.visible')
    .and('not.be.disabled')
    .click();
  cy.wait(`@${alias}`, {timeout: 60000})
    .its('response.statusCode')
    .should('be.oneOf', [200, 201]);
  cy.scrollDashboardToBottom()
}

export function openTenantSettings() {
  cy.get('body').then(($body) => {
    if (!$body.find('[data-testid="sidebar-subitem-profile-tenant-settings"]:visible').length) {
      cy.get('[data-testid="sidebar-group-profile"]').filter(':visible').first().scrollIntoView().click();
    }
  });
  cy.get('[data-testid="sidebar-subitem-profile-tenant-settings"]')
    .filter(':visible')
    .first()
    .scrollIntoView()
    .click();
  cy.location('pathname').should('include', '/dashboard/profile/tenant-settings');
  cy.contains('h1', 'Tenant Data').should('be.visible');
}

export function fillTenantNetworkConfiguration(server: string, port: string) {
  cy.contains('app-smtp-settings-block', 'Network Configuration')
    .scrollIntoView()
    .should('be.visible')
    .within(() => {
      cy.contains('label', /^\s*ACCOUNT MAIL\s*$/)
        .parent()
        .find('input')
        .clear()
        .type('tenant-mailer@example.test');
      cy.contains('label', /^\s*ACCOUNT MAIL PASSWORD\s*$/)
        .parent()
        .find('input')
        .clear()
        .type('1#VSC&cuad)d', {log: false});
      cy.contains('label', /^\s*ACCOUNT SMTP SERVER\s*$/)
        .parent()
        .find('input')
        .clear()
        .type(server);
      cy.contains('label', /^\s*ACCOUNT SMTP PORT\s*$/)
        .parent()
        .find('input')
        .clear()
        .type(port);
    });
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
    expect($body.find('[data-testid="side-filter-overlay"]:visible').length).to.eq(0);
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
    cy.wrap(rows.eq(0)).should('be.visible').click();
    cy.wrap(false).as('changed');
    cy.get('[data-testid="tenant-edit-panel"]').filter(':visible').first().as('tenantEditPanel').should('be.visible');

    cy.get('[data-testid="tenant-edit-form-panel"]')
      .filter(':visible')
      .first()
      .within(() => {
        cy.get('[data-testid="tenant-verified-toggle"] input[type="checkbox"]')
          .should('exist')
          .then(($checkbox) => {
            if (!$checkbox.prop('checked')) {
              cy.wrap($checkbox).check({force: true});
              cy.wrap(true).as('changed');
            }
          });

        cy.get('[data-testid="tenant-status-toggle"] input[type="checkbox"]')
          .should('exist')
          .then(($checkbox) => {
            if (!$checkbox.prop('checked')) {
              cy.wrap($checkbox).check({force: true});
              cy.wrap(true).as('changed');
            }
          });
      });

    cy.get('#dashboard-container, [data-testid="dashboard-container"]')
      .filter(':visible')
      .first()
      .scrollTo('bottom', {ensureScrollable: false});
    cy.get('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block')
      .filter(':visible')
      .first()
      .scrollTo('bottomRight', {ensureScrollable: false});

    cy.get('[data-testid="tenant-edit-form-panel"]')
      .filter(':visible')
      .first()
      .as('tenantEditFormPanel');
    setTenantLicenseSelection('enterprise', true, 'changed');

    cy.get('@changed').then((changed: any) => {
      if (changed) {
        cy.get('[data-testid="tenant-edit-form-panel"]')
          .filter(':visible')
          .first()
          .then(($panel) => {
            const panel = $panel.get(0) as HTMLElement;
            const dashboard = Cypress.$('#dashboard-container, [data-testid="dashboard-container"]')
              .filter(':visible')
              .first()
              .get(0) as HTMLElement | undefined;
            const parentScroller = panel.closest('div.relative.hidden.overflow-x-auto.overflow-y-visible.md\\:block') as HTMLElement | null;

            if (dashboard) {
              dashboard.scrollTop = dashboard.scrollHeight;
              dashboard.dispatchEvent(new Event('scroll', {bubbles: true}));
            }
            if (parentScroller) {
              parentScroller.scrollTop = parentScroller.scrollHeight;
              parentScroller.scrollLeft = parentScroller.scrollWidth;
              parentScroller.dispatchEvent(new Event('scroll', {bubbles: true}));
            }
          })
          .find('[data-testid="tenant-save-changes"]')
          .should('exist')
          .and('not.be.disabled')
          .click({force: true});
      }
    });
    openTenantsPage();

    cy.get('body').then($b => {
      if ($b.find('[data-testid="tenant-verification-status"]:contains("Not Verified")').length) {
        approveAllTenants(state, tries + 1);
      }
    });
  });
}

export function openTenantsPage() {
  setConfiguredViewport();
  cy.get('[data-testid="sidebar-subitem-profile-tenant"]').filter(':visible').first().scrollIntoView().click();
  cy.location('pathname').then((path) => {
    if (!path.includes('/dashboard/profile/tenant')) {
      cy.visit('/dashboard/profile/tenant');
    }
  });
  cy.location('pathname').should('include', '/dashboard/profile/tenant');
}

export function openAuditLogPage() {
  setConfiguredViewport();
  cy.visit('/dashboard/profile/auditlog');
  cy.location('pathname').should('include', '/dashboard/profile/auditlog');
  cy.get('[data-testid="auditlog-page-title"]').should('contain.text', 'Audit Logs');
}

export function openAuditLogFilter() {
  cy.get('app-auditlog #top').scrollIntoView();
  cy.get('[data-testid="auditlog-filter-open"]').scrollIntoView().should('be.visible').click();
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
  // cy.get('[data-testid="side-filter-date-day-11"]').filter(':visible').first().scrollIntoView().click();
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

export function openTenantHomepage() {
  cy.get('[data-testid="sidebar-subitem-profile-homepage"]').filter(':visible').first().scrollIntoView().click();
  cy.location('pathname').should('include', '/dashboard/profile/homepage');
}

export function ensureGeneralAlertIoc() {
  cy.intercept('POST', '**/api/get/tenant').as('loadGeneralAlertIocs');
  openManageIOCs();
  cy.wait('@loadGeneralAlertIocs', {timeout: 60000})
    .its('response.statusCode')
    .should('be.oneOf', [200, 201]);
  cy.contains('[data-testid^="tenant-ioc-tab-"]', 'Domains', {timeout: 30000})
    .scrollIntoView()
    .should('be.visible')
    .click();
  cy.get('[data-testid="tenant-ioc-value-input"]')
    .should('be.visible')
    .and('not.be.disabled');
  cy.get('body').then(($body) => {
    if ($body.text().includes(GENERAL_ALERT_DOMAIN_IOC)) {
      return;
    }

    cy.intercept('POST', '**/api/update/tenants').as('saveGeneralAlertIoc');
    cy.get('[data-testid="tenant-ioc-value-input"]')
      .clear()
      .type(GENERAL_ALERT_DOMAIN_IOC);
    cy.get('[data-testid="tenant-ioc-add-button"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    cy.wait('@saveGeneralAlertIoc', {timeout: 60000})
      .its('response.statusCode')
      .should('be.oneOf', [200, 201]);
    cy.contains(GENERAL_ALERT_DOMAIN_IOC).should('be.visible');
  });
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
  cy.clearAllEmails();
  cy.get('[data-testid="tenant-home-scan-all"]').scrollIntoView().should('be.visible').and('not.be.disabled').click();
}

function getAlertScannerRow(category: AlertScannerCategory): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.contains('div', `Scanner key: ${category}`, {timeout: 30000})
    .should('be.visible')
    .then(($label) => {
      const row = $label.parents().toArray().find((element) => {
        const $element = Cypress.$(element);
        return $element.text().includes(`Scanner key: ${category}`) && $element.find('input[type="checkbox"]').length > 0;
      });
      expect(row, `scanner row ${category}`).to.exist;
      return cy.wrap(row as HTMLElement);
    });
}

export function openAlertScannerSettings() {
  cy.get('[data-testid="tenant-home-alert-scanner-settings"]')
    .scrollIntoView()
    .should('be.visible')
    .click({force: true});
  cy.location('pathname').should('include', '/dashboard/profile/alert-scanners');
  cy.contains('h1', 'Alert Scanners').should('be.visible');
}

export function setOnlyGeneralAlertScanner() {
  ALERT_SCANNER_CATEGORIES.forEach((category) => {
    const shouldEnable = category === 'general';
    const alias = `saveAlertScanner${category.replace(/[^a-z0-9]/gi, '')}`;

    getAlertScannerRow(category).then(($row) => {
      const isChecked = $row.find('input[type="checkbox"]').prop('checked') === true;
      if (isChecked === shouldEnable) {
        return;
      }

      cy.intercept('POST', '**/api/update/tenants').as(alias);
      cy.wrap($row).scrollIntoView().click({force: true});
      cy.wait(`@${alias}`, {timeout: 60000})
        .its('response.statusCode')
        .should('be.oneOf', [200, 201]);
      getAlertScannerRow(category)
        .find('input[type="checkbox"]')
        .should(shouldEnable ? 'be.checked' : 'not.be.checked');
    });
  });
}

export function flushTenantAlertsIfPresent() {
  cy.location('origin').then((origin) => {
    cy.request({
      method: 'POST',
      url: `${origin}/api/profile/alerts/delete/all`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, 'flush tenant alerts').to.be.oneOf([200, 201, 400]);
    });

    const startedAt = Date.now();
    const poll = (): Cypress.Chainable => {
      return cy.request('GET', `${origin}/api/get/tenant/alert/summary`).then((response) => {
        expect(response.status).to.eq(200);
        const counts = Object.values((response.body?.counts_by_type || {}) as Record<string, unknown>);
        const total = counts.reduce<number>((sum, count) => sum + Number(count || 0), 0);
        if (total === 0) {
          return cy.wrap(null);
        }
        if (Date.now() - startedAt > 60000) {
          throw new Error(`Tenant alerts were not flushed before scan: ${JSON.stringify(response.body?.counts_by_type || {})}`);
        }
        return cy.wait(1000, {log: false}).then(() => poll());
      });
    };

    return poll();
  }).then(() => {
    cy.get('app-alert-scan-loading', {timeout: 60000}).should('not.exist');
  });
}

export function waitForTenantAlertScanComplete(timeoutMs = 180000) {
  const startedAt = Date.now();
  let observedRunning = false;

  return cy.location('origin').then((origin) => {
    const poll = (): Cypress.Chainable<any> => {
      return cy.request('POST', `${origin}/api/profile/alert/scan/status`, {}).then((response) => {
        expect(response.status).to.eq(200);
        if (response.body?.scan_running) {
          observedRunning = true;
        }
        if (!response.body?.scan_running && (observedRunning || Date.now() - startedAt > 3000)) {
          return cy.wrap(null);
        }
        if (Date.now() - startedAt > timeoutMs) {
          throw new Error('Tenant alert scan did not finish');
        }
        return cy.wait(1000, {log: false}).then(() => poll());
      });
    };

    return poll();
  }).then(() => {
    cy.get('app-alert-scan-loading', {timeout: 60000}).should('not.exist');
  });
}

export function runTenantAlertScan() {
  cy.intercept('POST', '**/api/profile/alert/scan').as('tenantAlertScanStart');
  cy.get('[data-testid="tenant-home-scan-all"]')
    .scrollIntoView()
    .should('be.visible')
    .and('not.be.disabled')
    .click({force: true});
  cy.wait('@tenantAlertScanStart', {timeout: 60000})
    .its('response.statusCode')
    .should('be.oneOf', [200, 202]);
  waitForTenantAlertScanComplete();
}

export function waitForTenantAlertFindings(category: AlertScannerCategory, timeoutMs = 360000) {
  return cy.location('origin').then((origin) => {
    const startedAt = Date.now();
    const poll = (): Cypress.Chainable => {
      return cy.request('GET', `${origin}/api/get/tenant/alert/summary`).then((response) => {
        expect(response.status).to.eq(200);
        const count = Number(response.body?.counts_by_type?.[category] || 0);
        if (count > 0) {
          return cy.wrap(null);
        }
        if (Date.now() - startedAt > timeoutMs) {
          throw new Error(`Tenant alert scan produced no ${category} findings`);
        }
        return cy.wait(1000, {log: false}).then(() => poll());
      });
    };

    return poll();
  });
}

function alertCardDisplayName(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function assertOnlyGeneralHasAlertFindings() {
  ALERT_SCANNER_CATEGORIES.forEach((category) => {
    cy.contains(HOME_ALERT_CARD_SELECTOR, alertCardDisplayName(category), {timeout: 30000})
      .scrollIntoView()
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const match = text.replace(/\s+/g, ' ').match(/IOC.s found\s*(\d+)/i);
        expect(match, `${category} IOC count`).to.not.be.null;
        const count = Number(match![1]);
        if (category === 'general') {
          expect(count, 'general findings').to.be.greaterThan(0);
          return;
        }
        expect(count, `${category} findings`).to.eq(0);
      });
  });
}

export function assertAlertScanCompletedMailPresent() {
  const timeoutMs = 60000;
  const intervalMs = 1000;
  const startedAt = Date.now();

  const waitForMail = (): Cypress.Chainable => {
    return cy.request('GET', 'http://localhost:8025/api/v1/messages').then((response) => {
      const messages = (response.body?.messages || []) as any[];
      const found = messages.some((message) => (
        String(message.Subject || message.subject || '').includes('Alert scan completed')
      ));

      if (found) {
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error('Alert scan completed email was not sent');
      }
      return cy.wait(intervalMs).then(() => waitForMail());
    });
  };

  return waitForMail();
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
