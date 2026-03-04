describe('Orion Intelligence – Full Stable Flow', () => {
  function openSidebarGroup(title: string) {
    cy.contains('app-dashboard-sidebar-items > li > div', title).then(($group) => {
      cy.wrap($group).scrollIntoView();
      let li = $group.closest('li');
      let sub = li.find('> ul');
      let isClosed =
        !sub.length || getComputedStyle(sub[0] as HTMLElement).pointerEvents === 'none';

      if (isClosed) {
        cy.wrap($group).find('img[alt="Drop Down"]').click();
      }
    });

    cy.contains('app-dashboard-sidebar-items > li > div', title)
      .closest('li')
      .find('> ul', { timeout: 20000 })
      .should(($ul) => {
        expect(getComputedStyle($ul[0] as HTMLElement).pointerEvents).not.to.equal('none');
      });
  }

  function clickSidebarSubItem(groupTitle: string, itemTitle: string) {
    cy.contains('app-dashboard-sidebar-items > li > div', groupTitle)
      .closest('li')
      .find('> ul')
      .should(($ul) => {
        expect(getComputedStyle($ul[0] as HTMLElement).pointerEvents).not.to.equal('none');
      })
      .contains('li > div > div', new RegExp(`^\\s*${itemTitle}\\s*$`))
      .scrollIntoView()
      .click();
  }

  it('Full Flow', () => {
    cy.loginAsAdmin();
    cy.contains('app-dashboard-sidebar-items div', 'admin')
      .scrollIntoView()
      .click();

    [
      'Homepage',
      'Account',
      'Users',
      'Auditlog',
      'Tenant',
      'System Settings'
    ].forEach((section) => {
      cy.contains('app-dashboard-sidebar-items div', section)
        .scrollIntoView()
        .click();
    });

    cy.get('img[src*="nav_menu"]')
      .should('be.visible')
      .click();

    cy.get('img[src*="menu-mini"]')
      .should('be.visible')
      .click();

    openSidebarGroup('General Intelligence');

    [
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
    ].forEach((s) => clickSidebarSubItem('General Intelligence', s));

    openSidebarGroup('Data Breach');

    cy.get('img[alt="scroll to top"]').click();
    ['All', 'Databases', 'Tracking'].forEach((s) => clickSidebarSubItem('Data Breach', s));

    openSidebarGroup('Defacement');

    ['All', 'Hacked', 'Phishing', 'Databases'].forEach((s) => clickSidebarSubItem('Defacement', s));

    openSidebarGroup('Social');

    [
      'All',
      'Telegram',
      'Twitter',
      'Mastodon',
      'Pastebin',
      'Forum',
      'Reddit'
    ].forEach((s) => clickSidebarSubItem('Social', s));

    openSidebarGroup('Exploit');

    ['All', 'CVE', 'Tools', 'ZeroDay'].forEach((s) => clickSidebarSubItem('Exploit', s));

    openSidebarGroup('Feed');

    openSidebarGroup('Stealer logs');

    cy.get('button[aria-label="Expand row"]')
      .each(($btn, index) => {
        if (index < 5) {
          cy.wrap($btn).scrollIntoView().click();
        }
      });

    openSidebarGroup('Web Scans');

    [
      'Basic Scan',
      'Port Scan',
      'Repository Scan',
      'SEO Scan'
    ].forEach((s) => clickSidebarSubItem('Web Scans', s));


    openSidebarGroup('Entity API');


    [
      'Email Breach',
      'Social Scanner',
      'Wanted List',
      'National Identity',
      'Playstore Scanner',
      'Software Scanner',
      'File Scanner',
      'Crypto Scanner'
    ].forEach((item) => clickSidebarSubItem('Entity API', item));

    cy.logout();
    });
});

describe('Orion Intelligence - Heatmap Coverage', () => {
  function getHeatmapComponent() {
    return cy.window().then((win) => {
      let host = win.document.querySelector('app-world-heatmap') as any;
      expect(host, 'app-world-heatmap host').to.exist;
      let ngApi = (win as any).ng;
      if (ngApi?.getComponent) {
        return ngApi.getComponent(host) as any;
      }
      let ctx = host.__ngContext__ as any[] | undefined;
      expect(ctx, 'Angular context fallback').to.exist;
      let comp = (ctx || []).find((x: any) => x && x.constructor?.name === 'WorldHeatmapComponent');
      expect(comp, 'WorldHeatmapComponent in ngContext').to.exist;
      return comp as any;
    });
  }
  function openHomepage() {
    cy.get('app-home-insight', { timeout: 30000 }).should('exist');
    cy.get('app-world-heatmap', { timeout: 30000 }).should('be.visible');
    cy.get('app-world-heatmap .map-container svg', { timeout: 30000 }).should('exist');
    cy.get('app-world-heatmap .map-container path.country', { timeout: 30000 }).should('have.length.greaterThan', 0);
  }

  function openCountryReportFromMap() {
    cy.get('app-world-heatmap .map-container path.country', { timeout: 30000 })
      .should('have.length.greaterThan', 0);

    cy.document().then((doc) => {
      let target =
        doc.querySelector('app-world-heatmap .map-container path.country.has-data') ||
        doc.querySelector('app-world-heatmap .map-container path.country');

      expect(target, 'clickable map country').to.exist;
      (target as Element).dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          composed: true
        })
      );
    });
    cy.get('app-heatmap-report', { timeout: 15000 }).should('exist');
  }

  it('covers world heatmap render, interactions and popup close paths', () => {
    cy.loginAsAdmin();
    openHomepage();

    cy.get('app-world-heatmap .map-container svg', { timeout: 15000 }).should('exist');
    cy.get('app-world-heatmap .map-container svg', { timeout: 15000 }).should('exist');

    cy.get('app-world-heatmap .map-container path.country.has-data, app-world-heatmap .map-container path.country')
      .first()
      .should('exist')
      .then(($el) => {
        let r = ($el[0] as Element).getBoundingClientRect();
        ($el[0] as Element).dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: r.left + Math.max(1, r.width / 2),
            clientY: r.top + Math.max(1, r.height / 2),
            bubbles: true
          })
        );
      });
    cy.get('app-world-heatmap .map-container .heatmap-tooltip.heatmap-tooltip-visible', { timeout: 10000 }).should('be.visible');
    cy.get('app-world-heatmap .map-container path.country.has-data, app-world-heatmap .map-container path.country')
      .first()
      .should('exist')
      .then(($el) => {
        ($el[0] as Element).dispatchEvent(
          new MouseEvent('mouseleave', {
            bubbles: true
          })
        );
      });
    cy.get('app-world-heatmap .map-container .heatmap-tooltip').should('exist');

    openCountryReportFromMap();
    cy.contains('app-heatmap-report h3', 'Reports', { timeout: 10000 }).should('be.visible');
    cy.get('app-heatmap-report .overflow-y-auto').should('exist');

    cy.get('app-heatmap-report button[aria-label="Close"]').scrollIntoView().should('be.visible').click();
    cy.get('app-heatmap-report', { timeout: 15000 }).should('not.exist');

    openCountryReportFromMap();
    cy.get('app-heatmap-report > div.fixed').scrollIntoView().click('topLeft');
    cy.get('app-heatmap-report', { timeout: 15000 }).should('not.exist');

    cy.logout();
  });

  it('covers branch paths by invoking heatmap component API', () => {
    cy.loginAsAdmin();
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

      let appService = comp['appService'];
      let originalWorld = appService.worldJson();
      appService.worldJson.set(null);
      comp['createChart']();
      appService.worldJson.set(originalWorld);
      comp['createChart']();

      let originalAll = comp['allCategoryReports'];
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

      let reports = comp.getReportsByCountry('Canada');
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

    cy.logout();
  });
});
