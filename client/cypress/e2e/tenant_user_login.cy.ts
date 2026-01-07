describe('Tenant Flow – Manage IOCs → Homepage → Webscan → Click Cards', () => {

  const loginAsTenant = () => {
    cy.visit('/login');

    cy.get('input[name="username"]').clear().type('test_for_tenants');
    cy.get('input[name="password"]').clear().type('1qaz!QAZ', { log: false });

    cy.contains(/sign in|login/i).click({ force: true });

    cy.get('.dashboard_container').should('exist');
  };

  const openManageIOCs = () => {
    cy.contains('.user-ioc-title', 'Manage IOCs', { timeout: 10000 })
      .should('be.visible');
  };

  const addIOC = (tabLabel: string, value: string) => {
    cy.contains('.onboarding-step2__tab', tabLabel)
      .scrollIntoView()
      .click({ force: true });

    cy.get('.onboarding-step2__input')
      .clear()
      .type(value);

    cy.contains('button.onboarding-step2__add-btn', 'Add')
      .click({ force: true });
  };

  it('Performs IOC entry + homepage navigation + webscan actions', () => {

    //
    // LOGIN
    //
    loginAsTenant();

    //
    // OPEN MANAGE IOCs (IOC Button already clicked before this page)
    //
    openManageIOCs();

    //
    // ADD VALUES IN MULTIPLE TABS
    //
    addIOC('Phone Numbers', '03030140655');
    addIOC('Emails', 'sundog710@gmail.com');
    addIOC('Domains', 'sundog710@gmail.com');
    addIOC('Country', 'France');
    addIOC('URLs', 'http://ehbpnf6befjqag6z2vgcrleqwtvjbhmnz5vwxlls2sl2ke26gjshtuyd.onion/new_arraival/927');
    addIOC('CVE & CWE', 'uk');
    addIOC('IP Addresses', '192.168.1.1');

    

    //
    // GO BACK TO HOMEPAGE
    //
    cy.contains('.onboarding-box__btn--back', 'Back')
      .click({ force: true });

    cy.contains('.sidebar__subitem-content', 'Homepage')
      .click({ force: true });

    cy.get('.user-homepage_cards').should('exist');

    //
    // CLICK WEBSCAN BUTTON
    //
    cy.get('button[apptooltip="scan all"]')
      .first()
      .click({ force: true });

    //
    // CLICK ALL HOMEPAGE CARDS ONE BY ONE
    //
    cy.get('.user-homepage_cards-card')
      .should('have.length.at.least', 1)
      .each(($card) => {
        cy.wrap($card)
          .scrollIntoView()
          .click({ force: true });
      });

  });

});
