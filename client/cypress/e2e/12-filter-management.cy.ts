describe('General Intelligence – Full Filters + Tools + Auto-Apply Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Apply ALL filters, auto-apply network, safe search, date, content type', () => {


    cy.visit('/dashboard');
    cy.contains('div.sidebar__item-dropdown', 'General Intelligence')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({ force: true });



    cy.get('label.small-switch input[type="checkbox"]')
      .should('exist')
      .check({ force: true });

    cy.get('.filters-overlay', { timeout: 10000 }).should('be.visible');


    const applyFilter = (name: string, value: string) => {
      cy.contains('.filter-panel__category-tab', name)
        .scrollIntoView()
        .click({ force: true });

      cy.get('.filter-panel__input-row input[type="text"]')
        .clear()
        .type(value);

      cy.get('.filter-add__icon').click({ force: true });

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


    cy.get('button.selected-filter-bar__clear-btn').should('exist').click({ force: true });


    cy.contains('span', 'Tools').scrollIntoView().click({ force: true });


    const sortOptions = ['Newest first', 'Oldest first'];
    sortOptions.forEach(option => {
      cy.get('#dropdownMenu1').click({ force: true });
      cy.contains('.dropdown-item', option).click({ force: true });
      cy.get('[data-cy="dashboard-general-input"]').type('{enter}');

    });

    const searchByOptions = [
      'Match Semantic',
      'Match any term (OR)',
      'Match indivisual terms (AND)',
      'Match full query (AND)'
    ];

    searchByOptions.forEach(option => {
      cy.get('#dropdownMenu2').click({ force: true });
      cy.contains('.dropdown-item', option).click({ force: true });
      cy.get('[data-cy="dashboard-general-input"]').clear().type('test query{enter}');

    });


    const openFilters = () => {
      cy.get('div.filter-button-wrapper label.filters-button').click({ force: true });
      cy.get('form.sidebar_form').should('be.visible');
    };

    openFilters();


    const networkOptions = ['All', 'Onion'];
    networkOptions.forEach(option => {
      cy.get('#dropdownnetwork').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    const safeSearchOptions = ['Yes', 'No'];
    safeSearchOptions.forEach(option => {
      cy.get('#dropdownsafe').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    const selectDateRange = () => {

      cy.get('.sidebar_input_date-button').click({ force: true });


      cy.contains('span.custom-day', '1').click({ force: true });

      cy.contains('span.custom-day', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    };
    selectDateRange();


    const contentTypes = [
      'All','Breach','Credential','Ransomware'
    ];

    contentTypes.forEach(option => {
      cy.get('#dropdowncontent').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    cy.get('button.default-input-button[type="submit"]').click({ force: true });

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

    cy.contains('div.sidebar__item-dropdown', 'Data Breach')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]').should('be.visible');


    cy.get('label.small-switch input[type="checkbox"]')
      .should('exist')
      .check({ force: true });



    const openFilters = () => {
      cy.get('div.filter-button-wrapper label.filters-button').click({ force: true });
      cy.get('form.sidebar_form').should('be.visible');
    };

    openFilters();


    const networkOptions = ['All', 'Onion'];
    networkOptions.forEach(option => {
      cy.get('#dropdownnetwork').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      openFilters();
    });


    const safeSearchOptions = ['Yes', 'No'];
    safeSearchOptions.forEach(option => {
      cy.get('#dropdownsafe').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      openFilters();
    });


    const selectDateRange = () => {
      cy.get('.sidebar_input_date-button').click({ force: true });


      cy.contains('span.custom-day', '1').click({ force: true });

      cy.contains('span.custom-day', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });
      openFilters();
    };
    selectDateRange();

    cy.get('.sidebar_input_date-button').click({ force: true });
    cy.contains('button', 'Clear').click({ force: true });



    const contentTypes = [
      'All','Breach','Credential','Ransomware'
    ];

    contentTypes.forEach(option => {
      cy.get('#dropdowncontent').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      openFilters();
    });


    cy.get('button.default-input-button[type="submit"]').click({ force: true });

  });

});






describe('Discussion – Full Filters Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Apply all filters in Discussion with auto-apply', () => {

    cy.visit('/dashboard');

    cy.contains('div.sidebar__item-dropdown', 'Discussion')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible');


    const openFilters = () => {
      cy.get('div.filter-button-wrapper label.filters-button')
        .click({ force: true });
      cy.get('form.sidebar_form')
        .should('be.visible');
    };
    openFilters();


    const selectMessageDate = () => {
      cy.get('.sidebar_input_date-button').click({ force: true });

      cy.contains('span.custom-day', '1').click({ force: true });

      cy.contains('span.custom-day', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });


      cy.get('.sidebar_input_date-button').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });
      openFilters();
    };
    selectMessageDate();


    const contentTypes = [
      'All','Breach','Credential','Ransomware'
    ];

    contentTypes.forEach(option => {
      cy.get('#dropdowncontent').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    cy.get('button.default-input-button[type="submit"]').click({ force: true });

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

    cy.contains('div.sidebar__item-dropdown', 'Defacement')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible');


    const openFilters = () => {
      cy.get('div.filter-button-wrapper label.filters-button')
        .click({ force: true });
      cy.get('form.sidebar_form')
        .should('be.visible');
    };
    openFilters();


    const selectDateRange = () => {
      cy.get('.sidebar_input_date-button').click({ force: true });

      cy.contains('span.custom-day', '1').click({ force: true });

      cy.contains('span.custom-day', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });


      cy.get('.sidebar_input_date-button').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });

      openFilters();
    };
    selectDateRange();


    const networkOptions = ['All', 'Onion'];
    networkOptions.forEach(option => {
      cy.get('#dropdownnetwork').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    cy.get('button.default-input-button[type="submit"]').click({ force: true });

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

    cy.contains('div.sidebar__item-dropdown', 'Social')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible');


    const openFilters = () => {
      cy.get('div.filter-button-wrapper label.filters-button')
        .click({ force: true });
      cy.get('form.sidebar_form')
        .should('be.visible');
    };
    openFilters();


    const selectDateRange = () => {
      cy.get('.sidebar_input_date-button').click({ force: true });

      cy.contains('span.custom-day', '1').click({ force: true });

      cy.contains('span.custom-day', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });


      cy.get('.sidebar_input_date-button').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });

      openFilters();
    };
    selectDateRange();


    const networkOptions = ['All', 'Onion'];
    networkOptions.forEach(option => {
      cy.get('#dropdownnetwork').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    const contentTypes = [
      'All','Breach','Credential','Ransomware'
    ];

    contentTypes.forEach(option => {
      cy.get('#dropdowncontent').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    cy.get('button.default-input-button[type="submit"]').click({ force: true });

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

    cy.contains('div.sidebar__item-dropdown', 'Exploit')
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible');


    const openFilters = () => {
      cy.get('label.filters-button')
        .click({ force: true });
      cy.get('form.sidebar_form')
        .should('be.visible');
    };
    openFilters();


    const selectDateRange = () => {
      cy.get('.sidebar_input_date-button').click({ force: true });

      cy.contains('span.custom-day', '1').click({ force: true });

      cy.contains('span.custom-day', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });


      cy.get('.sidebar_input_date-button').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });

      openFilters();
    };
    selectDateRange();

    const contentTypes = [
      'All','Breach','Credential','Ransomware'
    ];

    contentTypes.forEach(option => {
      cy.get('#dropdowncontent').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    const networkOptions = ['All', 'Onion'];
    networkOptions.forEach(option => {
      cy.get('#dropdownnetwork').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });

      openFilters();
    });


    cy.get('button.default-input-button[type="submit"]').click({ force: true });

  });

});




















