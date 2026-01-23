describe('Orion Intelligence – Full Stable Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Admin Sections', () => {
    cy.visit('/dashboard');

    cy.contains('div.sidebar__item-dropdown', 'admin')
      .scrollIntoView()
      .click({force: true});

    const adminSections = [
      'Homepage',
      'Account',
      'Users',
      'Auditlog',
      'Tenant',
      'System Settings'
    ];

    adminSections.forEach((section) => {
      cy.contains('.sidebar__subitem-content', section)
        .scrollIntoView()
        .click({force: true});
    });
  });

  it('General Intelligence', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'General Intelligence')
      .click({force: true});

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
        .click({force: true});
    });
  });

  it('Data Breach', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Data Breach')
      .click({force: true});

    ['All', 'Databases', 'Tracking'].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({force: true});
    });
  });

  it('Discussion', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Discussion')
      .click({force: true});

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

    sections.forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({force: true});
    });
  });

  it('Defacement', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Defacement')
      .click({force: true});

    ['All', 'Hacked', 'Phishing', 'Databases'].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({force: true});
    });
  });

  it('Social', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Social')
      .click({force: true});

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
        .click({force: true});
    });
  });

  it('Exploit', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Exploit')
      .click({force: true});

    ['All', 'CVE', 'Tools', 'ZeroDay'].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({force: true});
    });
  });

  it('Feed', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Feed')
      .click({force: true});
  });

  it('Stealer Logs', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Stealer logs')
      .click({force: true});

    cy.get('.credential_row_toggle').each(($btn) => {
      cy.wrap($btn).click({force: true});
    });
  });

  it('Web Scans', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Web Scans')
      .click({force: true});

    [
      'Basic Scan',
      'Port Scan',
      'Repository Scan',
      'SEO Scan'
    ].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({force: true});
    });
  });

  it('Live APIs', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Live APIs')
      .click({force: true});

    [
      'Email Breach',
      'Social Scanner',
      'Playstore Scanner'
    ].forEach((s) => {
      cy.contains('.sidebar__subitem-content', s)
        .click({force: true});
    });
  });

  it('Dump', () => {
    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Dump')
      .click({force: true});
  });

  it('CTI Graph', () => {
    cy.visit('/dashboard');

    cy.contains('CTI Graph')
      .invoke('removeAttr', 'target')
      .click({force: true});
  });

  it('Links', () => {
    cy.visit('/dashboard');

    cy.contains('Links')
      .click({force: true});
  });
});
