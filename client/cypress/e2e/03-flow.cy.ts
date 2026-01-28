describe('Orion Intelligence – Full Stable Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Full Flow', () => {
    cy.visit('/dashboard');

    cy.contains('div.sidebar__item-dropdown', 'admin')
      .scrollIntoView()
      .click({ force: true });

    const adminSections = [
      'Homepage',
      'Account',
      'Users',
      'Auditlog',
      'Tenant',
      'System Settings'
    ];

    cy.get('button.sidebar__header-menu')
      .should('be.visible')
      .click();

    cy.get('img[src*="menu-mini"]')
      .should('be.visible')
      .click();

    adminSections.forEach((section) => {
      cy.contains('.sidebar__subitem-content', section)
        .scrollIntoView()
        .click({ force: true });
    });

    cy.contains('.sidebar__item-dropdown', 'General Intelligence')
      .click({ force: true });

    const sections = [
      'All',
      'General',
      'Forums',
      'News',
      'Stolen',
      'Drugs',
      'Hacking',
      'Marketplaces',
      'Cryptocurrency',
      'Leaks'
    ];

    sections.forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });
    });

    cy.contains('.sidebar__item-dropdown', 'Data Breach')
      .click({ force: true });

    ['All', 'Databases', 'Tracking'].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });
    });

    cy.contains('.sidebar__item-dropdown', 'Discussion')
      .click({ force: true });

    const discussionSections = [
      'All',
      'Warfare',
      'Cloud',
      'DDoS',
      'Exploit',
      'Hack',
      'Credentials Common',
      'Text',
      'Phishing',
      'CVE',
      'Credential',
      'Ransomware',
      'Data',
      'Malware',
      'XSS',
      'C2',
      'Leak',
      'RCE',
      'Fraud',
      'Infostealer'
    ];

    discussionSections.forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });
    });

    cy.contains('.sidebar__item-dropdown', 'Defacement')
      .click({ force: true });

    ['All', 'Hacked', 'Phishing', 'Databases'].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });
    });

    cy.contains('.sidebar__item-dropdown', 'Social')
      .click({ force: true });

    [
      'All',
      'Telegram',
      'Twitter',
      'Mastodon',
      'Pastebin',
      'Forum',
      'Reddit'
    ].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });
    });

    cy.contains('.sidebar__item-dropdown', 'Exploit')
      .click({ force: true });

    ['All', 'CVE', 'Tools', 'ZeroDay'].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });
    });

    cy.contains('.sidebar__item-dropdown', 'Feed')
      .click({ force: true });

    cy.contains('.sidebar__item-dropdown', 'Stealer logs')
      .click({ force: true });

    cy.get('.credential_row_toggle')
      .each(($btn, index) => {
        if (index < 5) {
          cy.wrap($btn).click({ force: true });
        }
      });

    cy.contains('.sidebar__item-dropdown', 'Web Scans')
      .click({ force: true });

    [
      'Basic Scan',
      'Port Scan',
      'Repository Scan',
      'SEO Scan'
    ].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });
    });

    cy.contains('.sidebar__item-dropdown', 'Live APIs')
      .click({ force: true });

    [
      'Email Breach',
      'Social Scanner',
      'Playstore Scanner'
    ].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });
    });

    cy.contains('.sidebar__item-dropdown', 'Dump')
      .click({ force: true });

    cy.contains('Links')
      .click({ force: true });

    cy.logout();
  });
});
