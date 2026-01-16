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
      cy.wait(200);
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
      ['Credit Cards', '4111111111111111'],
      ['Organizations', 'OpenAI'],
      ['Company Names', 'Google'],
      ['Persons', 'John Doe'],
      ['Locations', 'Lahore'],
      ['Languages', 'English'],
      ['User Agents', 'Mozilla/5.0'],
      ['ASNs', 'AS15169'],
      ['Teams', 'Security Team'],
      ['Hashtags', '#cybersecurity'],
      ['Mentions', '@admin'],
      ['Social Media Profiles', 'twitter.com/example'],
      ['Currencies', 'USD'],
      ['Crypto Addresses', '1BoatSLRHtKNngkdXEeobR76b53LETtpyT'],
      ['XMPP Addresses', 'user@xmpp.org'],
      ['Enterprise ATT&CK Tactics', 'Initial Access'],
      ['Enterprise ATT&CK Techniques', 'T1059'],
      ['Document IDs', 'DOC-123'],
      ['Australian IDs', 'AUS-998877'],
      ['US IDs', 'US-112233'],
      ['US Bank Numbers', '021000021'],
      ['Platform', 'Telegram'],
      ['Author', 'Threat Researcher'],
      ['Industry', 'Cybersecurity'],
      ['Scrap Script', 'darkweb_scraper']
    ];

    filters.forEach(([name, value]) => applyFilter(name, value));


    cy.get('button.selected-filter-bar__clear-btn').should('exist').click({ force: true });


    cy.contains('span', 'Tools').scrollIntoView().click({ force: true });


    const sortOptions = ['Newest first', 'Oldest first'];
    sortOptions.forEach(option => {
      cy.get('#dropdownMenu1').click({ force: true });
      cy.contains('.dropdown-item', option).click({ force: true });
      cy.get('[data-cy="dashboard-general-input"]').type('{enter}');
      cy.wait(300);
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
      cy.wait(400);
    });


    const openFilters = () => {
      cy.get('div.filter-button-wrapper label.filters-button').click({ force: true });
      cy.get('form.sidebar_form').should('be.visible');
    };

    openFilters();


    const networkOptions = ['All', 'Onion', 'I2P', 'Clearnet'];
    networkOptions.forEach(option => {
      cy.get('#dropdownnetwork').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(400);
      openFilters();
    });


    const safeSearchOptions = ['Yes', 'No'];
    safeSearchOptions.forEach(option => {
      cy.get('#dropdownsafe').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(400);
      openFilters();
    });


    const selectDateRange = () => {

      cy.get('.sidebar_input_date-button').click({ force: true });


      cy.contains('span.custom-day', '1').click({ force: true });

      cy.contains('span.custom-day', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(500);
      openFilters();
    };
    selectDateRange();


    const contentTypes = [
      'All','Breach','Credential','Ransomware','Phishing','Scam','Malware',
      'Infostealer','C2','DDoS','Exploit','Leak','Logs','VPN','Carding','RAT',
      'Keylogger','Spyware','SQL Injection','XSS','Supply Chain','Insider','Fraud',
      'Obfuscation','Crack','Cheats','CVE','Zero Day','Rootkit','APT','Threat Intel',
      'Dark Web','RCE','LPE','Exfiltration','Persistence','Reconnaissance','Hack',
      'News','Credentials (Common)','War'
    ];

    contentTypes.forEach(option => {
      cy.get('#dropdowncontent').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(300);
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


    const networkOptions = ['All', 'Onion', 'I2P', 'Clearnet'];
    networkOptions.forEach(option => {
      cy.get('#dropdownnetwork').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(400);
      openFilters();
    });


    const safeSearchOptions = ['Yes', 'No'];
    safeSearchOptions.forEach(option => {
      cy.get('#dropdownsafe').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(400);
      openFilters();
    });


    const selectDateRange = () => {
      cy.get('.sidebar_input_date-button').click({ force: true });


      cy.contains('span.custom-day', '1').click({ force: true });

      cy.contains('span.custom-day', '25').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(500);
      openFilters();
    };
    selectDateRange();

    cy.get('.sidebar_input_date-button').click({ force: true });
    cy.contains('button', 'Clear').click({ force: true });
    cy.wait(200);


    const contentTypes = [
      'All','Breach','Credential','Ransomware','Phishing','Scam','Malware',
      'Infostealer','C2','DDoS','Exploit','Leak','Logs','VPN','Carding','RAT',
      'Keylogger','Spyware','SQL Injection','XSS','Supply Chain','Insider','Fraud',
      'Obfuscation','Crack','Cheats','CVE','Zero Day','Rootkit','APT','Threat Intel',
      'Dark Web','RCE','LPE','Exfiltration','Persistence','Reconnaissance','Hack',
      'News','Credentials (Common)','War'
    ];

    contentTypes.forEach(option => {
      cy.get('#dropdowncontent').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(300);
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
      cy.wait(500);

      cy.get('.sidebar_input_date-button').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });
      cy.wait(200);
      openFilters();
    };
    selectMessageDate();


    const contentTypes = [
      'All','Breach','Credential','Ransomware','Phishing','Scam','Malware',
      'Infostealer','C2','DDoS','Exploit','Leak','Logs','VPN','Carding','RAT',
      'Keylogger','Spyware','SQL Injection','XSS','Supply Chain','Insider','Fraud',
      'Obfuscation','Crack','Cheats','CVE','Zero Day','Rootkit','APT','Threat Intel',
      'Dark Web','RCE','LPE','Exfiltration','Persistence','Reconnaissance','Hack',
      'News','Credentials (Common)','War'
    ];

    contentTypes.forEach(option => {
      cy.get('#dropdowncontent').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(300);
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
      cy.wait(500);

      cy.get('.sidebar_input_date-button').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });
      cy.wait(200);
      openFilters();
    };
    selectDateRange();


    const networkOptions = ['All', 'Onion', 'I2P', 'Clearnet'];
    networkOptions.forEach(option => {
      cy.get('#dropdownnetwork').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(400);
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

      cy.contains('span.custom-day', '31').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(500);

      cy.get('.sidebar_input_date-button').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });
      cy.wait(200);
      openFilters();
    };
    selectDateRange();


    const networkOptions = ['All', 'Onion', 'I2P', 'Clearnet'];
    networkOptions.forEach(option => {
      cy.get('#dropdownnetwork').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(400);
      openFilters();
    });


    const contentTypes = [
      'All','Breach','Credential','Ransomware','Phishing','Scam','Malware',
      'Infostealer','C2','DDoS','Exploit','Leak','Logs','VPN','Carding','RAT',
      'Keylogger','Spyware','SQL Injection','XSS','Supply Chain','Insider','Fraud',
      'Obfuscation','Crack','Cheats','CVE','Zero Day','Rootkit','APT','Threat Intel',
      'Dark Web','RCE','LPE','Exfiltration','Persistence','Reconnaissance','Hack',
      'News','Credentials (Common)','War'
    ];

    contentTypes.forEach(option => {
      cy.get('#dropdowncontent').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(300);
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

      cy.contains('span.custom-day', '31').click({ force: true });

      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(500);

      cy.get('.sidebar_input_date-button').click({ force: true });
      cy.contains('button', 'Clear').click({ force: true });
      cy.wait(200);
      openFilters();
    };
    selectDateRange();

    const contentTypes = [
      'All','Breach','Credential','Ransomware','Phishing','Scam','Malware',
      'Infostealer','C2','DDoS','Exploit','Leak','Logs','VPN','Carding','RAT',
      'Keylogger','Spyware','SQL Injection','XSS','Supply Chain','Insider','Fraud',
      'Obfuscation','Crack','Cheats','CVE','Zero Day','Rootkit','APT','Threat Intel',
      'Dark Web','RCE','LPE','Exfiltration','Persistence','Reconnaissance','Hack',
      'News','Credentials (Common)','War'
    ];

    contentTypes.forEach(option => {
      cy.get('#dropdowncontent').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(300);
      openFilters();
    });


    const networkOptions = ['All', 'Onion', 'I2P', 'Clearnet'];
    networkOptions.forEach(option => {
      cy.get('#dropdownnetwork').click({ force: true });
      cy.contains('a.dropdown-item', option).click({ force: true });
      cy.contains('button', 'Apply').click({ force: true });
      cy.wait(400);
      openFilters();
    });


    cy.get('button.default-input-button[type="submit"]').click({ force: true });

  });

});


describe('Feed – Apply Filters and Verify Results', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Open Feed and Apply All Filters', () => {

    cy.visit('/dashboard');
    cy.contains('.sidebar__item-dropdown', 'feed')
      .scrollIntoView()
      .click({ force: true });
    cy.wait(500);


    cy.get('.filters-button').click({ force: true });
    cy.wait(300);


    cy.get('#dropdownnetwork').click({ force: true });
    cy.contains('.dropdown-item', 'Onion').click({ force: true });
    cy.contains('button', 'Apply').click({ force: true });
    cy.wait(500);


    cy.get('#dropdownsafe').click({ force: true });
    cy.contains('.dropdown-item', 'Yes').click({ force: true });
    cy.contains('button', 'Apply').click({ force: true });
    cy.wait(500);


    cy.get('#dropdowncontent').click({ force: true });
    cy.contains('.dropdown-item', 'Breach').click({ force: true });
    cy.contains('button', 'Apply').click({ force: true });
    cy.wait(500);


    cy.get('.sidebar_input_date-button').click({ force: true });
    cy.contains('span.custom-day', '1').click({ force: true });
    cy.contains('span.custom-day', '25').click({ force: true });
    cy.contains('button', 'Apply').click({ force: true });
    cy.wait(500);


    cy.get('.sidebar_input_date-button').click({ force: true });
    cy.contains('button', 'Clear').click({ force: true });
    cy.contains('button', 'Apply').click({ force: true });
    cy.wait(500);


    cy.get('.feed-result-item').should('exist');
  });
});


















