import {addUser, completeSubscriptionPopupFlow, deleteFirstUser, loginAndClickSidebar, loginAsUser, ManagedUser, openSidebarGroup, openSidebarSubItem, openUsersList} from './controllers/05-user-management.controller';

let testUsers: any = {};
let testData: any = {};
const CREATE_USERS: ManagedUser[] = [
  {username: 'testing1', email: 'a@hotmail.com', password: '1qaz!QAZ', role: 'Member', licenses: ['Free']},
  {username: 'testing2', email: 'b@hotmail.com', password: '1qaz!QAZ', role: 'Analyst', licenses: ['Free', 'OSINT Basic']},
  {username: 'testing3', email: 'c@hotmail.com', password: '1qaz!QAZ', role: 'Member', licenses: ['Free', 'OSINT Advanced']},
  {username: 'testing4', email: 'd@hotmail.com', password: '1qaz!QAZ', role: 'Member', licenses: ['Free', 'Pentester']},
  {username: 'testing5', email: 'e@hotmail.com', password: '1qaz!QAZ', role: 'Demo', licenses: ['Free']}
];

describe('Orion Intelligence - User Management Creation Flow', () => {
  before(() => {
    cy.env(['TEST_USERS', 'TEST_DATA']).then(({TEST_USERS, TEST_DATA}) => {
      testUsers = TEST_USERS || {};
      testData = TEST_DATA || {};
    });
  });

  after(() => {
    cy.logout();
  });

  // it('creates five users with configured licenses as admin', () => {
  //   cy.loginAsAdmin();
  //   cy.intercept('POST', '**/api/users').as('usersApi');
  //   cy.visit('/dashboard/profile/homepage');
  //   cy.get('[data-testid="sidebar-group-profile"]').should('be.visible').scrollIntoView().click();
  //   cy.get('[data-testid="sidebar-subitem-profile-users"]').should('be.visible').scrollIntoView().click();
  //   cy.url().should('include', '/dashboard/profile/users');
  //   cy.wait('@usersApi');
  //
  //   CREATE_USERS.forEach((u) => addUser(u));
  //   cy.logout();
  // });
  //
  // it('logs in as testing1 and verifies allowed sidebar group access', () => {
  //   loginAndClickSidebar(testUsers.testing1.username, ['General Intelligence'], testUsers, testData);
  // });
  //
  // it('logs in as testing2 and verifies assigned license sidebar groups', () => {
  //   loginAndClickSidebar(testUsers.testing2.username, ['General Intelligence', 'Data Breach', 'Defacement', 'Social', 'Exploit', 'Feed', 'Dump'], testUsers, testData);
  // });
  //
  // it('logs in as testing2 and updates account settings preferences', () => {
  //   loginAsUser(testUsers.testing2.username, testUsers.testing2.password);
  //   cy.intercept('POST', '**/api/update/current/user').as('updateCurrentUser');
  //   cy.visit('/dashboard/profile/account');
  //   cy.get('[data-testid="account-settings-form"]').should('be.visible');
  //   cy.get('[data-testid="account-settings-twofa-toggle"]').scrollIntoView().should('be.visible').click();
  //   cy.wait('@updateCurrentUser');
  //   cy.get('[data-testid="account-settings-theme-toggle"]').scrollIntoView().should('be.visible').click();
  //   cy.wait('@updateCurrentUser');
  //   cy.logout();
  // });
  //
  // it('logs in as testing3 and verifies assigned license sidebar groups', () => {
  //   loginAndClickSidebar(testUsers.testing3.username, ['General Intelligence', 'Data Breach', 'Defacement', 'Social', 'Exploit', 'Feed', 'Stealer logs', 'Dump'], testUsers, testData);
  // });
  //
  // it('logs in as testing4 and verifies scanner and api sidebar groups', () => {
  //   loginAndClickSidebar(testUsers.testing4.username, ['Web Scans', 'Entity API'], testUsers, testData);
  // });

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

  // it('logs in as testing1 and shows the trial subscription banner near expiry', () => {
  //   cy.clock(new Date('2026-03-10T12:00:00Z').getTime(), ['Date']);
  //   cy.intercept('POST', '**/api/get/tenant/node', (req) => {
  //     req.continue((res) => {
  //       if (res.body?.user) {
  //         res.body.user.role = 'member';
  //         res.body.user.subscription = false;
  //         res.body.user.verificationDate = '2026-02-20T12:00:00Z';
  //       }
  //     });
  //   }).as('trialSession');
  //
  //   loginAsUser(testUsers.testing1.username, testUsers.testing1.password);
  //   cy.wait('@trialSession');
  //   cy.get('[data-testid="trial-subscription-banner"]').should('be.visible');
  //   cy.contains('[data-testid="trial-subscription-banner"]', 'Your subscription is about to expire in 10 days.').should('be.visible');
  //   cy.logout();
  // });
});

// describe('Orion Intelligence - User Management Deletion Flow', () => {
//   const USERS_URL = '/dashboard/profile/users?page=1';
//
//   beforeEach(() => {
//     cy.loginAsAdmin();
//   });
//
//   after(() => {
//     cy.logout();
//   });
//
//   it('deletes users sequentially until only system users remain', () => {
//     openUsersList(USERS_URL);
//     deleteFirstUser(USERS_URL);
//     cy.logout();
//   });
// });
