import {addUser, completeSubscriptionPopupFlow, deleteUsersByUsername, loginAndClickSidebar, loginAsUser, ManagedUser, openSidebarGroup, openSidebarSubItem} from './controllers/05-user-management.controller';

let testUsers: any = {};
let testData: any = {};
let createUsers: ManagedUser[] = [];
let profileUserId = '';

function openFirstStrategicReportFromSearch(searchTerm = 'data') {
  cy.visit('/dashboard/strategic/all?page=1');
  cy.wait(1000)
  cy.scrollDashboardToTop()
  cy.get('[data-testid="dashboard-general-input"]').should('be.visible').clear().type(searchTerm);
  cy.get('[data-testid="dashboard-search-submit"]').click();
  cy.get('[data-testid="result-card"]').should('have.length.greaterThan', 0);
  cy.get('[data-testid="open-report"]').filter(':visible').first().click();
  cy.url().should('match', /\/dashboard\/strategic\/all\/[^/?]+/);
  cy.get('#report-detail').should('be.visible');
}

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

  it('covers report feedback and public profile activity flow', () => {
    cy.visit('/');
    cy.get('[data-testid="login-page"]').should('be.visible');

    const currentUsername = testUsers.testing3.username;
    const commentText = `Follow up on this thread ${Date.now()}`;
    const blockedCommentText = `Blocked follow up ${Date.now()}`;

    loginAsUser(testUsers.testing3.username, testUsers.testing3.password);

    openFirstStrategicReportFromSearch();

    cy.scrollDashboardToTop();
    cy.get('[data-testid="report-feedback-recommended"]').filter(':visible').first().scrollIntoView().click();
    cy.get('[data-testid="report-feedback-recommended"]').filter(':visible').first().should('contain.text', 'Selected');

    cy.get('[data-testid="report-feedback-trust"]').filter(':visible').first().scrollIntoView().click();
    cy.get('[data-testid="report-feedback-trust"]').filter(':visible').first().should('contain.text', 'Selected');

    cy.scrollDashboardToBottom()
    cy.get('[data-testid="report-feedback-comment-input"]').filter(':visible').first().scrollIntoView().should('be.visible').type(commentText);
    cy.get('[data-testid="report-feedback-comment-save"]').filter(':visible').first().click();
    cy.contains('p', commentText).should('be.visible');

    cy.contains('[data-testid="report-feedback-comment-user-name"]', currentUsername).first().click();
    cy.contains('div', 'Profile').should('be.visible');
    cy.get('[data-testid="report-user-sidebar-open-profile"]').filter(':visible').first().click();
    cy.url().should('match', /\/dashboard\/profile\/user\/[^/]+$/);
    cy.location('pathname').then((pathname) => {
      profileUserId = pathname.split('/').pop() || '';
      expect(profileUserId).to.not.equal('');
    });
    cy.contains('h1', currentUsername).should('be.visible');
    cy.contains('span', 'Recommended').should('exist');
    cy.contains('span', 'Trust').should('exist');
    cy.contains('span', /comment/i).should('exist');

    cy.window().then((win) => {
      cy.stub(win, 'open').as('profileWindowOpen');
    });
    cy.get('[data-testid="user-profile-open-thread"]').filter(':visible').first().click();
    cy.get('@profileWindowOpen').should('have.been.calledOnce');
    cy.get('@profileWindowOpen').its('firstCall.args.0').should('include', '/dashboard/');

    openFirstStrategicReportFromSearch();
    cy.scrollDashboardToBottom()
    cy.get('[data-testid="report-feedback-comment-input"]').filter(':visible').first().scrollIntoView().should('be.visible').type(blockedCommentText);
    cy.get('[data-testid="report-feedback-comment-save"]').filter(':visible').first().click();
    cy.contains('p', 'Only one comment per hour is allowed.').should('be.visible');
    cy.contains('p', blockedCommentText).should('not.exist');

    cy.visit('/dashboard/profile/account');
    cy.get('[data-testid="account-settings-profile-visibility-toggle"]').should('be.visible').then(($toggle) => {
      const label = $toggle.text();
      if (label.includes('Visible to other users')) {
        cy.wrap($toggle).scrollIntoView().click();
      }
    });
    cy.contains('[data-testid="account-settings-profile-visibility-toggle"] p', 'Hidden from other users').should('be.visible');
    cy.reload();
    cy.get('[data-testid="account-settings-profile-visibility-toggle"]').scrollIntoView().should('be.visible');
    cy.contains('[data-testid="account-settings-profile-visibility-toggle"] p', 'Hidden from other users').should('be.visible');
    cy.logout();

    loginAsUser(testUsers.testing5.username, testUsers.testing5.password);
    openFirstStrategicReportFromSearch();
    cy.scrollTo('bottom');
    cy.contains('[data-testid="report-feedback-comment-user-name"]', currentUsername).first().click();
    cy.get('[data-testid="report-user-sidebar-hidden-profile"]').should('exist');
    cy.get('[data-testid="report-user-sidebar-open-profile"]').should('not.exist');
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
