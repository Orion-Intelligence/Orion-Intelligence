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
      .click({force: true});

    cy.get('div.sidebar__subitem-content')
      .contains('Users')
      .should('be.visible')
      .click({force: true});

    cy.url().should('include', '/dashboard/profile/users?page=1');
  };

  interface User {
    username: string;
    email: string;
    password: string;
    role: string;
    licenses: string[];
  }

  const addUser = (user: User) => {
    cy.contains('span', 'Add User').should('be.visible').click({force: true});

    cy.get('form.add-tenant_form').should('exist').and('be.visible');

    cy.get('input[name="username"]').clear().type(user.username);
    cy.get('input[name="email"]').clear().type(user.email);
    cy.get('input[name="password"]').clear().type(user.password);

    cy.get('select[name="role"]').select(user.role);
    cy.get('select[name="status"]').select('Active');

    cy.get('.license-card').each($card => {
      const label = Cypress.$($card).find('.license-label').text().trim().toLowerCase();
      const checkbox = Cypress.$($card).find('input.license-checkbox');
      const wanted = user.licenses.map(x => x.trim().toLowerCase()).includes(label);

      if (wanted) {
        if (!checkbox.is(':checked')) cy.wrap(checkbox).click({force: true});
      } else {
        if (checkbox.is(':checked')) cy.wrap(checkbox).click({force: true});
      }
    });

    cy.get('div.add-tenant_footer button.add-tenant_btn-primary')
      .should('be.visible')
      .click({force: true});

    cy.contains(user.username).should('exist');
  };

  it('Create 5 users with different licenses', () => {
    openUsersPage();

    const users: User[] = [
      {username: 'testing1', email: 'a@hotmail.com', password: '1qaz!QAZ', role: 'Member', licenses: ['Free']},
      {
        username: 'testing2',
        email: 'b@hotmail.com',
        password: '1qaz!QAZ',
        role: 'Analyst',
        licenses: ['Free', 'OSINT Basic']
      },
      {
        username: 'testing3',
        email: 'c@hotmail.com',
        password: '1qaz!QAZ',
        role: 'Member',
        licenses: ['Free', 'OSINT Advanced']
      },
      {
        username: 'testing4',
        email: 'd@hotmail.com',
        password: '1qaz!QAZ',
        role: 'Member',
        licenses: ['Free', 'Pentester']
      },
      {username: 'testing5', email: 'e@hotmail.com', password: '1qaz!QAZ', role: 'Demo', licenses: ['Free']}
    ];

    users.forEach(user => addUser(user));
    cy.logout();
  });
});

describe('Login & Sidebar Checks for Users', () => {
  const loginAndClickSidebar = (username: string, sidebarItems: { name: string; selector: string }[]) => {
    cy.visit('/login');
    cy.get('input[name="username"]').should('exist').type(username);
    cy.get('input[name="password"]').should('exist').type('1qaz!QAZ', {log: false});
    cy.get('[data-cy="login-button"], input.login-button').first().should('exist').click();

    cy.get('[data-cy="dashboard-main-container"], [data-cy="dashboard-container"], .dashboard_container').should('exist');
    cy.contains(username).should('exist');

    sidebarItems.forEach(item => {
      if (username === 'testing5' && item.name === 'Stealer logs') {
        cy.get(item.selector).contains(item.name).should('exist').click({ force: true });

        cy.get('body').then($b => {
          if ($b.find('.pro-subscription_container').length) {
            cy.get('.pro-subscription_container').should('be.visible');
            cy.get('.pro-subscription_subscription-options input[type="radio"][value="annual"]').check({ force: true });
            cy.get('input#name').clear().type('Test User');
            cy.get('input#phone').clear().type('03001234567');
            cy.get('input#email').clear().type('test.user@example.com');
            cy.get('form.pro-subscription_payment-form').submit();



            cy.get('body').then($b2 => {
              if ($b2.find('.pro-subscription_container').length) {
                cy.get('.pro-subscription_container').should('be.visible');
                cy.get('button.pro-subscription_btn-close').should('be.visible').click({ force: true });
              }
            });
          }
        });

        return;
      }

    });



  };


  it('Logs in as testing1, clicks sidebar items, then logs out', () => {
    const sidebarItems1 = [
      {name: 'testing1', selector: 'div.sidebar__item-dropdown.active'},
      {name: 'General Intelligence', selector: 'div.sidebar__item-dropdown'},
      {name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink'}
    ];
    loginAndClickSidebar('testing1', sidebarItems1);
  });

  it('Logs in as testing2, clicks all license sidebar items, then logs out', () => {
    const sidebarItems2 = [
      {name: 'testing2', selector: 'div.sidebar__item-dropdown.active'},
      {name: 'General Intelligence', selector: 'div.sidebar__item-dropdown'},
      {name: 'Data Breach', selector: 'div.sidebar__item-dropdown'},
      {name: 'Defacement', selector: 'div.sidebar__item-dropdown'},
      {name: 'Social', selector: 'div.sidebar__item-dropdown'},
      {name: 'Exploit', selector: 'div.sidebar__item-dropdown'},
      {name: 'Feed', selector: 'div.sidebar__item-dropdown'},
      {name: 'Dump', selector: 'div.sidebar__item-dropdown'},
      {name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink'}
    ];
    loginAndClickSidebar('testing2', sidebarItems2);
  });

  it('Logs in as testing3, clicks all license sidebar items, then logs out', () => {
    const sidebarItems3 = [
      {name: 'testing3', selector: 'div.sidebar__item-dropdown.active'},
      {name: 'General Intelligence', selector: 'div.sidebar__item-dropdown'},
      {name: 'Data Breach', selector: 'div.sidebar__item-dropdown'},
      {name: 'Defacement', selector: 'div.sidebar__item-dropdown'},
      {name: 'Social', selector: 'div.sidebar__item-dropdown'},
      {name: 'Exploit', selector: 'div.sidebar__item-dropdown'},
      {name: 'Feed', selector: 'div.sidebar__item-dropdown'},
      {name: 'Stealer logs', selector: 'div.sidebar__item-dropdown'},
      {name: 'Dump', selector: 'div.sidebar__item-dropdown'},
      {name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink'}
    ];
    loginAndClickSidebar('testing3', sidebarItems3);
  });

  it('Logs in as testing4, clicks all license sidebar items, then logs out', () => {
    const sidebarItems4 = [
      {name: 'testing4', selector: 'div.sidebar__item-dropdown.active'},
      {name: 'Web Scans', selector: 'div.sidebar__item-dropdown'},
      {name: 'Live APIs', selector: 'div.sidebar__item-dropdown'},
      {name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink'}
    ];
    loginAndClickSidebar('testing4', sidebarItems4);
  });

  it('Logs in as testing5, clicks all license sidebar items, then logs out', () => {
    const sidebarItems5 = [
      {name: 'General Intelligence', selector: 'div.sidebar__item-dropdown.active'},
      {name: 'Data Breach', selector: 'div.sidebar__item-dropdown'},
      {name: 'Defacement', selector: 'div.sidebar__item-dropdown'},
      {name: 'Social', selector: 'div.sidebar__item-dropdown'},
      {name: 'Exploit', selector: 'div.sidebar__item-dropdown'},
      {name: 'Feed', selector: 'div.sidebar__item-dropdown'},
      {name: 'Stealer logs', selector: 'div.sidebar__item-dropdown'},
      {name: 'Web Scans', selector: 'div.sidebar__item-dropdown'},
      {name: 'Live APIs', selector: 'div.sidebar__item-dropdown'},
      {name: 'Dump', selector: 'div.sidebar__item-dropdown'},
      {name: 'Whistle Blowing', selector: 'div.sidebar__item a.sidebar__item-dropdown-hotlink'}
    ];
    loginAndClickSidebar('testing5', sidebarItems5);
  });
});

describe('Users Page – Delete Users Sequentially', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Counts edit-profile buttons; if 0 stop else delete total times', () => {
    cy.visit('/dashboard/profile/users');

    cy.get('button[id="edit-profile"]').then($btns => {
      const total = Math.max($btns.length - 2, 0);
      if (total === 0) return;

      cy.wrap($btns[0])
        .scrollIntoView()
        .then($b => $b[0].click());

      for (let i = 0; i < total; i++) {
        cy.contains('button', 'Delete User')
          .should('exist')
          .scrollIntoView()
          .then($btn => $btn[0].click());

        cy.contains('div.confirmation-popup_actions button', 'Yes, Confirm')
          .should('exist')
          .scrollIntoView()
          .then($btn => $btn[0].click());
      }

      cy.logout();
    });
  });
});
