const closeFiltersPanelIfOpen = () => {
  cy.get('body').then(($body) => {
    const closeImg = $body.find('app-filters img[alt="close"]');
    if (closeImg.length) {
      cy.wrap(closeImg.first()).scrollIntoView().click();
    }
  });
};

describe('General Intelligence – Full Filters + Tools + Auto-Apply Flow', () => {

  it('Apply ALL filters, auto-apply network, safe search, date, content type', () => {
    cy.logoutIfLoggedIn();
    cy.loginAsAdmin();
    cy.visit('/dashboard');


    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence', {timeout: 30000})

      .should('be.visible')
      .scrollIntoView().click();


    cy.get('[data-cy="dashboard-general-input"]', {timeout: 30000})
      .should('be.visible')
      .scrollIntoView().click();


    cy.contains('span', 'Advance', {timeout: 30000})
      .parent()
      .find('input[type="checkbox"]')
      .should('exist')
      .scrollIntoView().check();

    cy.get('app-search-filters', {timeout: 20000}).should('be.visible');


    const applyEntityFilter = (name: string, value: string) => {
      cy.contains('app-search-filters div', name, {timeout: 20000})
        .should('exist')
        .scrollIntoView()
        .scrollIntoView().click();

      cy.get('app-search-filters input[placeholder="Enter entity"]', {timeout: 20000})
        .scrollIntoView()
        .scrollIntoView().clear()
        .scrollIntoView().type();

      cy.get('app-search-filters input[placeholder="Enter entity"] + span', {timeout: 20000})
        .should('be.visible')
        .scrollIntoView().click();
    };


    const entityFilters: [string, string][] = [
      ['Phone Numbers', '+923001234567'],
      ['Emails', 'test@example.com'],
      ['Domains', 'example.com'],
      ['Country', 'Pakistan'],
      ['URLs', 'https://example.com'],
      ['CVE & CWE', 'CVE-2024-1111'],
      ['IP Addresses', '8.8.8.8'],
      ['YARA Rules', 'rule malicious_test'],
      ['Encoded URLs', 'aHR0cHM6Ly9leGFtcGxlLmNvbQ=='],
      ['File Paths', '/var/log/syslog'],
      ['Credit Cards', '4111111111111111'],
    ];

    entityFilters.forEach(([name, value]) => applyEntityFilter(name, value));


    cy.contains('app-search-filters button', 'Clear Selection', {timeout: 20000})
      .scrollIntoView()
      .scrollIntoView().click();


    cy.contains('button', 'Tools', {timeout: 20000})
      .scrollIntoView()
      .scrollIntoView().click();
    cy.contains('button', 'sort by', {timeout: 20000}).scrollIntoView().should('exist');


    ['Newest first', 'Oldest first'].forEach((option) => {
      cy.contains('button', 'sort by', {timeout: 20000})
        .scrollIntoView()
        .scrollIntoView().click();

      cy.get('.ui-result-dropdown-panel', {timeout: 20000}).should('exist');
      cy.contains('.ui-result-dropdown-panel button', option, {timeout: 20000})
        .scrollIntoView()
        .scrollIntoView().click();

      cy.get('[data-cy="dashboard-general-input"]', {timeout: 20000}).type('{enter}');
    });


    [
      'Match Semantic',
      'Match any term (OR)',
      'Match indivisual terms (AND)',
      'Match full query (AND)',
    ].forEach((option) => {
      cy.contains('button', 'search by', {timeout: 20000})
        .scrollIntoView()
        .scrollIntoView().click();

      cy.get('.ui-result-dropdown-panel', {timeout: 20000}).should('exist');
      cy.contains('.ui-result-dropdown-panel button', option, {timeout: 20000})
        .scrollIntoView()
        .scrollIntoView().click();

      cy.get('[data-cy="dashboard-general-input"]', {timeout: 20000})
        .should('be.visible')
        .clear()
        .type('test query{enter}');
    });


    const openFilters = () => {
      cy.contains('label', 'Filter', {timeout: 20000})
        .scrollIntoView()
        .scrollIntoView().click();

      cy.get('app-filters', {timeout: 20000}).should('exist');
    };

    const clickFiltersApply = () => {
      cy.get('app-filters', {timeout: 20000})
        .contains('button', 'Apply', {matchCase: false})
        .scrollIntoView()
        .scrollIntoView().click();
    };


    openFilters();


    const safeSearchOptions = ['Yes', 'No'];
    safeSearchOptions.forEach((option) => {
      cy.contains('app-filters label', 'Safe Search', {timeout: 30000})
        .parent()
        .find('select')
        .scrollIntoView().select();

      clickFiltersApply();
      openFilters();
    });


    cy.contains('app-filters button', 'Select date range', {timeout: 30000})
      .should('be.visible')
      .scrollIntoView().click();

    cy.contains('button', '1', {timeout: 20000}).scrollIntoView().click();
    cy.contains('button', '25', {timeout: 20000}).scrollIntoView().click();


    cy.get('app-filters', {timeout: 20000})
      .contains('button', 'Apply', {matchCase: false})
      .scrollIntoView()
      .scrollIntoView().click();

    openFilters();


    const contentTypes = ['All', 'Breach', 'Credential', 'Ransomware'];
    contentTypes.forEach((option) => {
      cy.contains('app-filters label', 'Content Type', {timeout: 30000})
        .parent()
        .find('select')
        .scrollIntoView().select();

      clickFiltersApply();
      openFilters();
    });


    cy.get('form button[type="submit"]', {timeout: 20000})
      .first()
      .should('be.visible')
      .scrollIntoView().click();
  closeFiltersPanelIfOpen();
  cy.logoutIfLoggedIn();
});


  describe('Data Breach – Full Filters + Auto-Apply Flow', () => {

    it('Apply ALL filters, network, safe search, date, content type in Data Breach tab', () => {

    closeFiltersPanelIfOpen();
    cy.logoutIfLoggedIn();
      cy.loginAsAdmin();

      cy.visit('/dashboard');

      cy.contains('app-dashboard-sidebar-items div', 'Data Breach')

        .scrollIntoView().click();

      cy.get('[data-cy="dashboard-general-input"]').should('be.visible');


      cy.contains('span', 'Advance')
        .parent()
        .find('input[type="checkbox"]')
        .should('exist')
        .scrollIntoView().check();


      const openFilters = () => {
        cy.contains('label', 'Filter').scrollIntoView().scrollIntoView().click();
        cy.get('app-filters').should('exist');
      };

      openFilters();


      const networkOptions = ['All', 'Onion'];
      networkOptions.forEach(option => {
      cy.contains('app-filters label', 'Network Type')
        .parent()
        .find('select')
        .scrollIntoView().select();
        cy.contains('button', 'Apply').scrollIntoView().click();
        openFilters();
      });


      const safeSearchOptions = ['Yes', 'No'];
      safeSearchOptions.forEach(option => {
        cy.contains('app-filters label', 'Safe Search')
          .parent()
          .find('select')
          .scrollIntoView().select();
        cy.contains('button', 'Apply').scrollIntoView().click();
        openFilters();
      });


      const selectDateRange = () => {
        cy.contains('button', 'Select date range').scrollIntoView().click();


        cy.contains('button', '1').scrollIntoView().click();

        cy.contains('button', '25').scrollIntoView().click();

        cy.contains('button', 'Apply').scrollIntoView().click();
        openFilters();
      };
      selectDateRange();

      cy.contains('button', 'Reset').scrollIntoView().click();


      const contentTypes = [
        'All', 'Breach', 'Credential', 'Ransomware'
      ];

      contentTypes.forEach(option => {
        cy.contains('app-filters label', 'Content Type')
          .parent()
          .find('select')
          .scrollIntoView().select();
        cy.contains('button', 'Apply').scrollIntoView().click();
        openFilters();
      });


      cy.get('form button[type="submit"]').first().scrollIntoView().click();
    closeFiltersPanelIfOpen();
    cy.logoutIfLoggedIn();

    });

  });


  describe('Defacement – Full Filters Flow', () => {

    it('Apply all filters in Defacement with auto-apply', () => {

    closeFiltersPanelIfOpen();
    cy.logoutIfLoggedIn();
      cy.loginAsAdmin();

      cy.visit('/dashboard');

      cy.contains('app-dashboard-sidebar-items div', 'Defacement')

        .scrollIntoView().click();

      cy.get('[data-cy="dashboard-general-input"]')
        .should('be.visible');


      const openFilters = () => {
        cy.contains('label', 'Filter')
          .scrollIntoView()
          .scrollIntoView().click();
        cy.get('app-filters')
          .should('exist');
      };
      openFilters();


      const selectDateRange = () => {
        cy.contains('button', 'Select date range').scrollIntoView().click();

        cy.contains('button', '1').scrollIntoView().click();

        cy.contains('button', '25').scrollIntoView().click();

        cy.contains('button', 'Apply').scrollIntoView().click();


        cy.contains('button', 'Reset').scrollIntoView().click();

        openFilters();
      };
      selectDateRange();


      const networkOptions = ['All', 'Onion'];
      networkOptions.forEach(option => {
      cy.contains('app-filters label', 'Network Type')
        .parent()
        .find('select')
        .scrollIntoView().select();
        cy.contains('button', 'Apply').scrollIntoView().click();

        openFilters();
      });


      cy.get('form button[type="submit"]').first().scrollIntoView().click();
    closeFiltersPanelIfOpen();
    cy.logoutIfLoggedIn();

    });

  });


  describe('Social – Full Filters Flow', () => {

    it('Apply all filters in Social with auto-apply', () => {

      cy.logoutIfLoggedIn();
      cy.loginAsAdmin();

      cy.visit('/dashboard');

      cy.contains('app-dashboard-sidebar-items div', 'Social')

        .scrollIntoView().click();

      cy.get('[data-cy="dashboard-general-input"]')
        .should('be.visible');


      const openFilters = () => {
        cy.contains('label', 'Filter')
          .scrollIntoView()
          .scrollIntoView().click();
        cy.get('app-filters')
          .should('exist');
      };
      openFilters();


      const selectDateRange = () => {
        cy.contains('button', 'Select date range').scrollIntoView().click();

        cy.contains('button', '1').scrollIntoView().click();

        cy.contains('button', '25').scrollIntoView().click();

        cy.contains('button', 'Apply').scrollIntoView().click();


        cy.contains('button', 'Reset').scrollIntoView().click();

        openFilters();
      };
      selectDateRange();


      const networkOptions = ['All', 'Onion'];
      networkOptions.forEach(option => {
      cy.contains('app-filters label', 'Network Type')
        .parent()
        .find('select')
        .scrollIntoView().select();
        cy.contains('button', 'Apply').scrollIntoView().click();

        openFilters();
      });


      const contentTypes = [
        'All', 'Breach', 'Credential', 'Ransomware'
      ];

      contentTypes.forEach(option => {
        cy.contains('app-filters label', 'Content Type')
          .parent()
          .find('select')
          .scrollIntoView().select();
        cy.contains('button', 'Apply').scrollIntoView().click();

        openFilters();
      });


      cy.get('form button[type="submit"]').first().scrollIntoView().click();
      cy.logoutIfLoggedIn();

    });

  });


  describe('Exploit – Full Filters Flow', () => {

    it('Apply all filters in Exploit with auto-apply', () => {

      cy.logoutIfLoggedIn();
      cy.loginAsAdmin();

      cy.visit('/dashboard');

      cy.contains('app-dashboard-sidebar-items div', 'Exploit')

        .scrollIntoView().click();

      cy.get('[data-cy="dashboard-general-input"]')
        .should('be.visible');


      const openFilters = () => {
        cy.contains('label', 'Filter')
          .scrollIntoView()
          .scrollIntoView().click();
        cy.get('app-filters')
          .should('exist');
      };
      openFilters();


      const selectDateRange = () => {
        cy.contains('button', 'Select date range').scrollIntoView().click();

        cy.contains('button', '1').scrollIntoView().click();

        cy.contains('button', '25').scrollIntoView().click();

        cy.contains('button', 'Apply').scrollIntoView().click();


        cy.contains('button', 'Reset').scrollIntoView().click();

        openFilters();
      };
      selectDateRange();

      const contentTypes = [
        'All', 'Breach', 'Credential', 'Ransomware'
      ];

      contentTypes.forEach(option => {
        cy.contains('app-filters label', 'Content Type')
          .parent()
          .find('select')
          .scrollIntoView().select();
        cy.contains('button', 'Apply').scrollIntoView().click();

        openFilters();
      });


      const networkOptions = ['All', 'Onion'];
      networkOptions.forEach(option => {
      cy.contains('app-filters label', 'Network Type')
        .parent()
        .find('select')
        .scrollIntoView().select();
        cy.contains('button', 'Apply').scrollIntoView().click();

        openFilters();
      });


      cy.get('form button[type="submit"]').first().scrollIntoView().click();
      cy.logoutIfLoggedIn();

    });

  });
});
