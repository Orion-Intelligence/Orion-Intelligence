describe('Login & Sidebar Checks for Users', () => {

  const loginAndClickSidebar = (username: string, sidebarItems: { name: string, selector: string }[]) => {
    // LOGIN
    cy.visit('/login');
    cy.get('input[name="username"]').should('exist').type(username);
    cy.get('input[name="password"]').should('exist').type('1qaz!QAZ', { log: false });
    cy.get('input.login-button').should('exist').click();

    cy.get('.dashboard_container').should('exist');
    cy.contains(username).should('exist');

    // CLICK SIDEBAR ITEMS
    sidebarItems.forEach(item => {
      cy.get(item.selector).contains(item.name).should('exist').click({ force: true });
    });

    // LOGOUT
    cy.get('div.profile_category.profile_logout_icon').should('exist').click({ force: true });
    cy.get('li.profile-item').contains('Sign out').should('exist').click({ force: true });
    cy.get('input[name="username"]').should('exist');
  };

  // ----- TESTING1: Free license -----
  it('Logs in as testing1, clicks sidebar items, then logs out', () => {
    const sidebarItems1 = [
      { name: 'testing1', selector: 'div.sidebar__item-dropdown.active' },
      { name: 'General Intelligence', selector: 'div.sidebar__item-dropdown' },
      { name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink' }
    ];

    loginAndClickSidebar('testing1', sidebarItems1);
  });

  // ----- TESTING2: Full license -----
  it('Logs in as testing2, clicks all license sidebar items, then logs out', () => {
    const sidebarItems2 = [
      { name: 'testing2', selector: 'div.sidebar__item-dropdown.active' },
      { name: 'General Intelligence', selector: 'div.sidebar__item-dropdown' },
      { name: 'Data Breach', selector: 'div.sidebar__item-dropdown' },
      { name: 'Discussion', selector: 'div.sidebar__item-dropdown' },
      { name: 'Defacement', selector: 'div.sidebar__item-dropdown' },
      { name: 'Social', selector: 'div.sidebar__item-dropdown' },
      { name: 'Exploit', selector: 'div.sidebar__item-dropdown' },
      { name: 'Feed', selector: 'div.sidebar__item-dropdown' },
      { name: 'Dump', selector: 'div.sidebar__item-dropdown' },
      { name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink' }
    ];

    loginAndClickSidebar('testing2', sidebarItems2);
  });

  // ----- TESTING3: Full license -----
  it('Logs in as testing3, clicks all license sidebar items, then logs out', () => {
    const sidebarItems3 = [
      { name: 'testing3', selector: 'div.sidebar__item-dropdown.active' },
      { name: 'General Intelligence', selector: 'div.sidebar__item-dropdown' },
      { name: 'Data Breach', selector: 'div.sidebar__item-dropdown' },
      { name: 'Discussion', selector: 'div.sidebar__item-dropdown' },
      { name: 'Defacement', selector: 'div.sidebar__item-dropdown' },
      { name: 'Social', selector: 'div.sidebar__item-dropdown' },
      { name: 'Exploit', selector: 'div.sidebar__item-dropdown' },
      { name: 'Feed', selector: 'div.sidebar__item-dropdown' },
      { name: 'Stealer logs', selector: 'div.sidebar__item-dropdown' },
      { name: 'Dump', selector: 'div.sidebar__item-dropdown' },
      { name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink' }
    ];

    loginAndClickSidebar('testing3', sidebarItems3);
  });

  // ----- TESTING4: Full license -----
  it('Logs in as testing4, clicks all license sidebar items, then logs out', () => {
    const sidebarItems4 = [
      { name: 'testing4', selector: 'div.sidebar__item-dropdown.active' },
      { name: 'Web Scans', selector: 'div.sidebar__item-dropdown' },
      { name: 'Live APIs', selector: 'div.sidebar__item-dropdown' },
      { name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink' }
    ];

    loginAndClickSidebar('testing4', sidebarItems4);
  });

  // ----- TESTING5: Full license -----
  it('Logs in as testing5, clicks all license sidebar items, then logs out', () => {
    const sidebarItems5 = [
      { name: 'General Intelligence', selector: 'div.sidebar__item-dropdown.active' },
      { name: 'Data Breach', selector: 'div.sidebar__item-dropdown' },
      { name: 'Discussion', selector: 'div.sidebar__item-dropdown' },
      { name: 'Defacement', selector: 'div.sidebar__item-dropdown' },
      { name: 'Social', selector: 'div.sidebar__item-dropdown' },
      { name: 'Exploit', selector: 'div.sidebar__item-dropdown' },
      { name: 'Feed', selector: 'div.sidebar__item-dropdown' },
      { name: 'Stealer logs', selector: 'div.sidebar__item-dropdown' },
      { name: 'Web Scans', selector: 'div.sidebar__item-dropdown' },
      { name: 'Live APIs', selector: 'div.sidebar__item-dropdown' },
      { name: 'Dump', selector: 'div.sidebar__item-dropdown' },
      { name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink' }
    ];

    loginAndClickSidebar('testing5', sidebarItems5);
  });

});
