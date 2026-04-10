import {addUser, completeSubscriptionPopupFlow, deleteUsersByUsername, loginAndClickSidebar, loginAsUser, ManagedUser, openSidebarGroup, openSidebarSubItem} from './controllers/05-user-management.controller';

let testUsers: any = {};
let testData: any = {};
let createUsers: ManagedUser[] = [];

describe('Orion Intelligence - User Management Creation Flow', () => {
  before(() => {
    cy.env(['TEST_USERS', 'TEST_DATA']).then(({TEST_USERS, TEST_DATA}) => {
      testUsers = TEST_USERS || {};
      testData = TEST_DATA || {};
      createUsers = Object.keys(testUsers)
        .filter((key) => /^testing\d+$/.test(key))
        .map((key) => testUsers[key] as ManagedUser);
    });
  });

  after(() => {
    cy.logout();
  });

  it('creates five users with configured licenses as admin', () => {
    cy.loginAsAdmin();
    cy.intercept('POST', '**/api/users').as('usersApi');
    cy.visit('/dashboard/profile/homepage');
    cy.get('[data-testid="sidebar-group-profile"]').should('be.visible').scrollIntoView().click();
    cy.get('[data-testid="sidebar-subitem-profile-users"]').should('be.visible').scrollIntoView().click();
    cy.url().should('include', '/dashboard/profile/users');
    cy.wait('@usersApi');

    createUsers.forEach((u) => addUser(u));
    cy.logout();
  });

  it('logs in as testing1 and verifies allowed sidebar group access', () => {
    loginAndClickSidebar(testUsers.testing1.username, ['General Intelligence'], testUsers, testData);
  });

  it('logs in as testing2 and verifies assigned license sidebar groups', () => {
    loginAndClickSidebar(testUsers.testing2.username, ['General Intelligence', 'Data Breach', 'Defacement', 'Social', 'Exploit', 'Feed', 'Dump'], testUsers, testData);
  });

  it('logs in as testing2 and updates account settings preferences', () => {
    loginAsUser(testUsers.testing2.username, testUsers.testing2.password);
    cy.intercept('POST', '**/api/update/current/user').as('updateCurrentUser');
    cy.visit('/dashboard/profile/account');
    cy.get('[data-testid="account-settings-form"]').should('be.visible');
    cy.get('[data-testid="account-settings-twofa-toggle"]').scrollIntoView().should('be.visible').click();
    cy.wait('@updateCurrentUser');
    cy.get('[data-testid="account-settings-theme-toggle"]').scrollIntoView().should('be.visible').click();
    cy.wait('@updateCurrentUser');
    cy.logout();
  });

  it('logs in as testing3 and verifies assigned license sidebar groups', () => {
    loginAndClickSidebar(testUsers.testing3.username, ['General Intelligence', 'Data Breach', 'Defacement', 'Social', 'Exploit', 'Feed', 'Stealer logs', 'Dump'], testUsers, testData);
  });

  it('logs in as testing4 and verifies scanner and api sidebar groups', () => {
    loginAndClickSidebar(testUsers.testing4.username, ['Web Scans', 'Entity API'], testUsers, testData);
  });

  it('logs in as testing5 and completes the stealer logs subscription paywall flow', () => {
    loginAsUser(testUsers.testing5.username, testUsers.testing5.password);
    openSidebarGroup('Stealer logs');
    completeSubscriptionPopupFlow(testData, () => {
      openSidebarGroup('Stealer logs');
      openSidebarSubItem('stealerlogs', 'iocs');
    });
    cy.url().should('match', /\/($|homepage)/);
    cy.logout();
  });

  it('logs in as testing1 and shows the trial subscription banner near expiry', () => {
    cy.clock(new Date('2026-03-10T12:00:00Z').getTime(), ['Date']);
    cy.intercept('POST', '**/api/get/tenant/node', (req) => {
      req.continue((res) => {
        if (res.body?.user) {
          res.body.user.role = 'member';
          res.body.user.subscription = false;
          res.body.user.verificationDate = '2026-02-20T12:00:00Z';
        }
      });
    }).as('trialSession');

    loginAsUser(testUsers.testing1.username, testUsers.testing1.password);
    cy.wait('@trialSession');
    cy.get('[data-testid="trial-subscription-banner"]').should('be.visible');
    cy.contains('[data-testid="trial-subscription-banner"]', 'Your subscription is about to expire in 10 days.').should('be.visible');
    cy.logout();
  });
});

describe('Orion Intelligence - Enterprise Demo Tour', () => {
  const enterpriseUser: ManagedUser = {
    username: 'enterprise_tour1',
    email: 'enterprise_tour@example.com',
    password: '1qaz!QAZ',
    role: 'Analyst',
    licenses: ['Enterprise']
  };

  const waitForTourStep = (stepNumber: number, totalSteps = 6) => {
    cy.get('[data-testid="demo-tour-tooltip"]').should('be.visible');
    cy.get('[data-testid="demo-tour-step"]').should('contain', `Step ${stepNumber} / ${totalSteps}`);
  };

  before(() => {
    cy.loginAsAdmin();
    cy.intercept('POST', '**/api/users').as('usersApi');
    cy.visit('/dashboard/profile/homepage');
    cy.get('[data-testid="sidebar-group-profile"]').should('be.visible').scrollIntoView().click();
    cy.get('[data-testid="sidebar-subitem-profile-users"]').should('be.visible').scrollIntoView().click();
    cy.url().should('include', '/dashboard/profile/users');
    cy.wait('@usersApi');
    addUser(enterpriseUser);
    cy.logout();
  });

  beforeEach(() => {
    cy.intercept('POST', '**/api/get/tenant/node', (req) => {
      req.continue((res) => {
        if (res.body?.user) {
          res.body.user.demo_tour = false;
          res.body.user.license = ['enterprise'];
          res.body.user.role = 'Analyst';
        }
      });
    }).as('enterpriseTenantNode');
  });

  after(() => {
    cy.logout();
  });

  it('blocks page interaction during the tour and only allows next and skip', () => {
    cy.intercept('POST', '**/api/update/current/user', (req) => {
      req.reply({ statusCode: 200, body: { message: 'updated' } });
    }).as('updateCurrentUser');

    loginAsUser(enterpriseUser.username, enterpriseUser.password);
    cy.wait('@enterpriseTenantNode');
    waitForTourStep(1);

    cy.get('html').should('have.class', 'no-scroll');
    cy.get('body').should('have.class', 'no-scroll');

    cy.window().then((win) => {
      const overlay = win.document.querySelector('[data-testid="demo-tour-overlay"]') as SVGElement | null;
      const profileButton = win.document.querySelector('[data-testid="sidebar-group-profile"]') as HTMLElement | null;

      expect(overlay, 'demo tour overlay').to.not.be.null;
      expect(profileButton, 'profile sidebar button').to.not.be.null;

      const clickEvent = new win.MouseEvent('click', { bubbles: true, cancelable: true });
      const clickResult = profileButton!.dispatchEvent(clickEvent);
      expect(clickResult).to.eq(false);
      expect(clickEvent.defaultPrevented).to.eq(true);
    });

    cy.get('[data-testid="demo-tour-next"]').should('be.visible').click();
    waitForTourStep(2);

    cy.get('[data-testid="demo-tour-tooltip"]').should('be.visible');
  });

  it('marks demo_tour true after the enterprise tour completes', () => {
    cy.intercept('POST', '**/api/update/current/user', (req) => {
      req.reply({ statusCode: 200, body: { message: 'updated' } });
    }).as('updateCurrentUser');

    loginAsUser(enterpriseUser.username, enterpriseUser.password);
    cy.wait('@enterpriseTenantNode');
    waitForTourStep(1);

    for (let stepNumber = 1; stepNumber <= 6; stepNumber += 1) {
      cy.get('[data-testid="demo-tour-next"]').should('be.visible').click();

      if (stepNumber < 6) {
        waitForTourStep(stepNumber + 1);
      }
    }

    cy.wait('@updateCurrentUser').then(({ request }) => {
      expect(request.body.demo_tour).to.eq(true);
      expect(request.body.username).to.eq(enterpriseUser.username);
    });
    cy.get('[data-testid="demo-tour-tooltip"]').should('not.exist');
  });
});

describe('Orion Intelligence - User Management Deletion Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('deletes configured test users', () => {
    cy.env(['TEST_USERS']).then(({TEST_USERS}) => {
      const usernames = Object.keys(TEST_USERS || {})
        .filter((key) => /^testing\d+$/.test(key) && key !== 'testing3' && key !== 'testing4' && key !== 'testing5')
        .map((key) => TEST_USERS[key]?.username)
        .filter(Boolean);

      deleteUsersByUsername(usernames);
    });
    cy.logout();
  });
});
