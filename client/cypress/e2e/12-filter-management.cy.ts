describe('General Intelligence – Full Filters + Tools + Auto-Apply Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Apply ALL filters, auto-apply network, safe search, date, content type', () => {


    cy.visit('/dashboard');
    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({ force: true });



    cy.contains('span', 'Advance')
      .parent()
      .find('input[type="checkbox"]')
      .should('exist')
      .check({ force: true });

    cy.get('app-search-filters', { timeout: 10000 }).should('be.visible');


    const applyFilter = (name: string, value: string) => {
      cy.contains('app-search-filters div', name)
        .scrollIntoView()
        .click({ force: true });

      cy.get('app-search-filters input[placeholder="Enter entity"]')
        .clear()
        .type(value);

      cy.get('app-search-filters input[placeholder="Enter entity"] + span').click({ force: true });

    };


    const filters: [string, string][] = [
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
      ['Credit Cards', '4111111111111111']
    ];

    filters.forEach(([name, value]) => applyFilter(name, value));


    cy.contains('app-search-filters button', 'Clear Selection').should('exist').click({ force: true });


    cy.contains('button', 'Tools').scrollIntoView().click({ force: true });


    const sortOptions = ['Newest first', 'Oldest first'];
    sortOptions.forEach(option => {
      cy.contains('button', 'sort by').click({ force: true });
      cy.contains('.ui-result-dropdown-item', option).click({ force: true });
      cy.get('[data-cy="dashboard-general-input"]').type('{enter}');

    });

    const searchByOptions = [
      'Match Semantic',
      'Match any term (OR)',
      'Match indivisual terms (AND)',
      'Match full query (AND)'
    ];

    searchByOptions.forEach(option => {
      cy.contains('button', 'search by').click({ force: true });
      cy.contains('.ui-result-dropdown-item', option).click({ force: true });
      cy.get('[data-cy="dashboard-general-input"]').clear().type('test query{enter}');

    });


    const openFilters = () => {
      cy.contains('label', 'Filter').click({ force: true });
      cy.get('app-filters').should('be.visible');
    };

    openFilters();


    const networkOptions = ['All', 'Onion'];
    networkOptions.forEach(option => {
      cy.get('app-filters select[name="network"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    const safeSearchOptions = ['Yes', 'No'];
    safeSearchOptions.forEach(option => {
      cy.get('app-filters select[name="safe"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    const selectDateRange = () => {

      cy.contains('button', 'Select date range').click({ force: true });


      cy.contains('button', '1').click({ force: true });

      cy.contains('button', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    };
    selectDateRange();


    const contentTypes = [
      'All','Breach','Credential','Ransomware'
    ];

    contentTypes.forEach(option => {
      cy.get('app-filters select[name="content"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    cy.get('form button[type="submit"]').first().click({ force: true });

  });

});


describe('Data Breach – Full Filters + Auto-Apply Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Apply ALL filters, network, safe search, date, content type in Data Breach tab', () => {


    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Data Breach')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]').should('be.visible');


    cy.contains('span', 'Advance')
      .parent()
      .find('input[type="checkbox"]')
      .should('exist')
      .check({ force: true });



    const openFilters = () => {
      cy.contains('label', 'Filter').click({ force: true });
      cy.get('app-filters').should('be.visible');
    };

    openFilters();


    const networkOptions = ['All', 'Onion'];
    networkOptions.forEach(option => {
      cy.get('app-filters select[name="network"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });
      openFilters();
    });


    const safeSearchOptions = ['Yes', 'No'];
    safeSearchOptions.forEach(option => {
      cy.get('app-filters select[name="safe"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });
      openFilters();
    });


    const selectDateRange = () => {
      cy.contains('button', 'Select date range').click({ force: true });


      cy.contains('button', '1').click({ force: true });

      cy.contains('button', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });
      openFilters();
    };
    selectDateRange();

    cy.contains('button', 'Select date range').click({ force: true });
    cy.contains('button', 'Clear').click({ force: true });



    const contentTypes = [
      'All','Breach','Credential','Ransomware'
    ];

    contentTypes.forEach(option => {
      cy.get('app-filters select[name="content_type"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });
      openFilters();
    });


    cy.get('form button[type="submit"]').first().click({ force: true });

  });

});






describe('Defacement – Full Filters Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Apply all filters in Defacement with auto-apply', () => {


    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Defacement')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible');


    const openFilters = () => {
      cy.contains('label', 'Filter')
        .click({ force: true });
      cy.get('app-filters')
        .should('be.visible');
    };
    openFilters();


    const selectDateRange = () => {
      cy.contains('button', 'Select date range').click({ force: true });

      cy.contains('button', '1').click({ force: true });

      cy.contains('button', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });


      cy.contains('button', 'Select date range').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });

      openFilters();
    };
    selectDateRange();


    const networkOptions = ['All', 'Onion'];
    networkOptions.forEach(option => {
      cy.get('app-filters select[name="network"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    cy.get('form button[type="submit"]').first().click({ force: true });

  });

});




describe('Social – Full Filters Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Apply all filters in Social with auto-apply', () => {


    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Social')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible');


    const openFilters = () => {
      cy.contains('label', 'Filter')
        .click({ force: true });
      cy.get('app-filters')
        .should('be.visible');
    };
    openFilters();


    const selectDateRange = () => {
      cy.contains('button', 'Select date range').click({ force: true });

      cy.contains('button', '1').click({ force: true });

      cy.contains('button', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });


      cy.contains('button', 'Select date range').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });

      openFilters();
    };
    selectDateRange();


    const networkOptions = ['All', 'Onion'];
    networkOptions.forEach(option => {
      cy.get('app-filters select[name="network"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    const contentTypes = [
      'All','Breach','Credential','Ransomware'
    ];

    contentTypes.forEach(option => {
      cy.get('app-filters select[name="content"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    cy.get('form button[type="submit"]').first().click({ force: true });

  });

});




describe('Exploit – Full Filters Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Apply all filters in Exploit with auto-apply', () => {


    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Exploit')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible');


    const openFilters = () => {
      cy.contains('label', 'Filter')
        .click({ force: true });
      cy.get('app-filters')
        .should('be.visible');
    };
    openFilters();


    const selectDateRange = () => {
      cy.contains('button', 'Select date range').click({ force: true });

      cy.contains('button', '1').click({ force: true });

      cy.contains('button', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });


      cy.contains('button', 'Select date range').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });

      openFilters();
    };
    selectDateRange();

    const contentTypes = [
      'All','Breach','Credential','Ransomware'
    ];

    contentTypes.forEach(option => {
      cy.get('app-filters select[name="content"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    const networkOptions = ['All', 'Onion'];
    networkOptions.forEach(option => {
      cy.get('app-filters select[name="network"]').select(option, { force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    cy.get('form button[type="submit"]').first().click({ force: true });

  });

});














