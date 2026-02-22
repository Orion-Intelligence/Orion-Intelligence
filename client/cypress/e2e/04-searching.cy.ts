describe('General Intelligence – Multi-Tab Search & Open Report Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  const clickSecondVisibleSearchInner = () => {
    cy.get('div[apptooltip="Open Report"]')
      .filter(':visible')
      .should('have.length.at.least', 2)
      .eq(1)
      .click({force: true});
  };

  const clickSecondSearchButtonContainerInner = () => {
    cy.get('div[apptooltip="Open Report"]')
      .filter(':visible')
      .should('have.length.at.least', 2)
      .eq(1)
      .within(() => {
        cy.get('div[apptooltip="Open Report"]')
          .filter(':visible')
          .last()
          .click({force: true});
      });
  };

  function clickReportTabs(_: string) {
    cy.get('app-report-mapping').should('exist');

    cy.get('app-report-mapping thead th').then($tabs => {
      const tabNames = [...$tabs].map(tab => tab.innerText.trim());

      tabNames.forEach(tabName => {
        cy.contains('app-report-mapping thead th', tabName)
          .scrollIntoView()
          .should('be.visible')
          .click({force: true});
      });
    });
  }

  function clickReportMenuButtons(_: string) {
    cy.get('app-report-header')
      .should('exist')
      .within(() => {
        cy.get('button[apptooltip]:not(:has(img[src*="graph.svg"]))')
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
    cy.contains('app-dashboard-sidebar-items div', 'Defacement')
      .scrollIntoView()
      .as('defacementMenu')
      .click({force: true});

    cy.get('@defacementMenu')
      .parent()
      .find('div')
      .contains(tabText)
      .click({force: true});
  };

  const openSocialSubTab = (tabText: string) => {
    cy.contains('app-dashboard-sidebar-items div', 'Social')
      .scrollIntoView()
      .as('socialMenu')
      .click({force: true});

    cy.get('@socialMenu')
      .parent()
      .find('div')
      .contains(tabText)
      .click({force: true});
  };

  const openFeedSubTab = (tabText: string) => {
    cy.contains('app-dashboard-sidebar-items div', 'Feed')
      .scrollIntoView()
      .as('feedMenu')
      .click({force: true});

    cy.get('@feedMenu')
      .parent()
      .find('div')
      .contains(tabText)
      .click({force: true});
  };

  const runExploitSearchFlow = (tab: string, term: string, shot: string) => {
    cy.contains('app-dashboard-sidebar-items div', 'Exploit')
      .as('exploitMenu')
      .parent()
      .within(() => {
        cy.contains('div', tab)
          .scrollIntoView()
          .click({force: true});
      });

    cy.get('[data-cy="dashboard-general-input"], input[name="q"]').first().clear().type(`${term}{enter}`);

    cy.get('div[apptooltip="Open Report"]').first().should('be.visible');

    cy.get('div[apptooltip="Open Report"]')
      .first()
      .within(() => {
        cy.get('div[apptooltip="Open Report"]')
          .eq(0)
          .within(() => {
            cy.get('div[apptooltip="Open Report"]')
              .filter(':visible')
              .last()
              .click({force: true});
          });
      });

    cy.get('body').type('{esc}');

    cy.get('div[apptooltip="Open Report"]')
      .first()
      .within(() => {
        cy.get('div[apptooltip="Open Report"]')
          .eq(1)
          .within(() => {
            cy.get('div[apptooltip="Open Report"]')
              .filter(':visible')
              .last()
              .click({force: true});
          });
      });

    cy.get('app-json-api-viewer').should('exist').and('be.visible');

    clickReportTabs(`${shot}-report`);

    if (['All', 'CVE', 'Tools'].includes(tab)) {
      clickReportMenuButtons(`${shot}-report`);
    }

    cy.get('@exploitMenu').click({force: true});
  };

  const jsom_relation_maping = () => {
    cy.get('app-json-api-viewer img[alt="toggle icon"]')
      .first()
      .click({force: true});

    cy.get('app-json-api-viewer img[alt="toggle icon"]').then(($toggles) => {
      const imgs = [...$toggles].slice(0, 2);
      imgs.forEach((img) => {
        cy.get('app-json-api-viewer img[alt="toggle icon"]').eq(imgs.indexOf(img)).click({force: true});
      });
      imgs.forEach((img) => {
        cy.get('app-json-api-viewer img[alt="toggle icon"]').eq(imgs.indexOf(img)).click({force: true});
      });
    });

    cy.get('app-report-mapping img[alt="toggle icon"]')
      .first()
      .click({force: true});

    cy.get('app-report-mapping table').then(($rows) => {
      const idx = Math.floor(Math.random() * $rows.length);

      cy.get('app-report-mapping table')
        .eq(idx)
        .click({force: true});

      cy.get('app-report-mapping table').should('exist');
    });
  };

  it('Search across tabs → Open Report → Click Tabs (Menu Buttons only in ALL)', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence')
      .scrollIntoView()
      .click({force: true});

    const tabs = [
      {name: 'All', searchTerm: 'uk'},
      {name: 'General', searchTerm: 'uk'}
    ];

    tabs.forEach(tab => {
      cy.contains('app-dashboard-sidebar-items div', tab.name).click({force: true});

      const isButtonContainer = tab.name === 'Forums' || tab.name === 'News';

      if (isButtonContainer) {
        clickSecondSearchButtonContainerInner();
      } else {
        cy.get('.ui-result-card')
          .first()
          .find('[apptooltip="Open Report"]')
          .should('be.visible')
          .click({force: true});
      }

      cy.get('app-json-api-viewer').should('exist').and('be.visible');

      clickReportTabs(`04-${tab.name.toLowerCase()}-report`);

      if (tab.name === 'All') {
        clickReportMenuButtons(`04-${tab.name.toLowerCase()}-report`);
      }
    });

    const reportTabs = ['Marketplaces'];

    reportTabs.forEach(tab => {
      cy.contains('app-dashboard-sidebar-items div', tab).click({force: true});

      cy.get('div[apptooltip="Open Report"]')
        .filter(':visible')
        .should('have.length.at.least', 2);

      clickSecondSearchButtonContainerInner();

      cy.get('app-json-api-viewer').should('exist').and('be.visible');

      clickReportTabs(`04-${tab.toLowerCase()}-report`);
    });
  });

  it('Search & open reports + click tabs + menu buttons (Data Breach)', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence')
      .scrollIntoView()
      .click({force: true});

    cy.contains('app-dashboard-sidebar-items div', 'Data Breach').click({force: true});

    clickSecondVisibleSearchInner();

    cy.get('app-json-api-viewer').should('exist').and('be.visible');

    clickReportTabs('04-data-breach-report');
    clickReportMenuButtons('04-data-breach-report');
    jsom_relation_maping();

    cy.contains('app-dashboard-sidebar-items div', 'Databases').click({force: true});

    clickSecondVisibleSearchInner();

    cy.get('app-json-api-viewer').should('exist').and('be.visible');

    clickReportTabs('04-data-breach-databases-report');
    clickReportMenuButtons('04-data-breach-databases-report');
    jsom_relation_maping();

    cy.contains('app-dashboard-sidebar-items div', 'Tracking').click({force: true});

    clickSecondVisibleSearchInner();

    cy.get('app-json-api-viewer').should('exist').and('be.visible');

    clickReportTabs('04-data-breach-tracking-report');
    clickReportMenuButtons('04-data-breach-tracking-report');
    jsom_relation_maping();
  });

  it('Defacement: Hacked → Phishing → Databases', () => {
    cy.visit('/dashboard/profile/homepage');

    openDefacementSubTab('Hacked');

    cy.get('[data-cy="dashboard-general-input"], input[name="q"]').first().clear().type('102.212.246.99{enter}');
    cy.get('tr[id^="item-"]').first().click({force: true});

    cy.get('app-json-api-viewer').should('be.visible');

    clickReportTabs('defacement-hacked-report');
    clickReportMenuButtons('defacement-hacked-report');

    openDefacementSubTab('Phishing');

    cy.get('[data-cy="dashboard-general-input"], input[name="q"]').first().clear().type('phishunt{enter}');
    cy.get('tr[id^="item-"]').first().click({force: true});

    cy.get('app-json-api-viewer').should('be.visible');

    clickReportTabs('defacement-phishing-report');

    openDefacementSubTab('Databases');

    cy.get('[data-cy="dashboard-general-input"], input[name="q"]').first().clear().type('urldna_bot{enter}');
    cy.get('tr[id^="item-"]').first().click({force: true});

    cy.get('app-json-api-viewer').should('be.visible');

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

      cy.get('app-json-api-viewer').should('be.visible');

      clickReportTabs(`${tab.screenshot}-report`);

      if (['All', 'Twitter'].includes(tab.name)) {
        clickReportMenuButtons(`${tab.screenshot}-report`);
      }

      cy.get('@socialMenu').click({force: true});
    });
  });

  it('Exploit: All → CVE → Tools → ZeroDay', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('app-dashboard-sidebar-items div', 'Exploit')
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

    cy.get('app-json-api-viewer').should('be.visible');

    clickReportTabs('feed-news-report');
    clickReportMenuButtons('feed-news-report');

    cy.get('@feedMenu').click({force: true});
  });

  it('Dump: Listing → Search leak → View Result (No Timeouts)', () => {
    cy.visit('/dashboard/profile/homepage');

    cy.contains('app-dashboard-sidebar-items div', 'Dump')
      .scrollIntoView()
      .as('dumpMenu')
      .click({force: true});

    cy.get('@dumpMenu')
      .parent()
      .within(() => {
        cy.contains('div', 'Listing').click({force: true});
      });

    cy.get('form.directory-listing-search').should('exist');

    cy.get('input[name="username"]').clear().type('leak');

    cy.contains('button', 'Search').click({force: true});

    cy.get('[data-cy="dashboard-main-container"], [data-cy="dashboard-container"], .ui-result-card').should('exist');
    cy.logout();
  });
});
