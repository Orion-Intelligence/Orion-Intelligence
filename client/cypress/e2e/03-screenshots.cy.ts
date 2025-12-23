describe('Orion Intelligence – Full Stable Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  /* =====================
     ADMIN SECTIONS
  ====================== */
  it('Admin Sections', () => {
    cy.visit('/dashboard');

    cy.contains('div.sidebar__item-dropdown', 'admin')
      .scrollIntoView()
      .click({ force: true });

    cy.screenshot('06-admin-dropdown-opened');

    const adminSections = [
      'Homepage',
      'Account',
      'Users',
      'Auditlog',
      'Tenant',
      'System Settings'
    ];

    adminSections.forEach((section, index) => {
      cy.contains('.sidebar__subitem-content', section)
        .scrollIntoView()
        .click({ force: true });

      cy.screenshot(
        `07-admin-${index + 1}-${section.toLowerCase().replace(/\s+/g, '-')}`
      );
    });
  });

  /* =====================
     GENERAL INTELLIGENCE
  ====================== */
  it('General Intelligence', () => {
    cy.visit('/dashboard');

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

    sections.forEach((s, i) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });

      cy.screenshot(
        `06-gi-${i + 1}-${s.toLowerCase().replace(/\s+/g, '-')}`
      );
    });
  });

  /* =====================
     DATA BREACH
  ====================== */
  it('Data Breach', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Data Breach')
      .click({ force: true });

    ['All', 'Databases', 'Tracking'].forEach((s, i) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });

      cy.screenshot(`07-data-breach-${i + 1}-${s.toLowerCase()}`);
    });
  });

  /* =====================
     DISCUSSION
  ====================== */
  it('Discussion', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Discussion')
      .click({ force: true });

    const sections = [
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

    sections.forEach((s, i) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });

      cy.screenshot(
        `08-discussion-${i + 1}-${s.toLowerCase().replace(/\s+/g, '-')}`
      );
    });
  });

  /* =====================
     DEFACEMENT
  ====================== */
  it('Defacement', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Defacement')
      .click({ force: true });

    ['All', 'Hacked', 'Phishing', 'Databases'].forEach((s, i) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });

      cy.screenshot(`09-defacement-${i + 1}-${s.toLowerCase()}`);
    });
  });

  /* =====================
     SOCIAL
  ====================== */
  it('Social', () => {
    cy.visit('/dashboard');

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
    ].forEach((s, i) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });

      cy.screenshot(`10-social-${i + 1}-${s.toLowerCase()}`);
    });
  });

  /* =====================
     EXPLOIT
  ====================== */
  it('Exploit', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Exploit')
      .click({ force: true });

    ['All', 'CVE', 'Tools', 'ZeroDay'].forEach((s, i) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });

      cy.screenshot(`11-exploit-${i + 1}-${s.toLowerCase()}`);
    });
  });

  /* =====================
     FEED
  ====================== */
  it('Feed', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Feed')
      .click({ force: true });

    cy.screenshot('12-feed-news');
  });

  /* =====================
     STEALER LOGS
  ====================== */
  it('Stealer Logs', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Stealer logs')
      .click({ force: true });

    ['Credential', 'Logs'].forEach((s, i) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });

      cy.screenshot(`13-stealer-${i + 1}-${s.toLowerCase()}`);
    });
  });

  /* =====================
     WEB SCANS
  ====================== */
  it('Web Scans', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Web Scans')
      .click({ force: true });

    [
      'Basic Scan',
      'Port Scan',
      'Repository Scan',
      'SEO Scan'
    ].forEach((s, i) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });

      cy.screenshot(
        `14-webscan-${i + 1}-${s.toLowerCase().replace(/\s+/g, '-')}`
      );
    });
  });

  /* =====================
     LIVE APIs
  ====================== */
  it('Live APIs', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Live APIs')
      .click({ force: true });

    [
      'Email Breach',
      'Social Scanner',
      'Playstore Scanner'
    ].forEach((s, i) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });

      cy.screenshot(
        `15-liveapi-${i + 1}-${s.toLowerCase().replace(/\s+/g, '-')}`
      );
    });
  });

  /* =====================
     DUMP
  ====================== */
  it('Dump', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Dump')
      .click({ force: true });

    cy.screenshot('16-dump-listing');
  });

  /* =====================
     TENANT (SUB)
  ====================== */
  it('Tenant Sections', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Tenant')
      .click({ force: true });

    ['View Profiles', 'View Tenants', 'Auditlog'].forEach((s, i) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({ force: true });

      cy.screenshot(
        `17-tenant-${i + 1}-${s.toLowerCase().replace(/\s+/g, '-')}`
      );
    });
  });

  /* =====================
     CTI GRAPH
  ====================== */
  it('CTI Graph', () => {
    cy.visit('/dashboard');

    cy.contains('CTI Graph')
      .invoke('removeAttr', 'target')
      .click({ force: true });

    cy.screenshot('18-cti-graph');
  });



  /* =====================
     LINKS
  ====================== */
  it('Links', () => {
    cy.visit('/dashboard');

    cy.contains('Links')
      .click({ force: true });

    cy.screenshot('20-links');
  });

});
