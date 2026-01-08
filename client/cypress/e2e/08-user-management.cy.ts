/*describe('Login & Sidebar Checks + Delete All Users', () => {

  const loginAndClickSidebar = (username, sidebarItems) => {
    cy.visit('/login');

    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type('1qaz!QAZ', { log: false });
    cy.get('input.login-button').click();

    cy.get('.dashboard_container').should('exist');
    cy.contains(username).should('exist');

    sidebarItems.forEach(item => {
      cy.get(item.selector).contains(item.name).click({ force: true });
    });

    cy.get('div.profile_category.profile_logout_icon').click({ force: true });
    cy.contains('li.profile-item', 'Sign out').click({ force: true });

    cy.get('input[name="username"]').should('exist');
  };

  it('testing1 – sidebar checks + logout', () => {
    loginAndClickSidebar('testing1', [
      { name: 'testing1', selector: 'div.sidebar__item-dropdown.active' },
      { name: 'General Intelligence', selector: 'div.sidebar__item-dropdown' },
      { name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink' }
    ]);
  });

  it('testing2 – all licensed items + logout', () => {
    loginAndClickSidebar('testing2', [
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
    ]);
  });

  it('testing3 – all licensed items + logout', () => {
    loginAndClickSidebar('testing3', [
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
    ]);
  });

  it('testing4 – license items + logout', () => {
    loginAndClickSidebar('testing4', [
      { name: 'testing4', selector: 'div.sidebar__item-dropdown.active' },
      { name: 'Web Scans', selector: 'div.sidebar__item-dropdown' },
      { name: 'Live APIs', selector: 'div.sidebar__item-dropdown' },
      { name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink' }
    ]);
  });

  it('testing5 – full access items + logout', () => {
    loginAndClickSidebar('testing5', [
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
    ]);
  });

  //
  // 🔥 FINAL TEST — DELETE ALL USERS (NO TIMEOUT BS)
  //
  it('Deletes all users one-by-one', () => {

    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });

    cy.visit('/dashboard/profile/homepage');

    cy.contains('div.sidebar__subitem-content', 'Users').click({ force: true });

    const deleteAllUsers = () => {
      return cy.get('table.directory-list__table tbody tr').then($rows => {

        if ($rows.length === 0) {
          cy.log('✔ All users deleted');
          return;
        }

        cy.wrap($rows[0])
          .find('td.col-action img[alt="edit"]')
          .click({ force: true });

        cy.contains('button.btn-danger', 'Delete User').click({ force: true });

        cy.wait(300);

        return deleteAllUsers();
      });
    };

    deleteAllUsers().then(() => {
      cy.get('table.directory-list__table tbody tr').should('have.length', 0);
    });
  });

});
*/
