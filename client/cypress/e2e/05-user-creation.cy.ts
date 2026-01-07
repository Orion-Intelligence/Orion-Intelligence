describe('Users Page – Create 5 Different Users With License', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  const openUsersPage = () => {
    cy.visit('/dashboard/profile/homepage');

    cy.get('div.sidebar__item-dropdown.active')
      .should('be.visible')
      .click({ force: true });

    cy.get('div.sidebar__subitem-content')
      .contains('Users')
      .should('be.visible')
      .click({ force: true });

    cy.url().should('include', '/dashboard/profile/users?page=1');
  };

  interface User {
    username: string;
    email: string;
    password: string;
    role: string;
    licenses: string[]; // <-- Array of licenses
  }

  const addUser = (user: User) => {
    cy.contains('span', 'Add User')
      .should('be.visible')
      .click({ force: true });

    cy.get('form.add-tenant_form')
      .should('exist')
      .and('be.visible');

    cy.get('input[name="username"]').clear().type(user.username);
    cy.get('input[name="email"]').clear().type(user.email);
    cy.get('input[name="password"]').clear().type(user.password);

    cy.get('select[name="role"]').select(user.role);

    cy.get('select[name="status"]').select('Active');

    cy.get('.license-card input.license-checkbox').each($checkbox => {
      cy.wrap($checkbox).then($el => {
        if ($el.is(':checked')) {
          cy.wrap($el).click({ force: true }); // Force uncheck
        }
      });
    });

    user.licenses.forEach(licenseName => {
      cy.get('.license-card').contains('span.license-label', licenseName)
        .parent()
        .find('input.license-checkbox')
        .click({ force: true }); // Force check
    });

    cy.get('div.add-tenant_footer button.add-tenant_btn-primary')
      .should('be.visible')
      .click({ force: true });

    cy.contains(user.username).should('exist');
  };

  it('Create 5 users with different licenses', () => {
    openUsersPage();

    const users: User[] = [
      { username: 'testing1', email: 'a@hotmail.com', password: '1qaz!QAZ', role: 'Member', licenses: ['Free'] },
      { username: 'testing2', email: 'b@hotmail.com', password: '1qaz!QAZ', role: 'Analyst', licenses: ['Free' , 'OSINT Basic'] },
      { username: 'testing3', email: 'c@hotmail.com', password: '1qaz!QAZ', role: 'Member', licenses: ['Free' , 'OSINT Advanced'] },
      { username: 'testing4', email: 'd@hotmail.com', password: '1qaz!QAZ', role: 'Member', licenses: ['Free' , 'Pentester'] },
      { username: 'testing5', email: 'e@hotmail.com', password: '1qaz!QAZ', role: 'Demo', licenses: ['Free' , 'Enterprise'] }
    ];

    users.forEach(user => addUser(user));
    cy.logout();
  });

});
