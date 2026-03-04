describe('General Intelligence – Multi-Tab Search & Open Report Flow', { testIsolation: false }, () => {
  before(() => {
    cy.loginAsAdmin();
  });

  beforeEach(() => {
    cy.visit('/dashboard/profile/homepage');
    cy.location('pathname').then((pathname) => {
      if (pathname.includes('/login')) {
        cy.loginAsAdmin();
        cy.visit('/dashboard/profile/homepage');
      }
    });
  });

  after(() => {
    cy.logout();
  });

  it('General Intelligence: All/General/Forums → search bitcoin → open report', () => {
    cy.visit('/dashboard/profile/homepage');
    cy.contains('app-dashboard-sidebar-items', 'General Intelligence').find('li > div').first().click();

    cy.contains('app-dashboard-sidebar-items', 'General Intelligence').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'All').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('bitcoin{enter}');
    cy.location('pathname').then((pathBefore) => {
      cy.get('div[apptooltip="Open Report"]', {timeout: 30000}).filter(':visible').first().should('be.visible').scrollIntoView().click();
      cy.get('body', {timeout: 10000}).then(($body) => {
        if ($body.find('app-json-api-viewer').length) {
          cy.get('app-json-api-viewer').should('be.visible');
          cy.get('body').type('{esc}');
          return;
        }
        cy.location('pathname', {timeout: 10000}).should('not.eq', pathBefore);
      });
    });
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'General Intelligence').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'General').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('bitcoin{enter}');
    cy.location('pathname').then((pathBefore) => {
      cy.get('div[apptooltip="Open Report"]', {timeout: 30000}).filter(':visible').first().should('be.visible').scrollIntoView().click();
      cy.get('body', {timeout: 10000}).then(($body) => {
        if ($body.find('app-json-api-viewer').length) {
          cy.get('app-json-api-viewer').should('be.visible');
          cy.get('body').type('{esc}');
          return;
        }
        cy.location('pathname', {timeout: 10000}).should('not.eq', pathBefore);
      });
    });
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'General Intelligence').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'Forums').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('bitcoin{enter}');
    cy.location('pathname').then((pathBefore) => {
      cy.get('div[apptooltip="Open Report"]', {timeout: 30000}).filter(':visible').first().should('be.visible').scrollIntoView().click();
      cy.get('body', {timeout: 10000}).then(($body) => {
        if ($body.find('app-json-api-viewer').length) {
          cy.get('app-json-api-viewer').should('be.visible');
          cy.get('body').type('{esc}');
          return;
        }
        cy.location('pathname', {timeout: 10000}).should('not.eq', pathBefore);
      });
    });
  });

  it('Defacement flow: All/Hacked/Phishing/Databases', () => {
    cy.visit('/dashboard/profile/homepage');
    cy.contains('app-dashboard-sidebar-items', 'Defacement').find('li > div').first().click();

    cy.contains('app-dashboard-sidebar-items', 'Defacement').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'Defacement').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'Defacement').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'All').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('mthcht{enter}');
    cy.get('tbody tr.cursor-pointer[id^="item-"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Defacement').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'Defacement').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'Defacement').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'Hacked').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('ASTAR{enter}');
    cy.get('tbody tr.cursor-pointer[id^="item-"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Defacement').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'Defacement').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'Defacement').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'Phishing').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('mthcht{enter}');
    cy.get('tbody tr.cursor-pointer[id^="item-"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Defacement').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'Defacement').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'Defacement').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'Databases').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('urldna_bot{enter}');
    cy.get('tbody tr.cursor-pointer[id^="item-"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
  });

  it('Social: All/Twitter/Mastodon/Pastebin/Forum/Reddit', () => {
    cy.visit('/dashboard/profile/homepage');
    cy.contains('app-dashboard-sidebar-items', 'Social').find('li > div').first().click();

    cy.contains('app-dashboard-sidebar-items', 'Social').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'All').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('Linux{enter}');
    cy.get('div[apptooltip="Open Report"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Social').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'Twitter').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('Linux{enter}');
    cy.get('div[apptooltip="Open Report"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Social').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'Mastodon').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('Linux{enter}');
    cy.get('div[apptooltip="Open Report"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Social').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'Pastebin').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('Linux{enter}');
    cy.get('div[apptooltip="Open Report"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Social').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'Forum').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('Linux{enter}');
    cy.get('div[apptooltip="Open Report"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Social').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').scrollIntoView().should('be.visible').click();
    cy.contains('app-dashboard-sidebar-items div', 'Social').closest('app-dashboard-sidebar-items').find('ul').contains('div', 'Reddit').should('be.visible').click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]').first().should('be.visible').and('not.be.disabled').clear().type('Linux{enter}');
    cy.get('div[apptooltip="Open Report"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
  });
  it('Exploit: All → CVE → Tools → ZeroDay (Search + Open Report)', () => {
    
    cy.visit('/dashboard/profile/homepage');
    const typeExploitSearch = (value: string) => {
      cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000})
        .first()
        .should('be.visible')
        .and('not.be.disabled')
        .clear();
      cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000})
        .first()
        .should('be.visible')
        .and('not.be.disabled')
        .type(`${value}{enter}`);
    };
    cy.contains('app-dashboard-sidebar-items', 'Exploit').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items', 'Exploit').find('ul').first().should('exist').contains('div', 'All').should('be.visible').click();
    typeExploitSearch('exploit');
    cy.get('div[apptooltip="Open Report"]', {timeout: 30000}).filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Exploit').find('ul').first().should('exist').contains('div', 'CVE').should('be.visible').click();
    typeExploitSearch('cve');
    cy.get('div[apptooltip="Open Report"]', {timeout: 30000}).filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Exploit').find('ul').first().should('exist').contains('div', 'Tools').should('be.visible').click();
    typeExploitSearch('tool');
    cy.get('div[apptooltip="Open Report"]', {timeout: 30000}).filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.go('back');

    cy.contains('app-dashboard-sidebar-items', 'Exploit').find('ul').first().should('exist').contains('div', 'ZeroDay').should('be.visible').click();
    typeExploitSearch('exploit');
    cy.get('div[apptooltip="Open Report"]', {timeout: 30000}).filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.go('back');
    cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000}).first().should('exist');
  });

  it('Feed: search police → open report', () => {
    
    cy.visit('/dashboard/profile/homepage');
    cy.contains('app-dashboard-sidebar-items', 'Feed').find('li > div').first().click();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000}).first().as('q');
    cy.get('@q').should('be.visible').and('not.be.disabled');
    cy.get('@q').clear();
    cy.get('@q').type('police{enter}');
    cy.get('div[apptooltip="Open Report"]', {timeout: 30000}).filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
  });

  it('Stealer logs: IOCS → search email → press collapse button', () => {
    
    cy.visit('/dashboard/profile/homepage');
    cy.contains('app-dashboard-sidebar-items', 'Stealer logs').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items ul li div', 'IOCS').scrollIntoView().click();
    cy.get('input[name="searchQuery"][placeholder="Search..."]', {timeout: 30000}).first().as('q');
    cy.get('@q').should('be.visible').and('not.be.disabled').clear();
    cy.get('@q').type('uwe.dippold@web.de{enter}');
    cy.get('button[aria-label="Expand row"]', {timeout: 30000}).should('have.length.greaterThan', 0).first().scrollIntoView().click();
  });

  it('Web Scans: Basic / Port / Repository / SEO (skip APK) → search bbc.com', () => {
    
    cy.visit('/dashboard/profile/homepage');
    cy.contains('app-dashboard-sidebar-items', 'Web Scans').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items ul li div', 'Basic Scan').scrollIntoView().click();
    cy.get('input[name="username"][placeholder="Domain"]', {timeout: 30000}).first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    cy.get('@scanInput').type('bbc.com');
    cy.get('button').contains(/^Search$/).should('be.visible').should('not.be.disabled').click();
    cy.contains('app-dashboard-sidebar-items ul li div', 'Port Scan').scrollIntoView().click();
    cy.get('input[name="username"][placeholder="Domain"]', {timeout: 30000}).first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    cy.get('@scanInput').type('bbc.com');
    cy.get('button').contains(/^Search$/).should('be.visible').should('not.be.disabled').click();
    cy.contains('app-dashboard-sidebar-items ul li div', 'Repository Scan').scrollIntoView().click();
    cy.get('input[name="username"][placeholder="Repository"]', {timeout: 30000}).first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    cy.get('@scanInput').type('bbc.com');
    cy.get('button').contains(/^Search$/).should('be.visible').should('not.be.disabled').click();
    cy.contains('app-dashboard-sidebar-items ul li div', 'SEO Scan').scrollIntoView().click();
    cy.get('input[name="username"][placeholder="Domain"]', {timeout: 30000}).first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    cy.get('@scanInput').type('bbc.com');
    cy.get('button').contains(/^Search$/).should('be.visible').should('not.be.disabled').click();
  });

  it('Entity API: Playstore Scanner (open only)', () => {
    
    cy.visit('/dashboard/profile/homepage');
    cy.contains('app-dashboard-sidebar-items > li > div', 'Entity API').scrollIntoView().click();
    cy.contains('app-dashboard-sidebar-items ul li div', 'Playstore Scanner').scrollIntoView().click();
  });

  it('Dump: Listing → search leak → Search button', () => {
    
    cy.visit('/dashboard/profile/homepage');
    cy.contains('app-dashboard-sidebar-items', 'Dump').find('li > div').first().click();
    cy.contains('app-dashboard-sidebar-items ul li div', 'Listing').scrollIntoView().click();
    cy.get('input[name="username"][placeholder="Search leak URL"]', {timeout: 30000}).first().as('leak');
    cy.get('@leak').should('be.visible');
    cy.get('@leak').clear();
    cy.get('@leak').type('leak');
    cy.contains('button', 'Search').should('be.visible').click();
  });
});
