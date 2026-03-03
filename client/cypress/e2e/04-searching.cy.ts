describe('General Intelligence – Multi-Tab Search & Open Report Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  // ---------- Selectors based on your HTML ----------
  const sidebarParentLabel = 'General Intelligence';

  const generalIntelParent = () =>
    cy.contains('app-dashboard-sidebar-items div', sidebarParentLabel);

  const generalIntelSubMenuRoot = () =>
    generalIntelParent()
      .closest('app-dashboard-sidebar-items')
      .find('ul');

  const subTabClickableItems = () =>
    generalIntelSubMenuRoot()
      .find('li div[tabindex="0"]')
      .filter(':visible');

  const searchInput = () =>
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first();

  const openReportButton = () =>
    cy.get(
      '[data-cy="open-report"], div[apptooltip="Open Report"], div[appTooltip="Open Report"], p[apptooltip="Open Report"], p[appTooltip="Open Report"]',
      { timeout: 30000 }
    )
      .filter(':visible')
      .first();

  // ---------- Helpers ----------
  const openGeneralIntelMenu = () => {
    cy.contains('app-dashboard-sidebar-items', 'General Intelligence')
      .find('li > div')
      .first()
      .click({ force: true });

    generalIntelParent()
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    generalIntelSubMenuRoot().should('exist');
  };

  const runSearchAndOpenReport = (term: string) => {
    searchInput()
      .should('be.visible')
      .clear({ force: true })
      .type(`${term}{enter}`, { force: true });

    openReportButton()
      .should('be.visible')
      .click({ force: true });

    cy.get('app-json-api-viewer', { timeout: 30000 })
      .should('exist')
      .and('be.visible');

    cy.get('body').type('{esc}', { force: true });
  };

  it('General Intelligence: click allowed subtabs → search bitcoin → open report → back', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('app-dashboard-sidebar-items', 'General Intelligence')
      .find('li > div')
      .first()
      .click({ force: true });

    // 1) open General Intelligence
    openGeneralIntelMenu();

    // 2) skip these tabs (DO NOT click / DO NOT search inside them)
    const skipTabs = new Set(['News', 'Stolen', 'Drugs', 'Hacking']);

    // capture tab names
    subTabClickableItems()
      .then($items => {
        const names = [...$items]
          .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean);

        const unique = [...new Set(names)];

        // filter out skip tabs
        return unique.filter(name => !skipTabs.has(name));
      })
      .then((tabNames: string[]) => {
        // iterate
        tabNames.forEach((tabName) => {
          // ensure submenu is open (UI collapses sometimes)
          openGeneralIntelMenu();

          // click the tab
          generalIntelSubMenuRoot()
            .contains('div', tabName)
            .should('be.visible')
            .click({ force: true });

          // search + open report
          runSearchAndOpenReport('bitcoin');

          // go back to tab list page
          cy.go('back');

          // sanity check we're back
          searchInput().should('exist');
        });
      });
  });


  it('Defacement flow: All(mthcht) → Hacked(ASTAR) → Phishing(mthcht) → Databases(urldna_bot)', () => {
      // ---------- Selectors based on your HTML ----------
  const sidebarParentLabel = 'Defacement';

  const defacementParent = () =>
    cy.contains('app-dashboard-sidebar-items div', sidebarParentLabel);

  const defacementSubMenuRoot = () =>
    defacementParent()
      .closest('app-dashboard-sidebar-items')
      .find('ul');

  const searchInput = () =>
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first();

  // row open button (arrow)
  const openRowButton = () =>
    cy.get('td.text-right img[alt="click"][src*="arrow-right-click.svg"]')
      .filter(':visible')
      .first();

  // ---------- Helpers ----------
  const openDefacementMenu = () => {
    // click Defacement header first (as you asked)
    cy.contains('app-dashboard-sidebar-items', 'Defacement')
      .find('li > div')
      .first()
      .click({ force: true });

    defacementParent()
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    defacementSubMenuRoot().should('exist');
  };

  const searchAndOpenFirstRow = (term: string) => {
    searchInput()
      .should('be.visible')
      .clear({ force: true })
      .type(`${term}{enter}`, { force: true });

    openRowButton()
      .should('be.visible')
      .click({ force: true });

    cy.get('app-json-api-viewer', { timeout: 30000 })
      .should('exist')
      .and('be.visible');

    cy.get('body').type('{esc}', { force: true });
  };

  const goToSubTab = (tabName: 'All' | 'Hacked' | 'Phishing' | 'Databases') => {
    openDefacementMenu();

    defacementSubMenuRoot()
      .contains('div', tabName)
      .should('be.visible')
      .click({ force: true });
  };
    cy.visit('/dashboard/profile/homepage');

    cy.contains('app-dashboard-sidebar-items', 'Defacement')
      .find('li > div')
      .first()
      .click({ force: true });

    // ----- All -----
    goToSubTab('All');
    searchAndOpenFirstRow('mthcht');

    cy.go('back');
    searchInput().should('exist');

    // ----- Hacked -----
    goToSubTab('Hacked');
    searchAndOpenFirstRow('ASTAR');

    cy.go('back');
    searchInput().should('exist');

    // ----- Phishing -----
    goToSubTab('Phishing');
    searchAndOpenFirstRow('mthcht');

    cy.go('back');
    searchInput().should('exist');

    // ----- Databases -----
    goToSubTab('Databases');
    searchAndOpenFirstRow('urldna_bot');
  });

  it('Social: All/Twitter/Mastodon/Pastebin/Forum/Reddit (skip Telegram) → search Linux → open report', () => {
    // ---------- Selectors ----------
    const sidebarParentLabel = 'Social';

    const socialParent = () =>
      cy.contains('app-dashboard-sidebar-items div', sidebarParentLabel);

    const socialSubMenuRoot = () =>
      socialParent()
        .closest('app-dashboard-sidebar-items')
        .find('ul');

    const subTabClickableItems = () =>
      socialSubMenuRoot()
        .find('li div[tabindex="0"]')
        .filter(':visible');

    const searchInput = () =>
      cy.get('input[data-cy="dashboard-general-input"][name="q"]').first();

    // ✅ UPDATED: Social me arrow button nahi, Open Report button hai
    const openReportButton = () =>
      cy.get('div[data-cy="open-report"][apptooltip="Open Report"]')
        .filter(':visible')
        .first();

    // ---------- Helpers ----------
    const openSocialMenu = () => {
      cy.contains('app-dashboard-sidebar-items', 'Social')
        .find('li > div')
        .first()
        .click({ force: true });

      socialParent()
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });

      socialSubMenuRoot().should('exist');
    };

    const searchAndOpenReport = (term: string) => {
      searchInput()
        .should('be.visible')
        .clear({ force: true })
        .type(`${term}{enter}`, { force: true });

      openReportButton()
        .should('be.visible')
        .click({ force: true });

      cy.get('app-json-api-viewer', { timeout: 30000 })
        .should('exist')
        .and('be.visible');

      cy.get('body').type('{esc}', { force: true });
    };

    // ---------- Test ----------
    cy.visit('/dashboard/profile/homepage');

    // open Social menu once
    cy.contains('app-dashboard-sidebar-items', 'Social')
      .find('li > div')
      .first()
      .click({ force: true });

    openSocialMenu();

    const skipTabs = new Set(['Telegram']);

    subTabClickableItems()
      .then($items => {
        const names = [...$items]
          .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean);

        const unique = [...new Set(names)];
        return unique.filter(name => !skipTabs.has(name));
      })
      .then((tabNames: string[]) => {
        tabNames.forEach((tabName) => {
          openSocialMenu();

          socialSubMenuRoot()
            .contains('div', tabName)
            .should('be.visible')
            .click({ force: true });

          searchAndOpenReport('Linux');

          cy.go('back');
          searchInput().should('exist');
        });
      });
  });

  it('Exploit: All → CVE → Tools → ZeroDay (Search + Open Report)', () => {
    // ---------- Selectors ----------
    const exploitMenu = () => cy.contains('app-dashboard-sidebar-items', 'Exploit');
    const exploitHeader = () => exploitMenu().find('li > div').first();
    const exploitSubMenu = () => exploitMenu().find('ul').first();

    const searchInput = () =>
      cy.get('input[data-cy="dashboard-general-input"][name="q"]', { timeout: 30000 }).first();



    // ---------- Helpers ----------
    const openExploitMenu = () => {
      exploitHeader().scrollIntoView().click({ force: true });
      exploitSubMenu().should('exist');
    };

    const clickExploitTab = (tabName: 'All' | 'CVE' | 'Tools' | 'ZeroDay') => {
      openExploitMenu();
      exploitSubMenu()
        .contains('div', tabName)
        .should('be.visible')
        .click({ force: true });
    };

    const searchAndOpenReport = (term: string) => {
      // ✅ break chains to avoid "detached from DOM"
      searchInput().as('q');
      cy.get('@q').should('be.visible');
      cy.get('@q').clear({ force: true });
      cy.get('@q').type(`${term}{enter}`, { force: true });

      // wait results + open report
      openReportButton().should('be.visible').click({ force: true });

      // go back to listing for next tab
      cy.go('back');
      searchInput().should('exist');
    };

    // ---------- Test ----------
    cy.visit('/dashboard/profile/homepage');

    cy.contains('app-dashboard-sidebar-items', 'Exploit')
      .find('li > div')
      .first()
      .click({ force: true });

    openExploitMenu();

    // All -> SSLoad
    clickExploitTab('All');
    searchAndOpenReport('SSLoad');

    // CVE -> Skyvern
    clickExploitTab('CVE');
    searchAndOpenReport('Skyvern');

    // Tools -> Plugx
    clickExploitTab('Tools');
    searchAndOpenReport('Plugx');

    // ZeroDay -> Livewire
    clickExploitTab('ZeroDay');

  });

  it('Feed: search police → open report', () => {
    cy.visit('/dashboard/profile/homepage');

    // ✅ Feed pe click
    cy.contains('app-dashboard-sidebar-items', 'Feed')
      .find('li > div')
      .first()
      .click({ force: true });

    const searchInput = () =>
      cy.get('input[data-cy="dashboard-general-input"][name="q"]', { timeout: 30000 }).first();

    const openReportButton = () =>
      cy.get(
        '[data-cy="open-report"], div[apptooltip="Open Report"], div[appTooltip="Open Report"], p[apptooltip="Open Report"], p[appTooltip="Open Report"]',
        { timeout: 30000 }
      )
        .filter(':visible')
        .first();

    // ✅ Search police
    searchInput().as('q');
    cy.get('@q').should('be.visible');
    cy.get('@q').clear({ force: true });
    cy.get('@q').type('police{enter}', { force: true });

    // ✅ Open Report click
    openReportButton()
      .should('be.visible')
      .click({ force: true });

    // optional viewer check
    cy.get('app-json-api-viewer', { timeout: 30000 })
      .should('exist')
      .and('be.visible');
  });

  // -----------------------------
  // IT: Stealer logs (IOCS) ✅ FIXED
  // -----------------------------
  it('Stealer logs: IOCS → search email → press collapse button', () => {
    cy.visit('/dashboard/profile/homepage');

    // open Stealer logs
    cy.contains('app-dashboard-sidebar-items', 'Stealer logs')
      .find('li > div')
      .first()
      .click({ force: true });

    // go to IOCS (if already on iocs page, no issue)
    cy.contains('app-dashboard-sidebar-items ul li div', 'IOCS')
      .scrollIntoView()
      .click({ force: true });

    // ✅ correct input for Stealer logs
    cy.get('input[name="searchQuery"][placeholder="Search..."]', { timeout: 30000 })
      .first()
      .as('q');

    cy.get('@q').should('be.visible');
    cy.get('@q').clear({ force: true });
    cy.get('@q').type('uwe.dippold@web.de{enter}', { force: true });

    // press the dash "collapse row" button
    cy.get('button[aria-label="Expand row"]', { timeout: 30000 })
      .should('exist')
      .and('be.visible')
      .click({ force: true });
  });

  // -----------------------------
  // IT: Web Scans (skip APK Scan) ✅ FIXED (Repository placeholder)
  // -----------------------------
  it('Web Scans: Basic / Port / Repository / SEO (skip APK) → search bbc.com', () => {
    cy.visit('/dashboard/profile/homepage');

    // open Web Scans
    cy.contains('app-dashboard-sidebar-items', 'Web Scans')
      .find('li > div')
      .first()
      .click({ force: true });

    const clickScanTab = (tabName: string) => {
      cy.contains('app-dashboard-sidebar-items ul li div', tabName)
        .scrollIntoView()
        .click({ force: true });
    };

    const runUrlScanSearch = (placeholder: 'Domain' | 'Repository', value: string) => {
      cy.get(`input[name="username"][placeholder="${placeholder}"]`, { timeout: 30000 })
        .first()
        .as('scanInput');

      cy.get('@scanInput').should('be.visible');
      cy.get('@scanInput').clear({ force: true });
      cy.get('@scanInput').type(value, { force: true });

      // button is often disabled until input is valid → wait until enabled then click
      cy.get('button')
        .contains(/^Search$/)
        .should('be.visible')
        .should('not.be.disabled')
        .click({ force: true });
    };

    // Basic Scan (Domain)
    clickScanTab('Basic Scan');
    runUrlScanSearch('Domain', 'bbc.com');

    // Port Scan (Domain)
    clickScanTab('Port Scan');
    runUrlScanSearch('Domain', 'bbc.com');

    // Repository Scan (Repository)
    clickScanTab('Repository Scan');
    runUrlScanSearch('Repository', 'bbc.com');

    // SEO Scan (Domain)
    clickScanTab('SEO Scan');
    runUrlScanSearch('Domain', 'bbc.com');

    // ✅ APK Scan intentionally skipped
  });

  // -----------------------------
  // IT: Entity API → Playstore Scanner ONLY ✅ (NO typing/search)
  // -----------------------------
  it('Entity API: Playstore Scanner (open only)', () => {
    cy.visit('/dashboard/profile/homepage');

    // Open Entity API dropdown
    cy.contains('app-dashboard-sidebar-items > li > div', 'Entity API')
      .scrollIntoView()
      .click({ force: true });

    // Open Playstore Scanner only (no input)
    cy.contains('app-dashboard-sidebar-items ul li div', 'Playstore Scanner')
      .scrollIntoView()
      .click({ force: true });

    // optional: confirm playstore input exists (means page opened)
  });

  // -----------------------------
  // IT: Dump → Listing → search leak
  // -----------------------------
  it('Dump: Listing → search leak → Search button', () => {
    cy.visit('/dashboard/profile/homepage');

    // open Dump
    cy.contains('app-dashboard-sidebar-items', 'Dump')
      .find('li > div')
      .first()
      .click({ force: true });

    // open Listing
    cy.contains('app-dashboard-sidebar-items ul li div', 'Listing')
      .scrollIntoView()
      .click({ force: true });

    // type leak
    cy.get('input[name="username"][placeholder="Search leak URL"]', { timeout: 30000 })
      .first()
      .as('leak');

    cy.get('@leak').should('be.visible');
    cy.get('@leak').clear({ force: true });
    cy.get('@leak').type('leak', { force: true });

    // click Search
    cy.contains('button', 'Search')
      .should('be.visible')
      .click({ force: true });
  });
});
