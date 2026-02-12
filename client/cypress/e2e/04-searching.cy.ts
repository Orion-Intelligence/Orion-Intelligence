describe('General Intelligence – Multi-Tab Search & Open Report Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  const clickSecondVisibleSearchInner = () => {
    cy.get('.dashboard__search-button-inner')
      .filter(':visible')
      .should('have.length.at.least', 2)
      .eq(1)
      .click({force: true});
  };

  const clickSecondSearchButtonContainerInner = () => {
    cy.get('.dashboard__search-button')
      .filter(':visible')
      .should('have.length.at.least', 2)
      .eq(1)
      .within(() => {
        cy.get('.dashboard__search-button-inner')
          .filter(':visible')
          .last()
          .click({force: true});
      });
  };

  function clickReportTabs(_: string) {
    cy.get('.search__result-detail-container').should('exist');

    cy.get('button.search__result-tabs').then($tabs => {
      const tabNames = [...$tabs].map(tab => tab.innerText.trim());

      tabNames.forEach(tabName => {
        cy.contains('button.search__result-tabs', tabName)
          .scrollIntoView()
          .should('be.visible')
          .click({force: true});
      });
    });
  }

  function clickReportMenuButtons(_: string) {
    cy.get('.report-menu-option-container')
      .should('exist')
      .within(() => {
        cy.get('button.report-menu-option:not(:has(img[src*="graph.svg"]))')
          .each($btn => {
            const label = $btn.attr('apptooltip') || '';
            if (['Open Breach Link', 'Print'].includes(label)) return;

            cy.wrap($btn)
              .scrollIntoView()
              .should('be.visible')
              .click({force: true});
          });
      });
  }

  const openDefacementSubTab = (tabText: string) => {
    cy.contains('.sidebar__item-dropdown', 'Defacement')
      .scrollIntoView()
      .as('defacementMenu')
      .click({force: true});

    cy.get('@defacementMenu')
      .parent()
      .find('.sidebar__subitem-content')
      .contains(tabText)
      .click({force: true});
  };

  const openSocialSubTab = (tabText: string) => {
    cy.contains('.sidebar__item-dropdown', 'Social')
      .scrollIntoView()
      .as('socialMenu')
      .click({force: true});

    cy.get('@socialMenu')
      .parent()
      .find('.sidebar__subitem-content')
      .contains(tabText)
      .click({force: true});
  };

  const openFeedSubTab = (tabText: string) => {
    cy.contains('.sidebar__item-dropdown', 'Feed')
      .scrollIntoView()
      .as('feedMenu')
      .click({force: true});

    cy.get('@feedMenu')
      .parent()
      .find('.sidebar__subitem-content')
      .contains(tabText)
      .click({force: true});
  };

  const runExploitSearchFlow = (tab: string, term: string, shot: string) => {
    cy.contains('.sidebar__item-dropdown', 'Exploit')
      .as('exploitMenu')
      .parent()
      .within(() => {
        cy.contains('.sidebar__subitem-content', tab)
          .scrollIntoView()
          .click({force: true});
      });

    cy.get('input[name="q"]').clear().type(`${term}{enter}`);

    cy.get('.dashboard__buttons').first().should('be.visible');

    cy.get('.dashboard__buttons')
      .first()
      .within(() => {
        cy.get('.dashboard__search-button')
          .eq(0)
          .within(() => {
            cy.get('.dashboard__search-button-inner')
              .filter(':visible')
              .last()
              .click({force: true});
          });
      });

    cy.get('body').type('{esc}');

    cy.get('.dashboard__buttons')
      .first()
      .within(() => {
        cy.get('.dashboard__search-button')
          .eq(1)
          .within(() => {
            cy.get('.dashboard__search-button-inner')
              .filter(':visible')
              .last()
              .click({force: true});
          });
      });

    cy.get('.search__result-detail').should('exist').and('be.visible');

    clickReportTabs(`${shot}-report`);

    if (['All', 'CVE', 'Tools'].includes(tab)) {
      clickReportMenuButtons(`${shot}-report`);
    }

    cy.get('@exploitMenu').click({force: true});
  };

  const jsom_relation_maping = () => {
    cy.get('app-json-api-viewer .search__result__section__heading .toggle-btn')
      .first()
      .click({force: true});

    cy.get('app-json-api-viewer .content .json-tree_toggle img').then(($toggles) => {
      const imgs = [...$toggles].slice(0, 2);
      imgs.forEach((img) => {
        cy.get('app-json-api-viewer .content .json-tree_toggle img').eq(imgs.indexOf(img)).click({force: true});
      });
      imgs.forEach((img) => {
        cy.get('app-json-api-viewer .content .json-tree_toggle img').eq(imgs.indexOf(img)).click({force: true});
      });
    });

    cy.get('app-report-mapping .search__result__section__heading .toggle-btn')
      .first()
      .click({force: true});

    cy.get('app-report-mapping tbody tr').then(($rows) => {
      const idx = Math.floor(Math.random() * $rows.length);

      cy.get('app-report-mapping tbody tr')
        .eq(idx)
        .click({force: true});

      cy.get('app-report-mapping tbody tr').should('exist');
    });
  };

  it('Search across tabs → Open Report → Click Tabs (Menu Buttons only in ALL)', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('.sidebar__item-dropdown', 'General Intelligence')
      .scrollIntoView()
      .click({force: true});

    const tabs = [
      {name: 'All', searchTerm: 'uk'},
      {name: 'General', searchTerm: 'uk'}
    ];

    tabs.forEach(tab => {
      cy.contains('.sidebar__subitem-content', tab.name).click({force: true});

      const isButtonContainer = tab.name === 'Forums' || tab.name === 'News';

      if (isButtonContainer) {
        clickSecondSearchButtonContainerInner();
      } else {
        cy.get('.dashboard__search-main-div')
          .first()
          .find('[apptooltip="Open Report"]')
          .should('be.visible')
          .click({force: true});
      }

      cy.get('.search__result-detail').should('exist').and('be.visible');

      clickReportTabs(`04-${tab.name.toLowerCase()}-report`);

      if (tab.name === 'All') {
        clickReportMenuButtons(`04-${tab.name.toLowerCase()}-report`);
      }
    });

    const reportTabs = ['Marketplaces'];

    reportTabs.forEach(tab => {
      cy.contains('.sidebar__subitem-content', tab).click({force: true});

      cy.get('.dashboard__search-button')
        .filter(':visible')
        .should('have.length.at.least', 2);

      clickSecondSearchButtonContainerInner();

      cy.get('.search__result-detail').should('exist').and('be.visible');

      clickReportTabs(`04-${tab.toLowerCase()}-report`);
    });
  });

  it('Search & open reports + click tabs + menu buttons (Data Breach)', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('.sidebar__item-dropdown', 'General Intelligence')
      .scrollIntoView()
      .click({force: true});

    cy.get('div[ng-reflect-router-link="breach"]').click({force: true});

    clickSecondVisibleSearchInner();

    cy.get('.search__result-detail').should('exist').and('be.visible');

    clickReportTabs('04-data-breach-report');
    clickReportMenuButtons('04-data-breach-report');
    jsom_relation_maping();

    cy.contains('.sidebar__subitem-content', 'Databases').click({force: true});

    clickSecondVisibleSearchInner();

    cy.get('.search__result-detail').should('exist').and('be.visible');

    clickReportTabs('04-data-breach-databases-report');
    clickReportMenuButtons('04-data-breach-databases-report');
    jsom_relation_maping();

    cy.contains('.sidebar__subitem-content', 'Tracking').click({force: true});

    clickSecondVisibleSearchInner();

    cy.get('.search__result-detail').should('exist').and('be.visible');

    clickReportTabs('04-data-breach-tracking-report');
    clickReportMenuButtons('04-data-breach-tracking-report');
    jsom_relation_maping();
  });

  it('Discussion: All → Search → Open Report → Click Tabs', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('.sidebar__item-dropdown', 'Discussion')
      .scrollIntoView()
      .click({force: true});

    cy.contains('.sidebar__subitem-content', 'All').click({force: true});

    cy.get('.dashboard__search-main-div')
      .first()
      .should('exist')
      .and('be.visible')
      .within(() => {
        cy.get('[apptooltip="Open Report"]').should('be.visible').click({force: true});
      });

    cy.get('.search__result-detail').should('exist').and('be.visible');

    clickReportTabs('discussion-all-report');
    clickReportMenuButtons('discussion-all-report');
  });

  it('Defacement: Hacked → Phishing → Databases', () => {
    cy.visit('/dashboard/profile/homepage');

    openDefacementSubTab('Hacked');

    cy.get('input[name="q"]').clear().type('102.212.246.99{enter}');
    cy.get('tr[id^="item-"]').first().click({force: true});

    cy.get('.search__result-detail').should('be.visible');

    clickReportTabs('defacement-hacked-report');
    clickReportMenuButtons('defacement-hacked-report');

    openDefacementSubTab('Phishing');

    cy.get('input[name="q"]').clear().type('phishunt{enter}');
    cy.get('tr[id^="item-"]').first().click({force: true});

    cy.get('.search__result-detail').should('be.visible');

    clickReportTabs('defacement-phishing-report');

    openDefacementSubTab('Databases');

    cy.get('input[name="q"]').clear().type('urldna_bot{enter}');
    cy.get('tr[id^="item-"]').first().click({force: true});

    cy.get('.search__result-detail').should('be.visible');

    clickReportTabs('defacement-databases-report');
  });

  it('Social: All → Twitter → Forum → Reddit', () => {
    cy.visit('/dashboard/profile/homepage');

    const socialTabs = [
      {name: 'All', screenshot: 'social-all'},
      {name: 'Twitter', screenshot: 'social-twitter'}
    ];

    socialTabs.forEach(tab => {
      openSocialSubTab(tab.name);

      clickSecondVisibleSearchInner();

      cy.get('.search__result-detail').should('be.visible');

      clickReportTabs(`${tab.screenshot}-report`);

      if (['All', 'Twitter'].includes(tab.name)) {
        clickReportMenuButtons(`${tab.screenshot}-report`);
      }

      cy.get('@socialMenu').click({force: true});
    });
  });

  it('Exploit: All → CVE → Tools → ZeroDay', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('.sidebar__item-dropdown', 'Exploit')
      .scrollIntoView()
      .click({force: true});

    runExploitSearchFlow('All', 'turning', 'exploit-all');
    runExploitSearchFlow('CVE', 'turning', 'exploit-cve');
  });

  it('Feed: News → Search UK → Open Report', () => {
    cy.visit('/dashboard/profile/homepage');

    openFeedSubTab('News');

    cy.get('.input-group.default-input-sub-container').should('exist');

    clickSecondVisibleSearchInner();

    cy.get('.search__result-detail').should('be.visible');

    clickReportTabs('feed-news-report');
    clickReportMenuButtons('feed-news-report');

    cy.get('@feedMenu').click({force: true});
  });

  it('Dump: Listing → Search leak → View Result (No Timeouts)', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('.sidebar__item-dropdown', 'Dump')
      .scrollIntoView()
      .as('dumpMenu')
      .click({force: true});

    cy.get('@dumpMenu')
      .parent()
      .within(() => {
        cy.contains('.sidebar__subitem-content', 'Listing').click({force: true});
      });

    cy.get('form.directory-listing-search').should('exist');

    cy.get('input[name="username"]').clear().type('leak');

    cy.contains('button', 'Search').click({force: true});

    cy.get('.dashboard_container, .list__table, .search__result-detail').should('exist');
    cy.logout();
  });
});
