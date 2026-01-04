describe('General Intelligence – Multi-Tab Search & Open Report Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  function clickReportTabs(reportName: string) {
    cy.get('.search__result-detail-container').should('exist');

    cy.get('button.search__result-tabs').then($tabs => {
      const tabNames = [...$tabs].map(tab => tab.innerText.trim());

      tabNames.forEach(tabName => {
        cy.contains('button.search__result-tabs', tabName)
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true });
      });
    });
  }

  function clickReportMenuButtons(reportName: string) {
    cy.get('.report-menu-option-container')
      .should('exist')
      .within(() => {
        cy.get('button.report-menu-option').each($btn => {
          const label = $btn.attr('apptooltip') || '';
          const skipButtons = ['Open Breach Link', 'Print'];

          if (skipButtons.includes(label)) {
            return;
          }

          cy.wrap($btn)
            .scrollIntoView()
            .should('be.visible')
            .click({ force: true });
        });
      });
  }

  it('Search across tabs → Open Report → Click Tabs (Menu Buttons only in ALL)', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('.sidebar__item-dropdown', 'General Intelligence')
      .scrollIntoView()
      .click({ force: true });

    const tabs = [
      { name: 'All', searchTerm: 'uk' },
      { name: 'General', searchTerm: 'uk' },
      { name: 'Forums', searchTerm: 'he' },
      { name: 'News', searchTerm: 'he' }
    ];

    tabs.forEach(tab => {
      cy.contains('.sidebar__subitem-content', tab.name)
        .click({ force: true });

      cy.get('input[name="q"]').clear().type(`${tab.searchTerm}{enter}`);

      const searchContainer =
        tab.name === 'Forums' || tab.name === 'News'
          ? '.dashboard__search-button'
          : '.dashboard__search-main-div';

      cy.get(searchContainer)
        .should('exist')
        .and('not.be.empty');

      const openReportSelector =
        tab.name === 'Forums' || tab.name === 'News'
          ? '.dashboard__search-button-inner'
          : '[apptooltip="Open Report"]';

      cy.get(searchContainer)
        .first()
        .find(openReportSelector)
        .should('be.visible')
        .click({ force: true });

      cy.get('.search__result-detail')
        .should('exist')
        .and('be.visible');

      clickReportTabs(`04-${tab.name.toLowerCase()}-report`);

      if (tab.name === 'All') {
        clickReportMenuButtons(`04-${tab.name.toLowerCase()}-report`);
      }
    });

    const reportTabs = ['Marketplaces', 'Cryptocurrency', 'Leaks'];

    reportTabs.forEach(tab => {
      cy.contains('.sidebar__subitem-content', tab)
        .click({ force: true });

      cy.get('input[name="q"]').clear().type('he{enter}');

      cy.get('.dashboard__search-button')
        .first()
        .should('be.visible');

      cy.get('div[apptooltip="Open Report"]')
        .first()
        .click({ force: true });

      cy.get('.search__result-detail')
        .should('exist')
        .and('be.visible');

      clickReportTabs(`04-${tab.toLowerCase()}-report`);
    });
  });

  it('Search & open reports + click tabs + menu buttons (Data Breach)', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('.sidebar__item-dropdown', 'General Intelligence')
      .scrollIntoView()
      .click({ force: true });

    cy.get('div[ng-reflect-router-link="breach"]').click({ force: true });

    cy.get('input[name="q"]').clear().type('uk{enter}');
    cy.get('.dashboard__search-button-inner').first().click({ force: true });

    cy.get('.search__result-detail').should('exist').and('be.visible');

    clickReportTabs('04-data-breach-report');
    clickReportMenuButtons('04-data-breach-report');

    cy.contains('.sidebar__subitem-content', 'Databases').click({ force: true });

    cy.get('input[name="q"]').clear().type('he{enter}');
    cy.get('.dashboard__search-button-inner').first().click({ force: true });

    cy.get('.search__result-detail').should('exist').and('be.visible');

    clickReportTabs('04-data-breach-databases-report');
    clickReportMenuButtons('04-data-breach-databases-report');

    cy.contains('.sidebar__subitem-content', 'Tracking').click({ force: true });

    cy.get('input[name="q"]').clear().type('uk{enter}');
    cy.get('.dashboard__search-button-inner').first().click({ force: true });

    cy.get('.search__result-detail').should('exist').and('be.visible');

    clickReportTabs('04-data-breach-tracking-report');
    clickReportMenuButtons('04-data-breach-tracking-report');
  });

  it('Discussion: All → Search → Open Report → Click Tabs', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('.sidebar__item-dropdown', 'Discussion')
      .scrollIntoView()
      .click({ force: true });

    cy.contains('.sidebar__subitem-content', 'All')
      .click({ force: true });

    cy.get('input[name="q"]')
      .clear()
      .type('uk{enter}');

    cy.get('.dashboard__search-main-div')
      .first()
      .should('exist')
      .and('be.visible');

    cy.get('.dashboard__search-main-div')
      .first()
      .within(() => {
        cy.get('[apptooltip="Open Report"]')
          .should('be.visible')
          .click({ force: true });
      });

    cy.get('.search__result-detail')
      .should('exist')
      .and('be.visible');

    clickReportTabs('discussion-all-report');
    clickReportMenuButtons('discussion-all-report');
  });

  const openDefacementSubTab = (tabText: string) => {
    cy.contains('.sidebar__item-dropdown', 'Defacement')
      .scrollIntoView()
      .as('defacementMenu')
      .click({ force: true });

    cy.get('@defacementMenu')
      .parent()
      .find('.sidebar__subitem-content')
      .contains(tabText)
      .click({ force: true });
  };

  it('Defacement: Hacked → Phishing → Databases', () => {
    cy.visit('/dashboard/profile/homepage');

    openDefacementSubTab('Hacked');

    cy.get('input[name="q"]').clear().type('128.201.75.82{enter}');
    cy.get('tr[id^="item-"]').first().click({ force: true });

    cy.get('.search__result-detail').should('be.visible');

    clickReportTabs('defacement-hacked-report');
    clickReportMenuButtons('defacement-hacked-report');

    openDefacementSubTab('Phishing');

    cy.get('input[name="q"]').clear().type('masaomi346{enter}');
    cy.get('tr[id^="item-"]').first().click({ force: true });

    cy.get('.search__result-detail').should('be.visible');

    clickReportTabs('defacement-phishing-report');

    openDefacementSubTab('Databases');

    cy.get('input[name="q"]').clear().type('urldna_bot{enter}');
    cy.get('tr[id^="item-"]').first().click({ force: true });

    cy.get('.search__result-detail').should('be.visible');

    clickReportTabs('defacement-databases-report');
  });

  const openSocialSubTab = (tabText: string) => {
    cy.contains('.sidebar__item-dropdown', 'Social')
      .scrollIntoView()
      .as('socialMenu')
      .click({ force: true });

    cy.get('@socialMenu')
      .parent()
      .find('.sidebar__subitem-content')
      .contains(tabText)
      .click({ force: true });
  };

  it('Social: All → Twitter → Forum → Reddit', () => {
    cy.visit('/dashboard/profile/homepage');

    const socialTabs = [
      { name: 'All', screenshot: 'social-all' },
      { name: 'Twitter', screenshot: 'social-twitter' },
      { name: 'Forum', screenshot: 'social-forum' },
      { name: 'Reddit', screenshot: 'social-reddit' }
    ];

    socialTabs.forEach(tab => {
      openSocialSubTab(tab.name);

      cy.get('input[name="q"]').clear().type('uk{enter}');
      cy.get('.dashboard__search-button-inner').first().should('be.visible');

      cy.get('.dashboard__search-button-inner').first().click({ force: true });

      cy.get('.search__result-detail').should('be.visible');

      clickReportTabs(`${tab.screenshot}-report`);

      if (['All', 'Twitter'].includes(tab.name)) {
        clickReportMenuButtons(`${tab.screenshot}-report`);
      }

      cy.get('@socialMenu').click({ force: true });
    });
  });

  const runExploitSearchFlow = (tab: string, term: string, shot: string) => {
    cy.contains('.sidebar__item-dropdown', 'Exploit')
      .as('exploitMenu')
      .parent()
      .within(() => {
        cy.contains('.sidebar__subitem-content', tab)
          .scrollIntoView()
          .click({ force: true });
      });

    cy.get('input[name="q"]').clear().type(`${term}{enter}`);

    cy.get('.dashboard__buttons').first().should('be.visible');

    cy.get('.dashboard__buttons').first().within(() => {
      cy.get('.dashboard__search-button')
        .eq(0)
        .find('.dashboard__search-button-inner')
        .click({ force: true });
    });

    cy.get('body').type('{esc}');

    cy.get('.dashboard__buttons').first().within(() => {
      cy.get('.dashboard__search-button')
        .eq(1)
        .find('.dashboard__search-button-inner')
        .click({ force: true });
    });

    cy.get('.search__result-detail')
      .should('exist')
      .and('be.visible');

    clickReportTabs(`${shot}-report`);

    if (['All', 'CVE', 'Tools'].includes(tab)) {
      clickReportMenuButtons(`${shot}-report`);
    }

    cy.get('@exploitMenu').click({ force: true });
  };

  it('Exploit: All → CVE → Tools → ZeroDay', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('.sidebar__item-dropdown', 'Exploit')
      .scrollIntoView()
      .click({ force: true });

    runExploitSearchFlow('All', 'turning', 'exploit-all');
    runExploitSearchFlow('CVE', 'turning', 'exploit-cve');
    runExploitSearchFlow('Tools', 'Salty', 'exploit-tools');
    runExploitSearchFlow('ZeroDay', 'turning', 'exploit-zeroday');
  });

  const openFeedSubTab = (tabText: string) => {
    cy.contains('.sidebar__item-dropdown', 'Feed')
      .scrollIntoView()
      .as('feedMenu')
      .click({ force: true });

    cy.get('@feedMenu')
      .parent()
      .find('.sidebar__subitem-content')
      .contains(tabText)
      .click({ force: true });
  };

  it('Feed: News → Search UK → Open Report', () => {
    cy.visit('/dashboard/profile/homepage');

    openFeedSubTab('News');

    cy.get('.input-group.default-input-sub-container').should('exist');

    cy.get('input[name="q"]').clear().type('uk{enter}');

    cy.get('.dashboard__search-button-inner').first().should('be.visible');

    cy.get('.dashboard__search-button-inner').first().click({ force: true });

    cy.get('.search__result-detail').should('be.visible');

    clickReportTabs('feed-news-report');
    clickReportMenuButtons('feed-news-report');

    cy.get('@feedMenu').click({ force: true });
  });

  it('Dump: Listing → Search leak → View Result (No Timeouts)', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('.sidebar__item-dropdown', 'Dump')
      .scrollIntoView()
      .as('dumpMenu')
      .click({ force: true });

    cy.get('@dumpMenu')
      .parent()
      .within(() => {
        cy.contains('.sidebar__subitem-content', 'Listing')
          .click({ force: true });
      });

    cy.get('form.directory-listing-search')
      .should('exist');

    cy.get('input[name="username"]')
      .clear()
      .type('leak');

    cy.contains('button', 'Search')
      .click({ force: true });

    cy.get('.dashboard_container, .list__table, .search__result-detail')
      .should('exist');
  });
});
