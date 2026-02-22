describe('Orion Intelligence – Full Stable Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Full Flow', () => {
    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'admin')
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

    cy.get('img[src*="nav_menu"]')
      .should('be.visible')
      .click();

    cy.get('img[src*="menu-mini"]')
      .should('be.visible')
      .click();

    adminSections.forEach((section) => {
      cy.contains('app-dashboard-sidebar-items div', section)
        .scrollIntoView()
        .click({ force: true });
    });

    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence')
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
      cy.contains('app-dashboard-sidebar-items div', s)
        .click({ force: true });
    });

    cy.contains('app-dashboard-sidebar-items div', 'Data Breach')
      .click({ force: true });

    cy.get('img[alt="scroll to top"]').click();
    ['All', 'Databases', 'Tracking'].forEach((s) => {
      cy.contains('app-dashboard-sidebar-items div', s)
        .click({ force: true });
    });

    cy.contains('app-dashboard-sidebar-items div', 'Defacement')
      .click({ force: true });

    ['All', 'Hacked', 'Phishing', 'Databases'].forEach((s) => {
      cy.contains('app-dashboard-sidebar-items div', s)
        .click({ force: true });
    });

    cy.contains('app-dashboard-sidebar-items div', 'Social')
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
      cy.contains('app-dashboard-sidebar-items div', s)
        .click({ force: true });
    });

    cy.contains('app-dashboard-sidebar-items div', 'Exploit')
      .click({ force: true });

    ['All', 'CVE', 'Tools', 'ZeroDay'].forEach((s) => {
      cy.contains('app-dashboard-sidebar-items div', s)
        .click({ force: true });
    });

    cy.contains('app-dashboard-sidebar-items div', 'Feed')
      .click({ force: true });

    cy.contains('app-dashboard-sidebar-items div', 'Stealer logs')
      .click({ force: true });

    cy.get('button[aria-label="Expand row"]')
      .each(($btn, index) => {
        if (index < 5) {
          cy.wrap($btn).click({ force: true });
        }
      });

    cy.contains('app-dashboard-sidebar-items div', 'Web Scans')
      .click({ force: true });

    [
      'Basic Scan',
      'Port Scan',
      'Repository Scan',
      'SEO Scan'
    ].forEach((s) => {
      cy.contains('app-dashboard-sidebar-items div', s)
        .click({ force: true });
    });

    cy.contains('app-dashboard-sidebar-items div', 'Live APIs')
      .click({ force: true });

    [
      'Email Breach',
      'Social Scanner',
      'Playstore Scanner'
    ].forEach((s) => {
      cy.contains('app-dashboard-sidebar-items div', s)
        .click({ force: true });
    });

    cy.contains('app-dashboard-sidebar-items div', 'Dump')
      .click({ force: true });

    cy.contains('Links')
      .click({ force: true });

    cy.logout();
  });
});

describe('Orion Intelligence - Heatmap Coverage', () => {
  const getHeatmapComponent = () =>
    cy.window().then((win) => {
      const host = win.document.querySelector('app-world-heatmap') as any;
      expect(host, 'app-world-heatmap host').to.exist;
      const ngApi = (win as any).ng;
      if (ngApi?.getComponent) {
        return ngApi.getComponent(host) as any;
      }
      const ctx = host.__ngContext__ as any[] | undefined;
      expect(ctx, 'Angular context fallback').to.exist;
      const comp = (ctx || []).find((x: any) => x && x.constructor?.name === 'WorldHeatmapComponent');
      expect(comp, 'WorldHeatmapComponent in ngContext').to.exist;
      return comp as any;
    });

  const openHomepage = () => {
    cy.visit('/dashboard/profile/homepage');
    cy.get('app-world-heatmap', { timeout: 30000 }).should('be.visible');
    cy.get('app-world-heatmap .map-container svg', { timeout: 30000 }).should('exist');
    cy.get('app-world-heatmap .map-container path.country', { timeout: 30000 }).should('have.length.greaterThan', 0);
  };

  const openCountryReportFromMap = () => {
    cy.get('app-world-heatmap .map-container path.country.has-data').then(($withData) => {
      if ($withData.length) {
        cy.wrap($withData[0]).click({ force: true });
        return;
      }
      cy.get('app-world-heatmap .map-container path.country').first().click({ force: true });
    });
    cy.get('app-heatmap-report', { timeout: 15000 }).should('exist');
  };

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('covers world heatmap render, interactions and popup close paths', () => {
    openHomepage();

    cy.viewport(1280, 800);
    cy.get('app-world-heatmap .map-container svg', { timeout: 15000 }).should('exist');
    cy.viewport(1440, 900);
    cy.get('app-world-heatmap .map-container svg', { timeout: 15000 }).should('exist');

    cy.get('app-world-heatmap .map-container path.country').first().trigger('mousemove', {
      clientX: 40,
      clientY: 40,
      force: true
    });
    cy.get('app-world-heatmap .map-container .heatmap-tooltip.heatmap-tooltip-visible', { timeout: 10000 }).should('be.visible');
    cy.get('app-world-heatmap .map-container path.country').first().trigger('mouseleave', { force: true });
    cy.get('app-world-heatmap .map-container .heatmap-tooltip').should('exist');

    openCountryReportFromMap();
    cy.contains('app-heatmap-report h3', 'Reports', { timeout: 10000 }).should('be.visible');
    cy.get('app-heatmap-report .overflow-y-auto').should('exist');

    cy.get('app-heatmap-report button[aria-label="Close"]').click({ force: true });
    cy.get('app-heatmap-report', { timeout: 15000 }).should('not.exist');

    openCountryReportFromMap();
    cy.get('app-heatmap-report > div.fixed').click('topLeft', { force: true });
    cy.get('app-heatmap-report', { timeout: 15000 }).should('not.exist');
  });

  it('covers branch paths by invoking heatmap component API', () => {
    openHomepage();
    cy.clock();

    getHeatmapComponent().then((comp: any) => {
      comp.ngOnChanges({
        data: {
          firstChange: false,
          currentValue: [{ name: 'Mockland', value: 2 }],
          previousValue: []
        }
      });

      const appService = comp['appService'];
      const originalWorld = appService.worldJson();
      appService.worldJson.set(null);
      comp['createChart']();
      appService.worldJson.set(originalWorld);
      comp['createChart']();

      const originalAll = comp['allCategoryReports'];
      comp['allCategoryReports'] = {};
      comp['startCategoryRotation']();
      comp['allCategoryReports'] = {
        leak: [{ m_country: ['United States, Canada'] }, { m_country: ['Canada'] }],
        generic: [{ m_country: ['France'] }],
        exploit: [],
        chat: [],
        social: [],
        defacement: []
      };
      comp['startCategoryRotation']();

      const reports = comp.getReportsByCountry('Canada');
      expect(reports.length).to.be.greaterThan(0);
      comp['openCountryReport']('Canada');
      expect(comp.isOpenCountryReport).to.equal(true);
      expect(Array.isArray(comp.selectedCountryReports)).to.equal(true);
      comp.closeCountryReport();
      expect(comp.isOpenCountryReport).to.equal(false);

      comp['onCountryClick']({});
      comp['onCountryClick']({ properties: { name: 'Canada' } });
      expect(comp.isOpenCountryReport).to.equal(true);
      comp.closeCountryReport();

      comp['allCategoryReports'] = originalAll;
      comp.ngOnDestroy();
    });

    cy.tick(8100);
    cy.get('app-world-heatmap .map-container svg', { timeout: 15000 }).should('exist');
  });
});
