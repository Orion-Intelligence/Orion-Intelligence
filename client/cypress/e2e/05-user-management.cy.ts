describe('Users Page – Create 5 Different Users With License', () => {
  const testUsers = Cypress.env('TEST_USERS') || {};
  const userOrder = ['testing1', 'testing2', 'testing3', 'testing4', 'testing5'];

  interface User {
    username: string;
    email: string;
    password: string;
    role: 'Member' | 'Analyst' | 'Demo';
    licenses: string[];
  }

  const openUsersPage = () => {
    cy.intercept('POST', '**/api/users').as('usersApi');
    cy.visit('/dashboard/profile/homepage');
    cy.get('#dashboard__sidebar-main', { timeout: 30000 }).should('be.visible');

    cy.get('app-dashboard-sidebar-items[ng-reflect-category="Profile"]', { timeout: 30000 })
      .should('exist')
      .as('profileGroup');

    cy.get('@profileGroup')
      .find('li > div[tabindex="0"]', { timeout: 30000 })
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.get('@profileGroup')
      .find('ul div[tabindex="0"][ng-reflect-router-link="profile,users"]', { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.url({ timeout: 30000 }).should('include', '/dashboard/profile/users');
    cy.wait('@usersApi', { timeout: 30000 });
  };

  const clickAddUserButton = () => {
    cy.url({ timeout: 30000 }).should('include', '/dashboard/profile/users');

    cy.get('#dashboard-container app-view-profile', { timeout: 30000 })
      .should('be.visible')
      .within(() => {
        cy.get('button.ui-btn-primary', { timeout: 30000 })
          .should('exist')
          .filter((_, el) => {
            const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
            return txt.includes('add user');
          })
          .first()
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true });
      });

    cy.contains('.ui-popup-shell .ui-popup-title', 'Add User', { timeout: 30000 })
      .should('be.visible')
      .closest('.ui-popup-shell')
      .as('addUserModal');
  };

  const setInput = (name: 'username' | 'email' | 'password', value: string) => {
    cy.get('@addUserModal')
      .find(`input[name="${name}"]`, { timeout: 30000 })
      .should('be.visible')
      .clear({ force: true })
      .type(value, { force: true });
  };

  const setSelect = (name: 'role' | 'status', optionText: string) => {
    cy.get('@addUserModal')
      .find(`select[name="${name}"]`, { timeout: 30000 })
      .should('exist')
      .then(($select) => {
        const optionLabels = [...$select.find('option')]
          .map((opt) => (opt.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean);
        const normalized = optionLabels.map((x) => x.toLowerCase());
        const wanted = optionText.trim().toLowerCase();

        let resolved = optionText;
        if (!normalized.includes(wanted)) {
          if (name === 'role' && wanted === 'member' && normalized.includes('analyst')) {
            resolved = 'Analyst';
          } else if (optionLabels.length > 0) {
            resolved = optionLabels[0];
          }
        }

        cy.wrap($select).select(resolved, { force: true });
      });
  };

  const setLicenses = (licensesWanted: string[]) => {
    const wanted = licensesWanted.map((x) => x.trim().toLowerCase());

    cy.get('@addUserModal')
      .find('.license-grid .license-card', { timeout: 30000 })
      .should('exist')
      .each(($card) => {
        const label = $card.find('.license-label').text().replace(/\s+/g, ' ').trim().toLowerCase();
        const $checkbox = $card.find('input[type="checkbox"]');

        const shouldBeChecked = wanted.includes(label);
        const isChecked = $checkbox.is(':checked');

        if (shouldBeChecked && !isChecked) cy.wrap($card).click({ force: true });
        if (!shouldBeChecked && isChecked) cy.wrap($card).click({ force: true });
      });
  };

  const submitAddUser = () => {
    cy.get('@addUserModal')
      .contains('button', 'Add User', { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains('.ui-popup-shell .ui-popup-title', 'Add User', { timeout: 30000 }).should('not.exist');
  };

  const addUser = (user: User) => {
    clickAddUserButton();
    setInput('username', user.username);
    setInput('email', user.email);
    setInput('password', user.password);
    setSelect('role', user.role);
    setSelect('status', 'Active');
    setLicenses(user.licenses);
    submitAddUser();
    cy.contains(user.username, { timeout: 30000 }).should('exist');
  };

  const loginAsUser = (username: string, password: string) => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/login');
    cy.get('input[name="username"]', { timeout: 30000 }).should('be.visible').clear().type(username, { force: true });
    cy.get('input[name="password"]', { timeout: 30000 }).should('be.visible').clear().type(password, { log: false });

    cy.get('[data-cy="login-button"], input.login-button', { timeout: 30000 })
      .first()
      .should('be.visible')
      .click({ force: true });

    cy.url({ timeout: 30000 }).should('include', '/dashboard/profile');
  };

  const clickSidebarItemByText = (name: string) => {
    cy.contains('app-dashboard-sidebar-items div', new RegExp(`^\\s*${Cypress._.escapeRegExp(name)}\\s*$`, 'i'), {
      timeout: 30000,
    })
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });
  };

  const loginAndClickSidebar = (username: string, sidebarItems: string[]) => {
    const selectedUser = Object.values(testUsers).find((u: any) => u?.username === username) as User | undefined;
    if (!selectedUser?.password) {
      throw new Error(`Missing user/password in Cypress env for username: ${username}`);
    }

    loginAsUser(username, selectedUser.password);

    sidebarItems.forEach((itemName) => {
      clickSidebarItemByText(itemName);

      if (username === 'testing5' && itemName === 'Stealer logs') {
        cy.get('body').then(($b) => {
          if ($b.find('.pro-subscription_container').length) {
            cy.get('.pro-subscription_container').should('be.visible');
            cy.get('.pro-subscription_subscription-options input[type="radio"][value="annual"]').check({ force: true });
            cy.get('input#name').clear({ force: true }).type('Test User', { force: true });
            cy.get('input#phone').clear({ force: true }).type('03001234567', { force: true });
            cy.get('input#email').clear({ force: true }).type('test.user@example.com', { force: true });
            cy.get('form.pro-subscription_payment-form').submit();
            cy.get('button.pro-subscription_btn-close', { timeout: 30000 })
              .should('be.visible')
              .click({ force: true });
          }
        });
      }
    });

    cy.logout();
  };

  it('Create 5 users with different licenses (admin)', () => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });

    openUsersPage();

    const users: User[] = userOrder
      .map((key) => testUsers[key])
      .filter((u: User | undefined): u is User => Boolean(u));

    if (users.length === 0) {
      throw new Error('No TEST_USERS provided in cypress config');
    }

    users.forEach((u) => addUser(u));
    cy.logout();
  });

  it('Logs in as testing1, clicks sidebar items, then logs out', () => {
    loginAndClickSidebar(testUsers.testing1.username, ['General Intelligence']);
  });

  it('Logs in as testing2, clicks all license sidebar items, then logs out', () => {
    loginAndClickSidebar(testUsers.testing2.username, ['General Intelligence', 'Data Breach', 'Defacement', 'Social', 'Exploit', 'Feed', 'Dump']);
  });

  it('Logs in as testing3, clicks all license sidebar items, then logs out', () => {
    loginAndClickSidebar(testUsers.testing3.username, ['General Intelligence', 'Data Breach', 'Defacement', 'Social', 'Exploit', 'Feed', 'Stealer logs', 'Dump']);
  });

  it('Logs in as testing4, clicks all license sidebar items, then logs out', () => {
    loginAndClickSidebar(testUsers.testing4.username, ['Web Scans', 'Entity API']);
  });
});

describe('Users Page – Delete Users Sequentially', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  const USERS_URL = '/dashboard/profile/users?page=1';

  const openUsersList = () => {
    cy.intercept('POST', '**/api/users').as('usersApi');
    cy.visit(USERS_URL);
    cy.wait('@usersApi', { timeout: 30000 });
  };

  const confirmDelete = () => {
    cy.get('.ui-graph-popup-panel', { timeout: 30000 })
      .should('be.visible')
      .within(() => {
        cy.get('button.ui-popup-btn-primary')
          .should('be.visible')
          .click({ force: true });
      });

    cy.get('.ui-graph-popup-panel').should('not.exist');
  };

  const deleteFirstUser = () => {
    cy.get('button#edit-profile', { timeout: 30000 }).then(($btns) => {
      if ($btns.length <= 2) {
        cy.log('Only system users left. Stop.');
        return;
      }

      cy.wrap($btns[0]).scrollIntoView().click({ force: true });
      cy.contains('button.ui-btn-danger', 'Delete User', { timeout: 30000 })
        .should('be.visible')
        .click({ force: true });

      confirmDelete();
      openUsersList();
      deleteFirstUser();
    });
  };

  it('Deletes users until only 2 remain', () => {
    openUsersList();
    deleteFirstUser();
    cy.logout();
  });
});
